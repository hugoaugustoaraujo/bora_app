// src/routes/matches.ts
import { Router, Request, Response } from 'express';
import { pool } from '../config/database';

const router = Router();

// ==========================================
// 1. ROTA PARA CRIAR PARTIDA
// ==========================================
router.post('/matches', async (req: Request, res: Response) => {
  try {
    const {
      title,
      category,
      modality,
      match_date,
      location_name,
      lat,
      lng,
      total_spots,
      organizer_id,
    } = req.body;

    if (!title || !category || !modality || !match_date || !location_name || !total_spots || !organizer_id) {
      return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
    }

    // O organizador já ocupa 1 vaga nativamente no preenchimento inicial
    const vacancies = Math.max(total_spots - 1, 0);

    const matchResult = await pool.query(
      `INSERT INTO matches (title, category, modality, match_date, location_name, location_geom, total_spots, vacancies, organizer_id)
       VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($6, $7), 4326), $8, $9, $10)
       RETURNING *;`,
      [title, category, modality, match_date, location_name, lng || -35.7353, lat || -9.6658, total_spots, vacancies, organizer_id]
    );
    const newMatch = matchResult.rows[0];

    // Insere o organizador como participante confirmado
    await pool.query(
      `INSERT INTO match_participants (match_id, user_id, status)
       VALUES ($1, $2, 'confirmed')
       ON CONFLICT (match_id, user_id) DO UPDATE SET status = 'confirmed';`,
      [newMatch.id, organizer_id]
    );

    // Notificar amigos do organizador sobre a nova partida
    const userResult = await pool.query(`SELECT name FROM users WHERE id = $1`, [organizer_id]);
    const organizerName = userResult.rows[0]?.name || 'Alguém';

    const friendsResult = await pool.query(
      `SELECT DISTINCT u.id
       FROM friendships f 
       JOIN users u ON (u.id = CASE WHEN f.user_id = $1 THEN f.friend_id ELSE f.user_id END)
       WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = 'accepted'`,
      [organizer_id]
    );

    for (const friend of friendsResult.rows) {
      await pool.query(
        `INSERT INTO notifications (user_id, actor_id, type, reference_id, notification_text)
         VALUES ($1, $2, 'match_created_friend', $3, $4)`,
        [
          friend.id,
          organizer_id,
          newMatch.id,
          `O seu amigo ${organizerName} criou uma nova partida de ${modality}.`,
        ]
      );
    }

    return res.status(201).json(newMatch);
  } catch (error) {
    console.error('Erro ao criar partida:', error);
    return res.status(500).json({ error: 'Erro interno ao criar a partida.' });
  }
});

// ==========================================
// 2. ROTA PARA ENVIAR CONVITE (Pendente sem consumir vagas)
// ==========================================
router.post('/matches/:matchId/invite', async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const { friendId } = req.body;
    if (!matchId || !friendId) {
      return res.status(400).json({ error: 'Match ID e Friend ID são obrigatórios.' });
    }

    await pool.query(
      `INSERT INTO match_participants (match_id, user_id, status, arrived) 
       VALUES ($1, $2, 'pending', false) 
       ON CONFLICT (match_id, user_id) 
       DO UPDATE SET status = 'pending'`,
      [matchId, friendId]
    );

    const matchRes = await pool.query('SELECT title, modality, organizer_id FROM matches WHERE id = $1', [matchId]);
    const matchData = matchRes.rows[0];
    const matchTitle = matchData?.title || 'uma partida';
    const organizerId = matchData?.organizer_id || null;

    await pool.query(
      `INSERT INTO notifications (user_id, actor_id, type, reference_id, notification_text)
       VALUES ($1, $2, 'match_invite', $3, $4)`,
      [
        friendId,
        organizerId,
        matchId,
        `Recebeu um convite para participar na partida: ${matchTitle}.`
      ]
    );

    return res.status(200).json({ message: 'Convite enviado com sucesso e pendente de aceitação!' });
  } catch (error) {
    console.error('Erro ao enviar convite:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ==========================================
// 3. ROTA PARA CONFIRMAR PRESENÇA / ACEITAR CONVITE
// ==========================================
router.post('/matches/:matchId/participate', async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const { userId } = req.body;

    if (!matchId || !userId) {
      return res.status(400).json({ error: 'matchId e userId são obrigatórios.' });
    }

    const existingCheck = await pool.query(
      `SELECT status FROM match_participants WHERE match_id = $1 AND user_id = $2`,
      [matchId, userId]
    );

    const currentStatus = existingCheck.rows[0]?.status;
    const alreadyConfirmed = currentStatus === 'confirmed';

    const matchCheck = await pool.query(`SELECT * FROM matches WHERE id = $1`, [matchId]);
    if (matchCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Partida não encontrada.' });
    }

    const currentMatch = matchCheck.rows[0];

    if (!alreadyConfirmed && currentMatch.vacancies <= 0) {
      return res.status(400).json({ error: 'Partida lotada! Não há vagas disponíveis.' });
    }

    await pool.query(
      `INSERT INTO match_participants (match_id, user_id, status)
       VALUES ($1, $2, 'confirmed')
       ON CONFLICT (match_id, user_id) DO UPDATE SET status = 'confirmed';`,
      [matchId, userId]
    );

    if (!alreadyConfirmed) {
      await pool.query(
        `UPDATE matches SET vacancies = GREATEST(vacancies - 1, 0) WHERE id = $1;`,
        [matchId]
      );
    }

    return res.status(200).json({ message: 'Presença confirmada com sucesso!' });
  } catch (error) {
    console.error('Erro ao confirmar participação:', error);
    return res.status(500).json({ error: 'Erro interno ao confirmar participação.' });
  }
});

// ==========================================
// 4. ROTA PARA LISTAR TODAS AS PARTIDAS COM JOIN CORRIGIDO
// ==========================================
router.get('/matches', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    const query = `
      SELECT 
        m.id,
        m.title,
        m.category,
        m.modality,
        m.match_date,
        m.location_name,
        ST_X(m.location_geom) AS longitude,
        ST_Y(m.location_geom) AS latitude,
        m.total_spots,
        m.vacancies,
        m.organizer_id,
        mp_user.status as participant_status,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'username', u.username,
          'avatarUrl', u.avatar_url
        ) AS organizer,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', p.user_id,
                'name', pu.name,
                'avatarUrl', pu.avatar_url,
                'role', CASE WHEN p.user_id = m.organizer_id THEN 'Organizador' ELSE 'Participante' END
              )
            )
            FROM match_participants p
            JOIN users pu ON p.user_id = pu.id
            WHERE p.match_id = m.id AND p.status = 'confirmed'
          ),
          '[]'::json
        ) AS participants
      FROM matches m
      LEFT JOIN users u ON m.organizer_id = u.id
      LEFT JOIN match_participants mp_user ON mp_user.match_id = m.id AND mp_user.user_id = $1
      ORDER BY m.created_at DESC;
    `;

    const result = await pool.query(query, [userId || null]);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao listar partidas:', error);
    return res.status(500).json({ error: 'Erro interno ao listar partidas.' });
  }
});

export default router;