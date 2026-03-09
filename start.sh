#!/bin/bash

echo "==================================="
echo "  Compliance System - Iniciando"
echo "==================================="

cd "$(dirname "$0")"

# Verificar si PostgreSQL está corriendo o usar Docker
if command -v docker &> /dev/null; then
    echo "[1/3] Iniciando base de datos con Docker..."
    docker compose up -d compliance-db 2>/dev/null || docker-compose up -d compliance-db 2>/dev/null
    sleep 5
else
    echo "[!] Docker no encontrado. Asegúrate de tener PostgreSQL corriendo."
fi

# Iniciar Backend
echo "[2/3] Iniciando Backend (puerto 5000)..."
cd backend
npm install --silent 2>/dev/null
npm run dev &
BACKEND_PID=$!
cd ..

# Esperar que el backend esté listo
echo "     Esperando backend..."
sleep 5

# Iniciar Frontend
echo "[3/3] Iniciando Frontend (puerto 3000)..."
cd frontend
npm install --silent 2>/dev/null
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "==================================="
echo "  Sistema Iniciado!"
echo "==================================="
echo ""
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:5000"
echo ""
echo "  Presiona Ctrl+C para detener"
echo "==================================="

# Esperar señal de terminación
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait
