# Documentation Index

Quick navigation for SocialFlow documentation.

---

## Core Documentation

| Document | Description |
|----------|-------------|
| [API_REFERENCE.md](API_REFERENCE.md) | REST API endpoints, request/response formats |
| [WEBHOOK_API_REFERENCE.md](WEBHOOK_API_REFERENCE.md) | Workflow trigger webhooks (W0-W3), Agent API routes |
| [SCHEDULING.md](SCHEDULING.md) | Schedule.yaml v9 format, timing configuration |
| [W2_INSTRUCTION_CASCADE.md](W2_INSTRUCTION_CASCADE.md) | AI instruction cascade system (Phase 3) |
| [UI_DESIGN_GUIDE.md](UI_DESIGN_GUIDE.md) | UI design system: colors, components, dark mode |

---

## Root Level Docs

| Document | Location | Description |
|----------|----------|-------------|
| CLAUDE.md | `../CLAUDE.md` | AI assistant instructions |
| INDEX.md | `../INDEX.md` | Project file index |
| PROJECT_HISTORY.md | `../PROJECT_HISTORY.md` | Complete project history |

---

## Workflow Docs

| Document | Location | Description |
|----------|----------|-------------|
| CHANGELOG.md | `../workflows/CHANGELOG.md` | Workflow version history (v15 current) |

---

## Quick Links

### API Basics
- Base URL: `http://localhost:5678/webhook`
- All routes: `/api?route=/...`
- CORS: Enabled

### Key Endpoints
```
/health     - Health check
/clients    - Client CRUD
/batches    - Batch operations
/items      - Content items
/settings   - Configuration
/stats      - Dashboard stats
/agents     - AI agent instructions (Phase 3)
```

### Workflow Triggers
```
POST /w0-sync     - Sync Late accounts
POST /w1-ingest   - Ingest media
POST /w2-captions - Generate captions
POST /w3-schedule - Schedule posts
```

---

## Current Version: v15

### Recent Updates
- **v15** (2025-12-10): All workflows standardized to v15, Two-Agent Caption System, VLM descriptions
- **v14.4** (2025-12-08): Final code review - race conditions, cache invalidation, accessibility
- **v14.3** (2025-12-08): Code review fixes - DB connection safety, URL encoding, memory leaks
- **v14.2** (2025-12-07): Comprehensive bug fixes (null safety, memory leaks, test suite)
- **v14.1** (2025-12-07): Language-specific prompts (French/English native support)
- **v14** (2025-12-07): AI Agent System with instruction cascade

See [CHANGELOG.md](../workflows/CHANGELOG.md) for full version history.

---

**Last Updated**: 2025-12-12
