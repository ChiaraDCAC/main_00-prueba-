@echo off
title HC DCAC - Compliance System
cd /d "%~dp0"

echo.
echo =====================================================
echo   HC DCAC - Herramienta Compliance
echo   Iniciando sistema completo...
echo =====================================================
echo.

:: ---- 1. Verificar que Docker Desktop esté corriendo ----
echo [1/4] Verificando Docker Desktop...
docker info >nul 2>&1
if errorlevel 1 (
    echo.
    echo  ERROR: Docker Desktop no esta corriendo.
    echo  Abri Docker Desktop y esperá que inicie, luego volvé a ejecutar este archivo.
    echo.
    pause
    exit /b 1
)
echo  OK - Docker Desktop activo.
echo.

:: ---- 2. Levantar contenedores ----
echo [2/4] Levantando contenedores (DB + Backend)...
docker-compose up -d
echo.

:: ---- 3. Esperar a que el backend responda ----
echo [3/4] Esperando que el backend esté listo...
set MAX_RETRIES=30
set COUNT=0

:WAIT_BACKEND
set /a COUNT+=1
if %COUNT% gtr %MAX_RETRIES% (
    echo.
    echo  ERROR: El backend no respondio despues de 30 intentos.
    echo  Revisá los logs con: docker logs compliance-backend
    echo.
    pause
    exit /b 1
)

curl -s http://127.0.0.1:5000/health >nul 2>&1
if errorlevel 1 (
    echo  Intento %COUNT%/%MAX_RETRIES% - esperando...
    timeout /t 2 /nobreak >nul
    goto WAIT_BACKEND
)

echo  OK - Backend respondiendo en http://127.0.0.1:5000
echo.

:: ---- 4. Iniciar frontend ----
echo [4/4] Iniciando frontend...
echo  Abriendo http://localhost:3000 en unos segundos...
echo.
echo =====================================================
echo   CREDENCIALES DE ACCESO
echo =====================================================
echo   Oficial:  oficial@compliance.com  / Oficial2026!
echo   Analista: analista1@compliance.com / Analista2026!
echo =====================================================
echo.

:: Abrir el browser después de 5 segundos
start "" timeout /t 5 /nobreak >nul && start "" "http://localhost:3000"

:: Iniciar Vite en esta ventana
cd /d "%~dp0frontend"
npm run dev
pause
