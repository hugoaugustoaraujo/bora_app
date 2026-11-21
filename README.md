# Bora

Aplicativo para organizar partidas esportivas: criar jogos, encontrar locais próximos no mapa, convidar amigos e conversar por chat.

O repositório é um monorepo simples com duas partes independentes:

| Pasta | O que é | Stack |
| --- | --- | --- |
| `bora-app-main/` | Aplicativo mobile (iOS, Android e Web) | Expo SDK 58, React Native 0.88, Expo Router, TypeScript |
| `bora-backend/` | API REST | Node.js, Express 4, TypeScript, PostgreSQL + PostGIS |

---

## Pré-requisitos

- **Node.js 18+** e npm
- **Docker** e **Docker Compose** — caminho recomendado, sobe o banco e a API sem instalar PostgreSQL na máquina
- **PostgreSQL 15 + PostGIS** — apenas se preferir rodar sem Docker
- Para testar no celular: app **Expo Go**, ou Android Studio / Xcode para um development build

---

## Começando

### 1. Clone e instale as dependências

As dependências **não são versionadas** — cada pessoa instala as suas a partir do `package-lock.json`:

```bash
git clone <url-do-repositorio>
cd bora_app

cd bora-backend   && npm install && cd ..
cd bora-app-main  && npm install && cd ..
```

> Em CI ou em qualquer instalação limpa, prefira `npm ci`: ele respeita exatamente o `package-lock.json` e falha se o lock estiver fora de sincronia com o `package.json`.

### 2. Suba o backend e o banco

**Com Docker (recomendado)** — sobe PostgreSQL + PostGIS, aplica os scripts SQL de inicialização e levanta a API:

```bash
docker compose up --build postgres-db backend
```

A API fica em `http://localhost:3000` e o banco em `localhost:5432`. As variáveis de ambiente já são injetadas pelo `docker-compose.yml`; **não é preciso criar `.env` neste caminho**.

**Sem Docker** — crie o `.env` a partir do modelo e aponte para o seu PostgreSQL:

```bash
cd bora-backend
cp .env.example .env   # ajuste usuário, senha e nome do banco
npm run dev            # tsx watch, recarrega a cada alteração
```

Rodando sem Docker, aplique os scripts SQL manualmente, **na ordem**:

```bash
psql -U postgres -d app-bora -f src/database/01_extensions.sql
psql -U postgres -d app-bora -f src/database/02_schema.sql
psql -U postgres -d app-bora -f src/database/03_indexes.sql
```

### 3. Rode o aplicativo

```bash
cd bora-app-main
npx expo start        # abre o Expo Dev Tools; use o QR Code no Expo Go
npx expo start --web  # ou direto no navegador
```

O app descobre o endereço da API sozinho (`src/services/api.ts`): usa `localhost:3000` na Web e, no celular, o IP da sua máquina detectado pelo Expo. **O celular e o computador precisam estar na mesma rede Wi‑Fi.**

---

## Build nativo (Android / iOS)

As pastas `android/` e `ios/` **não são versionadas**. Elas são geradas pelo Expo (Continuous Native Generation) a partir do `app.json`, então toda configuração nativa — permissões, ícones, nome do pacote — é feita lá, nunca editando os arquivos nativos à mão.

Para rodar um build nativo local, gere-as antes:

```bash
cd bora-app-main
npx expo prebuild          # gera android/ e ios/ a partir do app.json
npx expo run:android       # já executa o prebuild se necessário
npx expo run:ios
```

Para builds na nuvem (sem Xcode ou Android Studio), use o EAS, já configurado em `eas.json`:

```bash
npx eas-cli@latest build --profile development
```

> Rodando apenas no Expo Go ou no dev server, nada disso é necessário.

---

## Testes

```bash
# Tudo via Docker — sobe um banco limpo e roda os testes de integração
docker compose up --build --abort-on-container-exit --exit-code-from test-runner postgres-db test-runner
docker compose run --rm frontend-test-runner

# Ou localmente
cd bora-backend  && npm test   # integração: precisa do PostgreSQL no ar
cd bora-app-main && npm test   # unitários: regras de negócio e serviços
```

Os testes do backend (`src/tests/api.integration.test.ts`) fazem requisições reais contra o banco. Os do app (`src/__tests__/`) são unitários e não dependem de rede.

---

## Estrutura do projeto

