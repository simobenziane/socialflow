# SocialFlow MVP - Project History

Quick reference for AI assistants and developers. Short expressions, maximum clarity.

---

## What Is This?

**SocialFlow** = Social media automation system
- Ingest media → AI captions → Schedule to Late.com
- Headless architecture: Backend (n8n) + Frontend (React) = independent
- SQLite database, YAML configs, REST API

---

## Architecture

```
Frontend (React SPA)     →  REST API  →  Backend (n8n workflows)
     ↓                                          ↓
Cloudflare tunnel test              SQLite + File system
```

**Key principle**: Components don't depend on each other. Swap frontend, scale backend independently.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v10 | Pre-2025 | Google Sheets storage |
| v11 | 2025-12-05 | SQLite migration, new architecture |
| v12 | 2025-12-05 | Archive system, bug fixes |
| v13 | 2025-12-06 | Unified versions, JS cleanup, documentation |
| v14 | 2025-12-07 | Phase 3: AI Agent System, instruction cascade |
| v15 | 2025-12-10 | Two-Agent Caption System, VLM descriptions, conversation logging |

---

## Phases Completed

### Phase 0: Foundation
- Project structure setup
- n8n workflow design
- SQLite schema design
- Template files created

### Phase 1: Core Workflows
- W0: Late.com account sync
- W1: Media ingest & validation
- W2: AI caption generation (Ollama)
- W3: Late.com scheduling
- W-API: REST API router

### Phase 2: API Enhancement
- Full REST API implementation
- Archive endpoints (soft delete)
- Job tracking system
- Hybrid batch discovery (FS + DB)
- CORS support

### Phase 3: AI Agent System (Current)
- All workflows → v15
- Instruction cascade system (system/client/batch levels)
- New W-Agent1 workflows for AI-assisted config generation
- 8 new API routes for agent instruction management
- Per-agent model configuration
- Master prompt files (`_config/agents/*.md`)
- `agent_instructions` database table

### Phase 2.5: Documentation & Cleanup
- All workflows → v13
- JavaScript code tidied
- Documentation updated
- Temporary files removed

---

## File Structure

```
files/
├── CLAUDE.md            # AI instructions
├── INDEX.md             # Quick reference
├── PROJECT_HISTORY.md   # This file
├── workflows/           # n8n JSON files (v15)
├── docs/                # Documentation
├── scripts/             # DB scripts
├── templates/           # YAML templates
└── config/              # Runtime config samples
    └── agents/          # AI agent master prompts
```

---

## Workflows (v15)

| Workflow | Purpose | Trigger |
|----------|---------|---------|
| W-API | REST API router + Agent APIs | `GET/POST/PUT /api?route=...` |
| W0 | Sync Late accounts | `POST /w0-sync` |
| W1 | Ingest media | `POST /w1-ingest` |
| W2 | AI captions (with cascade) | `POST /w2-captions` |
| W3 | Schedule posts | `POST /w3-schedule` |
| W-Agent1-Config | Generate client config | `POST /w-agent1-config` |
| W-Agent1-Batch | Generate batch briefs | `POST /w-agent1-batch` |

**Import order**: W-API → W0 → W1 → W2 → W3 → W-Agent1-Config → W-Agent1-Batch

---

## Content Flow

```
Batch folder → W1 → NEEDS_AI → W2 → NEEDS_REVIEW → UI → APPROVED → W3 → SCHEDULED
```

**Statuses**: PENDING → NEEDS_AI → NEEDS_REVIEW → APPROVED → SCHEDULED
**Failed**: BLOCKED, FAILED

---

## Key Paths

| Item | Path |
|------|------|
| Database | `/data/clients/_config/socialflow.db` |
| Settings | `/data/clients/_config/settings.json` |
| Agent Prompts | `/data/clients/_config/agents/*.md` |
| Clients | `/data/clients/{slug}/` |
| Batches | `/data/clients/{slug}/{batch}/` |

---

## API Routes (Key)

