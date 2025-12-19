# SocialFlow API Reference

Base URL: `http://localhost:5678/webhook`

## Authentication
No authentication required for local access. CORS enabled (`Access-Control-Allow-Origin: *`).

## Request Format
All API routes go through a single webhook with a `route` query parameter:
```
GET  /api?route=/health
POST /api?route=/clients
PUT  /api?route=/settings
```

---

## Health & Stats

### Health Check
```
GET /api?route=/health
```

**Response:**
```json
{
  "success": true,
  "message": "API is healthy",
  "data": {
    "status": "healthy",
    "version": "v15",
    "database": "connected",
    "storage": "SQLite"
  }
}
```

### Dashboard Stats
```
GET /api?route=/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clients": 2,
    "batches": 3,
    "content_items": {
      "total": 15,
      "pending": 0,
      "needs_ai": 2,
      "needs_review": 5,
      "approved": 3,
      "scheduled": 5,
      "failed": 0
    },
    "accounts": 3
  }
}
```

---

## Clients

### List Clients
```
GET /api?route=/clients
```

**Response:**
```json
{
  "success": true,
  "message": "Found 2 clients",
  "data": [
    {
      "id": 1,
      "slug": "berlin-doner",
      "name": "Berlin Döner",
      "type": "restaurant",
      "language": "fr",
      "timezone": "Europe/Berlin",
      "is_active": true,
      "accounts": {
        "instagram": {
          "late_account_id": "692d87acf43160a0bc999aeb",
          "username": "simo_benziane"
        },
        "tiktok": {
          "late_account_id": "692f0bbaf43160a0bc999cd6",
          "username": "n8ntester"
        }
      },
      "batch_count": 1,
      "account_count": 2,
      "item_count": 5
    }
  ]
}
```

### Get Single Client
```
GET /api?route=/clients/:slug
```

**Example:** `GET /api?route=/clients/berlin-doner`

### Create Client
```
POST /api?route=/clients
```

**Request Body:**
```json
{
  "name": "New Restaurant",
  "slug": "new-restaurant",
  "type": "restaurant",
  "language": "en",
  "timezone": "Europe/Berlin",
  "instagram_account_id": "abc123",
  "tiktok_account_id": "xyz789"
}
```

### Update Client
```
PUT /api?route=/clients/:slug
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "language": "de"
}
```

### Delete Client
```
DELETE /api?route=/clients/:slug
```

---

## Batches

### List Batches (Hybrid)
```
GET /api?route=/clients/:slug/batches
```

Returns batches from both filesystem and database (merged).

**Response:**
```json
{
  "success": true,
  "message": "Found 2 batches",
  "data": {
    "batches": [
      {
        "name": "december",
        "slug": "december",
        "has_ready": true,
        "has_config": true,
        "photo_count": 3,
        "video_count": 2,
        "source": "database",
        "id": 1,
        "ingested": true,
        "item_count": 5,
        "needs_ai": 0,
        "needs_review": 3,
        "approved": 2,
        "scheduled": 0
      }
    ],
    "client": "berlin-doner"
  }
}
```

### Batch Status Counts
```
GET /api?route=/batches/:client/:batch/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "counts": {
      "total": 5,
      "pending": 0,
      "needs_ai": 0,
      "needs_review": 3,
      "approved": 2,
      "scheduled": 0,
      "failed": 0
    },
    "client": "berlin-doner",
    "batch": "december"
  }
}
```

---

## Content Items

### List Items
```
GET /api?route=/items/:client/:batch
```

