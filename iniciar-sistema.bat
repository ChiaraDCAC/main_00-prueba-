@echo off
title HC DCAC - Compliance System
cd /d "%~dp0"

:: =====================================================
::  HC DCAC - Compliance System - Launcher
:: =====================================================
::  Backend + DB corren en Docker.
::  Frontend corre con Vite local (npm run dev) para ver
::  cambios de código en vivo durante desarrollo.
::
::  Uso:
::    iniciar-sistema.bat            -> Levantar Docker (backend+db) y Vite (frontend)
::    iniciar-sistema.bat seed       -> Cargar datos de prueba dentro del contenedor
::    iniciar-sistema.bat stop       -> Apagar contenedores (Vite se cierra con Ctrl+C)
::    iniciar-sistema.bat logs       -> Ver logs del backend en vivo
::    iniciar-sistema.bat rebuild    -> Reconstruir imagenes de backend/db
:: =====================================================

:: ---- Modo: seed ----
if /i "%1"=="seed" (
    echo.
    echo =====================================================
    echo   Cargando datos de prueba en el contenedor de DB
    echo =====================================================
    echo.
    docker exec compliance-backend node src/seed.js
    if errorlevel 1 (
        echo.
        echo  ERROR: El seed fallo. Verifica que los contenedores esten corriendo:
        echo    docker ps
        echo.
    )
    pause
    exit /b 0
)

:: ---- Modo: stop ----
if /i "%1"=="stop" (
    echo Apagando contenedores Docker...
    docker-compose down
    pause
    exit /b 0
)

:: ---- Modo: logs ----
if /i "%1"=="logs" (
    echo Mostrando logs del backend (Ctrl+C para salir)...
    docker logs -f compliance-backend
    exit /b 0
)

:: ---- Modo: rebuild ----
if /i "%1"=="rebuild" (
    echo Reconstruyendo imagenes...
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    pause
    exit /b 0
)

:: ---- Modo default: levantar Docker + Vite ----
echo.
echo =====================================================
echo   HC DCAC - Herramienta Compliance
echo   Iniciando sistema completo...
echo =====================================================
echo.

:: 1. Verificar Docker Desktop
echo [1/4] Verificando Docker Desktop...
docker info >nul 2>&1
if errorlevel 1 (
    echo.
    echo  ERROR: Docker Desktop no esta corriendo.
    echo  Abri Docker Desktop y espera que inicie, luego volve a ejecutar este archivo.
    echo.
    pause
    exit /b 1
)
echo  OK - Docker Desktop activo.
echo.

:: 2. Levantar contenedores (DB + Backend)
echo [2/4] Levantando contenedores (DB + Backend)...
docker-compose up -d
echo.

:: 3. Esperar a que el backend responda
echo [3/4] Esperando que el backend este listo...
set MAX_RETRIES=30
set COUNT=0

:WAIT_BACKEND
set /a COUNT+=1
if %COUNT% gtr %MAX_RETRIES% (
    echo.
    echo  ERROR: El backend no respondio despues de 30 intentos.
    echo  Revisa los logs:  iniciar-sistema.bat logs
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

:: 4. Iniciar frontend con Vite
echo [4/4] Iniciando frontend (Vite)...
echo  Abriendo http://localhost:3000 en unos segundos...
echo.
echo =====================================================
echo   CREDENCIALES DE ACCESO
echo =====================================================
echo   Oficial:  oficial@compliance.com   / Oficial2026!
echo   Analista: analista1@compliance.com / Analista2026!
echo =====================================================
echo  Otros comandos:
echo    iniciar-sistema.bat seed     - cargar datos de prueba
echo    iniciar-sistema.bat stop     - apagar Docker
echo    iniciar-sistema.bat logs     - ver logs del backend
echo    iniciar-sistema.bat rebuild  - reconstruir imagenes Docker
echo =====================================================
echo.

:: Abrir el browser despues de 5 segundos
start "" timeout /t 5 /nobreak >nul && start "" "http://localhost:3000"

:: Iniciar Vite en esta ventana
cd /d "%~dp0frontend"
npm run dev
pause
