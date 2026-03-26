@echo off
echo ===================================
echo   Iniciando Compliance System
echo ===================================

:: Iniciar PostgreSQL (busca el servicio automaticamente)
echo [1/3] Iniciando PostgreSQL...
for /f "tokens=*" %%i in ('sc query type^= all state^= all ^| findstr /i "postgresql"') do (
    set "svc=%%i"
)
net start postgresql-x64-18 2>nul
net start postgresql-x64-17 2>nul
net start postgresql-x64-16 2>nul
net start postgresql-x64-15 2>nul

:: Iniciar Backend
echo [2/3] Iniciando Backend...
start "Backend" cmd /k "cd /d "%~dp0backend" && npm start"

timeout /t 5 /nobreak >nul

:: Iniciar Frontend
echo [3/3] Iniciando Frontend...
start "Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ===================================
echo  Sistema iniciado!
echo  Abri: http://127.0.0.1:3000
echo  Usuario: admin@compliance.com
echo  Password: admin123
echo ===================================
pause
