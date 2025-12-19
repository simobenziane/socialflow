# setup-windows.ps1 - SocialFlow Windows Interactive Setup
# Run: .\scripts\setup-windows.ps1

$ErrorActionPreference = "Stop"

# Get script and project directories
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
Set-Location $ProjectDir

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "     SocialFlow - Interactive Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Note: Running without Administrator privileges." -ForegroundColor Yellow
    Write-Host "Some installations may require you to run as Administrator." -ForegroundColor Yellow
    Write-Host ""
}

# Function to check if command exists
function Test-CommandExists {
    param($Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# Function to check if winget is available
function Test-WingetAvailable {
    try {
        $null = winget --version
        return $true
    } catch {
        return $false
    }
}

# ===========================================
# Interactive Configuration
# ===========================================

Write-Host "--- Configuration ---" -ForegroundColor Cyan
Write-Host ""

# Ask deployment mode
Write-Host "How will you deploy SocialFlow?"
Write-Host ""
Write-Host "  1) Local machine (everything runs here)"
Write-Host "  2) VPS Hybrid (n8n on VPS, Ollama on local machine via Tailscale)"
Write-Host ""
$DeployMode = Read-Host "Select [1/2] (default: 1)"
if ([string]::IsNullOrEmpty($DeployMode)) { $DeployMode = "1" }

if ($DeployMode -eq "2") {
    $DeployType = "vps"
    Write-Host ""
    Write-Host "VPS Hybrid mode selected" -ForegroundColor Green
} else {
    $DeployType = "local"
    Write-Host ""
    Write-Host "Local deployment selected" -ForegroundColor Green
}

# Ask for data path
Write-Host ""
Write-Host "Where should SocialFlow store client data?"
Write-Host ""

if ($DeployType -eq "vps") {
    $DefaultPath = "C:\socialflow-data"
} else {
    $DefaultPath = "C:\Clients"
}

$DataPath = Read-Host "Data path [$DefaultPath]"
if ([string]::IsNullOrEmpty($DataPath)) { $DataPath = $DefaultPath }

Write-Host ""
Write-Host "Data will be stored in: $DataPath" -ForegroundColor Green

# For VPS mode, ask for Tailscale IP
$OllamaHost = ""
if ($DeployType -eq "vps") {
    Write-Host ""
    Write-Host "--- Tailscale Configuration ---" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "For VPS Hybrid, you need Tailscale to connect to your local Ollama."
    Write-Host ""
    Write-Host "On your LOCAL machine (where Ollama runs):"
    Write-Host "  1. Install Tailscale: https://tailscale.com/download"
    Write-Host "  2. Sign in to Tailscale"
    Write-Host "  3. Run: tailscale ip -4"
    Write-Host "  4. Enter that IP below"
    Write-Host ""
    $TailscaleIP = Read-Host "Local machine Tailscale IP (e.g., 100.100.100.2)"

    if ([string]::IsNullOrEmpty($TailscaleIP)) {
        Write-Host "No Tailscale IP provided. You'll need to edit .env later." -ForegroundColor Yellow
        $OllamaHost = "http://100.x.x.x:11434"
    } else {
        $OllamaHost = "http://${TailscaleIP}:11434"
        Write-Host "Ollama will be accessed at: $OllamaHost" -ForegroundColor Green
    }
}

# ===========================================
# Check Prerequisites
# ===========================================

Write-Host ""
Write-Host "--- Checking Prerequisites ---" -ForegroundColor Cyan
Write-Host ""

# Check winget
if (-not (Test-WingetAvailable)) {
    Write-Host "ERROR: winget is not available." -ForegroundColor Red
    Write-Host "Please install App Installer from Microsoft Store or update Windows." -ForegroundColor Red
    Write-Host "https://apps.microsoft.com/store/detail/app-installer/9NBLGGH4NNS1" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] winget available" -ForegroundColor Green

# Check/install Git
if (-not (Test-CommandExists "git")) {
    Write-Host "Installing Git..." -ForegroundColor Yellow
    winget install --id Git.Git -e --silent --accept-package-agreements --accept-source-agreements
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Write-Host "[OK] Git installed" -ForegroundColor Green
} else {
    Write-Host "[OK] Git installed" -ForegroundColor Green
}

# Check/install Docker
if (-not (Test-CommandExists "docker")) {
    Write-Host "Installing Docker Desktop..." -ForegroundColor Yellow
    winget install --id Docker.DockerDesktop -e --silent --accept-package-agreements --accept-source-agreements
    Write-Host ""
    Write-Host "Docker Desktop installed!" -ForegroundColor Green
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "  1. Start Docker Desktop from the Start Menu" -ForegroundColor Yellow
    Write-Host "  2. Wait for Docker to fully start (whale icon stops animating)" -ForegroundColor Yellow
    Write-Host "  3. Re-run this script" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "[OK] Docker installed" -ForegroundColor Green
}

# Check if Docker is running
try {
    $null = docker info 2>$null
    Write-Host "[OK] Docker is running" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Docker is not running." -ForegroundColor Red
    Write-Host "Please start Docker Desktop and re-run this script." -ForegroundColor Red
    exit 1
}

# Install Ollama (local mode only)
if ($DeployType -eq "local") {
    if (-not (Test-CommandExists "ollama")) {
        Write-Host "Installing Ollama..." -ForegroundColor Yellow
        winget install --id Ollama.Ollama -e --silent --accept-package-agreements --accept-source-agreements
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        Write-Host "[OK] Ollama installed" -ForegroundColor Green
    } else {
        Write-Host "[OK] Ollama installed" -ForegroundColor Green
    }
}

# Install Tailscale (VPS mode only)
if ($DeployType -eq "vps") {
    if (-not (Test-CommandExists "tailscale")) {
        Write-Host "Installing Tailscale..." -ForegroundColor Yellow
        winget install --id Tailscale.Tailscale -e --silent --accept-package-agreements --accept-source-agreements
        Write-Host "[OK] Tailscale installed" -ForegroundColor Green
    } else {
        Write-Host "[OK] Tailscale installed" -ForegroundColor Green
    }
}

# ===========================================
# Create Configuration
# ===========================================

Write-Host ""
Write-Host "--- Creating Configuration ---" -ForegroundColor Cyan
Write-Host ""

# Create data directory
Write-Host "Creating data directory..."
New-Item -ItemType Directory -Path "$DataPath\_config\agents" -Force | Out-Null
Write-Host "[OK] Created $DataPath" -ForegroundColor Green

# Create .env file
Write-Host "Creating .env file..."
if ($DeployType -eq "vps") {
    if (Test-Path ".env.vps.example") {
        Copy-Item ".env.vps.example" ".env"
    } else {
        Copy-Item ".env.example" ".env"
    }
} else {
    if (Test-Path ".env.windows.example") {
        Copy-Item ".env.windows.example" ".env"
    } elseif (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
    }
}

# Update DATA_PATH in .env
$envContent = Get-Content ".env" -Raw
$envContent = $envContent -replace "DATA_PATH=.*", "DATA_PATH=$DataPath"

# Update OLLAMA_HOST for VPS
if ($DeployType -eq "vps" -and -not [string]::IsNullOrEmpty($OllamaHost)) {
    $envContent = $envContent -replace "OLLAMA_HOST=.*", "OLLAMA_HOST=$OllamaHost"
}

Set-Content ".env" $envContent
Write-Host "[OK] Created .env" -ForegroundColor Green

# ===========================================
# Pull Ollama Models (local only)
# ===========================================

if ($DeployType -eq "local") {
    Write-Host ""
    Write-Host "--- Pulling Ollama Models ---" -ForegroundColor Cyan
    Write-Host ""

    # Check if Ollama is running
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:11434/api/version" -UseBasicParsing -TimeoutSec 2
        Write-Host "[OK] Ollama is running" -ForegroundColor Green
    } catch {
        Write-Host "Starting Ollama..." -ForegroundColor Yellow
        Start-Process "ollama" -ArgumentList "serve" -WindowStyle Hidden
        Start-Sleep -Seconds 3
    }

    Write-Host "Pulling llava:7b (vision model)... This may take a while." -ForegroundColor Yellow
    & ollama pull llava:7b

    Write-Host ""
    Write-Host "Pulling llama3.2:3b (text model)..." -ForegroundColor Yellow
    & ollama pull llama3.2:3b

    Write-Host "[OK] Models ready" -ForegroundColor Green
}

# ===========================================
# Build and Start Docker
# ===========================================

Write-Host ""
Write-Host "--- Building Docker Containers ---" -ForegroundColor Cyan
Write-Host ""

if ($DeployType -eq "vps") {
    & docker-compose -f docker-compose.vps.yml build
    Write-Host "[OK] Containers built (VPS mode)" -ForegroundColor Green

    Write-Host ""
    Write-Host "Starting containers..."
    & docker-compose -f docker-compose.vps.yml up -d
} else {
    & docker-compose build
    Write-Host "[OK] Containers built" -ForegroundColor Green

    Write-Host ""
    Write-Host "Starting containers..."
    & docker-compose up -d
}

Write-Host "[OK] Containers started" -ForegroundColor Green

# ===========================================
# Initialize Database
# ===========================================

Write-Host ""
Write-Host "--- Initializing Database ---" -ForegroundColor Cyan
Write-Host ""

Write-Host "Waiting for n8n to start..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$n8nReady = $false

while ($attempt -lt $maxAttempts -and -not $n8nReady) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5678/healthz" -UseBasicParsing -TimeoutSec 2
        $n8nReady = $true
    } catch {
        $attempt++
        Start-Sleep -Seconds 2
    }
}

