# SocialFlow - Comprehensive Test Plan

This document outlines all tests needed to verify the system works correctly.

---

## 1. Setup Script Tests

### 1.1 Windows Setup (`scripts/setup-windows.ps1`)

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Fresh install | Run on clean Windows machine | Installs Git, Docker, Ollama via winget |
| Interactive prompts | Run script | Asks for deployment mode, data path |
| Local mode | Select option 1 | Installs Ollama, skips Tailscale |
| VPS mode | Select option 2 | Installs Tailscale, asks for IP |
| Custom data path | Enter `D:\MyData` | Creates directory, updates .env |
| Default data path | Press Enter | Uses `C:\Clients` |
| Docker not running | Docker Desktop closed | Shows error, exits gracefully |
| Re-run safety | Run twice | Skips already installed components |

### 1.2 Mac/Linux Setup (`scripts/setup.sh`)

| Test | Steps | Expected Result |
|------|-------|-----------------|
| OS detection (Mac) | Run on macOS | Detects "mac", calls setup-mac.sh |
| OS detection (Linux) | Run on Ubuntu | Detects "linux", runs Linux setup |
| OS detection (Windows) | Run in Git Bash | Detects "windows", shows PowerShell message |
| Interactive prompts | Run script | Asks deployment mode, data path |
| Tilde expansion | Enter `~/data` | Expands to full home path |

### 1.3 VPS Setup (`scripts/setup-vps.sh`)

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Fresh VPS | Run on clean Ubuntu 22.04 | Installs Docker, Tailscale |
| Tailscale IP prompt | Enter `100.100.100.2` | Configures OLLAMA_HOST in .env |
| No Tailscale IP | Press Enter | Shows warning, uses placeholder |
| Sudo permissions | Run as non-root | Prompts for sudo when needed |
| Data directory | Enter `/var/socialflow` | Creates with correct ownership |

---

## 2. Docker Tests

### 2.1 Container Build

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Local build | `docker-compose build` | Builds socialflow-ui, socialflow-n8n |
| VPS build | `docker-compose -f docker-compose.vps.yml build` | Builds with VPS config |
| Mac build | `docker-compose -f docker-compose.yml -f docker-compose.mac.yml build` | Uses Mac optimizations |

### 2.2 Container Startup

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Start containers | `docker-compose up -d` | Both containers running |
| Health endpoints | `curl localhost:5678/healthz` | Returns 200 OK |
| UI accessible | Open `http://localhost:3000` | Shows SocialFlow UI |
| n8n accessible | Open `http://localhost:5678` | Shows n8n interface |
| Container names | `docker ps` | Shows `socialflow-n8n`, `socialflow-ui` |

### 2.3 Volume Mounts

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Data persistence | Restart containers | Data preserved in DATA_PATH |
| Config access | Check `/opt/config-templates` in container | Contains agent prompts |
| Workflow access | Check `/opt/workflows` in container | Contains workflow JSON files |
| Script access | Check `/opt/scripts` in container | Contains init-db.sh |

---

## 3. Database Tests

### 3.1 Initialization

| Test | Steps | Expected Result |
|------|-------|-----------------|
| First init | `docker exec socialflow-n8n sh /opt/scripts/init-db.sh` | Creates socialflow.db |
| Schema check | Query sqlite3 | Tables: clients, batches, content_items, settings |
| Re-init safety | Run init again | No duplicate tables, no data loss |
| Settings created | Check settings table | Has cloudflare_tunnel_url, ai_provider |

### 3.2 Data Operations

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Insert client | API POST /clients | Client created in DB |
| Read client | API GET /clients/:slug | Returns client data |
| Insert batch | API POST /batches | Batch created with client_id |
| Insert item | Ingest workflow | Content item with correct status |

---

## 4. Ollama Tests

### 4.1 Local Connection

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Ollama running | `curl localhost:11434/api/version` | Returns version JSON |
| Model available | `ollama list` | Shows llava:7b, llama3.2:3b |
| Docker to host | From container: `curl host.docker.internal:11434` | Reaches Ollama |

### 4.2 VPS/Tailscale Connection

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Tailscale status | `tailscale status` | Shows both machines connected |
| Cross-network ping | From VPS: `ping 100.x.x.x` | Reaches local machine |
| Ollama via Tailscale | `curl http://100.x.x.x:11434/api/version` | Returns version |
| AI generation | Trigger W2 workflow | Captions generated via Tailscale |

---

## 5. Workflow Tests

### 5.1 W-API Endpoints

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Health check | GET `/api?route=/health` | Returns `{status: "ok"}` |
| List clients | GET `/api?route=/clients` | Returns array of clients |
| Get settings | GET `/api?route=/settings` | Returns settings object |
| Update settings | PUT `/api?route=/settings` | Settings updated |

### 5.2 W0 - Late Sync

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Sync trigger | POST `/api?route=/w0-sync` | Syncs Late.com accounts |
| Account storage | Check accounts table | Late.com accounts cached |

### 5.3 W1 - Ingest

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Ingest photos | POST with client/batch | Photos added to DB |
| Ingest videos | POST with client/batch | Videos + frames added |
| READY.txt check | Missing READY.txt | Returns error |
| Duplicate prevention | Ingest same batch twice | No duplicates |
| Progress tracking | Monitor during ingest | Progress updates visible |

