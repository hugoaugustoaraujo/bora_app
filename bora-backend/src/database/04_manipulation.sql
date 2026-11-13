-- Active: 1790272910664@@127.0.0.1@5432@app-bora
SELECT * FROM users;

UPDATE users
SET avatar_url = '/images/padrao.png'
WHERE id = 2;