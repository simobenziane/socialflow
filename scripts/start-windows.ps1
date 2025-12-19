# start-windows.ps1 - SocialFlow Windows Startup Script
# Run: .\scripts\start-windows.ps1

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "SocialFlow - Starting Services" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Get script and project directories
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
Set-Location $ProjectDir

# Check Docker
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    $null = docker info 2>$null
    Write-Host "[OK] Docker is running" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Docker is not running." -ForegroundColor Red
    Write-Host "Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check/Start Ollama
Write-Host ""
Write-Host "Checking Ollama..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/version" -UseBasicParsing -TimeoutSec 2
    Write-Host "[OK] Ollama is running" -ForegroundColor Green
} catch {
    Write-Host "Starting Ollama..." -ForegroundColor Yellow
    Start-Process "ollama" -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 3

    try {
        $response = Invoke-WebRequest -Uri "http://localhost:11434/api/version" -UseBasicParsing -TimeoutSec 5
        Write-Host "[OK] Ollama started" -ForegroundColor Green
    } catch {
        Write-Host "WARNING: Ollama may not be running." -ForegroundColor Yellow
    }
}

# Start Docker containers
Write-Host ""
Write-Host "Starting Docker containers..." -ForegroundColor Yellow
& docker-compose up -d

# Wait and check health
Write-Host ""
Write-Host "Checking services..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check n8n
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5678/healthz" -UseBasicParsing -TimeoutSec 5
    Write-Host "[OK] n8n: http://localhost:5678" -ForegroundColor Green
} catch {
    Write-Host "[..] n8n: Starting up..." -ForegroundColor Yellow
}

# Check UI
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
    Write-Host "[OK] UI:  http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "[..] UI:  Starting up..." -ForegroundColor Yellow
}

# Check Ollama
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/version" -UseBasicParsing -TimeoutSec 2
    Write-Host "[OK] Ollama: http://localhost:11434" -ForegroundColor Green
} catch {
    Write-Host "[!!] Ollama: Not responding" -ForegroundColor Red
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Services Started!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Open: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop: docker-compose down" -ForegroundColor Yellow
Write-Host ""
