#!/usr/bin/env bash
set -e

# Change directory to backend
cd "$(dirname "$0")"

# Activate virtualenv if present
if [ -d "../.venv" ]; then
    source ../.venv/bin/activate
elif [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Initialize database schema and seed data
PYTHONPATH=. python seed_data.py

# Start FastAPI server with WebSockets
echo "Starting AquaFlow FastAPI Backend on http://0.0.0.0:8000..."
PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