**Query Parameters:**
- `status` - Filter by status (PENDING, NEEDS_AI, NEEDS_REVIEW, APPROVED, SCHEDULED)
- `limit` - Max items (default: 100)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "content_id": "berlin-doner_december_photo_2025-12-07_feed",
        "media_type": "photo",
        "file_name": "food1.jpg",
        "status": "NEEDS_REVIEW",
        "caption_ig": "Delicious döner...",
        "scheduled_date": "2025-12-07",
        "scheduled_time": "10:00:00",
        "media_url": "https://xxx.trycloudflare.com/berlin-doner/december/photos/food1.jpg"
      }
    ],
    "pagination": {
      "total": 5,
      "limit": 100,
      "offset": 0,
      "has_more": false
    }
  }
}
```

### Get Single Item
```
GET /api?route=/item/:id
```

### Approve Item
```
POST /api?route=/item/:id/approve
```

**Response:**
```json
{
  "success": true,
  "message": "Item approved",
  "data": { /* updated item */ }
}
```

### Reject Item
```
POST /api?route=/item/:id/reject
```

**Request Body:**
```json
{
  "reason": "Caption needs revision"
}
```

### Update Caption
```
POST /api?route=/item/:id/caption
```

**Request Body:**
```json
{
  "caption_ig": "New Instagram caption",
  "caption_tt": "New TikTok caption"
}
```

### Bulk Approve
```
POST /api?route=/approve-batch
```

**Request Body:**
```json
{
  "ids": [1, 2, 3]
}
```

### Bulk Update Schedule
```
POST /api?route=/batches/:client/:batch/schedule
```

Updates scheduled dates and times for multiple content items. Only affects items with `status='APPROVED'`.

**Request Body:**
```json
{
  "items": [
    {
      "id": 1,
      "scheduled_date": "2025-12-15",
      "scheduled_time": "20:00:00",
      "slot": "feed"
    },
    {
      "id": 2,
      "scheduled_date": "2025-12-16",
      "scheduled_time": "18:30:00",
      "slot": "story"
    }
  ],
  "timezone": "Europe/Berlin"
}
```

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| items | array | Yes | Array of schedule updates |
| items[].id | number | Yes | Content item ID |
| items[].scheduled_date | string | Yes | Date in YYYY-MM-DD format |
| items[].scheduled_time | string | Yes | Time in HH:MM:SS format |
| items[].slot | string | Yes | Posting slot: 'feed' or 'story' |
| timezone | string | No | Timezone for scheduling (default: client's timezone) |

**Response:**
```json
{
  "success": true,
  "message": "Updated 2 items",
  "data": {
    "updated": 2
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "No approved items found to update",
  "code": 400
}
```

**curl Example:**
```bash
curl -X POST "http://localhost:5678/webhook/api?route=/batches/berlin-doner/december/schedule" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "id": 1,
        "scheduled_date": "2025-12-15",
        "scheduled_time": "20:00:00",
        "slot": "feed"
      }
    ],
    "timezone": "Europe/Berlin"
  }'
```

**PowerShell Example:**
```powershell
$body = @{
  items = @(
    @{
      id = 1
      scheduled_date = "2025-12-15"
      scheduled_time = "20:00:00"
      slot = "feed"
    }
  )
  timezone = "Europe/Berlin"
} | ConvertTo-Json

Invoke-RestMethod -Method POST `
  -Uri "http://localhost:5678/webhook/api?route=/batches/berlin-doner/december/schedule" `
  -Body $body `
  -ContentType "application/json"
```

**Notes:**
- Only updates items with `status='APPROVED'` - other statuses are ignored
- Returns count of actually updated items (may be less than requested if some items are not approved)
- Timezone parameter is optional and defaults to the client's configured timezone
- Validation ensures dates are in correct format (YYYY-MM-DD)
- Validation ensures times are in correct format (HH:MM:SS)
- Slot must be either 'feed' or 'story'

---

## Late.com Accounts

### List Accounts (Cached)
```
GET /api?route=/late/accounts
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "id": "692d87acf43160a0bc999aeb",
        "platform": "instagram",
        "username": "simo_benziane",
        "display_name": "Simo benziane",
        "profile_picture": "https://...",
        "is_active": true,
        "token_expires_at": "2026-01-30T12:18:51.989Z",
        "health": "healthy",
        "days_until_expiry": 56
      }
    ],
    "profiles": [
      {
        "id": "692d86cb9723b10deb5b44fa",
        "name": "Simo",
        "color": "#ffeda0",
        "is_default": false
      }
    ],
    "synced_at": "2025-12-04T16:34:35.593Z"
  }
}
```

**Health Status:**
- `healthy` - Token valid for 7+ days
- `warning` - Token expires within 7 days
- `expired` - Token has expired

---

## Settings

### Get Settings
```
GET /api?route=/settings
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cloudflare_tunnel_url": "https://xxx.trycloudflare.com",
    "paths": {
      "docker_base": "/data/clients/"
    },
    "ollama": {
      "model": "llava:7b",
      "timeout_ms": 120000,
      "models": {
        "caption_generator": "llava:7b",
        "config_generator": "llama3.2:3b"
      }
    }
  }
}
```

