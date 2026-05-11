@echo off
title HC DCAC - Backend Compliance
cd /d "%~dp0backend"
echo.
echo ================================================
echo   HC DCAC - Herramienta Compliance - Backend
echo ================================================
echo.

if "%1"=="seed" (
    echo Cargando datos de prueba en PostgreSQL...
    node src/seed.js
    pause
    exit
)

echo Iniciando servidor en http://localhost:5000
echo.
npm start
pause
