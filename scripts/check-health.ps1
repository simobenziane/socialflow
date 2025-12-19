# check-health.ps1 - SocialFlow Health Check Script

# Get script and project directories
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
Set-Location $ProjectDir

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "SocialFlow - Health Check" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$Errors = 0

# Check Docker
Write-Host "Checking Docker..." -ForegroundColor White
try {
    $null = docker info 2>$null
    Write-Host "[OK] Docker is running" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Docker is not running" -ForegroundColor Red
    $Errors++
}

# Check containers
Write-Host ""
Write-Host "Checking containers..." -ForegroundColor White

$containers = docker ps --format '{{.Names}}' 2>$null

if ($containers -match "socialflow-n8n") {
    Write-Host "[OK] socialflow-n8n container is running" -ForegroundColor Green
} else {
    Write-Host "[FAIL] socialflow-n8n container is not running" -ForegroundColor Red
    $Errors++
}

if ($containers -match "socialflow-ui") {
    Write-Host "[OK] socialflow-ui container is running" -ForegroundColor Green
} else {
    Write-Host "[FAIL] socialflow-ui container is not running" -ForegroundColor Red
    $Errors++
}

# Check endpoints
Write-Host ""
Write-Host "Checking endpoints..." -ForegroundColor White

# Check n8n
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5678/healthz" -UseBasicParsing -TimeoutSec 5
    Write-Host "[OK] n8n: http://localhost:5678" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] n8n is not responding" -ForegroundColor Red
    $Errors++
}

# Check UI
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
    Write-Host "[OK] UI: http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "[WARN] UI may still be starting..." -ForegroundColor Yellow
}

# Check Ollama
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/version" -UseBasicParsing -TimeoutSec 2
    Write-Host "[OK] Ollama: http://localhost:11434" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Ollama is not responding" -ForegroundColor Red
    $Errors++
}

# Check Ollama models
Write-Host ""
Write-Host "Checking Ollama models..." -ForegroundColor White

$models = & ollama list 2>$null

if ($models -match "llava") {
    Write-Host "[OK] llava model installed" -ForegroundColor Green
} else {
    Write-Host "[WARN] llava model not found - run: ollama pull llava:7b" -ForegroundColor Yellow
}

if ($models -match "llama3") {
    Write-Host "[OK] llama3 model installed" -ForegroundColor Green
} else {
    Write-Host "[WARN] llama3 model not found - run: ollama pull llama3.2:3b" -ForegroundColor Yellow
}

# Check data directory
Write-Host ""
Write-Host "Checking data directory..." -ForegroundColor White

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$envFile = Join-Path $ScriptDir ".env"

if (Test-Path $envFile) {
    $envContent = Get-Content $envFile
    $dataPathLine = $envContent | Where-Object { $_ -match "^DATA_PATH=" }
    if ($dataPathLine) {
        $dataPath = ($dataPathLine -split "=", 2)[1]
        if (Test-Path $dataPath) {
            Write-Host "[OK] Data directory exists: $dataPath" -ForegroundColor Green
        } else {
            Write-Host "[WARN] Data directory not found: $dataPath" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "[WARN] .env file not found" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
if ($Errors -eq 0) {
    Write-Host "All checks passed!" -ForegroundColor Green
} else {
    Write-Host "$Errors error(s) found" -ForegroundColor Red
}
Write-Host "==========================================" -ForegroundColor Cyan
