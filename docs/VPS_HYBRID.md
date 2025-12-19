# SocialFlow - VPS Hybrid Setup with Tailscale

Run SocialFlow on a VPS while keeping Ollama on your local machine.

---

## Why Hybrid?

| Component | Location | Reason |
|-----------|----------|--------|
| n8n + Frontend | VPS | Always online, accessible anywhere |
| Ollama (AI) | Local | GPU expensive on VPS, faster locally |
| Database | VPS | Persistent, backed up |
| Media Files | Local + Cloudflare | Large files, served via tunnel |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          INTERNET                               │
└─────────────────────────────────────────────────────────────────┘
          │                                    │
          │ HTTPS                              │ Tailscale VPN
          ▼                                    │ (private network)
┌─────────────────────────┐                    │
│         VPS             │                    │
│  ┌───────────────────┐  │                    │
│  │ nginx (SSL)       │  │                    │
│  │ Port 443          │  │                    │
│  └─────────┬─────────┘  │                    │
│            │            │                    │
│  ┌─────────▼─────────┐  │                    │
│  │ socialflow-ui     │  │                    │
│  │ Port 3000         │  │                    │
│  └───────────────────┘  │                    │
│            │            │                    │
│  ┌─────────▼─────────┐  │    ┌───────────────▼───────────────┐
│  │ socialflow-n8n    │──┼────│      YOUR LOCAL MACHINE       │
│  │ Port 5678         │  │    │  ┌─────────────────────────┐  │
│  └───────────────────┘  │    │  │ Ollama                  │  │
│            │            │    │  │ Port 11434              │  │
│  ┌─────────▼─────────┐  │    │  │ Models: llava, llama3.2 │  │
│  │ SQLite Database   │  │    │  └─────────────────────────┘  │
│  │ /opt/socialflow   │  │    │                               │
│  └───────────────────┘  │    │  ┌─────────────────────────┐  │
│                         │    │  │ Cloudflare Tunnel       │  │
│  Tailscale IP:          │    │  │ (for media files)       │  │
│  100.x.x.1              │    │  └─────────────────────────┘  │
└─────────────────────────┘    │                               │
                               │  Tailscale IP: 100.x.x.2      │
                               └───────────────────────────────┘
```

---

## Quick Setup (Interactive)

The setup script handles everything automatically:

```bash
# SSH into VPS
ssh user@your-vps-ip

# Clone repository
git clone https://github.com/simobenziane/socialflow.git
cd socialflow

# Run interactive setup
./scripts/setup-vps.sh
```

The script will:
1. **Ask for data path** (default: `/opt/socialflow-data`)
2. **Ask for your local machine's Tailscale IP** (e.g., `100.100.100.2`)
3. **Install Docker, Docker Compose, and Tailscale**
4. **Configure `.env` with your settings**
5. **Build and start containers**
6. **Initialize the database**

---

## Prerequisites

### On VPS
- Ubuntu 22.04 or Debian 11+ (other Linux distros work too)
- 2GB RAM, 2 vCPU minimum
- Domain name pointed to VPS IP (for SSL)

### On Local Machine
- Ollama installed with models:
  ```bash
  ollama pull llava:7b
  ollama pull llama3.2:3b
  ```
- Tailscale installed and signed in

---

## Step-by-Step Manual Setup

### Step 1: Setup Local Machine First

**Install Tailscale:**
- Windows: Download from https://tailscale.com/download/windows
- Mac: `brew install --cask tailscale`
- Linux: `curl -fsSL https://tailscale.com/install.sh | sh`

**Sign in and get your IP:**
```bash
tailscale up
tailscale ip -4
# Note this IP (e.g., 100.100.100.2)
```

**Configure Ollama to accept remote connections:**
```bash
# Mac/Linux
OLLAMA_HOST=0.0.0.0:11434 ollama serve

# Windows: Set environment variable OLLAMA_HOST=0.0.0.0:11434
# Then restart Ollama
```

### Step 2: Run VPS Setup

```bash
ssh user@your-vps-ip
git clone https://github.com/simobenziane/socialflow.git
cd socialflow
./scripts/setup-vps.sh
```

When prompted:
- Enter data path (or press Enter for `/opt/socialflow-data`)
- Enter your local machine's Tailscale IP from Step 1

