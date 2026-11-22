#!/usr/bin/env bash
# AquaFlow Full-Stack Launcher (C# .NET 8 Backend + React Frontend)

echo "=========================================================="
echo "    AquaFlow Smart Water Monitoring System (C# + React)   "
echo "=========================================================="

DIR="$(cd "$(dirname "$0")" && pwd)"
export PATH="$PATH:$HOME/.dotnet"
export DOTNET_ROOT="$HOME/.dotnet"
export DOTNET_CLI_HOME="/tmp/.dotnet_cli"
export ASPNETCORE_ENVIRONMENT="Development"
export ASPNETCORE_URLS="http://0.0.0.0:8000"

# 1. Start C# ASP.NET Core Web API
echo "Starting C# ASP.NET Core Web API on http://localhost:8000..."
cd "$DIR/backend_csharp/AquaFlow.Server"
"$HOME/.dotnet/dotnet" run &
BACKEND_PID=$!

# 2. Start Frontend React Dev Server
echo "Starting Frontend Development Server on http://localhost:5173..."
cd "$DIR/frontend"
npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

echo ""
echo "AquaFlow System Running:"
echo " - Frontend Dashboard: http://localhost:5173"
echo " - C# Swagger API Docs: http://localhost:8000/swagger"
echo " - Real-time WebSocket: ws://localhost:8000/ws"
echo ""
echo "Press [CTRL+C] to stop both servers."

wait
