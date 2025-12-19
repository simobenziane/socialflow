# SocialFlow - VPS Hybrid Setup Guide

Run SocialFlow on a VPS (cloud server) while keeping Ollama running locally on your machine.

---

## Why Hybrid?

| Component | Best Location | Reason |
|-----------|---------------|--------|
| n8n + Frontend | VPS | Always online, accessible anywhere |
| Ollama (LLM) | Local | GPU expensive on VPS, faster locally |
| Database | VPS | Persistent, backed up |
| Media Files | Local + Cloudflare | Large files, served via tunnel |

---

## Architecture Overview

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
│  │ /data/clients/    │  │    │                               │
│  └───────────────────┘  │    │  ┌─────────────────────────┐  │
│                         │    │  │ Cloudflare Tunnel       │  │
│  Tailscale IP:          │    │  │ (for media files)       │  │
│  100.x.x.1              │    │  └─────────────────────────┘  │
└─────────────────────────┘    │                               │
                               │  Tailscale IP: 100.x.x.2      │
                               └───────────────────────────────┘
```

---

## Connection Options

### Option 1: Tailscale (Recommended)

Zero-config mesh VPN. Free for personal use. Most reliable.

**How it works:**
- Both machines join the same Tailscale network
- Each gets a stable private IP (100.x.x.x)
- Traffic is encrypted end-to-end
- Works through firewalls/NAT

**Setup time:** 10 minutes

---

### Option 2: Cloudflare Tunnel

Expose Ollama via Cloudflare like you do for media files.

**How it works:**
- Run `cloudflared` pointing to Ollama
- Get a public HTTPS URL
- n8n calls that URL

**Pros:** No software on VPS, easy
**Cons:** URL changes unless you set up permanent tunnel

**Setup time:** 5 minutes (temporary) / 20 minutes (permanent)

---

### Option 3: SSH Reverse Tunnel

Use SSH to create a tunnel from local to VPS.

**How it works:**
- SSH from local machine to VPS with reverse port forward
- VPS can access localhost:11434 which tunnels to your machine

**Pros:** No extra software
**Cons:** Less stable, need to keep SSH open

**Setup time:** 5 minutes

---

## Detailed Setup: Tailscale (Recommended)

### Step 1: Install Tailscale on VPS

```bash
# SSH into your VPS
ssh user@your-vps-ip

# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Start and authenticate
sudo tailscale up

# Note your VPS Tailscale IP
tailscale ip -4
# Example: 100.100.100.1
```

### Step 2: Install Tailscale on Local Machine

**Windows:**
1. Download from https://tailscale.com/download/windows
2. Install and sign in with same account
3. Note your local Tailscale IP: `tailscale ip -4`
   - Example: `100.100.100.2`

**Mac:**
```bash
brew install --cask tailscale
# Open Tailscale from Applications, sign in
tailscale ip -4
# Example: 100.100.100.2
```

### Step 3: Test Connection

```bash
# From VPS, ping your local machine
ping 100.100.100.2

# From VPS, test Ollama
curl http://100.100.100.2:11434/api/version
```

### Step 4: Configure VPS Environment

Create `.env` on VPS:

```bash
# /opt/socialflow/.env

# Ports
UI_PORT=3000
N8N_PORT=5678

# API Configuration
VITE_API_BASE=https://your-domain.com/webhook
WEBHOOK_URL=https://your-domain.com

# Data Path
DATA_PATH=/opt/socialflow-data

# Ollama - Use Tailscale IP of your local machine
OLLAMA_HOST=http://100.100.100.2:11434

# Timezone
TZ=Europe/Berlin
```

### Step 5: Update docker-compose.yml on VPS

```yaml
version: '3.8'

