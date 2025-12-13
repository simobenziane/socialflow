# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SocialFlow MVP - A **headless, composable** social media content automation system. The architecture separates concerns completely:

- **Backend**: n8n workflows + SQLite database (stateless, API-driven)
- **Frontend**: React SPA (connects via REST API, no backend coupling)
- **Storage**: Cloudflare tunnel for media serving (frontend tests connectivity directly)

This design allows the UI to be swapped, the backend to scale independently, and components to be tested in isolation.

## Architecture Philosophy

### Headless & Composable
```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  React SPA (Vite + shadcn/ui + TanStack Query)                 │
│  - Stateless, API-driven                                        │
│  - Direct Cloudflare connectivity testing                       │
│  - No backend coupling                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ REST API (CORS enabled)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                 │
│  n8n Workflows (Docker)                                         │
│  ├── W-API: REST router (single webhook, route param)          │
│  ├── W0: Late.com account sync                                 │
│  ├── W1: Media ingest & validation                             │
│  ├── W2: AI caption generation (Ollama)                        │
│  └── W3: Late.com scheduling                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                               │
│  SQLite (socialflow.db) + JSON configs + File system           │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions
1. **Frontend tests Cloudflare directly** - No backend HTTP calls needed for tunnel validation
2. **Single API endpoint** - All routes go through `/api?route=...`
3. **Workflows are stateless** - Each call is independent, no session state
4. **Config cascade** - Batch → Client → Global settings

## File Structure

```
files/
├── CLAUDE.md              # This file - AI assistant instructions
├── INDEX.md               # Documentation index
├── workflows/             # n8n workflow JSON files (all v15.2)
│   ├── W0_Late_Sync_v15.2.json
│   ├── W1_Ingest_Validate_v15.2.json
│   ├── W2_AI_Captions_v15.2.json
│   ├── W3_Late_Scheduling_v15.2.json
│   ├── W_API_Endpoints_v15.2.json
│   ├── W_Agent1_Config_v15.2.json
│   └── W_Agent1_Batch_v15.2.json
├── docs/                  # Documentation
├── config/                # Runtime configuration
│   └── agents/           # AI agent master prompts (Phase 3)
├── scripts/               # Database scripts
└── templates/             # Client/batch templates

socialflow-ui/             # React frontend (separate directory)
├── src/
│   ├── api/              # API client (axios + types)
│   ├── components/       # UI components (shadcn/ui)
│   ├── hooks/            # TanStack Query hooks
│   └── pages/            # Page components
└── package.json
```

## Workflow Pipeline

| Workflow | Version | Description | Webhook |
|----------|---------|-------------|---------|
| W-API | v15.2 | REST API router + Agent instruction APIs | `GET/POST/PUT /api?route=...` |
| W0 | v15.2 | Sync Late.com accounts to cache | `POST /w0-sync` |
| W1 | v15.2 | Ingest media, validate, create DB records, **progress tracking** | `POST /w1-ingest` |
| W2 | v15.2 | Generate AI captions via Ollama (with instruction cascade) | `POST /w2-captions` |
| W3 | v15.2 | Schedule approved content to Late.com | `POST /w3-schedule` |
| W-Agent1-Config | v15.2 | Generate client configuration files | `POST /w-agent1-config` |
| W-Agent1-Batch | v15.2 | Generate batch brief files | `POST /w-agent1-batch` |

### Data Flow
```
Batch Folder → W1 (Ingest) → SQLite (NEEDS_AI)
                                   ↓
                            W2 (AI Captions)
                                   ↓
                         SQLite (NEEDS_REVIEW)
                                   ↓
                         UI Approval → APPROVED
                                   ↓
                            W3 (Schedule)
                                   ↓
                         Late.com → Published
```

## Configuration

### Key Paths
| Item | Value |
|------|-------|
| Docker Base Path | `/data/clients/` |
| Config Path | `/data/clients/_config/` |
| Database | `/data/clients/_config/socialflow.db` |
| Late API | `https://getlate.dev/api/v1` |
| Default Ollama Model | `llava:7b` or `qwen3-vl:4b` |
| Default Timezone | `Europe/Berlin` |

