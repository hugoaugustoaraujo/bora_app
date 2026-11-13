-- Índice espacial PostGIS crucial para acelerar buscas geográficas por raio
CREATE INDEX IF NOT EXISTS idx_matches_location_geom ON matches USING GIST (location_geom);

-- Índices relacionais para otimizar pesquisas frequentes
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches (match_date);
CREATE INDEX IF NOT EXISTS idx_participants_user ON match_participants (user_id);