services:
  socialflow-ui:
    build:
      context: ./socialflow-ui
      args:
        - VITE_API_BASE=${VITE_API_BASE}
    container_name: socialflow-ui
    ports:
      - "127.0.0.1:3000:80"
    depends_on:
      - socialflow-n8n
    networks:
      - socialflow-network
    restart: unless-stopped

  socialflow-n8n:
    image: n8nio/n8n:latest
    container_name: socialflow-n8n
    ports:
      - "127.0.0.1:5678:5678"
    environment:
      - N8N_HOST=0.0.0.0
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=${WEBHOOK_URL}
      - GENERIC_TIMEZONE=${TZ:-Europe/Berlin}
      - DB_TYPE=sqlite
      - DB_SQLITE_DATABASE=/home/node/.n8n/database.sqlite
      - EXECUTIONS_DATA_SAVE_ON_ERROR=all
      - EXECUTIONS_DATA_SAVE_ON_SUCCESS=all
      - NODE_FUNCTION_ALLOW_BUILTIN=*
      - NODE_FUNCTION_ALLOW_EXTERNAL=*
      # Ollama on local machine via Tailscale
      - OLLAMA_HOST=${OLLAMA_HOST}
    volumes:
      - socialflow-n8n-data:/home/node/.n8n
      - ${DATA_PATH}:/data/clients
      - ./files/workflows:/opt/workflows:ro
      - ./files/scripts:/opt/scripts:ro
    networks:
      - socialflow-network
    restart: unless-stopped

networks:
  socialflow-network:
    driver: bridge

volumes:
  socialflow-n8n-data:
