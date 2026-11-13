import { Request, Response } from 'express';
import { pool } from '../config/database';

// Buscar partidas (com suporte a raio de distância se latitude/longitude forem fornecidas)
export const getMatches = async (req: Request, res: Response) => {
  try {
    const { lat, lng, radiusKm } = req.query;

    let query = `
      id, title, category, modality, match_date, location_name, total_spots, vacancies,
      ST_X(location_geom) as lng, ST_Y(location_geom) as lat
    `;
    let sql = `SELECT ${query} FROM matches`;
    let values: any[] = [];

    if (lat && lng && radiusKm) {
      sql = `
        SELECT ${query},
               ST_DistanceSphere(location_geom, ST_MakePoint($1, $2)) / 1000 AS distance_km
        FROM matches
        WHERE ST_DistanceSphere(location_geom, ST_MakePoint($1, $2)) <= $3 * 1000
        ORDER BY distance_km ASC;
      `;
      values = [Number(lng), Number(lat), Number(radiusKm)];
    }

    const result = await pool.query(sql, values);
    return res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar partidas:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar partidas' });
  }
};

// Criar nova partida com coordenadas geográficas
export const createMatch = async (req: Request, res: Response) => {
  try {
    const { title, category, modality, match_date, location_name, lat, lng, total_spots, organizer_id } = req.body;

    const vacancies = total_spots - 1; // O organizador já ocupa uma vaga

    const query = `
      INSERT INTO matches (title, category, modality, match_date, location_name, location_geom, total_spots, vacancies, organizer_id)
      VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($6, $7), 4326), $8, $9, $10)
      RETURNING *, ST_X(location_geom) as lng, ST_Y(location_geom) as lat;
    `;

    const values = [title, category, modality, match_date, location_name, lng, lat, total_spots, vacancies, organizer_id];

    const result = await pool.query(query, values);
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar partida:', error);
    return res.status(500).json({ error: 'Erro ao criar partida no banco' });
  }
};