@echo off
setlocal
title AquaFlow Smart Water System (.NET 8 C#)

echo ======================================================================
echo    AquaFlow: Smart Water Leakage Detection and Community Supply
echo               .NET C# ASP.NET Core Web System (LPU CSE253)
echo ======================================================================
echo.

cd /d "%~dp0"

set "EXE_PATH=%~dp0publish\AquaFlow.Server.exe"
set "DLL_PATH=%~dp0backend_csharp\AquaFlow.Server\bin\Debug\net8.0\AquaFlow.Server.dll"

if exist "%EXE_PATH%" (
    echo [1/3] Verifying C# .NET 8 Backend Engine & Hydraulic Rules (Native Exe)...
    "%EXE_PATH%" --verify
) else (
    echo [1/3] Verifying C# .NET 8 Backend Engine & Hydraulic Rules (DLL)...
    dotnet exec "%DLL_PATH%" --verify
)

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Verification failed. Please check build output.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Starting AquaFlow .NET C# Web Application on http://localhost:8000...
echo.
echo   - Full Dashboard:      http://localhost:8000
echo   - Swagger API Docs:    http://localhost:8000/swagger
echo   - IoT Telemetry WS:    ws://localhost:8000/ws
echo   - System Healthcheck:  http://localhost:8000/api/status
echo.
echo [3/3] Opening browser in 2 seconds...
timeout /t 2 /nobreak >nul
start "" "http://localhost:8000"

echo Server is running. Press CTRL+C in this window to stop.
echo.

if exist "%EXE_PATH%" (
    "%EXE_PATH%"
) else (
    dotnet exec "%DLL_PATH%"
)
pause
