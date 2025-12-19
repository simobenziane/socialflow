# SocialFlow Webhook API Reference

**Version:** 2.0 (v15)
**Base URL:** `http://localhost:5678/webhook`
**Date:** 2025-12-07

This document describes all webhook endpoints available for UI integration.

---

## Configuration

```
Docker Base Path:   /data/clients/
Config Path:        /data/clients/_config/
Database:           /data/clients/_config/socialflow.db
Late API:           https://getlate.dev/api/v1
Default Model:      llava:7b (vision), llama3.2:3b (text)
```

---

## Table of Contents

1. [Workflow Webhooks](#workflow-webhooks)
   - [W0: Late Account Sync](#w0-late-account-sync)
   - [W1: Ingest & Validate](#w1-ingest--validate)
   - [W2: AI Captions](#w2-ai-captions)
   - [W3: Late Scheduling](#w3-late-scheduling)
2. [API Endpoints (W-API)](#api-endpoints-w-api)
   - [Health & Stats](#health--stats)
   - [Clients](#clients)
   - [Batches](#batches)
   - [Content Items](#content-items)
   - [Settings](#settings)
   - [Agent Instructions](#agent-instructions)
3. [Error Handling](#error-handling)

---

## Workflow Webhooks

Direct webhook triggers for individual workflows.

### W0: Late Account Sync

Syncs accounts from Late API to local cache.

**Endpoint:** `POST /webhook/w0-sync`

```bash
curl -X POST http://localhost:5678/webhook/w0-sync \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Response:**
```json
{
  "success": true,
  "workflow": "W0: Late Account Sync v15",
  "summary": {
    "profiles_synced": 2,
    "accounts_synced": 5
  },
  "health": {
    "total_accounts": 5,
    "healthy": 4,
    "warning": 1,
    "expired": 0
  }
}
```

---

### W1: Ingest & Validate

Ingests media from batch folder and validates files.

**Endpoint:** `POST /webhook/w1-ingest`

**Request Body:**
```json
{
  "client": "berlin-doner",
  "batch": "december"
}
```

**Response:**
```json
{
  "success": true,
  "workflow": "W1: Ingest & Validate v15",
  "client": "berlin-doner",
  "batch": "december",
  "summary": {
    "photos_processed": 31,
    "videos_processed": 31,
    "total_items": 62
  }
}
```

---

### W2: AI Captions

Generates AI captions for items with status `NEEDS_AI`. Supports instruction cascade (system/client/batch level overrides).

**Endpoint:** `POST /webhook/w2-captions`

**Request Body:**
```json
{
  "client": "berlin-doner",
  "batch": "december"
}
```

**Response:**
```json
{
  "success": true,
  "workflow": "W2: AI Captions v15",
  "client": "berlin-doner",
  "batch": "december",
  "summary": {
    "items_processed": 15,
    "captions_generated": 14,
    "errors": 1
  },
  "ollama_model": "llava:7b"
}
```

---

### W3: Late Scheduling

Schedules approved items to Late.com.

**Endpoint:** `POST /webhook/w3-schedule`

**Request Body:**
```json
{
  "client": "berlin-doner",
  "batch": "december"
}
```

**Response:**
```json
{
  "success": true,
  "workflow": "W3: Late Scheduling v15",
  "client": "berlin-doner",
  "batch": "december",
  "summary": {
    "items_processed": 10,
    "scheduled": 9,
    "skipped": 1
  }
}
```

---

## API Endpoints (W-API)

REST-like endpoints via the W-API workflow.

**Base:** `GET/POST/PUT/DELETE /webhook/api?route={route}`

### Health & Stats

| Route | Method | Description |
|-------|--------|-------------|
| `/health` | GET | Health check |
| `/stats` | GET | Dashboard statistics |
| `/jobs` | GET | Job execution status |

```bash
curl "http://localhost:5678/webhook/api?route=/health"
```

---

### Clients

| Route | Method | Description |
|-------|--------|-------------|
| `/clients` | GET | List all clients |
| `/clients` | POST | Create client |
| `/clients/:slug` | GET | Get single client |
| `/clients/:slug` | DELETE | Delete client |
| `/clients/:slug/archive` | POST | Archive client |

```bash
# List clients
curl "http://localhost:5678/webhook/api?route=/clients"

# Create client
curl -X POST "http://localhost:5678/webhook/api?route=/clients" \
  -H "Content-Type: application/json" \
  -d '{"slug": "test-client", "name": "Test Client"}'
```

---

### Batches

| Route | Method | Description |
|-------|--------|-------------|
| `/clients/:slug/batches` | GET | List batches for client |
| `/batches/:client/:batch/status` | GET | Get batch status counts |

```bash
curl "http://localhost:5678/webhook/api?route=/clients/berlin-doner/batches"
curl "http://localhost:5678/webhook/api?route=/batches/berlin-doner/december/status"
```

---

### Content Items

| Route | Method | Description |
|-------|--------|-------------|
| `/items/:client/:batch` | GET | List content items |
| `/item/:id` | GET | Get single item |
| `/item/:id/approve` | POST | Approve item |
| `/item/:id/reject` | POST | Reject item |
| `/item/:id/caption` | PUT | Update caption |
| `/items/approve-batch` | POST | Bulk approve items |

```bash
# List items
curl "http://localhost:5678/webhook/api?route=/items/berlin-doner/december"

# Approve item
curl -X POST "http://localhost:5678/webhook/api?route=/item/123/approve"

# Bulk approve
curl -X POST "http://localhost:5678/webhook/api?route=/items/approve-batch" \
  -H "Content-Type: application/json" \
  -d '{"ids": [1, 2, 3]}'
```

---

### Settings

| Route | Method | Description |
|-------|--------|-------------|
| `/settings` | GET | Get settings |
| `/settings` | PUT | Update settings |

```bash
curl "http://localhost:5678/webhook/api?route=/settings"
```

---

### Agent Instructions (v15)

| Route | Method | Description |
|-------|--------|-------------|
| `/agents/settings` | GET | Get agent models and master prompts |
| `/agents/settings` | PUT | Update agent model or master prompt |
| `/agents/instructions` | GET | Get system-level instructions |
| `/agents/instructions` | PUT | Upsert system-level instruction |
| `/clients/:slug/instructions` | GET | Get client-level instructions |
| `/clients/:slug/instructions` | PUT | Upsert client-level instruction |
| `/batches/:client/:batch/instructions` | GET | Get batch-level instructions |
| `/batches/:client/:batch/instructions` | PUT | Upsert batch-level instruction |

```bash
# Get agent settings
curl "http://localhost:5678/webhook/api?route=/agents/settings"

# Update system instruction
curl -X PUT "http://localhost:5678/webhook/api?route=/agents/instructions" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_type": "caption_generator",
    "instruction_key": "override",
    "instruction_value": "Always include emojis"
  }'

# Get client instructions
curl "http://localhost:5678/webhook/api?route=/clients/berlin-doner/instructions"
```

---

### Archive

| Route | Method | Description |
|-------|--------|-------------|
| `/archive/clients` | GET | List archived clients |
| `/archive/clients/:id/restore` | POST | Restore archived client |
| `/archive/clients/:id` | DELETE | Permanently delete |

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `CLIENT_NOT_FOUND` | Client slug doesn't exist |
| `BATCH_NOT_FOUND` | Batch folder doesn't exist |
| `ITEM_NOT_FOUND` | Content item doesn't exist |
| `CONFIG_ERROR` | Missing or invalid config file |
| `API_ERROR` | External API error |
| `VALIDATION_ERROR` | Invalid request parameters |
| `FILE_CHANGED` | File modified after approval |

### HTTP Status Codes

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 400 | Bad Request |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Webhook URLs Summary

| Workflow | Method | URL | Body |
|----------|--------|-----|------|
| W0 Sync | POST | `/webhook/w0-sync` | `{}` |
| W1 Ingest | POST | `/webhook/w1-ingest` | `{client, batch}` |
| W2 Captions | POST | `/webhook/w2-captions` | `{client, batch}` |
| W3 Schedule | POST | `/webhook/w3-schedule` | `{client, batch}` |
| API Router | GET/POST/PUT/DELETE | `/webhook/api?route=...` | varies |

---

**Version:** 2.0 | **Updated:** 2025-12-10
