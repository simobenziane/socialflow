# Mac & Docker Compatibility Study

**Date:** 2025-12-19
**Status:** Research Complete
**Purpose:** Evaluate requirements for running SocialFlow on macOS via Docker

---

## Executive Summary

The SocialFlow codebase is **well-architected for cross-platform support**. Most compatibility issues are related to **documentation and default values** rather than actual code incompatibilities. Docker provides the abstraction layer that makes Mac deployment straightforward.

**Estimated effort:** Low-Medium (primarily documentation updates)

---

## Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    HOST MACHINE (Windows/Mac/Linux)         │
│  ┌─────────────────┐    ┌─────────────────────────────────┐│
│  │ Cloudflare      │    │ Data Directory                  ││
│  │ Tunnel          │    │ Windows: C:/Clients             ││
│  │ (media serving) │    │ Mac: ~/socialflow-data          ││
│  └─────────────────┘    └─────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DOCKER CONTAINERS                        │
│  ┌──────────────────────┐  ┌──────────────────────────────┐│
│  │ socialflow-ui        │  │ socialflow-n8n               ││
│  │ (React + Nginx)      │  │ (n8n workflows)              ││
│  │ Port: 3000           │  │ Port: 5678                   ││
│  └──────────────────────┘  └──────────────────────────────┘│
│                              │                              │
│                              ▼                              │
│                    /data/clients (mounted volume)           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    HOST SERVICES                            │
│  ┌──────────────────────┐  ┌──────────────────────────────┐│
│  │ Ollama LLM           │  │ Late.com API                 ││
│  │ localhost:11434      │  │ (external)                   ││
│  │ via host.docker.     │  │                              ││
│  │ internal             │  │                              ││
│  └──────────────────────┘  └──────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## What Already Works Cross-Platform

| Component | Status | Notes |
|-----------|--------|-------|
| Docker Compose | ✅ Ready | Uses environment variables, no hardcoded paths |
| Frontend (React) | ✅ Ready | Pure JavaScript, no native dependencies |
| n8n Container | ✅ Ready | Official image works on all platforms |
| Nginx Proxy | ✅ Ready | Standard configuration |
| SQLite Database | ✅ Ready | Runs inside container |
| Volume Mounts | ✅ Ready | `${DATA_PATH}` environment variable |
| `host.docker.internal` | ✅ Ready | Works on Docker Desktop (Mac & Windows) |

---

## What Needs Changes for Mac

### 1. Default Data Path (Priority: High)

**Current (.env.example):**
```bash
DATA_PATH=C:/Clients
```

**Required for Mac:**
```bash
# Mac/Linux default
DATA_PATH=./data
# or
DATA_PATH=$HOME/socialflow-data
```

**Files to update:**
- `.env.example`

---

### 2. Documentation Updates (Priority: High)

**Files needing Mac-specific instructions:**

| File | Current State | Required Changes |
|------|---------------|------------------|
| `README.md` | Windows-focused | Add Mac section |
| `README.Docker.md` | Mentions Linux/Mac | More explicit Mac steps |
| `files/CLAUDE.md` | Windows paths | Add Mac alternatives |
| `files/INDEX.md` | Windows paths | Add Mac alternatives |

**Example update for README.md:**

```markdown
## Quick Start

### macOS

1. Install prerequisites:
   ```bash
   # Install Docker Desktop
   brew install --cask docker

   # Install Ollama
   brew install ollama

   # Install Cloudflare Tunnel
   brew install cloudflared
   ```

2. Clone and configure:
   ```bash
   git clone https://github.com/yourusername/socialflow.git
   cd socialflow
   cp .env.example .env

   # Edit .env - set DATA_PATH
   # DATA_PATH=$HOME/socialflow-data
   ```

3. Create data directory:
   ```bash
   mkdir -p ~/socialflow-data/_config
   ```

4. Start services:
   ```bash
   docker-compose up -d --build
   ```

5. Initialize database:
   ```bash
   docker exec socialflow-n8n sh /opt/scripts/init-db.sh
   ```

6. Start Cloudflare tunnel:
   ```bash
   cloudflared tunnel --url file://$HOME/socialflow-data
   ```
```

---

### 3. Cloudflare Tunnel Commands (Priority: High)

**Current documentation shows:**
```bash
# Windows:
cloudflared tunnel --url file://C:/Clients
```

**Mac equivalent:**
```bash
# macOS:
cloudflared tunnel --url file://$HOME/socialflow-data
# or with absolute path:
cloudflared tunnel --url file:///Users/username/socialflow-data
```

---

### 4. Docker Desktop Performance (Priority: Medium)

Mac Docker has known performance issues with volume mounts. Recommend documenting:

