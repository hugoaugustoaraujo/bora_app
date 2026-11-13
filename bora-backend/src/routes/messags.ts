import { Router, Request, Response } from 'express';
import { pool } from '../config/database';

const router = Router();

// Rota para enviar nova mensagem
router.post('/messages', async (req: Request, res: Response) => {
  try {
    const { sender_id, receiver_id, message_text, attachments } = req.body;
    // ... validações anteriores ...

    // 1. Salva a mensagem de forma persistente
    const msgResult = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, message_text)
       VALUES (\$1, \$2, \$3) RETURNING *`,
      [sender_id, receiver_id, message_text]
    );
    const newMessage = msgResult.rows[0];

    // 2. Salva os anexos (se houver)
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        await pool.query(
          `INSERT INTO message_attachments (message_id, file_url, file_type)
           VALUES (\$1, \$2, \$3)`,
          [newMessage.id, attachment.url, attachment.type]
        );
      }
    }

    // 3. Trigger: Inserir Notificação de Chat Persistente para o Destinatário
    await pool.query(
      `INSERT INTO notifications (user_id, actor_id, type, message_id, notification_text)
       VALUES (\$1, \$2, 'chat_message', \$3, \$4)`,
      [
        receiver_id, // Quem recebe
        sender_id, // Quem enviou
        newMessage.id,
        'Você recebeu uma nova mensagem.'
      ]
    );

    // 4. (Opcional) Enviar evento via Socket.io para real-time se estiver implementado
    // io.to(receiver_id.toString()).emit('new_notification', { type: 'chat_message', msgId: newMessage.id });

    return res.status(201).json(newMessage);
  } catch (error) {
    // ... manipulação de erro ...
  }
});