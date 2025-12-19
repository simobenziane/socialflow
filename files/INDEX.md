# SocialFlow MVP - File Index

## Project Structure

```
phase 0/all/
├── files/                    # Backend: workflows, scripts, docs
│   ├── CLAUDE.md            # AI assistant instructions
│   ├── INDEX.md             # This file
│   ├── PROJECT_HISTORY.md   # Complete project history
│   ├── workflows/           # n8n workflow JSON files
│   ├── docs/                # Documentation
│   ├── scripts/             # Database scripts
│   └── templates/           # Client/batch templates
│
└── socialflow-ui/           # Frontend: React SPA
    ├── src/
    │   ├── api/             # API client + types
    │   ├── components/      # shadcn/ui components
    │   ├── hooks/           # TanStack Query hooks
    │   └── pages/           # Page components
    └── package.json
```

---

## Workflows (`workflows/`)

n8n workflow JSON files for import. **Current: v15.4 (W-API), v15.3 (W1), v15.2 (others):**

| File | Description | Webhook |
|------|-------------|---------|
| `W0_Late_Sync_v15.2.json` | Syncs Late.com accounts to local cache | `POST /w0-sync` |
| `W1_Ingest_Validate_v15.3.json` | Ingests media, validates, VLM descriptions, **progress tracking** | `POST /w1-ingest` |
| `W2_AI_Captions_v15.2.json` | Two-agent caption generation (Generator + Supervisor) | `POST /w2-captions` |
| `W3_Late_Scheduling_v15.2.json` | Schedules approved content to Late.com | `POST /w3-schedule` |
| `W_API_Endpoints_v15.4.json` | REST API router + scheduling calendar endpoint | `GET/POST/PUT /api` |
| `W_Agent1_Config_v15.2.json` | Generate client configuration files | `POST /w-agent1-config` |
| `W_Agent1_Batch_v15.2.json` | Generate batch brief files | `POST /w-agent1-batch` |

### Import Order
1. W_API_Endpoints_v15.4.json (API layer - must be first)
2. W0_Late_Sync_v15.2.json
3. W1_Ingest_Validate_v15.3.json
4. W2_AI_Captions_v15.2.json
5. W3_Late_Scheduling_v15.2.json
6. W_Agent1_Config_v15.2.json (optional - for AI-assisted client setup)
7. W_Agent1_Batch_v15.2.json (optional - for AI-assisted batch briefs)

### Changelog
- **v15.4** (2025-12-12): Content Scheduling Calendar - bulk schedule API endpoint, week/month view components
- **v15.3** (2025-12-12): Batch isolation fix - added batchName to content_id generation
- **v15.2** (2025-12-11): W1 ingest progress tracking, DB schema audit (agent_instructions table), all workflows consolidated
- **v15.1** (2025-12-10): Deep code review fixes - security (path traversal, XSS, SQL injection), memory leaks, cache invalidation
- **v15** (2025-12-10): Two-Agent Caption System - VLM image descriptions in W1, Generator+Supervisor loop in W2, conversation logging
- **v14.4** (2025-12-08): Final code review fixes - DB safety, race conditions, cache invalidation, accessibility
- **v14.3** (2025-12-08): Code review fixes - DB connection safety, URL encoding, memory leak prevention
- **v14.2** (2025-12-07): Comprehensive bug fix release - null safety, memory leak prevention, test fixes
- **v14.1** (2025-12-07): Phase 2.7 language-specific prompts (French/English native support)
- **v14** (2025-12-07): Phase 3 AI Agent System with instruction cascade support
- **v13** (2025-12-06): Unified version, tidied JavaScript code, improved documentation

---

## Documentation (`docs/`)

| File | Description |
|------|-------------|
| `API_REFERENCE.md` | REST API endpoints reference |
| `WEBHOOK_API_REFERENCE.md` | Webhook endpoints for workflow triggers (v2.0) |
| `SCHEDULING.md` | Content scheduling logic (schedule.yaml v9) |
| `W2_INSTRUCTION_CASCADE.md` | AI instruction cascade system (Phase 3) |
| `UI_DESIGN_GUIDE.md` | UI design system: colors, components, dark mode |
| `INDEX.md` | Documentation index with quick links |

---

## Scripts (`scripts/`)

Database initialization scripts.

| File | Description |
|------|-------------|
| `schema.sql` | SQLite database schema |
| `init_database.js` | Initialize empty database |

