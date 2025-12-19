# SocialFlow - Setup Guide

Complete setup guide for Windows, Mac, Linux, and VPS.

---

## Interactive Setup (Recommended)

The setup scripts guide you through configuration with prompts:
- **Deployment mode**: Local or VPS Hybrid
- **Data path**: Where to store client media and database
- **Tailscale IP**: For VPS mode, connects to your local Ollama

### Windows (PowerShell)
```powershell
git clone https://github.com/simobenziane/socialflow.git
cd socialflow
.\scripts\setup-windows.ps1
```

### Mac / Linux
```bash
git clone https://github.com/simobenziane/socialflow.git
cd socialflow
./scripts/setup.sh
```

### VPS (Ubuntu/Debian)
```bash
git clone https://github.com/simobenziane/socialflow.git
cd socialflow
./scripts/setup-vps.sh
```

The scripts will:
1. Ask for your preferences (data path, deployment mode)
2. Install all dependencies (Docker, Ollama, etc.)
3. Pull required AI models
4. Build and start containers
5. Initialize the database

After setup: Open http://localhost:3000

---

## What Gets Installed

| Platform | Dependencies |
|----------|-------------|
| Windows | Git, Docker Desktop, Ollama (via winget) |
| Mac | Homebrew, Docker Desktop, Ollama, cloudflared |
| Linux | Docker, Docker Compose, Ollama, curl, git |
| VPS | Docker, Docker Compose, Tailscale |

### Required Ollama Models (auto-pulled)
- `llava:7b` - Vision model for image understanding
- `llama3.2:3b` - Text model for caption generation

---

## Manual Setup

If you prefer manual installation:

### 1. Clone Repository
```bash
git clone https://github.com/simobenziane/socialflow.git
cd socialflow
```

### 2. Configure Environment
```bash
# Windows
copy .env.windows.example .env

# Mac
cp .env.mac.example .env

# Linux
cp .env.example .env

# VPS
cp .env.vps.example .env
```

Edit `.env` and set your `DATA_PATH`:
- Windows: `DATA_PATH=C:/Clients`
- Mac: `DATA_PATH=/Users/YOUR_NAME/socialflow-data`
- Linux: `DATA_PATH=./data` or `/opt/socialflow-data`
- VPS: `DATA_PATH=/opt/socialflow-data`

### 3. Create Data Directory
```bash
# Windows
mkdir C:\Clients\_config\agents

# Mac/Linux
mkdir -p ~/socialflow-data/_config/agents

# VPS
sudo mkdir -p /opt/socialflow-data/_config/agents
sudo chown -R $USER:$USER /opt/socialflow-data
```

### 4. Install & Start Ollama
```bash
# Mac
brew install ollama
ollama serve

# Linux
curl -fsSL https://ollama.com/install.sh | sh
ollama serve

# Windows (runs as service after install)
winget install Ollama.Ollama
```

### 5. Pull Ollama Models
```bash
ollama pull llava:7b
ollama pull llama3.2:3b
```

### 6. Build and Start Docker
```bash
# Local deployment
docker-compose build
docker-compose up -d

# VPS deployment
docker-compose -f docker-compose.vps.yml build
docker-compose -f docker-compose.vps.yml up -d
```

### 7. Initialize Database
```bash
docker exec socialflow-n8n sh /opt/scripts/init-db.sh
```

### 8. Import Workflows in n8n
1. Open http://localhost:5678
2. Go to **Workflows** → **Add Workflow** → **Import from File**
3. Import all JSON files from `workflows/` folder
4. **Activate** each workflow

### 9. Configure Cloudflare Tunnel (for media)
```bash
# Install cloudflared
# Windows: winget install Cloudflare.cloudflared
# Mac: brew install cloudflared

# Start tunnel pointing to your data directory
cloudflared tunnel --url file://C:/Clients  # Windows
cloudflared tunnel --url file://$HOME/socialflow-data  # Mac/Linux
```