```
GET  /api?route=/health          # Health check
GET  /api?route=/clients         # List clients
POST /api?route=/clients         # Create client
GET  /api?route=/batches/:c/:b/status  # Batch status
GET  /api?route=/items/:c/:b     # Content items
POST /api?route=/item/:id/approve      # Approve
POST /api?route=/item/:id/reject       # Reject

# Agent Instructions (v15)
GET/PUT /api?route=/agents/settings           # Agent models & prompts
GET/PUT /api?route=/agents/instructions       # System-level overrides
GET/PUT /api?route=/clients/:slug/instructions      # Client-level
GET/PUT /api?route=/batches/:c/:b/instructions      # Batch-level
```

---

## Frontend (socialflow-ui)

**Stack**: React 18 + TypeScript + Vite + TanStack Query + shadcn/ui

**Pages**:
- `/` Dashboard
- `/clients` Client list
- `/clients/:slug` Client detail
- `/batches/:c/:b` Batch detail
- `/batches/:c/:b/approve` Approval board
- `/accounts` Late.com accounts
- `/settings` Configuration
- `/archive` Archived clients

---

## Configuration

### client.yaml
```yaml
name: "Client Name"
language: fr
accounts:
  instagram:
    - late_account_id: "abc123"
```

### batch.yaml
```yaml
name: "Batch Name"
schedule:
  photos_per_day: 2
```

### settings.json
```json
{
  "cloudflare_tunnel_url": "https://xxx.trycloudflare.com",
  "ollama": {
    "model": "llava:7b",
    "models": {
      "caption_generator": "llava:7b",
      "config_generator": "llama3.2:3b"
    }
  }
}
```

---

## Decisions Made

1. **Single API webhook** - All routes via `/api?route=...`
2. **SQLite over Sheets** - Performance, reliability
3. **YAML configs** - Human readable, version controllable
4. **Hybrid batch discovery** - FS for existence, DB for metadata
5. **Frontend tests Cloudflare** - No backend proxy needed
6. **Archive system** - Soft delete with restore option
7. **Instruction cascade** - System → Client → Batch (additive)
8. **Per-agent models** - Different LLMs for different tasks
9. **Master prompts in files** - Easy to edit, version controllable

---

## Files Cleaned Up (v13)

Removed temporary scripts:
- `fix_*.js` - One-time fixes
- `import_*.js` - Migration helpers
- `add_archive_endpoints.js` - Applied
- `package.json` - Not needed
- `node_modules/` - Not needed
- `*.sqlite` backups - Not needed
- `v12` workflows - Superseded by v13

---

## Documentation Index

| Doc | Purpose |
|-----|---------|
| `CLAUDE.md` | AI assistant instructions |
| `INDEX.md` | File index, quick start |
| `PROJECT_HISTORY.md` | This file |
| `workflows/CHANGELOG.md` | Version history |
| `docs/API_REFERENCE.md` | REST API details |
| `docs/WEBHOOK_API_REFERENCE.md` | Workflow triggers |
| `docs/SCHEDULING.md` | Schedule configuration |
| `docs/V11_ARCHITECTURE_PLAN.md` | Architecture design |
| `docs/V11_WORKFLOW_ANALYSIS.md` | Workflow analysis |
| `docs/PHASE1_CHUNKS.md` | Phase 1 implementation chunks |

---

## Quick Start

1. Import workflows (W-API first)
2. Activate all workflows
3. Start UI: `cd socialflow-ui && npm run dev`
4. Start tunnel: `cloudflared tunnel --url file://C:/Clients`
5. Configure: UI → Settings → Paste URL → Save
6. Test: Click Test button

---

## AI Agent System (v15)

### Instruction Cascade
```
System Prompt → System Override → Client Override → Batch Override
   (file)         (database)        (database)       (database)
```

All levels are additive - each appends to the previous.

### Agent Types
| Agent | Model | Purpose |
|-------|-------|---------|
| `caption_generator` | llava:7b | Photo/video captions (W2) |
| `config_generator` | llama3.2:3b | Client config files (W-Agent1) |

### Database Table
```sql
agent_instructions (
  agent_type, scope, scope_id, instruction_key, instruction_value, is_active
)
```

---

## What's Next?

Potential future work:
- Multi-user support
- Analytics dashboard
- More AI models
- Platform expansions
- Mobile app
- UI for agent instruction management

---

**Last Updated**: 2025-12-10