### Config Files
| File | Location | Description |
|------|----------|-------------|
| `settings.json` | `_config/` | Cloudflare URL, Ollama config, per-agent models |
| `late_accounts.json` | `_config/` | Cached Late.com accounts (from W0) |
| `active_job.json` | `_config/` | Current processing job state |
| `socialflow.db` | `_config/` | SQLite database (includes `agent_instructions` table) |

### Agent Prompt Files (Phase 3)
| File | Location | Description |
|------|----------|-------------|
| `caption_generator.md` | `_config/agents/` | System prompt for W2 caption generation |
| `config_generator.md` | `_config/agents/` | System prompt for client config generation |

### settings.json Structure
```json
{
  "cloudflare_tunnel_url": "https://xxx.trycloudflare.com",
  "paths": { "docker_base": "/data/clients/" },
  "ollama": {
    "model": "llava:7b",
    "timeout_ms": 120000,
    "models": {
      "caption_generator": "llava:7b",
      "config_generator": "llama3.2:3b"
    }
  }
}
```

## Client File Structure

```
/data/clients/
├── _config/
│   ├── settings.json
│   ├── socialflow.db
│   ├── late_accounts.json
│   └── agents/              # AI agent master prompts
│       ├── caption_generator.md
│       └── config_generator.md
├── {client_slug}/
│   ├── client.yaml           # Client config (name, language, accounts)
│   ├── brief.txt             # AI context for photos AND videos
│   ├── hashtags.txt          # Default hashtags
│   └── {batch_name}/
│       ├── READY.txt         # Gate file (required to process)
│       ├── batch.yaml        # Batch config
│       ├── photos_schedule.csv
│       ├── videos_schedule.csv
│       ├── photos/           # .jpg, .jpeg, .png
│       └── videos/           # .mp4, .mov + *_F1.jpg..F4.jpg frames
```

## Content Status Flow

`PENDING` → `NEEDS_AI` → `NEEDS_REVIEW` → `APPROVED` → `SCHEDULED`

Failed items: `BLOCKED` or `FAILED`

## Frontend (socialflow-ui)

### Tech Stack
- **React 18** + TypeScript
- **Vite** - Build tool
- **TanStack Query** - Server state management
- **shadcn/ui** - Component library (Radix + Tailwind)
- **React Router** - Client-side routing
- **Axios** - HTTP client

### Pages
| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Stats overview, quick actions |
| Clients | `/clients` | Client list + create |
| Client Detail | `/clients/:slug` | Client info, batches |
| Batch Detail | `/batches/:client/:batch` | Workflow actions, status |
| Approval Board | `/batches/:client/:batch/approve` | Review/approve content |
| Accounts | `/accounts` | Late.com accounts, sync |
| Settings | `/settings` | Cloudflare URL, AI model, test connection |
| Archive | `/archive` | Archived clients |

### Key Features
- **Test Connection** - Frontend directly tests Cloudflare tunnel (no backend)
- **Auto-refresh** - TanStack Query cache invalidation after mutations
- **Optimistic Updates** - Approve/reject with rollback on error
- **Media Preview** - Video thumbnails via cover frames

### Running the UI
```bash
cd socialflow-ui
npm install
npm run dev      # Development server (port 5173)
npm run build    # Production build
npm run test:run # Run tests
```

## API Endpoints

Base URL: `http://localhost:5678/webhook`

### Core Routes
| Route | Method | Description |
|-------|--------|-------------|
| `/api?route=/health` | GET | Health check |
| `/api?route=/clients` | GET | List clients |
| `/api?route=/clients/:slug` | GET | Get client |
| `/api?route=/clients` | POST | Create client |
| `/api?route=/clients/:slug/batches` | GET | List batches (hybrid FS + DB) |
| `/api?route=/batches/:client/:batch/status` | GET | Batch status counts |
| `/api?route=/items/:client/:batch` | GET | Content items |
| `/api?route=/item/:id/approve` | POST | Approve item |
| `/api?route=/item/:id/reject` | POST | Reject item |
| `/api?route=/settings` | GET/PUT | Get/update settings |
| `/api?route=/stats` | GET | Dashboard statistics |
| `/api?route=/jobs` | GET | Job execution status |

