# SocialFlow Docker Setup

Complete Docker setup for running SocialFlow (React frontend + n8n backend).

## Prerequisites

1. **Docker Desktop** (Windows/Mac) or **Docker Engine + Docker Compose** (Linux)
2. **Ollama** running on the host machine
   - Install: https://ollama.ai
   - Pull required models:
     ```bash
     ollama pull llava:7b
     ollama pull llama3.2:3b
     ```

## Quick Start

### 1. Clone and Configure

```bash
git clone https://github.com/your-org/socialflow.git
cd socialflow

# Create environment file
cp .env.example .env

# Edit .env to set your data path (default: C:/Clients)
```

### 2. Start Containers

```bash
# Production mode
docker-compose up -d --build

# Wait for containers to start
docker-compose ps
```

### 3. Initialize Database (First Run Only)

```bash
docker exec socialflow-n8n sh /opt/scripts/init-db.sh
```

### 4. Import Workflows

1. Open n8n at http://localhost:5678
2. Click **Workflows** > **Add Workflow** > **Import from File**
3. Import workflows in this order:
   - `W_API_Endpoints_v15.2.json` (required first)
   - `W0_Late_Sync_v15.2.json`
   - `W1_Ingest_Validate_v15.3.json`
   - `W2_AI_Captions_v15.2.json`
   - `W3_Late_Scheduling_v15.2.json`
   - `W_Agent1_Config_v15.2.json` (optional)
   - `W_Agent1_Batch_v15.2.json` (optional)
4. **Activate** each workflow after import

### 5. Configure Cloudflare Tunnel

```bash
# On your host machine (not in Docker)
cloudflared tunnel --url file://C:/Clients
```

Copy the tunnel URL and paste it in Settings (http://localhost:3000/settings).

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **n8n Dashboard**: http://localhost:5678

## Development Mode

For hot-reload during development:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

- Frontend with hot-reload: http://localhost:5173
- n8n: http://localhost:5678

## Commands Reference

```bash
# Start (production)
docker-compose up -d --build

# Start (development)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# View logs
docker-compose logs -f
docker-compose logs -f socialflow-ui
docker-compose logs -f socialflow-n8n

# Stop containers
docker-compose down

# Stop and remove volumes (WARNING: deletes n8n data)
docker-compose down -v

# Rebuild without cache
docker-compose build --no-cache
```

## Data Persistence

All data is stored in the path specified by `DATA_PATH` in `.env`:

```
C:/Clients/                    # Or your DATA_PATH
├── _config/
│   ├── socialflow.db          # SQLite database
│   ├── settings.json          # Application settings
│   ├── late_accounts.json     # Cached Late.com accounts
│   ├── active_job.json        # Current job state
│   └── agents/                # AI agent prompts
├── client-slug/               # Per-client folders
│   ├── client.yaml
│   ├── brief.txt
│   └── batch-name/
│       ├── photos/
│       └── videos/
└── ...
```

n8n internal data (workflows, credentials) is stored in the `socialflow-n8n-data` Docker volume.

## Troubleshooting

### n8n cannot connect to Ollama

Ensure Ollama is running on the host:
```bash
curl http://localhost:11434/api/version
```

The container uses `host.docker.internal` to reach host services.

### Database not initialized

Run the init script:
```bash
docker exec socialflow-n8n sh /opt/scripts/init-db.sh
```

### Workflows not found after restart

Workflows are stored in the n8n Docker volume. If you removed volumes, re-import the workflows.

### Frontend shows connection errors

1. Check n8n is running: `docker-compose ps`
2. Test API: `curl http://localhost:5678/webhook/api?route=/health`
3. Check nginx logs: `docker logs socialflow-ui`

### Permission errors on Linux

The n8n container runs as user `node` (UID 1000). Set ownership:
```bash
sudo chown -R 1000:1000 /path/to/your/data
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `UI_PORT` | 3000 | Frontend port |
| `N8N_PORT` | 5678 | n8n port |
| `DATA_PATH` | C:/Clients | Client data directory |
| `TZ` | Europe/Berlin | Timezone |
| `VITE_API_BASE` | http://localhost:5678/webhook | API base URL |

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Docker Compose                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────┐       ┌─────────────────────────┐  │
│  │ socialflow-ui   │       │    socialflow-n8n       │  │
│  │ (nginx:alpine)  │ ────▶ │    (n8nio/n8n)          │  │
│  │ Port: 3000      │       │    Port: 5678           │  │
│  └─────────────────┘       └─────────────────────────┘  │
│          │                           │                   │
│          └───────────┬───────────────┘                   │
│                      ▼                                   │
│           ┌──────────────────────┐                       │
│           │    DATA_PATH         │                       │
│           │    /data/clients     │                       │
│           └──────────────────────┘                       │
└──────────────────────────────────────────────────────────┘
                       │
                       ▼
            [Host: Ollama @ 11434]
```