```
bora_app/
├── docker-compose.yml        # Postgres + API + executores de teste
├── bora-backend/
│   ├── Dockerfile
│   ├── .env.example          # modelo das variáveis de ambiente
│   ├── images/               # avatares enviados (só padrao.png é versionado)
│   └── src/
│       ├── server.ts         # entrypoint do Express
│       ├── config/database.ts
│       ├── database/*.sql    # extensões, schema e índices
│       ├── routes/           # endpoints da API
│       └── tests/
└── bora-app-main/
    ├── app.json              # configuração do Expo (inclui o nativo)
    ├── eas.json              # perfis de build do EAS
    ├── app/                  # telas — cada arquivo é uma rota (Expo Router)
    │   ├── (tabs)/           # abas: início, partidas, amigos, perfil
    │   └── chat/[friendID].tsx
    ├── components/           # componentes compartilhados
    ├── context/AppContext.tsx
    └── src/services/api.ts   # cliente HTTP e funções da API
```

---

## Variáveis de ambiente

Só o backend usa `.env` (modelo em `bora-backend/.env.example`):

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `PORT` | `3000` | Porta da API |
| `DB_HOST` | `localhost` | Host do PostgreSQL (`postgres-db` no Docker) |
| `DB_PORT` | `5432` | Porta do PostgreSQL |
| `DB_USER` | `postgres` | Usuário do banco |
| `DB_PASSWORD` | `postgres` | Senha do banco |
| `DB_NAME` | `app-bora` | Nome do banco |

O arquivo `.env` **nunca deve ser commitado** — ele está no `.gitignore`.

---

## API

Todos os endpoints vivem sob o prefixo `/api`.

**Usuários e autenticação**

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/api/login` | Autentica por e-mail e senha |
| `POST` | `/api/users` | Cadastra um novo usuário |
| `GET` | `/api/users` | Lista usuários |
| `GET` | `/api/users/search?username=` | Busca por username |
| `GET` | `/api/users/:id` | Dados de um usuário |
| `POST` | `/api/users/:id/avatar` | Envia a foto de perfil (multipart) |
| `PATCH` | `/api/users/:id/settings` | Atualiza preferências |
| `PATCH` | `/api/users/:id/location` | Atualiza a geolocalização |
| `GET` | `/api/users/:targetId/profile-access` | Verifica acesso a perfil privado |

**Partidas**

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/matches` | Lista partidas com participantes |
| `POST` | `/api/matches` | Cria uma partida |
| `POST` | `/api/matches/:matchId/participate` | Confirma presença |
| `POST` | `/api/matches/:matchId/invite` | Convida um amigo |

**Amizades**

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/users/:id/friends` | Amigos e pedidos pendentes |
| `POST` | `/api/friendships/request` | Envia pedido de amizade |
| `POST` | `/api/friendships/respond` | Aceita ou recusa um pedido |
| `POST` | `/api/friendships/unfriend` | Desfaz a amizade |
| `POST` | `/api/users/block` · `/api/users/unblock` | Bloqueia e desbloqueia |
| `GET` | `/api/users/:id/blocked` | Lista bloqueados |

**Mensagens e notificações**

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/messages/:userId/:friendId` | Histórico da conversa |
| `POST` | `/api/messages` | Envia mensagem e gera notificação |
| `GET` | `/api/users/:id/notifications` | Lista notificações |
| `PATCH` | `/api/notifications/:id/read` | Marca como lida |

Imagens enviadas ficam disponíveis estaticamente em `/images/<arquivo>`.

---

## Banco de dados

PostgreSQL 15 com **PostGIS**, usado para buscar partidas por proximidade geográfica. Tabelas principais: `users`, `matches`, `match_participants`, `friendships`, `messages`, `notifications`, `venues`, `match_ratings`, `user_sports` e `message_attachments`.

No Docker, os arquivos de `bora-backend/src/database/` são executados automaticamente na **primeira** subida, em ordem alfabética. Para reaplicá-los do zero, apague o volume:

```bash
docker compose down -v && docker compose up --build
```

> `04_manipulation.sql` contém consultas e ajustes pontuais usados durante o desenvolvimento, não faz parte do schema.

---

## Convenções

O que o build consegue recriar não é versionado — versiona-se a receita. Ficam fora do Git: `node_modules/` (recriado por `npm install`), `android/` e `ios/` (por `npx expo prebuild`), `.expo/`, `dist/`, `coverage/` e `.env`.

---

## Limitações conhecidas

- As senhas são gravadas e comparadas **em texto puro** no campo `password_hash`; não há hash nem tokens de sessão. Não use dados reais.
- A API não tem camada de autenticação nas rotas — qualquer requisição com um `userId` válido é aceita.
- A configuração atual é voltada para desenvolvimento local (HTTP sem TLS, `usesCleartextTraffic` habilitado no Android).