### Usage
```bash
# Initialize new database
node scripts/init_database.js

# Run inside Docker container or with correct paths
```

---

## Templates (`templates/`)

Configuration templates for clients and batches.

| File | Description |
|------|-------------|
| `client.yaml` | Client configuration template |
| `batch.yaml` | Batch configuration template |
| `brief.txt` | AI brief template for photos AND videos |

### Client Setup
1. Create folder `/data/clients/{client-slug}/`
2. Copy `client.yaml` and customize
3. Copy `brief.txt`
4. Add client via UI or API

### Batch Setup
1. Create folder `/data/clients/{client-slug}/{batch-name}/`
2. Copy `batch.yaml` and customize
3. Add `photos/` and/or `videos/` folders with media
4. Add schedule CSV files
5. Create `READY.txt` when ready to process

---

## Frontend (`../socialflow-ui/`)

React SPA with shadcn/ui components.

### Tech Stack
- React 19 + TypeScript 5.9 + Vite 7
- TanStack Query 5 (server state)
- shadcn/ui (Radix + Tailwind)
- React Router 7 (client routing)
- Axios (HTTP client)

### Frontend Documentation
| File | Description |
|------|-------------|
| `CODE_REVIEW.md` | Comprehensive code review (2025-12-06) |

### Source Structure
```
src/
├── api/              # API client + types
│   ├── client.ts     # Axios instance, API functions
│   └── types.ts      # TypeScript interfaces
├── components/       # UI components
│   ├── ui/           # shadcn/ui primitives
│   ├── shared/       # Reusable components
│   └── layout/       # App layout, sidebar
├── hooks/            # TanStack Query hooks
│   ├── useClients.ts
│   ├── useBatches.ts
│   ├── useAccounts.ts
│   ├── useSettings.ts
│   ├── useStats.ts
│   ├── useContentItems.ts
│   ├── useItemActions.ts
│   └── useJobs.ts
├── pages/            # Page components
│   ├── Dashboard.tsx
│   ├── Clients.tsx
│   ├── ClientDetail.tsx
│   ├── CreateClient.tsx
│   ├── BatchDetail.tsx
│   ├── ApprovalBoard.tsx
│   ├── Accounts.tsx
│   └── Settings.tsx
├── lib/              # Utilities
└── UI-Tests/         # Test files + mocks
```

### Pages
| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Stats, quick actions |
| `/clients` | Clients | List + create clients |
| `/clients/:slug` | Client Detail | Client info, batch list |
| `/batches/:client/:batch` | Batch Detail | Workflow actions, content list |
| `/batches/:client/:batch/approve` | Approval Board | Review/approve content |
| `/accounts` | Accounts | Late.com accounts |
| `/settings` | Settings | Cloudflare URL, AI model |

### Commands
```bash
cd ../socialflow-ui
npm install
npm run dev      # Development (port 5173)
npm run build    # Production build
npm run test:run # Run tests
```

---

## Configuration Files

Runtime config in `/data/clients/_config/`:

| File | Description |
|------|-------------|
| `settings.json` | Global settings (Cloudflare URL, Ollama, per-agent models) |
| `socialflow.db` | SQLite database (includes `agent_instructions` table) |
| `late_accounts.json` | Cached Late.com accounts |
| `active_job.json` | Current job state |
| `agents/caption_generator.md` | Default caption prompt (French) |
| `agents/caption_generator_fr.md` | French caption prompt (Phase 2.7) |
| `agents/caption_generator_en.md` | English caption prompt (Phase 2.7) |
| `agents/config_generator.md` | System prompt for config generation |

### settings.json
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

---

## Quick Start

1. **Import Workflows** into n8n (see order above)
2. **Activate Workflows** - All must be active
3. **Start UI**: `cd socialflow-ui && npm run dev`
4. **Start Tunnel**: `cloudflared tunnel --url file://C:/Clients`
5. **Configure Settings**: UI → Settings → Paste tunnel URL → Save
6. **Test Connection**: Click Test button to verify tunnel

---

## Content Pipeline

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

### Status Flow
`PENDING` → `NEEDS_AI` → `NEEDS_REVIEW` → `APPROVED` → `SCHEDULED`

Failed: `BLOCKED` or `FAILED`

---

## Architecture

### Headless Design
- **Frontend** tests Cloudflare directly (no backend proxy)
- **Backend** is stateless REST API
- **Components** can be swapped independently

### Key Decisions
1. Single API endpoint with route param
2. SQLite for persistence (replaces Google Sheets)
3. Hybrid batch discovery (filesystem + database)
4. YAML configs for clients and batches

