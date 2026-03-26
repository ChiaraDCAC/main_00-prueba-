# copilot-instructions for Compliance System

Purpose: give AI coding agents the minimal, concrete context needed to be productive in this repo.

- **Big picture**: This is a two-tier web app.
  - Backend: Node/Express API using Sequelize ORM. Entry: [backend/src/index.js](backend/src/index.js). Uses SQLite for local development and Postgres in Docker/production ([backend/src/config/database.js](backend/src/config/database.js)). Routes are mounted under `/api` ([backend/src/index.js](backend/src/index.js)), controllers live in [backend/src/controllers](backend/src/controllers) and services in [backend/src/services](backend/src/services).
  - Frontend: React + Vite single-page app in [frontend/src](frontend/src). Dev server is `vite`; production build served by nginx in the Dockerfile ([frontend/Dockerfile](frontend/Dockerfile)).
  - Containerized prod: `docker-compose.yml` starts Postgres, backend, and frontend. In production the backend expects Postgres (see `db` service and env vars in `docker-compose.yml`).

- **How to run (dev)**
  - Backend (local, sqlite):
    - cd into `backend` then `npm ci` (or `npm install`), then `npm run dev` to start with `nodemon`.
    - Useful commands: `npm run start` (prod), `npm run migrate` (sequelize migrations), `npm run seed` (run seeds). See [backend/package.json](backend/package.json).
    - The seed helper file is [backend/src/seed.js](backend/src/seed.js) and creates an admin user (`admin@compliance.com / admin123`).
  - Frontend:
    - cd into `frontend`, run `npm ci`, then `npm run dev` to start the Vite dev server.
    - Build with `npm run build`; served by nginx in Docker.
  - Full prod with Docker: from repo root run `docker-compose up --build` (uses Postgres; configure env vars or `.env`). See `docker-compose.yml`.

- **Key conventions & patterns** (important for code generation and refactors)
  - Language: many domain strings and enum values are Spanish (e.g., `pendiente`, `aprobado`, `bajo`, `medio`, `alto`). Keep translations/labels consistent with existing enums in [backend/src/models/index.js](backend/src/models/index.js).
  - Database: development uses SQLite file at `data/compliance.sqlite` by default; production uses Postgres when env `NODE_ENV=production` (see [backend/src/config/database.js](backend/src/config/database.js)). Some fields use `JSON` instead of arrays for SQLite compatibility — mind dialect differences when adding migrations or queries.
  - Authentication: JWT-based middleware at [backend/src/middlewares/auth.js](backend/src/middlewares/auth.js). Use `req.user` set by the middleware for role checks; roles are `admin`, `analyst`, `supervisor`, `auditor`.
  - Uploads: backend serves uploads statically at `/uploads` and the `uploads` directory is used by Docker volumes. See [backend/src/index.js](backend/src/index.js) and `docker-compose.yml` volumes.
  - Logging: Winston-based logger used; morgan writes to logger (see [backend/src/index.js](backend/src/index.js) and [backend/src/utils/logger.js](backend/src/utils/logger.js)).
  - DB naming: Sequelize `define` uses `underscored: true` and `timestamps: true` (snake_case DB columns). Follow that when adding fields or raw SQL.

- **Integration points & external deps**
  - Screening / external APIs: env vars present in [backend/.env.example](backend/.env.example) (e.g., `SCREENING_API_URL`, `SCREENING_API_KEY`). Look for service wrappers under `backend/src/services`.
  - Migrations: uses `sequelize-cli` for `migrate` and `seed` scripts. Migration files (if present) will be under `backend/migrations` (not all projects include migrations; check before running).

- **When editing code, prefer these locations**
  - Add business logic to `backend/src/services/*` and keep controllers thin in `backend/src/controllers/*`.
  - Route changes go into `backend/src/routes/*` and are registered from `backend/src/routes/index.js`.
  - UI changes go into `frontend/src/components` or `frontend/src/pages` depending on scope.

- **Safety & common pitfalls**
  - Don't assume Postgres features in dev: local runs often use SQLite. Use Sequelize data types that work on both or add dialect-aware code (see existing JSON/JSONB handling).
  - Enums are stored as DB ENUMs — altering them may require migrations for Postgres.
  - Keep Spanish enum values and API message strings consistent with the rest of the codebase.

- **Useful files to inspect for context**
  - Backend entry: [backend/src/index.js](backend/src/index.js)
  - DB config: [backend/src/config/database.js](backend/src/config/database.js)
  - Models: [backend/src/models/index.js](backend/src/models/index.js)
  - Auth middleware: [backend/src/middlewares/auth.js](backend/src/middlewares/auth.js)
  - Seed helper: [backend/src/seed.js](backend/src/seed.js)
  - Frontend build: [frontend/Dockerfile](frontend/Dockerfile)
  - Compose / prod wiring: [docker-compose.yml](docker-compose.yml)

If anything above is unclear or you'd like me to add examples (pull-request templates, code snippets, or stricter rules), tell me which area to expand. I'll iterate quickly.