### 10. Configure App Settings
1. Open http://localhost:3000
2. Go to **Settings**
3. Paste Cloudflare tunnel URL
4. Click **Save** then **Test Connection**

---

## Daily Usage

### Start Services
```bash
# Using Makefile (Mac/Linux)
make start

# Windows
.\scripts\start-windows.ps1

# VPS
make vps-start
```

### Stop Services
```bash
make stop
# or
docker-compose down
```

### Check Health
```bash
make health
# or
./scripts/check-health.sh      # Mac/Linux
.\scripts\check-health.ps1     # Windows
```

### View Logs
```bash
make logs
# or
docker-compose logs -f
```

---

## Folder Structure

```
socialflow/
├── docker-compose.yml       # Main Docker config
├── docker-compose.vps.yml   # VPS hybrid config
├── docker-compose.mac.yml   # Mac optimization
├── .env                     # Your configuration
│
├── scripts/                 # Setup & utility scripts
│   ├── setup.sh             # Universal setup (Mac/Linux)
│   ├── setup-windows.ps1    # Windows setup
│   ├── setup-mac.sh         # Mac-specific setup
│   ├── setup-linux.sh       # Linux-specific setup
│   ├── setup-vps.sh         # VPS setup with Tailscale
│   ├── start-windows.ps1    # Windows start script
│   ├── check-health.sh      # Health check (bash)
│   ├── check-health.ps1     # Health check (PowerShell)
│   ├── init-db.sh           # Database initialization
│   └── schema.sql           # Database schema
│
├── config/                  # AI prompts, settings
├── templates/               # Client/batch templates
├── workflows/               # n8n workflow JSON files
├── docs/                    # Documentation
│
└── socialflow-ui/           # React frontend
```

---

## Data Directory Structure

```
C:/Clients/  (or your DATA_PATH)
├── _config/
│   ├── socialflow.db        # SQLite database
│   ├── settings.json        # App settings
│   └── agents/              # AI prompt files
│
├── my-client/               # Client folder
│   ├── client.yaml          # Client config
│   ├── brief.txt            # AI context
│   ├── hashtags.txt         # Default hashtags
│   │
│   └── january-batch/       # Batch folder
│       ├── READY.txt        # Gate file (required)
│       ├── batch.yaml       # Batch config
│       ├── photos/          # Images
│       └── videos/          # Videos + frame images
```

---

## Troubleshooting

### Docker Issues

**Container won't start:**
```bash
docker-compose logs socialflow-n8n
docker-compose logs socialflow-ui
```

**Port already in use:**
```bash
# Windows
netstat -ano | findstr :5678

# Mac/Linux
lsof -i :5678
```

### Ollama Issues

**Ollama not responding:**
```bash
# Check if running
curl http://localhost:11434/api/version

# Restart
# Mac/Linux: pkill ollama && ollama serve
# Windows: Restart Ollama from system tray
```

**Model not found:**
```bash
ollama list
ollama pull llava:7b
```

### Database Issues

**Reinitialize database:**
```bash
docker exec socialflow-n8n sh /opt/scripts/init-db.sh
```

### Permission Issues (Linux)

```bash
# n8n runs as user 1000
sudo chown -R 1000:1000 /path/to/data
```

---

## Development Mode

Run with hot-reload for frontend development:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

- Frontend: http://localhost:5173 (Vite dev server)
- n8n: http://localhost:5678

---

## Mac Performance

If Docker is slow on Mac:

1. Increase Docker resources: Docker Desktop → Settings → Resources
2. Use OrbStack instead: `brew install --cask orbstack`
3. Use the Mac compose file: `docker-compose -f docker-compose.yml -f docker-compose.mac.yml up`

---

## URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| n8n | http://localhost:5678 |
| Ollama | http://localhost:11434 |

---

For VPS deployment with remote access, see [VPS_HYBRID.md](VPS_HYBRID.md).