```

### Step 6: Update n8n Workflows

In W2 (AI Captions), update the Ollama HTTP Request node:

**Old (local Docker):**
```
http://host.docker.internal:11434/api/generate
```

**New (Tailscale):**
```
{{ $env.OLLAMA_HOST }}/api/generate
```

Or hardcode:
```
http://100.100.100.2:11434/api/generate
```

### Step 7: Nginx Configuration (VPS)

```nginx
# /etc/nginx/sites-available/socialflow

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
        proxy_cache_bypass $http_upgrade;
    }

    # n8n webhooks
    location /webhook {
        proxy_pass http://127.0.0.1:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # n8n UI (optional - for workflow editing)
    location /n8n/ {
        proxy_pass http://127.0.0.1:5678/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Detailed Setup: Cloudflare Tunnel

### Temporary Tunnel (Quick Testing)

```bash
# On your local machine
cloudflared tunnel --url http://localhost:11434

# Output:
# https://random-words-here.trycloudflare.com
```

Update n8n to use this URL (changes each restart).

### Permanent Tunnel (Production)

```bash
# 1. Login to Cloudflare
cloudflared tunnel login

# 2. Create tunnel
cloudflared tunnel create ollama-tunnel

# 3. Create config file
cat > ~/.cloudflared/config.yml << EOF
tunnel: YOUR_TUNNEL_ID
credentials-file: /home/USER/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: ollama.your-domain.com
    service: http://localhost:11434
  - service: http_status:404
EOF

# 4. Add DNS record
cloudflared tunnel route dns ollama-tunnel ollama.your-domain.com

# 5. Run tunnel
cloudflared tunnel run ollama-tunnel
```

**In n8n:**
```
OLLAMA_HOST=https://ollama.your-domain.com
```

---

## Detailed Setup: SSH Reverse Tunnel

### On Your Local Machine

```bash
# Create persistent reverse tunnel
ssh -N -R 11434:localhost:11434 user@your-vps-ip

# Or with autossh for auto-reconnect
autossh -M 0 -N -R 11434:localhost:11434 user@your-vps-ip
```

### On VPS

n8n can now access Ollama at `localhost:11434`:

```yaml
environment:
  - OLLAMA_HOST=http://localhost:11434
```

### Make it Persistent (systemd)

```bash
# /etc/systemd/system/ollama-tunnel.service
[Unit]
Description=Ollama SSH Tunnel
After=network.target

[Service]
User=your-user
ExecStart=/usr/bin/autossh -M 0 -N -R 11434:localhost:11434 user@your-vps-ip
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable ollama-tunnel
sudo systemctl start ollama-tunnel
```

---

## Local Machine Requirements

### Keep Running

Your local machine must have:

1. **Ollama running:**
   ```bash
   # Windows: Ollama runs as service automatically
   # Mac/Linux:
   ollama serve
   ```

2. **Tailscale connected** (if using Tailscale):
   - Just keep the app running
   - It auto-reconnects

3. **Cloudflare Tunnel** (if using that option):
   ```bash
   cloudflared tunnel run ollama-tunnel
   ```

### Startup Script (Local Machine)

**Windows (start-local.bat):**
```batch
@echo off
echo Starting local services for SocialFlow...

REM Start Ollama (usually auto-starts)
start /B ollama serve

REM Start Tailscale (usually auto-starts)
REM No action needed

echo Local services running!
echo Ollama: http://localhost:11434
pause
```

**Mac (start-local.sh):**
```bash
#!/bin/bash
echo "Starting local services for SocialFlow..."

# Start Ollama
ollama serve &

# Tailscale should auto-connect
echo "Checking Tailscale..."
tailscale status

echo ""
echo "Local services running!"
echo "Ollama: http://localhost:11434"
echo "Tailscale IP: $(tailscale ip -4)"
```

---

## VPS Requirements

### Minimum Specs

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 2 GB | 4 GB |
| Storage | 20 GB | 50 GB |
| OS | Ubuntu 22.04 | Ubuntu 22.04 |

**Note:** No GPU needed since Ollama runs locally!

### Recommended VPS Providers

| Provider | Cheapest Plan | Notes |
|----------|---------------|-------|
| Hetzner | €3.79/mo | Best value, EU servers |
| DigitalOcean | $6/mo | Easy, good docs |
| Vultr | $5/mo | Many locations |
| Linode | $5/mo | Reliable |

---

## Media Files: Cloudflare Tunnel

Media files still need to be served. Options:

### Option A: Media on Local Machine

Keep files on your local machine, serve via Cloudflare:

```bash
# On local machine
cloudflared tunnel --url file://$HOME/socialflow-data
```

**Pros:** Files stay local, easy
**Cons:** Local machine must be on, URL changes

### Option B: Media on VPS

Sync files to VPS:

```bash
# Sync files to VPS
rsync -avz ~/socialflow-data/ user@vps:/opt/socialflow-data/
```

Then serve from VPS (no Cloudflare needed for media).

### Option C: Cloud Storage

Use S3, Cloudflare R2, or similar:
- Upload media to cloud storage
- Update workflow to use cloud URLs
- Most scalable but requires workflow changes

---

## Complete Deployment Checklist

### VPS Setup

- [ ] Provision VPS (Ubuntu 22.04)
- [ ] Install Docker and Docker Compose
- [ ] Install Tailscale, join network
- [ ] Clone repository
- [ ] Create `.env` with Tailscale IP
- [ ] Run `docker-compose up -d`
- [ ] Initialize database
- [ ] Import workflows
- [ ] Configure nginx + SSL
- [ ] Update workflow Ollama URLs

### Local Machine Setup

- [ ] Install Tailscale, join network
- [ ] Install/configure Ollama
- [ ] Pull required models
- [ ] Start Ollama service
- [ ] Verify VPS can reach Ollama

### Testing

- [ ] VPS can ping local Tailscale IP
- [ ] VPS can reach Ollama API
- [ ] Frontend accessible via domain
- [ ] Webhooks working
- [ ] AI caption generation working
- [ ] Media files accessible

---

## Troubleshooting

### VPS Can't Reach Ollama

```bash
# On VPS, test connection
curl http://100.x.x.x:11434/api/version

# If fails:
# 1. Check Tailscale is running on both machines
tailscale status

# 2. Check Ollama is running locally
curl http://localhost:11434/api/version

# 3. Check Ollama is listening on all interfaces
# Edit ollama config to bind to 0.0.0.0
```

### Ollama Binding

By default, Ollama only listens on localhost. For Tailscale:

**Mac/Linux:**
```bash
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

**Windows:**
Set environment variable `OLLAMA_HOST=0.0.0.0:11434`

### Slow AI Generation

- Check your local internet upload speed
- Tailscale adds minimal latency (~1-5ms)
- Image data is sent to your local machine

### Connection Drops

**Tailscale:** Usually auto-reconnects
**SSH Tunnel:** Use `autossh` for auto-reconnect
**Cloudflare:** Tunnel auto-reconnects if daemon running

---

## Cost Comparison

| Setup | VPS Cost | Local Cost | Total |
|-------|----------|------------|-------|
| Everything Local | $0 | Electricity | ~$5/mo |
| **Hybrid (Recommended)** | $5-10/mo | Electricity | ~$10/mo |
| Full VPS (no GPU) | $5-10/mo | $0 | Won't work well |
| Full VPS (with GPU) | $50-200/mo | $0 | Expensive |

**Hybrid is the sweet spot** - cheap VPS + local GPU = best of both worlds.

---

## Summary

1. **Use Tailscale** - easiest, most reliable
2. **VPS runs** n8n + frontend + database
3. **Local runs** Ollama + media serving
4. **Connect via** Tailscale private network
5. **Update** n8n workflows to use Tailscale IP for Ollama

---

**Last Updated:** 2025-12-19
