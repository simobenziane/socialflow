# SocialFlow

**Headless, composable social media content automation system.**

SocialFlow automates the entire social media content pipeline: ingest media, generate AI captions, review & approve, and schedule to social platforms via [Late.com](https://getlate.dev).

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)
![n8n](https://img.shields.io/badge/n8n-v1.x-orange.svg)
![React](https://img.shields.io/badge/react-19-61dafb.svg)

## Features

- **AI-Powered Captions** - Generate social media captions using local LLMs (Ollama) with vision models
- **Multi-Language Support** - Native prompts in French, English (extensible)
- **Batch Processing** - Process entire folders of photos and videos
- **Visual Review Board** - Approve, edit, or reject content before publishing
- **Smart Scheduling** - Calendar-based scheduling with timezone support
- **Late.com Integration** - Direct publishing to Instagram, TikTok via Late.com API
- **Instruction Cascade** - System → Client → Batch level AI customization
- **Progress Tracking** - Real-time progress for ingest and AI generation
- **Docker Ready** - One command to run the entire stack

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                   │
│              React SPA (Vite + shadcn/ui + TanStack Query)          │
│                         Port: 3000                                   │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ REST API
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           BACKEND                                    │
│                    n8n Workflows (Port: 5678)                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ W-API   │ │   W0    │ │   W1    │ │   W2    │ │   W3    │       │
│  │ Router  │ │  Sync   │ │ Ingest  │ │ Caption │ │Schedule │       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
             ┌──────────┐   ┌──────────┐   ┌──────────┐
             │  SQLite  │   │  Ollama  │   │ Late.com │
             │ Database │   │   LLM    │   │   API    │
             └──────────┘   └──────────┘   └──────────┘
```

## Prerequisites

- **Docker Desktop** (Windows/Mac) or **Docker Engine + Docker Compose** (Linux)
- **Ollama** - Local LLM runtime ([install](https://ollama.ai))
- **Late.com Account** - For social media scheduling ([sign up](https://getlate.dev))

### Pull Required Ollama Models

```bash
# Vision model for image understanding
ollama pull llava:7b

# Text model for caption generation
ollama pull llama3.2:3b
```

## Interactive Setup

The setup script guides you through configuration with interactive prompts:
- **Deployment mode**: Local (everything on one machine) or VPS Hybrid (n8n on VPS, Ollama locally via Tailscale)
- **Data path**: Where to store client media and database
- **Tailscale IP**: For VPS mode, connects to your local Ollama

The script installs all dependencies, pulls AI models, builds containers, and initializes the database.

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

### After Setup

```bash
# Start services (daily)
make start       # or .\scripts\start-windows.ps1 (Windows)

# Check health
make health      # or .\scripts\check-health.ps1 (Windows)

# Stop services
make stop
```

**That's it!** Open http://localhost:3000 after setup completes.

### VPS Hybrid (Tailscale)

For running on a VPS with Ollama on your local machine:
```bash
# On VPS (Ubuntu/Debian)
git clone https://github.com/simobenziane/socialflow.git
cd socialflow
./scripts/setup-vps.sh
```

The script will:
1. Ask for your local machine's Tailscale IP
2. Install Docker, Docker Compose, and Tailscale
3. Configure the VPS to connect to your local Ollama
4. Build and start containers

See [docs/VPS_HYBRID.md](docs/VPS_HYBRID.md) for full guide.

---

## Quick Start (Docker) - Manual

### 1. Clone the Repository

```bash
git clone https://github.com/simobenziane/socialflow.git
cd socialflow
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env to set your data path
# Windows default: C:/Clients
# Linux/Mac: ./data or /opt/socialflow-data
```

### 3. Start the Stack

```bash
docker-compose up -d --build
```

### 4. Initialize Database (First Run)

```bash
docker exec socialflow-n8n sh /opt/scripts/init-db.sh
```

### 5. Import Workflows

1. Open n8n at **http://localhost:5678**
2. Go to **Workflows** → **Add Workflow** → **Import from File**
3. Import workflows in this order:
   - `W_API_Endpoints_v16.json` *(required first)*
   - `W0_Late_Sync_v16.json`
   - `W1_Ingest_Validate_v16.json`
   - `W2_AI_Captions_v16.json`
   - `W3_Late_Scheduling_v16.json`
   - `W_Agent1_Config_v16.json` *(optional)*
   - `W_Agent1_Batch_v16.json` *(optional)*
4. **Activate** each workflow after import

### 6. Configure Cloudflare Tunnel (for media serving)

```bash
# On your host machine (not in Docker)
# Windows:
cloudflared tunnel --url file://C:/Clients

# Linux/Mac:
cloudflared tunnel --url file:///path/to/your/data
```

Copy the generated tunnel URL (e.g., `https://abc-xyz.trycloudflare.com`).

### 7. Configure Settings

1. Open the app at **http://localhost:3000**
2. Go to **Settings**
3. Paste your Cloudflare tunnel URL
4. Save changes

### 8. Add Late.com Credentials (in n8n)

1. Open n8n at **http://localhost:5678**
2. Go to **Credentials** → **Add Credential**
3. Add "Header Auth" with your Late.com API key

## Usage

### Content Workflow

```
1. CREATE CLIENT     →  Define client settings, language, accounts
2. CREATE BATCH      →  Add media folder, schedule settings
3. INGEST (W1)       →  Import media, create database records
4. GENERATE (W2)     →  AI generates captions for each item
5. REVIEW            →  Approve, edit, or reject in UI
6. SCHEDULE (W3)     →  Push approved content to Late.com
```

### Folder Structure

Place your media in the data directory:

```
C:/Clients/                          # Or your DATA_PATH
├── _config/
│   ├── socialflow.db                # SQLite database
│   ├── settings.json                # Global settings
│   └── agents/                      # AI prompts
│       ├── caption_generator.md
│       └── caption_generator_en.md
│
├── my-client/                       # Client folder (slug)
│   ├── client.yaml                  # Client config
│   ├── brief.txt                    # AI context/brand info
│   ├── hashtags.txt                 # Default hashtags
│   │
│   └── january-2025/                # Batch folder
│       ├── READY.txt                # Gate file (required!)
│       ├── batch.yaml               # Batch config
│       ├── photos/
│       │   ├── photo1.jpg
│       │   └── photo2.png
│       └── videos/
│           ├── video1.mp4
│           └── video1_F1.jpg        # Frame 1 (for AI)
│           └── video1_F2.jpg        # Frame 2
│           └── video1_F3.jpg        # Frame 3
│           └── video1_F4.jpg        # Frame 4
```

### Client Configuration (client.yaml)

```yaml
name: "My Client"
language: "en"  # en, fr, de
timezone: "Europe/Berlin"
instagram_account_id: "acc_xxxxx"
tiktok_account_id: "acc_yyyyy"
```

### Batch Configuration (batch.yaml)

```yaml
name: "January 2025"
platforms:
  - ig  # Instagram
  - tt  # TikTok
feed_time: "20:00"
story_time: "18:30"
```

## Development

### Rebuilding the UI (After Frontend Changes)

**IMPORTANT:** The production UI runs on **port 3000** via Docker. After making any frontend changes, always rebuild the UI container:

```bash
# Recommended: Use the make command
make ui

# Or run directly:
docker compose build socialflow-ui && docker compose up -d socialflow-ui
```

Then access the UI at **http://localhost:3000** (not port 5173).

### Run in Development Mode (Hot Reload)

For development with hot-reload, you can use the dev server, but remember this is NOT the production UI:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

- Dev server (hot-reload): **http://localhost:5173** *(development only)*
- **Production UI: http://localhost:3000** *(always use this)*
- n8n: **http://localhost:5678**

### Run Frontend Locally (without Docker)

```bash
cd socialflow-ui
npm install
npm run dev  # Starts on port 5173 - for dev only, not production!
```

### Run Tests

```bash
cd socialflow-ui
npm run test        # Watch mode
npm run test:run    # Single run
```

## API Reference

Base URL: `http://localhost:5678/webhook/api?route=`

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/clients` | GET | List all clients |
| `/clients` | POST | Create new client |
| `/clients/:slug` | GET | Get client details |
| `/clients/:slug/batches` | GET | List client batches |
| `/batches/:client/:batch/status` | GET | Get batch status counts |
| `/items/:client/:batch` | GET | List content items |
| `/item/:id/approve` | POST | Approve content item |
| `/item/:id/reject` | POST | Reject content item |
| `/settings` | GET/PUT | Global settings |
| `/stats` | GET | Dashboard statistics |

### Workflow Triggers

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/w0-sync` | POST | Sync Late.com accounts |
| `/w1-ingest` | POST | Ingest batch media |
| `/w2-captions` | POST | Generate AI captions |
| `/w3-schedule` | POST | Schedule to Late.com |

See [API_REFERENCE.md](docs/API_REFERENCE.md) for full documentation.

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `UI_PORT` | 3000 | Frontend port |
| `N8N_PORT` | 5678 | n8n port |
| `DATA_PATH` | C:/Clients | Client data directory |
| `TZ` | Europe/Berlin | Timezone |
| `VITE_API_BASE` | http://localhost:5678/webhook | API URL |

### Settings (settings.json)

```json
{
  "cloudflare_tunnel_url": "https://your-tunnel.trycloudflare.com",
  "ai_provider": "ollama",
  "ollama": {
    "model": "llava:7b",
    "timeout_ms": 600000,
    "models": {
      "image_describer": "llava:7b",
      "caption_generator": "llama3.2:3b"
    }
  },
  "defaults": {
    "timezone": "Europe/Berlin",
    "language": "fr"
  }
}
```

## Workflows

| Workflow | Version | Purpose |
|----------|---------|---------|
| W-API | v16 | REST API router for all endpoints |
| W0 | v16 | Sync Late.com accounts to local cache |
| W1 | v16 | Ingest media, validate, create DB records |
| W2 | v16 | Generate AI captions via Ollama |
| W3 | v16 | Schedule approved content to Late.com |
| W-Agent1-Config | v16 | AI-powered client config generation |
| W-Agent1-Batch | v16 | AI-powered batch brief generation |

## Content Status Flow

```
PENDING → NEEDS_AI → NEEDS_REVIEW → APPROVED → SCHEDULED
                ↓           ↓
             BLOCKED      BLOCKED (rejected)
```

## Troubleshooting

### Ollama Connection Issues

```bash
# Verify Ollama is running
curl http://localhost:11434/api/version

# Docker uses host.docker.internal to reach host services
```

### Database Not Initialized

```bash
docker exec socialflow-n8n sh /opt/scripts/init-db.sh
```

### Workflows Not Working

1. Verify all workflows are imported and **activated**
2. Check Late API credentials are configured
3. View logs: `docker-compose logs -f socialflow-n8n`

### Frontend Connection Errors

1. Check n8n is running: `docker-compose ps`
2. Test API: `curl http://localhost:5678/webhook/api?route=/health`
3. Check nginx logs: `docker logs socialflow-ui`

### Permission Errors (Linux)

```bash
# n8n runs as user node (UID 1000)
sudo chown -R 1000:1000 /path/to/your/data
```

## Tech Stack

**Frontend:**
- React 19 + TypeScript
- Vite (build tool)
- TanStack Query (server state)
- shadcn/ui + Radix UI (components)
- Tailwind CSS (styling)

**Backend:**
- n8n (workflow automation)
- SQLite (database)
- Ollama (local LLM)

**Infrastructure:**
- Docker + Docker Compose
- nginx (reverse proxy)
- Cloudflare Tunnel (media CDN)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [n8n](https://n8n.io) - Workflow automation
- [Ollama](https://ollama.ai) - Local LLM runtime
- [Late.com](https://getlate.dev) - Social media scheduling
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Cloudflare](https://cloudflare.com) - Tunnel for media serving