---

## Phase 2.7: Language-Specific Prompts

All AI prompts are written in the client's native language - no runtime translation.

### Language-Specific Files
```
config/agents/
├── caption_generator.md      # Default fallback (French)
├── caption_generator_fr.md   # French - all instructions in French
├── caption_generator_en.md   # English - all instructions in English
```

### How It Works
1. **W2**: Reads `language` from `client.yaml`, loads matching prompt file
2. **W-Agent1-Config**: Uses conditional prompts based on `onboarding.language`

### Supported Languages
| Code | Language | Status |
|------|----------|--------|
| `fr` | French | Full support |
| `en` | English | Full support |
| `de` | German | Pending (uses French fallback) |

---

## Phase 3: AI Agent System (v15)

### Instruction Cascade
AI agents support a 3-level instruction override system:

```
System Level → Client Level → Batch Level
(base prompt)   (customize)    (override)
```

All levels are additive - each level's instructions append to the previous.

### Agent Types
| Agent | Model | Workflow | Purpose |
|-------|-------|----------|---------|
| `caption_generator` | llava:7b | W2 | Generate photo/video captions |
| `config_generator` | llama3.2:3b | W-Agent1 | Generate client config files |

### New API Routes (v15)
| Route | Method | Description |
|-------|--------|-------------|
| `/agents/settings` | GET/PUT | Agent models and master prompts |
| `/agents/instructions` | GET/PUT | System-level instructions |
| `/clients/:slug/instructions` | GET/PUT | Client-level instructions |
| `/batches/:client/:batch/instructions` | GET/PUT | Batch-level instructions |

---

## Version 15.2 W1 Progress Tracking (2025-12-11)

### New Features
- **W1 Ingest Progress Tracking**: Real-time progress updates during W1 workflow
- **New API Endpoint**: `GET /batches/:client/:batch/ingest-progress`
- **Database Schema**: Added `ingest_progress`, `ingest_started_at` columns to `batches` table
- **agent_instructions table**: Created for Phase 3 AI instruction cascade

### W1 Progress Stages
| Stage | Description |
|-------|-------------|
| `discovering` | Scanning filesystem for media files |
| `validating` | Checking file existence/format |
| `describing` | Running VLM for image descriptions |
| `saving` | Writing to database |

### Frontend Updates
| File | Change |
|------|--------|
| `src/api/types.ts` | Added `IngestProgress`, `IngestProgressResponse` types |
| `src/api/queryKeys.ts` | Added `ingestProgress.byBatch()` query key |
| `src/api/client.ts` | Added `getIngestProgress()` function |
| `src/hooks/useBatches.ts` | Added `useIngestProgress()` hook |
| `src/pages/BatchDetail.tsx` | Real-time progress bar, **Batch Brief tab** |

### Batch Brief Feature (New UI)
BatchDetail page now has a **"Batch Brief"** tab that allows:
- Describing what the batch is about (promo event, course pitch, etc.)
- Batch-level AI instructions that override client-level settings
- Saves to `agent_instructions` table with `scope='batch'`
- Used by W2 when generating captions for items in that batch

---

## Version 15.1 Code Review Fixes (2025-12-10)

