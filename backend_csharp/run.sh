#!/usr/bin/env bash
export DOTNET_CLI_HOME="/tmp/.dotnet_cli"
export ASPNETCORE_ENVIRONMENT="Development"
export ASPNETCORE_URLS="http://0.0.0.0:8000"
cd "$(dirname "$0")/AquaFlow.Server"
exec /Users/antrikshmishra/.dotnet/dotnet run --no-build
