import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import matchRoutes from './routes/matchRoutes';
import userRoutes from './routes/index';
import registerRoutes from './routes/register';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Disponibiliza a pasta local de imagens de forma estática na rota /images
app.use('/images', express.static(path.join(__dirname, '../images')));

// Registar todas as rotas sob o prefixo /api
app.use('/api', matchRoutes);
app.use('/api', userRoutes);
app.use('/api', registerRoutes);

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Servidor do Bora rodando na porta ${PORT}`);
});