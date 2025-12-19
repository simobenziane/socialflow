# SocialFlow - Mac Setup Guide

Complete guide for running SocialFlow on macOS. This guide covers Docker setup, Ollama installation, Cloudflare tunnel configuration, and cross-platform development workflow.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Project Changes Required](#2-project-changes-required)
3. [Mac Installation Steps](#3-mac-installation-steps)
4. [Running the Application](#4-running-the-application)
5. [Cross-Platform Development Workflow](#5-cross-platform-development-workflow)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Prerequisites

### On Mac, you need:

| Tool | Purpose | Installation |
|------|---------|--------------|
| Docker Desktop | Run containers | `brew install --cask docker` |
| Ollama | Local LLM for AI captions | `brew install ollama` |
| Cloudflare Tunnel | Serve media files | `brew install cloudflared` |
| Git | Version control | `brew install git` |
| Node.js 20+ | Local development (optional) | `brew install node@20` |

### Install Homebrew (if not installed):
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

---

## 2. Project Changes Required

Before the project works on Mac, these files need to be added/modified:

### 2.1 Update `.env.example`

**Current file** - Add Mac defaults:

```bash
# ===========================================
# SocialFlow Environment Configuration
# ===========================================

# Ports
UI_PORT=3000
N8N_PORT=5678

# API Configuration
VITE_API_BASE=http://localhost:5678/webhook
WEBHOOK_URL=http://localhost:5678

# n8n Configuration
N8N_PROTOCOL=http
TZ=Europe/Berlin

# ===========================================
# DATA PATH - IMPORTANT: Set for your OS
# ===========================================
# Windows:
# DATA_PATH=C:/Clients
#
# macOS:
# DATA_PATH=/Users/YOUR_USERNAME/socialflow-data
# or use relative path:
# DATA_PATH=./data
#
# Linux:
# DATA_PATH=/opt/socialflow-data
# ===========================================

# Default (change this based on your OS)
DATA_PATH=./data
```

### 2.2 Create `docker-compose.override.yml` (for Mac optimization)

Create this new file in project root:

```yaml
# docker-compose.override.yml
# Mac-specific optimizations (auto-loaded by docker-compose)
# Delete or rename this file on Windows if issues occur

version: '3.8'

services:
  socialflow-n8n:
    volumes:
      # Use cached mode for better Mac performance
      - ${DATA_PATH:-./data}:/data/clients:cached
      - ./files/workflows:/opt/workflows:ro,cached
      - ./files/config:/opt/config-templates:ro,cached
      - ./files/scripts:/opt/scripts:ro,cached

  socialflow-ui:
    volumes:
      # Development mode with cached volumes
      - ./socialflow-ui:/app:cached
      - /app/node_modules
```

### 2.3 Create Mac setup script: `setup-mac.sh`

Create this new file in project root:

```bash
#!/bin/bash
# setup-mac.sh - SocialFlow Mac Setup Script

set -e  # Exit on error

echo "=========================================="
echo "SocialFlow - Mac Setup"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on Mac
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}Error: This script is for macOS only${NC}"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo ""
echo "Step 1: Checking prerequisites..."
echo "---"

# Check Homebrew
if ! command_exists brew; then
    echo -e "${YELLOW}Installing Homebrew...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    echo -e "${GREEN}✓ Homebrew installed${NC}"
fi

# Check Docker
if ! command_exists docker; then
    echo -e "${YELLOW}Installing Docker Desktop...${NC}"
    brew install --cask docker
    echo -e "${YELLOW}Please start Docker Desktop manually, then re-run this script${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Docker installed${NC}"
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}Docker is not running. Please start Docker Desktop and re-run this script${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Docker is running${NC}"
fi

# Check Ollama
if ! command_exists ollama; then
    echo -e "${YELLOW}Installing Ollama...${NC}"
    brew install ollama
else
    echo -e "${GREEN}✓ Ollama installed${NC}"
fi

# Check Cloudflared
if ! command_exists cloudflared; then
    echo -e "${YELLOW}Installing Cloudflare Tunnel...${NC}"
    brew install cloudflared
else
    echo -e "${GREEN}✓ Cloudflared installed${NC}"
fi

echo ""
echo "Step 2: Setting up data directory..."
echo "---"

# Create data directory
DATA_DIR="$HOME/socialflow-data"
mkdir -p "$DATA_DIR/_config/agents"
echo -e "${GREEN}✓ Created $DATA_DIR${NC}"

echo ""
echo "Step 3: Creating .env file..."
echo "---"

# Create .env if not exists
if [ ! -f .env ]; then
    cp .env.example .env
    # Update DATA_PATH for Mac
    sed -i '' "s|DATA_PATH=.*|DATA_PATH=$DATA_DIR|g" .env
    echo -e "${GREEN}✓ Created .env with DATA_PATH=$DATA_DIR${NC}"
else
    echo -e "${YELLOW}⚠ .env already exists, checking DATA_PATH...${NC}"
    if grep -q "C:/" .env; then
        echo -e "${YELLOW}  Updating Windows path to Mac path...${NC}"
        sed -i '' "s|DATA_PATH=C:/Clients|DATA_PATH=$DATA_DIR|g" .env
        echo -e "${GREEN}✓ Updated DATA_PATH to $DATA_DIR${NC}"
    fi
fi

echo ""
echo "Step 4: Pulling Ollama models..."
echo "---"

# Start Ollama if not running
if ! pgrep -x "ollama" > /dev/null; then
    echo "Starting Ollama..."
    ollama serve &
    sleep 3
fi

# Pull required models
echo "Pulling llava:7b (vision model)..."
ollama pull llava:7b

echo "Pulling llama3.2:3b (text model)..."
ollama pull llama3.2:3b

echo -e "${GREEN}✓ Ollama models ready${NC}"

echo ""
echo "Step 5: Building Docker containers..."
echo "---"

docker-compose build

echo -e "${GREEN}✓ Docker containers built${NC}"

echo ""
echo "=========================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Start the application:"
echo "   docker-compose up -d"
echo ""
echo "2. Initialize the database (first time only):"
echo "   docker exec socialflow-n8n sh /opt/scripts/init-db.sh"
echo ""
echo "3. Import workflows in n8n:"
echo "   Open http://localhost:5678"
echo "   Import workflows from files/workflows/ folder"
echo ""
echo "4. Start Cloudflare tunnel (in a new terminal):"
echo "   cloudflared tunnel --url file://$DATA_DIR"
echo ""
echo "5. Open the application:"
echo "   http://localhost:3000"
echo ""
echo "Data directory: $DATA_DIR"
echo ""
```

### 2.4 Create `.env.mac.example` template

```bash
# .env.mac.example - Mac-specific environment configuration
# Copy this to .env on Mac: cp .env.mac.example .env

# Ports
UI_PORT=3000
N8N_PORT=5678

# API Configuration
VITE_API_BASE=http://localhost:5678/webhook
WEBHOOK_URL=http://localhost:5678

# n8n Configuration
N8N_PROTOCOL=http
TZ=Europe/Berlin

# Data Path - Mac
# Option 1: Home directory (recommended)
DATA_PATH=/Users/YOUR_USERNAME/socialflow-data

# Option 2: Relative to project (for development)
# DATA_PATH=./data

# Option 3: System directory
# DATA_PATH=/opt/socialflow-data
```

### 2.5 Update `docker-compose.yml` default

Change the default DATA_PATH fallback:

```yaml
# In docker-compose.yml, change:
# OLD:
- ${DATA_PATH:-C:/Clients}:/data/clients

# NEW (cross-platform default):
- ${DATA_PATH:-./data}:/data/clients
```

### 2.6 Create `.gitignore` additions

Add to `.gitignore`:

```gitignore
# Local data directory (when using ./data)
/data/

# Mac-specific
.DS_Store
*.swp
```

---

## 3. Mac Installation Steps

### Step 1: Install Prerequisites

```bash
# Install Homebrew (if needed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required tools
brew install --cask docker
brew install ollama
brew install cloudflared
brew install git
```

### Step 2: Start Docker Desktop

1. Open Docker Desktop from Applications
2. Wait for it to fully start (whale icon stops animating)
3. Verify: `docker --version`

### Step 3: Clone the Repository

```bash
cd ~
git clone https://github.com/simobenziane/socialflow.git
cd socialflow
```

### Step 4: Run Setup Script (if available)

```bash
chmod +x setup-mac.sh
./setup-mac.sh
```

**OR manually:**

### Step 4 (Manual): Configure Environment

```bash
# Create data directory
mkdir -p ~/socialflow-data/_config/agents

# Create .env file
cp .env.example .env

# Edit .env - set your data path
nano .env
# Change: DATA_PATH=/Users/YOUR_USERNAME/socialflow-data
```

### Step 5: Start Ollama and Pull Models

```bash
# Start Ollama (runs in background)
ollama serve &

# Pull required models
ollama pull llava:7b
ollama pull llama3.2:3b

# Verify models
ollama list
```

### Step 6: Build and Start Docker Containers

```bash
# Build containers
docker-compose build

# Start containers
docker-compose up -d

# Check status
docker-compose ps
```

### Step 7: Initialize Database

```bash
# Run initialization script (first time only)
docker exec socialflow-n8n sh /opt/scripts/init-db.sh
```

### Step 8: Import n8n Workflows

1. Open n8n: http://localhost:5678
2. Go to **Workflows** → **Add Workflow** → **Import from File**
3. Import in order:
   - `files/workflows/W_API_Endpoints_v15.4.json`
   - `files/workflows/W0_Late_Sync_v15.2.json`
   - `files/workflows/W1_Ingest_Validate_v15.3.json`
   - `files/workflows/W2_AI_Captions_v15.2.json`
   - `files/workflows/W3_Late_Scheduling_v15.2.json`
4. **Activate** each workflow

### Step 9: Start Cloudflare Tunnel

```bash
# In a new terminal window
cloudflared tunnel --url file://$HOME/socialflow-data

# Copy the generated URL (e.g., https://abc-xyz.trycloudflare.com)
```

### Step 10: Configure Application

1. Open app: http://localhost:3000
2. Go to **Settings**
3. Paste Cloudflare tunnel URL
4. Click **Save**
5. Click **Test Connection**

---

## 4. Running the Application

### Daily Startup (Mac)

```bash
# Terminal 1: Start Docker containers
cd ~/socialflow
docker-compose up -d

# Terminal 2: Start Ollama (if not running)
ollama serve

# Terminal 3: Start Cloudflare tunnel
cloudflared tunnel --url file://$HOME/socialflow-data
```

### Create a startup script: `start-mac.sh`

```bash
#!/bin/bash
# start-mac.sh - Start all SocialFlow services

echo "Starting SocialFlow..."

# Start Ollama if not running
if ! pgrep -x "ollama" > /dev/null; then
    echo "Starting Ollama..."
    ollama serve &
    sleep 2
fi

# Start Docker containers
echo "Starting Docker containers..."
docker-compose up -d

# Wait for containers
sleep 5

# Check health
echo ""
echo "Checking services..."
echo "---"

# Check n8n
if curl -s http://localhost:5678/healthz > /dev/null; then
    echo "✓ n8n is running: http://localhost:5678"
else
    echo "✗ n8n is not responding"
fi

# Check UI
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✓ UI is running: http://localhost:3000"
else
    echo "✗ UI is not responding"
fi

echo ""
echo "To start Cloudflare tunnel, run in a new terminal:"
echo "  cloudflared tunnel --url file://\$HOME/socialflow-data"
echo ""
```

### Stopping the Application

```bash
# Stop Docker containers
docker-compose down

# Stop Ollama (optional)
pkill ollama
```

---

## 5. Cross-Platform Development Workflow

### Development Setup

**Windows (primary development):**
```
DATA_PATH=C:/Clients
```

**Mac (testing/running):**
```
DATA_PATH=/Users/username/socialflow-data
```

### Git Workflow

The `.env` file is in `.gitignore`, so each platform keeps its own configuration.

```bash
# Windows: Develop and push
git add .
git commit -m "New feature"
git push origin main

# Mac: Pull and run
git pull origin main
docker-compose up -d --build
```

### Files That Differ Per Platform

| File | Windows | Mac | In Git? |
|------|---------|-----|---------|
| `.env` | `DATA_PATH=C:/Clients` | `DATA_PATH=~/socialflow-data` | No |
| `docker-compose.override.yml` | Not needed | Performance tweaks | Optional |
| Data directory | `C:/Clients/` | `~/socialflow-data/` | No |

### Syncing Workflows

Workflows are in `files/workflows/` and are version controlled. After pulling:

1. Import updated workflows in n8n
2. Or use n8n's "Import from URL" with GitHub raw URLs

### Database Considerations

The SQLite database (`socialflow.db`) is in the data directory and is **not synced** between machines. Each machine has its own database.

To sync data between machines:
1. Export/import via n8n
2. Or copy the database file manually
3. Or use a shared database (future enhancement)

---

## 6. Troubleshooting

### Docker Issues

**Container won't start:**
```bash
# Check logs
docker-compose logs socialflow-n8n
docker-compose logs socialflow-ui

# Rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

**Port already in use:**
```bash
# Find what's using the port
lsof -i :5678
lsof -i :3000

# Kill the process or change ports in .env
```

### Ollama Issues

**Ollama not responding:**
```bash
# Check if running
pgrep ollama

# Restart
pkill ollama
ollama serve &

# Test
curl http://localhost:11434/api/version
```

**Model not found:**
```bash
# List models
ollama list

# Pull missing model
ollama pull llava:7b
```

**Container can't reach Ollama:**
```bash
# Test from container
docker exec socialflow-n8n curl http://host.docker.internal:11434/api/version
```

### Cloudflare Tunnel Issues

**Tunnel won't start:**
```bash
# Check if path exists
ls -la ~/socialflow-data

# Try with explicit path
cloudflared tunnel --url file:///Users/YOUR_USERNAME/socialflow-data
```

**Media not loading in app:**
1. Check tunnel is running
2. Verify URL in Settings matches tunnel URL
3. Check file permissions: `chmod -R 755 ~/socialflow-data`

### Permission Issues

```bash
# Fix data directory permissions
chmod -R 755 ~/socialflow-data
chown -R $(whoami) ~/socialflow-data
```

### Performance Issues

**Slow on Mac:**
1. Increase Docker Desktop resources:
   - Docker Desktop → Settings → Resources
   - Set CPU: 4+, Memory: 8GB+

2. Use OrbStack instead of Docker Desktop:
   ```bash
   brew install --cask orbstack
   ```

3. Use cached volumes (already in docker-compose.override.yml)

---

## Quick Reference

### URLs
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| n8n | http://localhost:5678 |
| Ollama | http://localhost:11434 |

### Commands
| Action | Command |
|--------|---------|
| Start | `docker-compose up -d` |
| Stop | `docker-compose down` |
| Logs | `docker-compose logs -f` |
| Rebuild | `docker-compose build --no-cache` |
| Init DB | `docker exec socialflow-n8n sh /opt/scripts/init-db.sh` |

### File Locations (Mac)
| Item | Path |
|------|------|
| Project | `~/socialflow/` |
| Data | `~/socialflow-data/` |
| Database | `~/socialflow-data/_config/socialflow.db` |
| Settings | `~/socialflow-data/_config/settings.json` |
| Client files | `~/socialflow-data/{client-slug}/` |

---

## Summary: What to Add to Project

### New Files to Create

1. **`setup-mac.sh`** - Automated setup script
2. **`start-mac.sh`** - Daily startup script
3. **`.env.mac.example`** - Mac environment template
4. **`docker-compose.override.yml`** - Mac performance optimizations

### Files to Modify

1. **`.env.example`** - Add Mac path examples, change default
2. **`docker-compose.yml`** - Change default DATA_PATH to `./data`
3. **`.gitignore`** - Add `/data/` and `.DS_Store`
4. **`README.md`** - Add Mac installation section

### No Changes Needed

- All React frontend code
- All n8n workflows
- Docker configuration (already cross-platform)
- Nginx configuration

---

**Last Updated:** 2025-12-19