### Step 3: Configure Nginx (for HTTPS)

Install nginx and certbot:
```bash
sudo apt install nginx certbot python3-certbot-nginx
```

Create `/etc/nginx/sites-available/socialflow`:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # n8n webhooks
    location /webhook {
        proxy_pass http://127.0.0.1:5678;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 300s;
    }
}
```

Enable and get SSL:
```bash
sudo ln -s /etc/nginx/sites-available/socialflow /etc/nginx/sites-enabled/
sudo certbot --nginx -d your-domain.com
sudo systemctl reload nginx
```

### Step 4: Update VPS Environment

Edit `.env` to set your domain:
```bash
nano .env
```

Update:
```env
VITE_API_BASE=https://your-domain.com/webhook
WEBHOOK_URL=https://your-domain.com
N8N_PROTOCOL=https
```

Restart containers:
```bash
docker-compose -f docker-compose.vps.yml up -d
```

### Step 5: Import Workflows

1. Open https://your-domain.com (or use SSH tunnel to access n8n)
2. Go to n8n at port 5678
3. Import workflows from `workflows/` folder
4. Activate all workflows

---

## Daily Operation

### On VPS

```bash
# Start
make vps-start
# or: docker-compose -f docker-compose.vps.yml up -d

# Stop
make vps-stop
# or: docker-compose -f docker-compose.vps.yml down

# Logs
docker-compose -f docker-compose.vps.yml logs -f

# Health check
make health
```

### On Local Machine

Keep these running:
1. **Tailscale**: Just keep the app running (auto-starts on boot)
2. **Ollama**: `OLLAMA_HOST=0.0.0.0:11434 ollama serve`
3. **Cloudflare Tunnel** (optional): `cloudflared tunnel --url file://$HOME/socialflow-data`

---

## Updating from Git

### Development Machine
```bash
# Make changes
git add .
git commit -m "Update"
git push origin main
```

### VPS
```bash
cd /opt/socialflow  # or wherever you cloned
git pull origin main
docker-compose -f docker-compose.vps.yml up -d --build
```

---

## Media Files

Options for serving media:

### Option A: Cloudflare Tunnel from Local (Recommended)
```bash
# On local machine
cloudflared tunnel --url file://$HOME/socialflow-data
```
- Files stay on local machine
- URL changes on restart (use permanent tunnel for fixed URL)

### Option B: Sync to VPS
```bash
# Sync files
rsync -avz ~/socialflow-data/ user@vps:/opt/socialflow-data/
```
- Files on VPS, no tunnel needed
- Uses more VPS storage

---

## Troubleshooting

### VPS Can't Reach Ollama

```bash
# On VPS - test connection
curl http://100.x.x.x:11434/api/version

# If fails:
# 1. Check Tailscale on both machines: tailscale status
# 2. Check Ollama binding: netstat -tlnp | grep 11434
# 3. Ensure Ollama binds to 0.0.0.0, not 127.0.0.1
```

### Tailscale Not Connected

```bash
# Check status
tailscale status

# Reconnect
sudo tailscale up
```

### Slow AI Generation

- Check internet upload speed on local machine
- Tailscale adds minimal latency (~1-5ms)
- Large images sent to local Ollama take time

### Connection Drops

- **Tailscale**: Auto-reconnects
- **Cloudflare Tunnel**: Auto-reconnects if daemon running

---

## Cost Comparison

| Setup | VPS Cost | Notes |
|-------|----------|-------|
| Hybrid (Recommended) | $5-10/mo | VPS + local GPU |
| Full VPS (no GPU) | $5-10/mo | Won't work well for AI |
| Full VPS (with GPU) | $50-200/mo | Expensive |

**Hybrid is the sweet spot** - cheap VPS + local GPU.

---

## Quick Reference

| Item | Value |
|------|-------|
| VPS Setup Script | `./scripts/setup-vps.sh` |
| VPS Compose | `docker-compose.vps.yml` |
| VPS Data | `/opt/socialflow-data` |
| VPS .env template | `.env.vps.example` |
| Tailscale IPs | `100.x.x.x` range |
| Ollama Binding | `OLLAMA_HOST=0.0.0.0:11434` |
| Start VPS | `make vps-start` |
| Stop VPS | `make vps-stop` |
