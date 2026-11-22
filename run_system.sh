#!/usr/bin/env bash
# Smart Water Leakage Detection & Community Monitoring System Launch Script

echo "=========================================================="
echo "    AquaFlow Smart Community Water Monitoring System      "
echo "=========================================================="

# To run with C# (.NET 8) backend instead of Python:
# ./run_csharp_system.sh

if [ "$1" = "csharp" ] || [ "$1" = "c#" ] || [ "$1" = "cs" ]; then
    exec "$(dirname "$0")/run_csharp_system.sh"
fi

# Check Python environment
if [ -d ".venv" ]; then
    source .venv/bin/activate
elif [ -d "backend/.venv" ]; then
    source backend/.venv/bin/activate
else
    echo "Creating virtual environment..."
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r backend/requirements.txt
fi

# Seed DB if needed
echo "Verifying Database & Seed Data..."
cd backend
PYTHONPATH=. python seed_data.py
cd ..

echo "Starting Backend API on http://localhost:8000..."
(cd backend && PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port 8000) &
BACKEND_PID=$!

echo "Starting Frontend Development Server on http://localhost:5173..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

echo ""
echo "AquaFlow System Running:"
echo " - Frontend Dashboard: http://localhost:5173"
echo " - Backend REST & Swagger API: http://localhost:8000/docs"
echo " - Real-time WebSocket: ws://localhost:8000/ws"
echo ""
echo "Press [CTRL+C] to stop both servers."

wait