### Agent Instruction Routes (Phase 3)
| Route | Method | Description |
|-------|--------|-------------|
| `/api?route=/agents/settings` | GET | Get agent models and master prompts |
| `/api?route=/agents/settings` | PUT | Update agent model or master prompt |
| `/api?route=/agents/instructions` | GET | Get system-level instructions |
| `/api?route=/agents/instructions` | PUT | Upsert system-level instruction |
| `/api?route=/clients/:slug/instructions` | GET | Get client-level instructions |
| `/api?route=/clients/:slug/instructions` | PUT | Upsert client-level instruction |
| `/api?route=/batches/:client/:batch/instructions` | GET | Get batch-level instructions |
| `/api?route=/batches/:client/:batch/instructions` | PUT | Upsert batch-level instruction |

### Workflow Triggers
| Route | Method | Description |
|-------|--------|-------------|
| `/w0-sync` | POST | Sync Late.com accounts |
| `/w1-ingest` | POST | Ingest batch `{client, batch}` |
| `/w2-captions` | POST | Generate captions `{client, batch}` |
| `/w3-schedule` | POST | Schedule to Late.com `{client, batch}` |

## Testing Commands

```bash
# API Health
curl "http://localhost:5678/webhook/api?route=/health"

# List clients
curl "http://localhost:5678/webhook/api?route=/clients"

# Get batch status
curl "http://localhost:5678/webhook/api?route=/batches/{client-slug}/{batch-name}/status"

# Trigger ingest
curl -X POST http://localhost:5678/webhook/w1-ingest \
  -H "Content-Type: application/json" \
  -d '{"client":"{client-slug}","batch":"{batch-name}"}'

# Get stats
curl "http://localhost:5678/webhook/api?route=/stats"
```

## Session Setup

Before running workflows each session:
1. Start Cloudflare tunnel: `cloudflared tunnel --url file://C:/Clients`
2. Copy the tunnel URL (e.g., `https://abc-xyz.trycloudflare.com`)
3. Open UI → Settings → Paste URL → Save Changes
4. Test button verifies connectivity directly from browser

## Key Implementation Notes

- All workflows use webhook-only triggers (no manual triggers)
- Response format: `{ success: boolean, message: string, data: ... }`
- W-API returns CORS headers (`Access-Control-Allow-Origin: *`)
- Workflows read config from JSON files - no hardcoded values
- Both photos and videos use `brief.txt` for caption generation (v9 unified brief)
- Videos require 4 frame images (`*_F1.jpg` through `*_F4.jpg`)
- Freeze-on-approval: W3 checks if files changed after approval
- Cloudflare test runs in browser (avoids n8n sandbox restrictions)

## Required Credentials in n8n

- Late API credential (for W0, W3)

## Phase 2.7: Language-Specific Prompts

The system uses native language prompts - all instructions are written in the client's language rather than being translated at runtime.

### Language-Specific Prompt Files
```
config/agents/
├── caption_generator.md      # Default (French)
├── caption_generator_fr.md   # French - all instructions in French
├── caption_generator_en.md   # English - all instructions in English
```

### How Language Routing Works

1. **W2 (Caption Generation)**:
   - Reads `language` from `client.yaml`
   - Loads `caption_generator_{lang}.md` (falls back to default if not found)
   - Uses fully native prompts in Prepare Request node

2. **W-Agent1-Config (Config Generation)**:
   - Reads `language` from `onboarding.language` field
   - Uses conditional prompts in Generate Brief and Generate Hashtags nodes
   - Fallback briefs are language-specific

