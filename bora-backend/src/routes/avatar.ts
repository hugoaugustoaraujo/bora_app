// src/routes/avatar.ts
import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import axios from 'axios';

const router = Router();

/**
 * Rota para obter e cachear a imagem de perfil (avatar) do utilizador.
 * Endpoint: GET /api/users/:id/avatar
 */
router.get('/users/:id/avatar', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 1. Busca o avatar_url do utilizador na base de dados
    const result = await pool.query('SELECT avatar_url, name FROM users WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilizador não encontrado.' });
    }

    const avatarUrl = result.rows[0].avatar_url;

    if (!avatarUrl) {
      return res.status(404).json({ error: 'Utilizador não possui imagem de perfil.' });
    }

    // Se o avatar for um link externo (ex: Unsplash / Google / CDN)
    if (avatarUrl.startsWith('http')) {
      // Configuramos o cache agressivo no cabeçalho para durar 7 dias no cliente/proxy
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      
      // Opcional: Se quiser fazer fetch e retornar o Buffer diretamente pelo seu servidor (proxy reverso com cache):
      try {
        const imageResponse = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
        const contentType = imageResponse.headers['content-type'] || 'image/jpeg';
        
        res.setHeader('Content-Type', contentType);
        return res.send(Buffer.from(imageResponse.data));
      } catch (fetchError) {
        // Fallback: Redireciona diretamente para o link externo caso o fetch falhe
        return res.redirect(avatarUrl);
      }
    }

    // Se estiver guardado localmente em base64 ou caminho estático
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    return res.json({ avatar_url: avatarUrl });

  } catch (error) {
    console.error('Erro ao processar avatar do utilizador:', error);
    return res.status(500).json({ error: 'Erro interno ao carregar imagem de perfil.' });
  }
});

export default router;