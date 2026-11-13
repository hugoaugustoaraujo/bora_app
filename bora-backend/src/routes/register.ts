import { Router, Request, Response } from 'express';
import { pool } from '../config/database';

const router = Router();

// ==========================================
// ROTA: Registar Novo Utilizador (POST /users)
// ==========================================
router.post('/users', async (req: Request, res: Response) => {
  try {
    console.log('📩 [BACKEND] Dados recebidos para cadastro:', req.body);
    
    const { 
      name, 
      username, 
      email, 
      password_hash, 
      location_name, 
      birth_date, 
      bio, 
      avatar_url 
    } = req.body;
    
    // 1. Validação de campos obrigatórios básicos
    if (!name || !email || !password_hash) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }

    // 2. Verificar se o e-mail já está cadastrado
    const existingEmail = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)', 
      [email.trim()]
    );
    
    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ error: 'Este e-mail já está associado a outra conta.' });
    }

    // 3. Garantir unicidade do @username
    let baseUsername = username || email.split('@')[0];
    baseUsername = baseUsername.toLowerCase().replace(/[^a-z0-9]/g, '');
    let finalUsername = baseUsername;
    
    const existingUsername = await pool.query(
      'SELECT id FROM users WHERE username = $1', 
      [finalUsername]
    );
    
    if (existingUsername.rows.length > 0) {
      finalUsername = `${baseUsername}_${Math.floor(Math.random() * 1000)}`;
    }

    // 4. Inserção persistente na base de dados PostgreSQL
    const query = `
      INSERT INTO users (
        name, 
        username, 
        email, 
        password_hash, 
        location_name, 
        birth_date, 
        bio, 
        avatar_url
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING id, name, username, email, location_name, bio, avatar_url, birth_date;
    `;

    const values = [
      name.trim(),
      finalUsername,
      email.trim().toLowerCase(),
      password_hash,
      location_name || 'Maceió, AL',
      birth_date || null,
      bio || 'Membro do Bora',
      avatar_url || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'
    ];

    const result = await pool.query(query, values);
    const newUser = result.rows[0];

    console.log('✅ [BACKEND] Utilizador registado com sucesso. ID:', newUser.id);
    return res.status(201).json(newUser);

  } catch (error: any) {
    console.error('❌ [BACKEND] Erro crítico ao criar utilizador:', error);
    return res.status(500).json({ 
      error: error.detail || error.message || 'Erro interno ao criar utilizador no banco de dados.' 
    });
  }
});

export default router;