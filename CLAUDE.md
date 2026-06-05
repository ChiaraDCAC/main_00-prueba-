# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

KYC/AML compliance tool for an Argentine financial entity (HC DCAC). The domain is Spanish and
Argentina-specific — expect terms like CUIT/CUIL, IGJ, PEP (Persona Expuesta Políticamente),
beneficiario final, ROS (Reporte de Operación Sospechosa), OI (Operación Inusual), and legal
entity types `SA` / `SRL` / `SH` / `sucesion` / `monotributista`. Keep code, comments, and UI
strings in Spanish to match the surrounding code.

The repository is **two things at once**: a working software prototype (`backend/`, `frontend/`)
and a large set of design artifacts (PRDs, DER/ER diagrams) at the repo root and in `agents/`.
`PRD-Compliance-v3.md` is the master product spec; the `diagrama-*.html` / `explicacion-der.html`
files are the data-model reference. When changing the schema, these docs are the intended source
of truth and should be kept consistent with the models.

## Repo layout

- `backend/` — Node.js + Express + Sequelize API (port 5000).
- `frontend/` — React 18 + Vite SPA (dev port 3000, served on 80 in Docker via nginx).
- `agents/` — standalone Node scripts that convert the PRD markdown to HTML/PDF (`marked`, `xlsx`); **not** part of the running app.
- Root `*.html` / `*.docx` / `PRD-*.md` — product/design documentation.

## Commands

Everything at once (starts Dockerized Postgres + backend dev + frontend dev):
```bash
./start.sh
```

Backend (`cd backend`):
```bash
npm run dev      # nodemon, http://localhost:5000
npm start        # node src/index.js
npm run migrate  # sequelize-cli db:migrate
npm run seed     # node src/seed.js  — see caveat below
```

Frontend (`cd frontend`):
```bash
npm run dev      # vite, http://localhost:3000
npm run build
npm run preview
```

Full stack in Docker (Postgres + backend + nginx-served frontend on :80):
```bash
docker compose up
```

There is **no test runner and no linter configured** in either package — don't assume `npm test`
exists.

## Architecture

### Database: SQLite in dev, Postgres in prod
`backend/src/config/database.js` selects the dialect by `NODE_ENV`:
- `development` (default) → **SQLite** at `backend/data/compliance.sqlite`.
- `production` → **Postgres** (the docker-compose `db` service, env `DB_*`).

`backend/src/models/index.js` is a single file that defines **all** Sequelize models and their
associations and exports the `sequelize` instance. It is the canonical schema, mirrored by
`backend/migrations/001_create_tables.sql`. Tables/columns are Spanish and `underscored`. Key
entities: `SociedadTag` (the client company, an external production table), `UsuarioSociedad`
(people linked to companies, UUID PK), `UsuarioSociedadTag` (N:M join), `DocumentoCliente` +
`DocumentoVersion` (one slot per doc type, versioned uploads), role tables
(`BeneficiarioFinal`, `Autoridad`, `Apoderado`, …), `Form*` tables (per-entity-type intake forms
keyed to a `DocumentoVersion`), `LogAccion` (audit trail), `OperacionInusual`, `RiesgoSociedad`,
`AltaPendientePersona`, `Alerta`. `Usuario` is the internal app user (analyst).

The app does **not** auto-`sync()` on boot — schema comes from the migration SQL (Postgres) or a
pre-existing `compliance.sqlite` (dev). `index.js` only `authenticate()`s.

### Backend request flow
`src/index.js` → `src/routes/index.js` mounts feature routers under `/api/*` → route files wire
`express-validator` checks + `auth`/`authorize` middleware → controllers → models/services.
Uploaded files are served statically from `/uploads` and `/api/uploads`.

### Auth & roles
JWT (`Authorization: Bearer`). `src/middlewares/auth.js` exposes `auth` (verify token, load
`Usuario`) and `authorize(...roles)`. There are **two role vocabularies** bridged in
`authController.js`: the DB stores `nivel_1|nivel_2|nivel_3`, while the API/JWT/frontend use
`admin | supervisor | analyst | auditor` (`nivelToRole` / `roleToNivel`). Frontend permission
gating lives in `frontend/src/config/permissions.js` (`can(role, action)`).

### Frontend
- React Router in `src/App.jsx` (all real routes are under a `ProtectedRoute` + `Layout`).
- State: Zustand (`src/context/authStore.js` persists token/user in `localStorage`); server state via `@tanstack/react-query`.
- HTTP: a single axios instance in `src/services/api.js` (baseURL `/api`), with per-feature service modules in `src/services/`. The Vite dev server proxies `/api` → `127.0.0.1:5000`.
- Path alias `@` → `frontend/src`.

## Important: the prototype is mid-refactor — verify before assuming it runs

Two model/route generations coexist and the newer wiring is incomplete. Check the actual state
before building on a given module:

- **`backend/src/routes/index.js` references router files that do not exist** (`./sociedadRoutes`,
  `./personaRoutes`, `./documentoRoutes`, `./altaRoutes`, `./alertaRoutes`,
  `./altaPendientePersonaRoutes`). The routers that *do* exist (`clientRoutes`, `alertRoutes`,
  `contractRoutes`, `documentRoutes`, `unusualOperationRoutes`, `riskRoutes`, `reportRoutes`,
  `screeningRoutes`, `rosRoutes`, `investigationCaseRoutes`, plus the nested
  `beneficialOwner/signatory/attorney/authority` routers) are **not mounted** here. As committed,
  the backend throws `MODULE_NOT_FOUND` on boot — this index needs reconciling with the real files
  before the API will start.
- **Only some controllers use real models.** `clientController` and `unusualOperationController`
  correctly import the Spanish models defined in `models/index.js`. Others (`alertController`,
  `contractController`, `documentController`, `rosController`) and `services/riskService.js`
  import English model names (`Client`, `Document`, `Alert`, `Transaction`, `Contract`,
  `RiskAssessment`, `RiskMatrix`, `SuspiciousReport`, …) that are **not defined or exported** —
  those code paths are stubs and will throw at runtime. Treat them as aspirational scaffolding.
- **`npm run seed` forces `NODE_ENV=production`** (so it writes to Postgres, not the dev SQLite)
  and loads `backend/data/seed-data.json`, which is **not present** in the repo. It will not run as-is.
- **Frontend has a demo path.** `src/services/api.js` has a `DEMO_MODE` flag (currently `false`)
  and a large block of in-file mock clients/alerts/operations that short-circuit API calls when
  enabled. Much of the UI was built against this mock shape.
- **Mixed `.jsx` / `.tsx` components.** The live app is `.jsx`. There is a parallel set of `.tsx`
  components plus `src/lib/` (`mock-data.ts`, `client-store.ts`, `types.ts`) — a separate
  shadcn/ui-style design exploration that is not the integrated app. Don't assume the two share
  state or types.

When in doubt about whether a module is real or scaffolding, trace it to `models/index.js`: if the
models it imports aren't exported there, it isn't wired up yet.
