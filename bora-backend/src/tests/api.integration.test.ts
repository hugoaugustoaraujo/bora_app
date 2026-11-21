import request from 'supertest';
import express from 'express';
import matchRoutes from '../../src/routes/matches';
import userRoutes from '../../src/routes/index';
import { pool } from '../../src/config/database';

const app = express();
app.use(express.json());
app.use('/api', matchRoutes);
app.use('/api', userRoutes);

describe('Testes Funcionais / Integração - API Bora', () => {
  let createdUserId: number;
  let invitedFriendId: number;
  let createdMatchId: number;

  // Prepara utilizadores de teste no banco antes de rodar os fluxos
  beforeAll(async () => {
    const resOrg = await pool.query(
      `INSERT INTO users (name, username, email, password_hash, location_name)
       VALUES ('Organizador Teste', 'org_teste_${Date.now()}', 'org_${Date.now()}@test.com', 'senha1234', 'Maceió, AL')
       RETURNING id`
    );
    createdUserId = resOrg.rows[0].id;

    const resFriend = await pool.query(
      `INSERT INTO users (name, username, email, password_hash, location_name)
       VALUES ('Amigo Teste', 'amigo_teste_${Date.now()}', 'amigo_${Date.now()}@test.com', 'senha1234', 'Maceió, AL')
       RETURNING id`
    );
    invitedFriendId = resFriend.rows[0].id;
  });

  // Limpa os dados criados e fecha a pool do banco após os testes
  afterAll(async () => {
    if (createdMatchId) {
      await pool.query('DELETE FROM matches WHERE id = $1', [createdMatchId]);
    }
    if (createdUserId) {
      await pool.query('DELETE FROM users WHERE id = $1', [createdUserId]);
    }
    if (invitedFriendId) {
      await pool.query('DELETE FROM users WHERE id = $1', [invitedFriendId]);
    }
    await pool.end();
  });

  // TESTE DE INTEGRAÇÃO 1: Criação de partida e alocação automática de vaga do organizador
  it('1. Deve criar uma nova partida no PostgreSQL/PostGIS e reservar a vaga do organizador (POST /api/matches)', async () => {
    const payload = {
      title: 'Vôlei de Praia Teste Integração',
      category: 'Esportes',
      modality: 'Vôlei',
      match_date: '2026-12-01 18:00:00',
      location_name: 'Praia de Ponta Verde',
      lat: -9.6658,
      lng: -35.7353,
      total_spots: 6,
      organizer_id: createdUserId,
    };

    const response = await request(app).post('/api/matches').send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe(payload.title);
    // Como total_spots é 6 e o organizador já entra confirmado, vagas restantes devem ser 5
    expect(response.body.vacancies).toBe(5);

    createdMatchId = response.body.id;
  });

  // TESTE DE INTEGRAÇÃO 2: Listagem de partidas com JOIN de participantes e organizador
  it('2. Deve listar as partidas retornando coordenadas e o organizador confirmado (GET /api/matches)', async () => {
    const response = await request(app)
      .get('/api/matches')
      .query({ userId: createdUserId });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    const matchEncontrado = response.body.find((m: any) => m.id === createdMatchId);
    expect(matchEncontrado).toBeDefined();
    expect(matchEncontrado.organizer.id).toBe(createdUserId);
    expect(matchEncontrado.participants.length).toBeGreaterThanOrEqual(1);
  });

  // TESTE DE INTEGRAÇÃO 3: Envio de convite pendente sem consumir vagas imediatamente
  it('3. Deve enviar convite para um amigo deixando o status pendente sem alterar vagas (POST /api/matches/:matchId/invite)', async () => {
    const response = await request(app)
      .post(`/api/matches/${createdMatchId}/invite`)
      .send({ friendId: invitedFriendId });

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/Convite enviado com sucesso/i);

    // Verifica diretamente no banco se o status ficou 'pending' e as vagas continuam 5
    const partCheck = await pool.query(
      'SELECT status FROM match_participants WHERE match_id = $1 AND user_id = $2',
      [createdMatchId, invitedFriendId]
    );
    expect(partCheck.rows[0].status).toBe('pending');

    const matchCheck = await pool.query('SELECT vacancies FROM matches WHERE id = $1', [createdMatchId]);
    expect(matchCheck.rows[0].vacancies).toBe(5);
  });
});