if ($n8nReady) {
    Write-Host "[OK] n8n is ready" -ForegroundColor Green
    & docker exec socialflow-n8n sh /opt/scripts/init-db.sh
    Write-Host "[OK] Database initialized" -ForegroundColor Green
} else {
    Write-Host "WARNING: n8n is not responding yet." -ForegroundColor Yellow
    Write-Host "Run this command manually after n8n starts:" -ForegroundColor Yellow
    Write-Host "  docker exec socialflow-n8n sh /opt/scripts/init-db.sh" -ForegroundColor Cyan
}

# ===========================================
# Done!
# ===========================================

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "     Setup Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services:" -ForegroundColor White
Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "  n8n:       http://localhost:5678" -ForegroundColor Cyan
if ($DeployType -eq "local") {
    Write-Host "  Ollama:    http://localhost:11434" -ForegroundColor Cyan
}
Write-Host ""
Write-Host "Data directory: $DataPath" -ForegroundColor White
Write-Host ""

if ($DeployType -eq "vps") {
    Write-Host "VPS Hybrid Next Steps:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Configure nginx with SSL (see docs/VPS_HYBRID.md)"
    Write-Host ""
    Write-Host "2. On your LOCAL machine:"
    Write-Host "   - Keep Tailscale running"
    Write-Host "   - Start Ollama: ollama serve"
    Write-Host ""
    Write-Host "3. Test Tailscale connection:"
    Write-Host "   curl $OllamaHost/api/version"
    Write-Host ""
} else {
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Import workflows in n8n:"
    Write-Host "   Open http://localhost:5678"
    Write-Host "   Import from workflows/ folder"
    Write-Host ""
    Write-Host "2. Start Cloudflare tunnel (for media):"
    Write-Host "   cloudflared tunnel --url file://$DataPath"
    Write-Host ""
    Write-Host "3. Open the app:"
    Write-Host "   http://localhost:3000"
}
Write-Host ""
Write-Host "Daily commands:" -ForegroundColor White
Write-Host "  .\scripts\start-windows.ps1  - Start services"
Write-Host "  .\scripts\check-health.ps1   - Check status"
Write-Host "  docker-compose down          - Stop services"
Write-Host ""
