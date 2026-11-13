-- Active: 1790272910664@@127.0.0.1@5432@app-bora
-- Tabela de Utilizadores (Users)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  location_name VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  birth_date VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Partidas (Matches)
CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL,
  modality VARCHAR(50) NOT NULL,
  match_date TIMESTAMP NOT NULL,
  location_name VARCHAR(150) NOT NULL,
  location_geom GEOMETRY(Point, 4326),
  total_spots INT NOT NULL,
  vacancies INT NOT NULL,
  organizer_id INT REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Participantes / Inscrições (Match Participants)
CREATE TABLE IF NOT EXISTS match_participants (
  id SERIAL PRIMARY KEY,
  match_id INT REFERENCES matches(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(30) DEFAULT 'confirmed', -- 'pending', 'confirmed', 'waiting_arrival'
  arrived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(match_id, user_id)
);

-- Tabela de Amizades (Friendships)
CREATE TABLE IF NOT EXISTS friendships (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  friend_id INT REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, friend_id)
);

-- Tabela de Notificações
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  actor_id INT REFERENCES users(id) ON DELETE CASCADE, -- Quem realizou a ação
  type VARCHAR(50) NOT NULL, -- 'chat_message', 'match_created_friend', 'match_joined_friend'
  reference_id INT, -- ID da partida ou relação relevante
  message_id INT REFERENCES messages(id) ON DELETE CASCADE, -- Opcional, para notificações de chat
  notification_text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_sports (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  modality VARCHAR(50) NOT NULL, -- Ex: 'Vôlei', 'Futebol'
  skill_level VARCHAR(30) DEFAULT 'intermediary', -- 'beginner', 'intermediary', 'advanced'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, modality)
);

CREATE TABLE IF NOT EXISTS venues (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  address TEXT NOT NULL,
  location_geom GEOMETRY(Point, 4326),
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS match_ratings (
  id SERIAL PRIMARY KEY,
  match_id INT REFERENCES matches(id) ON DELETE CASCADE,
  rater_id INT REFERENCES users(id) ON DELETE CASCADE, -- Quem avaliou
  rated_id INT REFERENCES users(id) ON DELETE CASCADE, -- Quem foi avaliado
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(match_id, rater_id, rated_id)
);

-- Tabela de Mensagens de Chat Direto
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_id INT REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INT REFERENCES users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE, -- Crucial para notificações
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Anexos de Mensagem (Para imagens, arquivos, etc.)
CREATE TABLE IF NOT EXISTS message_attachments (
  id SERIAL PRIMARY KEY,
  message_id INT REFERENCES messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50), -- 'image/png', 'application/pdf', etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para otimizar as consultas frequentes de notificações e chat
CREATE INDEX IF NOT EXISTS idx_notifications_user_is_read ON notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages (receiver_id, is_read);