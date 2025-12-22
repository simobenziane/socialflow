# SocialFlow Mac Deployment Guide

Complete guide for deploying SocialFlow on macOS with GitHub auto-update.

## Quick Start (5 minutes)

```bash
# 1. Clone the repository
git clone https://github.com/simobenziane/socialflow.git
cd socialflow

# 2. Run interactive setup
make setup

# 3. Start services
make start

# 4. Open the app
open http://localhost:3000
```

That's it! The setup script handles everything automatically.

---

## What Gets Installed

The setup script installs:

| Component | Purpose | How Installed |
|-----------|---------|---------------|
| Homebrew | Package manager | Auto-installed if missing |
| Docker Desktop | Container runtime | `brew install --cask docker` |
| Ollama | Local AI models | `brew install ollama` |
| cloudflared | Tunnel for webhooks | `brew install cloudflared` |

AI Models pulled:
- `llava:7b` - Image understanding
- `llama3.2:3b` - Caption generation

---

## Directory Structure

After setup, your data is stored at:

```
~/socialflow-data/
├── _config/
│   ├── socialflow.db        # SQLite database
│   ├── settings.json        # App settings
│   └── agents/              # AI prompts
├── uploads/                 # File uploads
└── {client-slug}/           # Client media folders
```

---

## Daily Usage

### Start the app
```bash
make start
```
This starts Docker containers and Ollama automatically.

### Stop the app
```bash
make stop
```

### View logs
```bash
make logs
```

### Check health
```bash
make health
```

---

## Updating from GitHub

When you push changes to GitHub, update your Mac with:

```bash
make update
```

This command:
1. Fetches latest changes from GitHub
2. Shows new commits
3. Asks for confirmation
4. Pulls the changes
5. Rebuilds Docker containers
6. Restarts services
7. Verifies everything is healthy

### Silent Update (no prompts)
```bash
git pull origin main && docker-compose -f docker-compose.yml -f docker-compose.mac.yml build && docker-compose -f docker-compose.yml -f docker-compose.mac.yml up -d
```

---

## Automatic Updates (Optional)

### Option 1: Launchd (Scheduled)

Create a plist file to run updates automatically:

```bash
cat > ~/Library/LaunchAgents/com.socialflow.update.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.socialflow.update</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>-c</string>
        <string>cd /path/to/socialflow && git pull origin main && docker-compose build && docker-compose up -d</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>3</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>/tmp/socialflow-update.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/socialflow-update.log</string>
</dict>
</plist>
EOF

# Load the schedule (runs daily at 3 AM)
launchctl load ~/Library/LaunchAgents/com.socialflow.update.plist
```

### Option 2: Cron Job

```bash
# Edit crontab
crontab -e

# Add this line (updates at 3 AM daily)
0 3 * * * cd /path/to/socialflow && git pull origin main && docker-compose build && docker-compose up -d >> /tmp/socialflow-update.log 2>&1
```

---

## Ports Used

| Service | Port | URL |
|---------|------|-----|
| Frontend (UI) | 3000 | http://localhost:3000 |
| Backend (n8n) | 5678 | http://localhost:5678 |
| Ollama | 11434 | http://localhost:11434 |

---

## Troubleshooting

### Docker not starting
```bash
# Check if Docker Desktop is running
open -a Docker

# Wait for Docker to start, then:
make start
```

### Ollama not responding
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not, start it:
ollama serve &
```

### Containers failing
```bash
# Check container status
docker ps -a

# View logs
docker-compose logs socialflow-n8n
docker-compose logs socialflow-ui

# Rebuild from scratch
make clean
make build
make start
```

### Database issues
```bash
# Re-initialize database
make init-db
```

### Permission issues
```bash
# Fix script permissions
chmod +x scripts/*.sh
```

---

## Development Mode

For frontend development with hot-reload:

```bash
# Start backend only
docker-compose up -d socialflow-n8n

# Run frontend in dev mode (port 5173)
cd socialflow-ui
npm install
npm run dev
```

Note: Use port 3000 (Docker) for production testing.

---

## Performance Tips

1. **Allocate more resources to Docker**
   - Docker Desktop → Settings → Resources
   - Recommended: 4+ CPUs, 8+ GB RAM

2. **Use SSD for data directory**
   - Default `~/socialflow-data` is usually on SSD

3. **Mac-specific optimizations are automatic**
   - `docker-compose.mac.yml` applies cached volumes
   - Shared memory increased to 256MB

---

## Workflow: Push Changes → Update Mac

### From Windows (Development)
```bash
# Make changes
git add .
git commit -m "feat: new feature"
git push origin main
```

### On Mac (Production)
```bash
# Pull and deploy
make update
```

### One-liner from anywhere
```bash
ssh mac-host "cd /path/to/socialflow && make update"
```

---

## Useful Commands

```bash
# View all commands
make help

# Quick status check
make health

# Rebuild UI after frontend changes
make ui

# Full rebuild
make build

# View n8n logs only
docker-compose logs -f socialflow-n8n

# Enter n8n container
docker exec -it socialflow-n8n sh

# Check database
docker exec socialflow-n8n sqlite3 /data/clients/_config/socialflow.db ".tables"
```

---

## Environment Variables

Configuration is in `.env` file (created by setup):

```env
# Ports
UI_PORT=3000
N8N_PORT=5678

# API URL
VITE_API_BASE=http://localhost:5678/webhook

# Data location
DATA_PATH=/Users/YOUR_USERNAME/socialflow-data

# Timezone
TZ=Europe/Berlin
```

---

## Support

- **Issues**: https://github.com/simobenziane/socialflow/issues
- **Logs**: `make logs`
- **Health**: `make health`
