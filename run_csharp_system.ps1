# AquaFlow Smart Water System (.NET 8 C#) Launcher for PowerShell
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   AquaFlow: Smart Water Leakage Detection and Community Supply       " -ForegroundColor White
Write-Host "              .NET C# ASP.NET Core Web System (LPU CSE253)            " -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

$ExePath = Join-Path $ScriptDir "publish\AquaFlow.Server.exe"
$DllPath = Join-Path $ScriptDir "backend_csharp\AquaFlow.Server\bin\Debug\net8.0\AquaFlow.Server.dll"

if (Test-Path $ExePath) {
    Write-Host "[1/3] Running Comprehensive C# .NET 8 Verification Suite (Native Exe)..." -ForegroundColor Green
    & $ExePath --verify
} else {
    Write-Host "[1/3] Running Comprehensive C# .NET 8 Verification Suite (DLL)..." -ForegroundColor Green
    & dotnet exec $DllPath --verify
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Verification failed!" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[2/3] Launching AquaFlow .NET C# Web Application on http://localhost:8000..." -ForegroundColor Green
Write-Host "   - Interactive Dashboard:  http://localhost:8000" -ForegroundColor White
Write-Host "   - Swagger REST API Docs:  http://localhost:8000/swagger" -ForegroundColor White
Write-Host "   - Real-Time WebSocket:    ws://localhost:8000/ws" -ForegroundColor White
Write-Host "   - System Healthcheck:     http://localhost:8000/api/status" -ForegroundColor White
Write-Host ""

Start-Process "http://localhost:8000"

Write-Host "Press Ctrl+C to stop the AquaFlow C# Server." -ForegroundColor Yellow
Write-Host ""

if (Test-Path $ExePath) {
    & $ExePath
} else {
    & dotnet exec $DllPath
}
