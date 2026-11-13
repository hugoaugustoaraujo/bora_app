import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import multer from 'multer';
import path from 'path';

const router = Router();

// Garantir a criação das tabelas necessárias de forma segura
pool.query(`
  CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender_id INT REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INT REFERENCES users(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    actor_id INT REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    reference_id INT,
    message_id INT REFERENCES messages(id) ON DELETE CASCADE,
    notification_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`).catch((err) => console.error('Erro ao inicializar tabelas:', err));

// 1. Listar utilizadores
router.get('/users', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, name, username, email, location_name, bio, avatar_url FROM users'
    );
    return res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar utilizadores:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 2. Buscar Utilizador por Username
router.get('/users/search', async (req: Request, res: Response) => {
  try {
    const { username, userId } = req.query;
    if (!username) {
      return res.status(400).json({ error: 'Username é obrigatório.' });
    }

    const cleanUsername = String(username).replace('@', '').trim();
    const currentUserId = Number(userId) || 0;

    const result = await pool.query(
      `SELECT id, name, username, email, location_name, bio, avatar_url 
       FROM users 
       WHERE LOWER(username) = LOWER($1)
         AND id != $2
         AND NOT EXISTS (
           SELECT 1 FROM friendships f
           WHERE (f.user_id = $2 AND f.friend_id = users.id)
              OR (f.user_id = users.id AND f.friend_id = $2)
         )`,
      [cleanUsername, currentUserId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilizador não encontrado ou já adicionado.' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar utilizador por username:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 3. Obter dados de um utilizador específico pelo ID
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, name, username, email, location_name, bio, avatar_url FROM users WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilizador não encontrado.' });
    }
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar utilizador:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 4. Autenticação / Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const result = await pool.query(
      'SELECT id, name, username, email, password_hash, location_name, bio, avatar_url FROM users WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilizador não encontrado.' });
    }

    const user = result.rows[0];
    if (user.password_hash !== password) {
      return res.status(401).json({ error: 'Palavra-passe incorreta.' });
    }

    const { password_hash, ...userData } = user;
    return res.json(userData);
  } catch (error) {
    console.error('Erro ao realizar login:', error);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// 5. Registar Novo Utilizador (POST /users) - ÚNICA E OFICIAL
router.post('/users', async (req: Request, res: Response) => {
  try {
    console.log('📩 [BACKEND] Dados brutos recebidos em POST /users:', req.body);
    const { name, username, email, password_hash, location_name, birth_date, bio, avatar_url } = req.body;
    
    if (!name || !email || !password_hash) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }

    // Verificar se o e-mail já existe
    const existingEmail = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ error: 'Este e-mail já está associado a outra conta.' });
    }

    // Garantir um username único
    let baseUsername = username || email.split('@')[0];
    baseUsername = baseUsername.toLowerCase().replace(/[^a-z0-9]/g, '');
    let finalUsername = baseUsername;
    
    const existingUsername = await pool.query('SELECT id FROM users WHERE username = $1', [finalUsername]);
    if (existingUsername.rows.length > 0) {
      finalUsername = `${baseUsername}_${Math.floor(Math.random() * 1000)}`;
    }

    // Inserção na base de dados
    const result = await pool.query(
      `INSERT INTO users (name, username, email, password_hash, location_name, birth_date, bio, avatar_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, name, username, email, location_name, bio, avatar_url, birth_date`,
      [
        name.trim(),
        finalUsername,
        email.trim().toLowerCase(),
        password_hash,
        location_name || 'Maceió, AL',
        birth_date || null,
        bio || 'Membro do Bora',
        avatar_url || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'
      ]
    );

    console.log('✅ [BACKEND] Utilizador inserido na base de dados com ID:', result.rows[0].id);
    return res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('❌ [BACKEND] ERRO CRÍTICO NO POST /users:', error);
    return res.status(500).json({ error: error.detail || error.message || 'Erro interno ao criar utilizador.' });
  }
});

