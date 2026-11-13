import { Router } from 'express';
import matchRouter from './matches';

const router = Router();

// Reexporta todas as rotas de partidas padronizadas
router.use(matchRouter);

export default router;