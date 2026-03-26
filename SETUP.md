# Compliance System - Guía de Inicio

## Requisitos
- Node.js v18+
- PostgreSQL 18 (instalado en `C:\Program Files\PostgreSQL\18`)
- Git Bash

## Iniciar el sistema

### 1. Iniciar PostgreSQL
Abrir **PowerShell como administrador** y ejecutar:
```powershell
Start-Service postgresql-18
```

### 2. Iniciar Backend
```bash
cd "/c/users/admin/desktop/HC DCAC/compliance-system/backend"
npm start
```

### 3. Iniciar Frontend
```bash
cd "/c/users/admin/desktop/HC DCAC/compliance-system/frontend"
npm run dev
```

### 4. Abrir en el navegador
```
http://127.0.0.1:3000
```

## Credenciales
- **Usuario:** admin@compliance.com
- **Contraseña:** admin123

## Base de datos
- **Host:** 127.0.0.1
- **Puerto:** 5432
- **DB:** compliance_db
- **Usuario:** postgres
- **Contraseña:** Vicente2026!

## pgAdmin 4
- Abrir pgAdmin 4 desde el menú de inicio
- Si pide puerto → usar 2050
- Conectar con contraseña: `Vicente2026!`
- Host del servidor: `127.0.0.1`

## Tablas principales
- `clients` - Clientes del sistema
- `DatosGenerales` - Personas físicas
- `DatosGeneralesSociedades` - Relación persona-sociedad
- `SAData` - Datos específicos SA
- `SRLData` - Datos específicos SRL
- `SHData` - Datos específicos Sociedad de Hecho
- `SucesionData` - Datos específicos Sucesión
- `MonotributistaData` - Datos específicos Monotributista

## Endpoints de entidades
- `GET/POST /api/entity-data/sa/:id_sociedad`
- `GET/POST /api/entity-data/srl/:id_sociedad`
- `GET/POST /api/entity-data/sh/:id_sociedad`
- `GET/POST /api/entity-data/sucesion/:id_sociedad`
- `GET/POST /api/entity-data/monotributista/:id_sociedad`
- `POST /api/datos-generales` → crear persona nueva
- `POST /api/datos-generales/:uuid/sociedades` → vincular persona a sociedad

## Notas
- Usar siempre `http://127.0.0.1:3000` (no localhost)
- Si PostgreSQL no arranca, ejecutar `setup-postgres.ps1` como administrador
- Los logs del backend están en `backend/logs/`