### Supported Languages
| Code | Language | Prompt File |
|------|----------|-------------|
| `fr` | French | `caption_generator_fr.md` |
| `en` | English | `caption_generator_en.md` |
| `de` | German | (pending - uses French fallback) |

### Adding a New Language
1. Create `caption_generator_{lang}.md` with all instructions in that language
2. Add conditional prompt block in W-Agent1-Config Generate Brief node
3. Add fallback brief in Extract Brief node
4. Add hashtag prompt variant in Generate Hashtags node

## Phase 3: AI Agent System

### Instruction Cascade
The v15 workflows support a 3-level instruction cascade for AI agents:

```
System Level → Client Level → Batch Level
(lowest priority)            (highest priority)
```

Instructions are loaded additively:
1. **Language-specific prompt** from `_config/agents/{agent_type}_{lang}.md`
2. **System override** from `agent_instructions` table (scope='system')
3. **Client override** from `agent_instructions` table (scope='client')
4. **Batch override** from `agent_instructions` table (scope='batch')

### Agent Types
| Agent | Model | Purpose |
|-------|-------|---------|
| `caption_generator` | llava:7b | Generate captions for photos/videos (W2) |
| `config_generator` | llama3.2:3b | Generate client config files (W-Agent1) |

### Database Table: `agent_instructions`
```sql
CREATE TABLE agent_instructions (
  id INTEGER PRIMARY KEY,
  agent_type TEXT NOT NULL,      -- 'caption_generator', 'config_generator'
  scope TEXT NOT NULL,           -- 'system', 'client', 'batch'
  scope_id INTEGER,              -- NULL for system, client_id, or batch_id
  instruction_key TEXT NOT NULL, -- 'override', 'style', etc.
  instruction_value TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TEXT,
  updated_at TEXT
);
```

## Claude Code Subagents

Project-specific subagents are defined in `.claude/agents/` for specialized development tasks:

### Core Development (Tier 1)
| Agent | Purpose |
|-------|---------|
| `backend-architect` | n8n workflows, SQLite, API design |
| `frontend-developer` | React, TanStack Query, shadcn/ui |
| `ai-engineer` | Ollama integration, prompt pipelines |
| `api-integrator` | Late.com API, REST routing |

### Quality & Documentation (Tier 2)
| Agent | Purpose |
|-------|---------|
| `code-reviewer` | Code quality, security, pattern enforcement |
| `test-engineer` | Vitest, MSW, test coverage |
| `api-documenter` | API docs, CHANGELOG, technical writing |

### Specialized Experts (Tier 3)
| Agent | Purpose |
|-------|---------|
| `caption-prompt-tuner` | VLM prompt optimization, multi-language |
| `client-config-generator` | YAML config generation, onboarding |

### Orchestration (Tier 4)
| Agent | Purpose |
|-------|---------|
| `ai-agent-expert` | Multi-agent coordination, instruction cascade |

### Inter-Agent Communication

Agents use standardized handoff tags:
```
[BACKEND-COMPLETE] description - next action
[FRONTEND-COMPLETE] description - run tests
[AI-READY] description - test with tuner
[REVIEW-COMPLETE] severity issues - see @ISSUE
```

See `.claude/CONVENTIONS.md` for full communication protocols and coding standards.

## Documentation

| Document | Path | Description |
|----------|------|-------------|
| Index | `INDEX.md` | File organization |
| API Reference | `docs/API_REFERENCE.md` | REST API endpoints |
| Webhook Reference | `docs/WEBHOOK_API_REFERENCE.md` | Workflow triggers (v2.0) |
| Scheduling | `docs/SCHEDULING.md` | Schedule.yaml v9 configuration |
| Instruction Cascade | `docs/W2_INSTRUCTION_CASCADE.md` | AI instruction cascade (Phase 3) |
| UI Design Guide | `docs/UI_DESIGN_GUIDE.md` | UI design system, colors, dark mode |
| Changelog | `workflows/CHANGELOG.md` | Version history (v15.3 current) |
| Subagent Conventions | `.claude/CONVENTIONS.md` | Development conventions |