// 6. Listar amigos e solicitações pendentes
router.get('/users/:id/friends', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT DISTINCT u.id, u.name, u.username, u.email, u.location_name, u.bio, u.avatar_url, f.status, f.user_id as sender_id
       FROM friendships f 
       JOIN users u ON (u.id = CASE WHEN f.user_id = $1 THEN f.friend_id ELSE f.user_id END)
       WHERE (f.user_id = $1 OR f.friend_id = $1) 
         AND u.id != $1`,
      [id]
    );
    return res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar amigos:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 7. Listar Partidas
router.get('/matches', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    const result = await pool.query(
      `SELECT 
         m.*, 
         u.id as real_organizer_id,
         u.name as organizer_name, 
         u.username as organizer_username, 
         u.avatar_url as organizer_avatar,
         mp_user.status as participant_status,
         COALESCE(
           json_agg(
             json_build_object(
               'id', p_user.id,
               'name', p_user.name,
               'avatarUrl', p_user.avatar_url,
               'role', CASE WHEN p_user.id = m.organizer_id THEN 'Organizador' ELSE 'Participante' END
             )
           ) FILTER (WHERE p_user.id IS NOT NULL), '[]'
         ) as participants
       FROM matches m 
       LEFT JOIN users u ON m.organizer_id = u.id 
       LEFT JOIN match_participants mp_user ON mp_user.match_id = m.id AND mp_user.user_id = $1
       LEFT JOIN match_participants mp_all ON mp_all.match_id = m.id
       LEFT JOIN users p_user ON p_user.id = mp_all.user_id
       GROUP BY m.id, u.id, u.name, u.username, u.avatar_url, mp_user.status
       ORDER BY m.id DESC`,
      [userId || null]
    );
    return res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar partidas:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 8. Criar Partida
router.post('/matches', async (req: Request, res: Response) => {
  try {
    const { title, category, modality, match_date, location_name, total_spots, organizer_id, is_public } = req.body;
    if (!title || !organizer_id) {
      return res.status(400).json({ error: 'Título e organizador são obrigatórios.' });
    }

    const result = await pool.query(
      `INSERT INTO matches (title, category, modality, match_date, location_name, total_spots, vacancies, organizer_id, is_public) 
       VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8) RETURNING *`,
      [title, category, modality, match_date, location_name, total_spots, organizer_id, is_public ?? true]
    );

    const newMatch = result.rows[0];
    await pool.query(
      `INSERT INTO match_participants (match_id, user_id, status, arrived) 
       VALUES ($1, $2, 'confirmed', false)
       ON CONFLICT (match_id, user_id) DO UPDATE SET status = 'confirmed'`,
      [newMatch.id, organizer_id]
    );

    return res.status(201).json(newMatch);
  } catch (error) {
    console.error('Erro ao criar partida:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 9. Enviar Convite para Partida
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
       ON CONFLICT (match_id, user_id) DO UPDATE SET status = 'pending'`,
      [matchId, friendId]
    );

    return res.status(200).json({ message: 'Convite enviado com sucesso!' });
  } catch (error) {
    console.error('Erro ao enviar convite:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 10. Obter Histórico de Mensagens
router.get('/messages/:userId/:friendId', async (req: Request, res: Response) => {
  try {
    const { userId, friendId } = req.params;
    const result = await pool.query(
      `SELECT id, sender_id, receiver_id, message_text, created_at
       FROM messages
       WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC`,
      [userId, friendId]
    );
    return res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    return res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
});

// 11. Enviar Nova Mensagem
router.post('/messages', async (req: Request, res: Response) => {
  try {
    const { sender_id, receiver_id, message_text } = req.body;
    if (!sender_id || !receiver_id || !message_text) {
      return res.status(400).json({ error: 'Remetente, destinatário e texto são obrigatórios.' });
    }

    const result = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, message_text)
       VALUES ($1, $2, $3) RETURNING *`,
      [sender_id, receiver_id, message_text]
    );
    const newMessage = result.rows[0];

    const senderRes = await pool.query('SELECT name FROM users WHERE id = $1', [sender_id]);
    const senderName = senderRes.rows[0]?.name || 'Alguém';

    await pool.query(
      `INSERT INTO notifications (user_id, actor_id, type, message_id, notification_text)
       VALUES ($1, $2, 'chat_message', $3, $4)`,
      [
        receiver_id,
        sender_id,
        newMessage.id,
        `${senderName} enviou-te uma nova mensagem.`
      ]
    );

    return res.status(201).json(newMessage);
  } catch (error) {
    console.error('Erro ao salvar mensagem e notificação:', error);
    return res.status(500).json({ error: 'Erro ao salvar mensagem' });
  }
});

// 12. Responder a Pedido de Amizade
router.post('/friendships/respond', async (req: Request, res: Response) => {
  try {
    const { userId, friendId, status } = req.body;
    if (!userId || !friendId || !status) {
      return res.status(400).json({ error: 'User ID, Friend ID e Status são obrigatórios.' });
    }

    if (status === 'accepted') {
      const result = await pool.query(
        `UPDATE friendships 
         SET status = 'accepted' 
         WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
        [userId, friendId]
      );
      return res.json({ message: 'Amizade aceite com sucesso!', affected: result.rowCount });
    } else if (status === 'rejected' || status === 'declined') {
      const result = await pool.query(
        `DELETE FROM friendships 
         WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
        [userId, friendId]
      );
      return res.json({ message: 'Pedido de amizade recusado.', affected: result.rowCount });
    }

    return res.status(400).json({ error: 'Status inválido.' });
  } catch (error) {
    console.error('Erro ao responder pedido de amizade:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});


// 13. Enviar Pedido de Amizade
router.post('/friendships/request', async (req: Request, res: Response) => {
  try {
    const { userId, friendId } = req.body;
    if (!userId || !friendId) {
      return res.status(400).json({ error: 'User ID e Friend ID são obrigatórios.' });
    }
    if (Number(userId) === Number(friendId)) {
      return res.status(400).json({ error: 'Não podes enviar pedido a ti mesmo.' });
    }

    const check = await pool.query(
      `SELECT * FROM friendships 
       WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
      [userId, friendId]
    );

    if (check.rows.length > 0) {
      return res.status(400).json({ error: 'Já existe uma relação com este utilizador.' });
    }

    await pool.query(
      `INSERT INTO friendships (user_id, friend_id, status) VALUES ($1, $2, 'pending')`,
      [userId, friendId]
    );

    return res.status(201).json({ message: 'Pedido de amizade enviado com sucesso!' });
  } catch (error) {
    console.error('Erro ao enviar pedido de amizade:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 14. Desfazer Amizade
router.post('/friendships/unfriend', async (req: Request, res: Response) => {
  try {
    const { userId, friendId } = req.body;
    if (!userId || !friendId) {
      return res.status(400).json({ error: 'User ID e Friend ID são obrigatórios.' });
    }
    await pool.query(
      `DELETE FROM friendships 
       WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
      [userId, friendId]
    );
    return res.json({ message: 'Amizade desfeita com sucesso.' });
  } catch (error) {
    console.error('Erro ao desfazer amizade:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 15. Bloquear Utilizador
router.post('/users/block', async (req: Request, res: Response) => {
  try {
    const { userId, targetId } = req.body;
    if (!userId || !targetId) {
      return res.status(400).json({ error: 'User ID e Target ID são obrigatórios.' });
    }

    await pool.query(
      `DELETE FROM friendships 
       WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
      [userId, targetId]
    );

    await pool.query(
      `INSERT INTO friendships (user_id, friend_id, status) VALUES ($1, $2, 'blocked')`,
      [userId, targetId]
    );

    return res.json({ message: 'Utilizador bloqueado com sucesso.' });
  } catch (error) {
    console.error('Erro ao bloquear utilizador:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 16. Listar Notificações de um Utilizador
router.get('/users/:id/notifications', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT n.id, n.type, n.reference_id, n.message_id, n.notification_text, n.is_read, n.created_at,
              n.actor_id, u.name as actor_name, u.avatar_url as actor_avatar
       FROM notifications n
       LEFT JOIN users u ON n.actor_id = u.id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC`,
      [id]
    );

    const formatted = result.rows.map((row) => {
      let avatarFinal = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150';
      if (row.actor_avatar) {
        avatarFinal = row.actor_avatar.startsWith('http')
          ? row.actor_avatar
          : `https://localhost:3000/images/${row.actor_avatar}`;
      }

      return {
        id: String(row.id),
        type: row.type,
        actorId: String(row.actor_id),
        actorName: row.actor_name || 'Utilizador',
        actorAvatar: avatarFinal,
        referenceId: row.reference_id,
        messageId: row.message_id,
        notificationText: row.notification_text,
        isRead: row.is_read,
        timeAgo: new Date(row.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
    });

    return res.json(formatted);
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 17. Marcar Notificação como Lida
router.patch('/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = $1', [id]);
    return res.json({ message: 'Notificação marcada como lida.' });
  } catch (error) {
    console.error('Erro ao atualizar notificação:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 18. Atualizar Preferências/Configurações
router.patch('/users/:id/settings', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { is_private, push_notifications, email_alerts, dark_mode } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET is_private = COALESCE($1, is_private),
           push_notifications = COALESCE($2, push_notifications),
           email_alerts = COALESCE($3, email_alerts),
           dark_mode = COALESCE($4, dark_mode)
       WHERE id = $5 RETURNING id, is_private, push_notifications, email_alerts, dark_mode`,
      [is_private, push_notifications, email_alerts, dark_mode, id]
    );

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    return res.status(500).json({ error: 'Erro ao salvar configurações' });
  }
});

// 19. Buscar Utilizadores Bloqueados
router.get('/users/:id/blocked', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT u.id, u.name, u.username, u.avatar_url 
       FROM friendships f
       JOIN users u ON u.id = f.friend_id
       WHERE f.user_id = $1 AND f.status = 'blocked'`,
      [id]
    );
    return res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar utilizadores bloqueados:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 20. Desbloquear Utilizador
router.post('/users/unblock', async (req: Request, res: Response) => {
  try {
    const { userId, targetId } = req.body;
    await pool.query(
      `DELETE FROM friendships WHERE user_id = $1 AND friend_id = $2 AND status = 'blocked'`,
      [userId, targetId]
    );
    return res.json({ message: 'Utilizador desbloqueado com sucesso.' });
  } catch (error) {
    console.error('Erro ao desbloquear utilizador:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 21. Verificar Acesso ao Perfil Privado
router.get('/users/:targetId/profile-access', async (req: Request, res: Response) => {
  try {
    const { targetId } = req.params;
    const { requesterId } = req.query;

    const targetUser = (await pool.query('SELECT * FROM users WHERE id = $1', [targetId])).rows[0];

    if (!targetUser) return res.status(404).json({ error: 'Utilizador não encontrado.' });

    if (!targetUser.is_private || Number(targetId) === Number(requesterId)) {
      return res.json({ allowed: true, user: targetUser });
    }

    const friendship = await pool.query(
      `SELECT * FROM friendships 
       WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)) 
         AND status = 'accepted'`,
      [requesterId, targetId]
    );

    if (friendship.rows.length > 0) {
      return res.json({ allowed: true, user: targetUser });
    } else {
      return res.json({ 
        allowed: false, 
        user: { 
          id: targetUser.id, 
          name: targetUser.name, 
          username: targetUser.username, 
          avatar_url: targetUser.avatar_url,
          is_private: true 
        } 
      });
    }
  } catch (error) {
    console.error('Erro ao verificar acesso ao perfil:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 22. Atualizar Geolocalização
router.patch('/users/:id/location', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Latitude e longitude são obrigatórias.' });
    }

    await pool.query(
      `UPDATE users SET latitude = $1, longitude = $2 WHERE id = $3`,
      [latitude, longitude, id]
    );

    return res.json({ message: 'Localização atualizada com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar localização:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 23. Configuração do armazenamento local com Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Como este arquivo está em src/routes/, subimos duas pastas para alcançar a raiz do backend e entrar em /images
    cb(null, path.join(__dirname, '../../images'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// 24. Rota POST para receber a imagem do app, guardar localmente e atualizar o PostgreSQL
router.post('/users/:id/avatar', upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum ficheiro de imagem foi enviado.' });
    }

    // Caminho relativo limpo que será salvo na base de dados
    const avatarPath = `/images/${req.file.filename}`;

    // Atualiza o registo do utilizador na base de dados
    const result = await pool.query(
      `UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, name, username, avatar_url`,
      [avatarPath, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilizador não encontrado.' });
    }

    return res.json({
      message: 'Avatar atualizado com sucesso!',
      user: result.rows[0],
      avatar_url: avatarPath,
    });
  } catch (error) {
    console.error('Erro ao fazer upload do avatar:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar a imagem.' });
  }
});

export default router;