### Update Settings
```
PUT /api?route=/settings
```

**Request Body:**
```json
{
  "cloudflare_tunnel_url": "https://new-url.trycloudflare.com",
  "ollama": {
    "model": "qwen3-vl:4b",
    "timeout_ms": 180000,
    "models": {
      "caption_generator": "qwen3-vl:4b"
    }
  }
}
```

---

## AI Agent Instructions (Phase 3)

The v15 API includes endpoints for managing AI agent instructions at system, client, and batch levels.

### Get Agent Settings
```
GET /api?route=/agents/settings
```

**Response:**
```json
{
  "success": true,
  "data": {
    "agents": {
      "caption_generator": {
        "model": "llava:7b",
        "prompt_file": "caption_generator.md",
        "prompt_content": "You are a social media caption generator..."
      },
      "config_generator": {
        "model": "llama3.2:3b",
        "prompt_file": "config_generator.md",
        "prompt_content": "You are a client configuration generator..."
      }
    }
  }
}
```

### Update Agent Settings
```
PUT /api?route=/agents/settings
```

**Request Body:**
```json
{
  "agent_type": "caption_generator",
  "model": "qwen3-vl:4b",
  "prompt_content": "Updated system prompt..."
}
```

### Get System Instructions
```
GET /api?route=/agents/instructions
```

**Query Parameters:**
- `agent_type` - Filter by agent type (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "instructions": [
      {
        "id": 1,
        "agent_type": "caption_generator",
        "scope": "system",
        "instruction_key": "override",
        "instruction_value": "Always include emojis...",
        "is_active": 1
      }
    ]
  }
}
```

### Upsert System Instruction
```
PUT /api?route=/agents/instructions
```

**Request Body:**
```json
{
  "agent_type": "caption_generator",
  "instruction_key": "override",
  "instruction_value": "Always include emojis in captions.",
  "is_active": true
}
```

### Get Client Instructions
```
GET /api?route=/clients/:slug/instructions
```

**Example:** `GET /api?route=/clients/berlin-doner/instructions`

**Response:**
```json
{
  "success": true,
  "data": {
    "client": "berlin-doner",
    "instructions": [
      {
        "id": 2,
        "agent_type": "caption_generator",
        "scope": "client",
        "instruction_key": "override",
        "instruction_value": "Use German food terms...",
        "is_active": 1
      }
    ]
  }
}
```

### Upsert Client Instruction
```
PUT /api?route=/clients/:slug/instructions
```

**Request Body:**
```json
{
  "agent_type": "caption_generator",
  "instruction_key": "override",
  "instruction_value": "Use German food terms like 'lecker' and 'köstlich'.",
  "is_active": true
}
```

### Get Batch Instructions
```
GET /api?route=/batches/:client/:batch/instructions
```

**Example:** `GET /api?route=/batches/berlin-doner/december/instructions`

**Response:**
```json
{
  "success": true,
  "data": {
    "client": "berlin-doner",
    "batch": "december",
    "instructions": [
      {
        "id": 3,
        "agent_type": "caption_generator",
        "scope": "batch",
        "instruction_key": "override",
        "instruction_value": "Focus on holiday specials...",
        "is_active": 1
      }
    ]
  }
}
```

### Upsert Batch Instruction
```
PUT /api?route=/batches/:client/:batch/instructions
```

**Request Body:**
```json
{
  "agent_type": "caption_generator",
  "instruction_key": "override",
  "instruction_value": "Focus on holiday specials and winter menu items.",
  "is_active": true
}
```

### Instruction Cascade

Instructions are applied additively in this order:
1. **System prompt** (from `_config/agents/{agent_type}.md`)
2. **System override** (from database, `scope='system'`)
3. **Client override** (from database, `scope='client'`)
4. **Batch override** (from database, `scope='batch'`)

Each level's instructions append to the previous, allowing fine-grained customization.

---

## Jobs

### Get Job Status
```
GET /api?route=/jobs
```

**Response:**
```json
{
  "success": true,
  "data": {
    "current": {
      "client": "berlin-doner",
      "batch": "december"
    },
    "executions": {
      "W0": {
        "last_run": "2025-12-06T10:30:00.000Z",
        "status": "success",
        "duration_ms": 2500
      },
      "W1": {
        "last_run": "2025-12-06T11:00:00.000Z",
        "status": "success",
        "client": "berlin-doner",
        "batch": "december",
        "summary": { "total": 5, "ready_for_ai": 5 }
      },
      "W2": null,
      "W3": null
    }
  }
}
```

---

## Archive

### Archive Client
```
POST /api?route=/clients/:slug/archive
```

### List Archived Clients
```
GET /api?route=/archive/clients
```

### Restore Archived Client
```
POST /api?route=/archive/clients/:id/restore
```

### Delete Archived Client (Permanent)
```
DELETE /api?route=/archive/clients/:id
```

---

## Workflow Triggers (Direct Webhooks)

These are separate webhooks, not routed through `/api`:

### Sync Late.com Accounts (W0)
```
POST /w0-sync
Body: {}
```

### Ingest Batch (W1)
```
POST /w1-ingest
Body: { "client": "berlin-doner", "batch": "december" }
```

### Generate AI Captions (W2)
```
POST /w2-captions
Body: { "client": "berlin-doner", "batch": "december" }
```

### Schedule to Late.com (W3)
```
POST /w3-schedule
Body: { "client": "berlin-doner", "batch": "december" }
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message",
  "code": 400,
  "timestamp": "2025-12-06T10:30:00.000Z"
}
```

**Common Error Codes:**
- `400` - Bad request (missing required fields)
- `404` - Resource not found
- `409` - Conflict (e.g., duplicate slug)
- `500` - Server error

---

## Usage Examples

### curl (bash)
```bash
# List clients
curl "http://localhost:5678/webhook/api?route=/clients"