### 5.4 W2 - AI Captions

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Generate single | POST with item_id | Caption generated |
| Generate batch | POST with batch | All items captioned |
| Vision model | Image item | Uses llava:7b |
| Text model | Caption generation | Uses llama3.2:3b |
| Instruction cascade | With client brief | Brief included in prompt |
| Progress tracking | Monitor during generation | Progress updates visible |

### 5.5 W3 - Scheduling

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Schedule item | POST with approved item | Scheduled in Late.com |
| Schedule batch | POST with batch | All approved items scheduled |
| Platform selection | ig/tt platforms | Correct Late.com accounts used |

---

## 6. Frontend Tests

### 6.1 UI Components

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Dashboard loads | Open / | Shows stats, recent activity |
| Client list | Open /clients | Lists all clients |
| Client detail | Click client | Shows batches, items |
| Batch detail | Click batch | Shows content items |
| Review board | Open review | Shows items by status |
| Settings page | Open /settings | Shows configuration form |

### 6.2 API Integration

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Create client | Fill form, submit | Client appears in list |
| Approve item | Click approve | Status changes to APPROVED |
| Reject item | Click reject | Status changes to BLOCKED |
| Edit caption | Modify text, save | Caption updated |
| Test connection | Settings > Test | Shows connection status |

### 6.3 Error Handling

| Test | Steps | Expected Result |
|------|-------|-----------------|
| API down | Stop n8n container | Shows error message |
| Invalid data | Submit empty form | Shows validation errors |
| Network error | Disconnect network | Shows retry option |

---

## 7. Integration Tests

### 7.1 Full Pipeline (Local)

| Test | Steps | Expected Result |
|------|-------|-----------------|
| End-to-end local | Setup → Create client → Ingest → Generate → Approve → Schedule | Complete flow works |

**Detailed Steps:**
1. Run `./scripts/setup.sh` (or Windows equivalent)
2. Verify containers running: `make health`
3. Open http://localhost:3000
4. Create client via UI
5. Create batch folder with photos
6. Add READY.txt
7. Trigger ingest
8. Trigger AI generation
9. Review and approve items
10. Schedule to Late.com

### 7.2 Full Pipeline (VPS Hybrid)

| Test | Steps | Expected Result |
|------|-------|-----------------|
| End-to-end VPS | VPS setup → Tailscale → Full pipeline | Complete flow via Tailscale |

**Detailed Steps:**
1. On local: Start Ollama with `OLLAMA_HOST=0.0.0.0:11434`
2. On local: Get Tailscale IP
3. On VPS: Run `./scripts/setup-vps.sh`
4. Enter local Tailscale IP when prompted
5. Verify AI works via VPS: trigger W2
6. Complete full pipeline via VPS URL

---

## 8. Performance Tests

| Test | Threshold | How to Test |
|------|-----------|-------------|
| UI load time | < 3 seconds | Lighthouse |
| API response | < 500ms | curl timing |
| Ingest 100 photos | < 5 minutes | Batch ingest |
| AI generation/item | < 60 seconds | W2 timing |
| Tailscale latency | < 50ms | ping test |

---

## 9. Security Tests

| Test | Steps | Expected Result |
|------|-------|-----------------|
| VPS ports | `nmap vps-ip` | Only 80, 443 open |
| Local ports | Container binds | 127.0.0.1 only for VPS |
| Tailscale only | Block public 11434 | Ollama only via Tailscale |
| SSL cert | Check https:// | Valid Let's Encrypt cert |

---

## 10. Automated Test Script

Create `scripts/test-setup.sh`:

```bash
#!/bin/bash
# Quick verification after setup

echo "Testing SocialFlow Setup..."

# Test Docker
echo -n "Docker: "
docker info > /dev/null 2>&1 && echo "OK" || echo "FAIL"

# Test containers
echo -n "Containers: "
docker ps | grep -q socialflow && echo "OK" || echo "FAIL"

# Test n8n
echo -n "n8n API: "
curl -s localhost:5678/healthz > /dev/null && echo "OK" || echo "FAIL"

# Test UI
echo -n "UI: "
curl -s localhost:3000 > /dev/null && echo "OK" || echo "FAIL"

# Test Ollama
echo -n "Ollama: "
curl -s localhost:11434/api/version > /dev/null && echo "OK" || echo "FAIL"

# Test database
echo -n "Database: "
docker exec socialflow-n8n test -f /data/clients/_config/socialflow.db && echo "OK" || echo "FAIL"

echo "Done."
```

---

## Test Execution Order

1. **Setup Scripts** (fresh machine)
2. **Docker Tests** (containers running)
3. **Database Tests** (after init)
4. **Ollama Tests** (models pulled)
5. **Workflow Tests** (workflows imported)
6. **Frontend Tests** (UI accessible)
7. **Integration Tests** (full pipeline)
8. **Performance Tests** (under load)
9. **Security Tests** (production readiness)

---

## Test Environments

| Environment | Purpose | Configuration |
|-------------|---------|---------------|
| Windows Dev | Local development | Docker Desktop, WSL2 |
| Mac Dev | Local development | Docker Desktop or OrbStack |
| Linux Dev | Local development | Docker Engine |
| VPS Staging | Pre-production | Ubuntu 22.04, Tailscale |
| VPS Production | Live system | Same as staging + SSL |