```markdown
### Performance Optimization (macOS)

Docker Desktop on Mac can be slow with volume mounts. Options:

1. **Increase Docker resources:**
   - Docker Desktop → Settings → Resources
   - Recommend: 4+ CPUs, 8GB+ RAM

2. **Use alternative runtimes:**
   - [OrbStack](https://orbstack.dev/) - Faster alternative
   - [Colima](https://github.com/abiosoft/colima) - Lightweight option

3. **Volume mount optimization:**
   - Use `:cached` or `:delegated` flags for better performance
   ```yaml
   volumes:
     - ${DATA_PATH}:/data/clients:cached
   ```
```

---

### 5. Ollama Installation (Priority: Medium)

**Windows:** Downloads from ollama.ai
**Mac:** Available via Homebrew

```bash
# Install Ollama
brew install ollama

# Start Ollama service
ollama serve

# Pull required models
ollama pull llava:7b
ollama pull llama3.2:3b
```

---

## Implementation Checklist

### Phase 1: Configuration Updates
- [ ] Update `.env.example` with cross-platform defaults
- [ ] Add `.env.example.mac` template (optional)
- [ ] Test volume mounting on Mac

### Phase 2: Documentation
- [ ] Add macOS section to `README.md`
- [ ] Update `README.Docker.md` with Mac-specific notes
- [ ] Update `files/CLAUDE.md` session setup section
- [ ] Add performance optimization tips

### Phase 3: Testing
- [ ] Test Docker Compose on Mac (Intel)
- [ ] Test Docker Compose on Mac (Apple Silicon/M1/M2)
- [ ] Test Ollama connectivity via `host.docker.internal`
- [ ] Test Cloudflare tunnel with Mac paths
- [ ] Test full workflow (ingest → AI → schedule)

### Phase 4: Optional Enhancements
- [ ] Create `docker-compose.mac.yml` override (if needed)
- [ ] Add Makefile for common commands
- [ ] Create setup script for Mac (`setup-mac.sh`)

---

## Technical Deep Dive

### Volume Mount Syntax

**Windows:**
```yaml
volumes:
  - C:/Clients:/data/clients
  - ${DATA_PATH:-C:/Clients}:/data/clients
```

**Mac/Linux:**
```yaml
volumes:
  - ./data:/data/clients
  - ${DATA_PATH:-./data}:/data/clients
  - ~/socialflow-data:/data/clients
  - /opt/socialflow:/data/clients
```

### Path Format Differences

| Platform | Path Format | Example |
|----------|-------------|---------|
| Windows | `C:/path` or `C:\path` | `C:/Clients/_config` |
| Mac | `/path` | `/Users/john/socialflow-data` |
| Mac (home) | `~/path` | `~/socialflow-data` |
| Docker | Always `/path` | `/data/clients/_config` |

### Environment Variable Handling

The current `docker-compose.yml` handles this well:
```yaml
volumes:
  - ${DATA_PATH:-C:/Clients}:/data/clients
```

For Mac, user just needs to set `DATA_PATH` in `.env`:
```bash
DATA_PATH=/Users/john/socialflow-data
```

---

## Platform Detection (Already Implemented)

**`init_database.js` already handles this:**
```javascript
const isWindows = process.platform === 'win32';
const CONFIG_PATH = isWindows
  ? 'C:\\Clients\\_config'
  : '/data/clients/_config';
```

**`client.ts` path validation works everywhere:**
```typescript
if (slug.includes('..') || slug.includes('/') || slug.includes('\\')) {
  throw new Error('Invalid slug');
}
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Docker Desktop performance | Medium | Medium | Document OrbStack/Colima alternatives |
| Volume mount permissions | Low | Medium | Document chmod/chown if needed |
| Ollama connectivity | Low | High | Test `host.docker.internal` on Mac |
| Apple Silicon compatibility | Low | Low | n8n and Node images support ARM64 |

---

## Recommended Changes Summary

### Must Do (for Mac support)
1. Update `.env.example` default DATA_PATH
2. Add Mac installation section to README
3. Document Mac Cloudflare tunnel command

### Should Do (better experience)
4. Add Docker performance tips for Mac
5. Add troubleshooting section
6. Test on Apple Silicon

### Nice to Have
7. Create setup-mac.sh script
8. Add Makefile for common commands
9. Create OrbStack/Colima instructions

---

## Conclusion

**SocialFlow can run on Mac with minimal changes.** The Docker architecture already abstracts platform differences. The main work is:

1. **Update default path** in `.env.example`
2. **Update documentation** with Mac-specific commands
3. **Test** on Mac hardware

The codebase demonstrates good practices for cross-platform development - using environment variables, container-based deployment, and platform detection where needed.

---

**Next Steps:**
1. Review this document
2. Prioritize implementation tasks
3. Test on Mac hardware
4. Update documentation
5. Release Mac-compatible version