# Create client
curl -X POST "http://localhost:5678/webhook/api?route=/clients" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","slug":"test","language":"en","timezone":"Europe/Berlin"}'

# Trigger ingest
curl -X POST "http://localhost:5678/webhook/w1-ingest" \
  -H "Content-Type: application/json" \
  -d '{"client":"berlin-doner","batch":"december"}'
```

### PowerShell
```powershell
# List clients
Invoke-RestMethod -Uri "http://localhost:5678/webhook/api?route=/clients"

# Create client
$body = @{ name="Test"; slug="test" } | ConvertTo-Json
Invoke-RestMethod -Method POST -Uri "http://localhost:5678/webhook/api?route=/clients" -Body $body -ContentType "application/json"
```

### JavaScript (Frontend)
```javascript
// Using axios
const response = await axios.get('/api', { params: { route: '/clients' } });
const clients = response.data.data;

// Using fetch
const response = await fetch('/api?route=/clients');
const { data } = await response.json();
```

---

## Frontend API Client Security (v15.1)

The React frontend API client (`socialflow-ui/src/api/client.ts`) includes built-in security measures:

### Input Validation

All API functions validate their inputs before making requests:

**Slug Validation** (`validateSlug`):
- Rejects empty or non-string values
- Blocks path traversal attempts (`..`, `/`, `\`)
- Limits length to 100 characters
- Applied to: client slugs, batch names

**ID Validation** (`validateId`):
- Validates positive integers only
- Normalizes string IDs to numbers
- Prevents SQL injection via malformed IDs
- Applied to: content item IDs, archive IDs

### Error Sanitization

Backend error messages are sanitized before display:
- HTML tags stripped (`<script>`, `<img>`, etc.)
- Dangerous characters removed (`<`, `>`, `'`, `"`)
- Message length limited to 500 characters
- Prevents XSS attacks via error messages

### Timeout Constants

```typescript
export const API_TIMEOUTS = {
  DEFAULT: 60_000,        // 60 seconds - standard requests
  TUNNEL_TEST: 15_000,    // 15 seconds - Cloudflare connectivity
  WORKFLOW: 120_000,      // 2 minutes - W1/W2/W3 triggers
} as const;
```

### Example: Validated API Call

```typescript
// Input validation happens automatically
await getClient("berlin-doner");     // ✓ Valid slug
await getClient("../../../etc");     // ✗ Throws: contains forbidden characters
await getContentItem(123);           // ✓ Valid ID
await getContentItem("abc");         // ✗ Throws: must be positive integer
```

---

**Version:** 3.2 | **Updated:** 2025-12-12
