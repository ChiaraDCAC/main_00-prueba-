# HC DCAC — Herramienta de Compliance

Sistema interno de Compliance para DCAC (PSP). Gestiona el alta de clientes (PJ y PH), documentación, esquemas de firmantes, matriz de riesgo, operaciones inusuales y reportes regulatorios.

---

## Stack

- **Frontend:** React + Vite + TailwindCSS. En **desarrollo** corre con `npm run dev` (Vite) en el host. En **producción** se buildea y se sirve vía Nginx en contenedor.
- **Backend:** Node.js + Express + Sequelize (en contenedor Docker).
- **DB:** PostgreSQL 15 (en contenedor Docker).
- **Orquestación:** Docker Compose para backend + DB; Vite local para frontend en dev.

---

## Requisitos

- **Docker Desktop** corriendo (Windows / macOS / Linux).
- **Node.js + npm** instalados en el host (para Vite del frontend).
- Puertos libres: `3000` (frontend Vite), `5000` (backend), `5432` (Postgres).

---

## Levantar el sistema

Hay un único launcher: `iniciar-sistema.bat` en la raíz del proyecto. **No usar otros scripts.**

```bat
:: Levantar todo el sistema (DB + Backend + Frontend)
iniciar-sistema.bat

:: Cargar datos de prueba (drop + create)
iniciar-sistema.bat seed

:: Apagar todo
iniciar-sistema.bat stop

:: Ver logs del backend en vivo
iniciar-sistema.bat logs

:: Reconstruir imágenes tras cambios de código
iniciar-sistema.bat rebuild
```

Cuando termina de levantarse, abre automáticamente <http://localhost> en tu browser.

---

## URLs

- **Frontend (dev / Vite):** http://localhost:3000
- **Backend / API:** http://localhost:5000
- **Postgres:** localhost:5432 (usuario `postgres`, base `compliance_db`)

---

## Credenciales de seed

| Rol | Email | Password |
|---|---|---|
| Oficial | `oficial@compliance.com` | `Oficial2026!` |
| Analista | `analista1@compliance.com` | `Analista2026!` |
| Analista | `analista2@compliance.com` | `Analista2026!` |

---

## Clientes de prueba (tras correr `seed`)

| Tipo | Razón social | Estado |
|---|---|---|
| SA | Inversiones del Sur S.A. | pendiente |
| SRL | Tecnología Aplicada S.R.L. | pendiente |
| SH | López y Hermanos S.H. | pendiente |
| Sucesión | Sucesión de María González | pendiente |
| Monotributista | Juan Martín Rodríguez | aprobado |
| Monotributista | Lucía Beatriz Fernández | pendiente |

---

## Flujo típico de desarrollo

```bat
iniciar-sistema.bat            :: 1) levantar
iniciar-sistema.bat seed       :: 2) cargar data si es la primera vez o querés resetear
                               :: 3) usar la app en http://localhost
iniciar-sistema.bat stop       :: 4) apagar al terminar
```

Si modificás el código del backend o frontend, hay que reconstruir:

```bat
iniciar-sistema.bat rebuild
```

---

## Troubleshooting

**"Docker Desktop no está corriendo"** → abrí Docker Desktop, esperá que el ícono de la barra de tareas quede verde, y volvé a correr `iniciar-sistema.bat`.

**"Backend no respondió después de 30 intentos"** → ver logs:
```bat
iniciar-sistema.bat logs
```
Suele ser un error en el código del backend o en la migración. Si está colgado, hacé `iniciar-sistema.bat stop` y volvé a levantar.

**No veo los datos seedeados en el front** → recordá que después de `seed` hay que reiniciar el contenedor del backend para que detecte el nuevo schema. El propio seed lo hace internamente. Si tras un seed seguís sin ver los datos:
```bat
docker restart compliance-backend
```
Y hard refresh en el browser (Ctrl+F5).

**Puerto 80 ocupado (IIS, Skype, otro)** → ajustá el mapeo en `docker-compose.yml` (línea `"80:80"` por `"8080:80"` por ejemplo) y entrá a http://localhost:8080.

---

## Estructura del repo

```
compliance-system/
├── iniciar-sistema.bat       ← Launcher único
├── docker-compose.yml
├── backend/                  ← Node + Express + Sequelize
│   ├── data/                 ← seed-data.json
│   ├── src/                  ← controllers, routes, models, services
│   └── uploads/seed/         ← PDFs de prueba
├── frontend/                 ← React + Vite
│   ├── src/                  ← pages, components, services
│   └── vite.config.js
└── agents/                   ← PRDs y documentación de producto
```

---

## Notas para producción

El sistema corre con `NODE_ENV=production` por default (definido en `docker-compose.yml`). Las variables sensibles (passwords, JWT secret, etc.) se leen del archivo `.env` del backend — **no commitearlo**.

Postgres en producción debería ser una instancia gestionada (RDS, Cloud SQL, Supabase, Neon, etc.) y no el contenedor local. Ajustá `docker-compose.yml` para sacar el servicio `db` y apuntar el backend a la instancia gestionada vía variables de entorno (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`).