### Security Fixes (P0 Critical)
| File | Issue | Fix |
|------|-------|-----|
| client.ts | Path traversal vulnerability | Added `validateSlug()` - blocks `..`, `/`, `\` |
| client.ts | SQL injection via IDs | Added `validateId()` - validates positive integers |
| client.ts | XSS via error messages | Added `sanitizeErrorMessage()` - strips HTML |
| client.ts | Timeout race condition | Replaced completion flag with try-finally pattern |
| Settings.tsx | `refetch` undefined (crash) | Added to useSettings destructuring |

### Cache & Query Fixes (P1 High)
| File | Issue | Fix |
|------|-------|-----|
| queryKeys.ts | JSON.stringify collision risk | Explicit array structure for cache keys |
| useClients.ts | Missing stats invalidation | Added stats.all, client detail, batches invalidation |

### Memory Leak Prevention (P1 High)
| Component | Issue | Fix |
|-----------|-------|-----|
| ClientCard.tsx | Missing mount check | Added `isMountedRef` pattern |
| Clients.tsx | handleDeleteAll no guard | Added `isMountedRef` checks |
| BatchDetail.tsx | handleReset no guard | Added `isMountedRef` checks |

### Accessibility (P2 Medium)
| Component | Issue | Fix |
|-----------|-------|-----|
| ClientCard.tsx | Delete button unlabeled | Added `aria-label` |

### Image Handling (P1 High)
| Component | Issue | Fix |
|-----------|-------|-----|
| BatchDetail.tsx | Error hides image | Shows SVG placeholder instead |

---

## Version 14.4 Code Review Fixes (2025-12-08)

### Workflow Fixes
| Workflow | Issue | Fix |
|----------|-------|-----|
| W0 | DB connection leak on error | Added `try/finally` with `db.close()` |

### React API Layer Fixes (Critical)
| File | Issue | Fix |
|------|-------|-----|
| queryKeys.ts | Inconsistent cache keys | Normalized options object |
| client.ts | Cloudflare timeout race | Added completion flag pattern |
| client.ts | Silent batch scopeId fallback | Throws error for invalid format |
| useItemActions.ts | Predicate without type guard | Added `Array.isArray()` check |
| useItemActions.ts | Silent error on failure | Added error logging |

### React Hooks Fixes
| File | Issue | Fix |
|------|-------|-----|
| useBatches.ts | Tab visibility refresh issues | staleTime = pollInterval/2, refetchOnWindowFocus |
| useBatches.ts | Imprecise content invalidation | Predicate-based invalidation |
| useAccounts.ts | Duplicate invalidation | Use onSettled only |
| useContentItems.ts | Disabled key string pollution | Use null instead |

### React Component Fixes (Memory Leaks)
| Component | Issue | Fix |
|-----------|-------|-----|
| Accounts.tsx | Memory leak in handleSync | Added `isMountedRef` pattern |
| Dashboard.tsx | Memory leak in handleSync | Added `isMountedRef` pattern |
| Clients.tsx | Memory leak in archive handlers | Added `isMountedRef` pattern |

### Accessibility Fixes
| Component | Issue | Fix |
|-----------|-------|-----|
| ApprovalBoard.tsx | Missing checkbox label | Added `aria-label` |
| Clients.tsx | Icon-only button unlabeled | Added `aria-label`, `aria-hidden` |

---

## Version 14.3 Code Review Fixes (2025-12-08)

### Workflow Fixes
| Workflow | Issue | Fix |
|----------|-------|-----|
| W2 | Parse Response null access | Added null safety check with error return |
| W2 | Load Config DB connection leak | Added `try/finally` with `db.close()` |

### React API Layer Fixes
| File | Issue | Fix |
|------|-------|-----|
| client.ts | Batch route broken for batch scope | Fixed scopeId split for `client/batch` format |
| client.ts | URL injection possible | Added `encodeURIComponent()` to all routes |
| useItemActions.ts | Generic batch invalidation | Uses predicate function for precise matching |
| useAccounts.ts | setTimeout race condition | Removed setTimeout, uses proper invalidation |
| useBatches.ts | Unnecessary refetches | Added staleTime equal to poll interval |

### React Component Fixes
| Component | Issue | Fix |
|-----------|-------|-----|
| BatchDetail.tsx | Memory leak in async handlers | Added `isMountedRef` pattern |
| ClientDetail.tsx | useEffect dependency loop | Fixed with `lastInitKey` ref pattern |

---

## Version 14.2 Bug Fixes (2025-12-07)

### Workflow Fixes
| Workflow | Issue | Fix |
|----------|-------|-----|
| W2 | Update Database empty array | Added bounds check for items |
| W3 | NULL `approved_file_hash` | Added fallback to `file_hash` |
| W1 | Empty batch logging | Added `scheduleDates` length check |
| W-API | Archive DB not checked | Added `fs.existsSync()` validation |

### React Component Fixes
| Component | Issue | Fix |
|-----------|-------|-----|
| Settings.tsx | Memory leak in async handlers | Added `isMountedRef` pattern |
| CreateClient.tsx | Memory leak in async handlers | Added `isMountedRef` pattern |
| ClientDetail.tsx | Memory leak in async handlers | Added `isMountedRef` pattern |
| ApprovalBoard.tsx | Null item IDs | Added validation in all handlers |

### API Layer Fixes
| File | Issue | Fix |
|------|-------|-----|
| useBatches.ts | Cache not invalidated | Added batch status invalidation |
| client.ts | Cloudflare test hangs | Added 15s timeout |
| queryKeys.ts | Mutable cache key | Added JSON.stringify |

---

**Last Updated:** 2025-12-19
