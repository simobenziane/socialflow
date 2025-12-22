# SocialFlow v17 Workflows

## Overview

SocialFlow uses n8n workflows to automate social media content management. All workflows are numbered for easy import ordering.

## Import Order

Import workflows in this order (numbered prefixes ensure correct sequence):

| # | File | Purpose |
|---|------|---------|
| 00 | `00_API_Endpoints_v17.json` | Core API routes (must be first) |
| 01 | `01_Late_Sync_v17.json` | Sync accounts from Late.com |
| 02 | `02_Late_Validate_v17.json` | Validate Late.com API credentials |
| 03 | `03_Ingest_Validate_v17.json` | Ingest and validate content uploads |
| 04 | `04_AI_Captions_v17.json` | Generate AI captions via LLM |
| 05 | `05_Late_Scheduling_v17.json` | Schedule approved content to Late.com |
| 06 | `06_Late_Posts_Sync_v17.json` | Sync scheduled posts back to cache |
| 07 | `07_Agent_Config_v17.json` | AI-generate client brand configuration |
| 08 | `08_Agent_Batch_v17.json` | AI-generate batch campaign briefs |

## Workflow Details

### 00 - API Endpoints

**Webhook Paths:**
- `GET /webhook/api` - Read operations
- `POST /webhook/api` - Create operations
- `PUT /webhook/api` - Update operations
- `DELETE /webhook/api` - Delete operations
- `POST /webhook/w-upload` - File uploads
- `POST /webhook/w-onboarding-complete` - Complete onboarding

**Key Routes:**
- `/health` - Health check
- `/clients` - Client CRUD
- `/clients/:slug` - Single client
- `/clients/:slug/batches` - Client batches
- `/batches/:id` - Single batch
- `/batches/:id/content` - Batch content items
- `/late/accounts` - Late.com accounts cache

---

### 01 - Late Sync

**Webhook:** `POST /webhook/w0-sync`

**Purpose:** Syncs profiles and accounts from Late.com API to local cache.

**Flow:**
1. Fetch profiles from Late.com `/v1/profiles`
2. Fetch accounts from Late.com `/v1/accounts`
3. Update database with account metadata
4. Write cache to `late_accounts.json`
5. Return sync summary

**Schedule:** Run daily at 6 AM or on-demand from UI.

**Dependencies:** Requires `lateApi` credential in n8n.

---

### 02 - Late Validate

**Webhook:** `POST /webhook/late-validate`

**Purpose:** Validates Late.com API key by making a test request.

**Input:**
```json
{
  "api_key": "your-late-api-key"
}
```

**Output:**
```json
{
  "success": true,
  "plan_name": "Pro",
  "profiles_count": 3
}
```

---

### 03 - Ingest & Validate

**Webhook:** `POST /webhook/w1-ingest`

**Purpose:** Ingests uploaded content files, validates them, and creates content items.

**Flow:**
1. Load client and batch configuration
2. Scan for new media files (photos/videos)
3. Generate content IDs and thumbnails
4. Extract video frames (if applicable)
5. Create database records with PENDING status
6. Trigger W2 (AI Captions) automatically

**Triggers:** Called after file upload or manually from batch detail page.

---

### 04 - AI Captions

**Webhook:** `POST /webhook/w2-captions`

**Purpose:** Generates Instagram/TikTok captions using two-agent LLM system.

**Flow:**
1. Load content items in NEEDS_AI status
2. **Agent 1 (Generator):** Create initial caption based on:
   - Image/video description
   - Client brand voice
   - Batch brief
   - Platform requirements
3. **Agent 2 (Supervisor):** Review and approve/revise caption
4. Update database with generated captions
5. Set status to NEEDS_REVIEW

**Models Used:**
- Image description: `llava:7b` (vision model)
- Caption generation: `llama3.2:3b`
- Caption supervision: `llama3.2:3b`

**Configuration:** Ollama must be running at `host.docker.internal:11434`

---

### 05 - Late Scheduling

**Webhook:** `POST /webhook/w3-schedule`

**Purpose:** Schedules approved content items to Late.com.

**Flow:**
1. Query APPROVED content items
2. **Pre-flight checks:**
   - Verify file hash hasn't changed
   - Check media URL is accessible
   - Validate schedule time is in future
   - Confirm account IDs exist
3. **Concurrency protection:** Check item not already scheduled
4. Call Late.com API to create scheduled post
5. Update database with `late_post_id`
6. Handle rate limits (429) with retry status

**Triggers:** Called after user approves content or via scheduled job.

---

### 06 - Late Posts Sync

**Webhook:** `POST /webhook/w4-posts-sync`

**Purpose:** Syncs scheduled post status from Late.com back to local cache.

**Flow:**
1. Query Late.com for scheduled posts
2. Update local cache with post metadata
3. Detect published/failed posts

**Schedule:** Run periodically to keep status current.

---

### 07 - Agent: Config Generator

**Webhook:** `POST /webhook/w-agent1-config`

**Purpose:** AI-generates client brand configuration during onboarding.

**Input:**
```json
{
  "slug": "client-slug",
  "onboarding": {
    "business_name": "...",
    "business_description": "...",
    "target_audience": "...",
    "brand_personality": "...",
    "content_themes": "...",
    "call_to_actions": "...",
    "things_to_avoid": "..."
  }
}
```

**Generated Config:**
- Brand voice description
- Target audience summary
- Hashtag suggestions
- Platform defaults

---

### 08 - Agent: Batch Brief

**Webhook:** `POST /webhook/w-agent1-batch`

**Purpose:** AI-generates campaign brief for a content batch.

**Input:**
```json
{
  "batch_id": 123,
  "prompt": "Create captions for our holiday menu launch..."
}
```

**Output:** Campaign brief stored in batch record.

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACE                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  00 - API Endpoints (CRUD, Upload, Health)                  │
└─────────────────────────────────────────────────────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────────┐
│ 01 - Late     │   │ 03 - Ingest   │   │ 07/08 - AI Agents │
│ Sync          │   │ & Validate    │   │ (Config/Brief)    │
└───────────────┘   └───────────────┘   └───────────────────┘
                              │
                              ▼
                    ┌───────────────┐
                    │ 04 - AI       │
                    │ Captions      │
                    └───────────────┘
                              │
                    (User Approval)
                              │
                              ▼
                    ┌───────────────┐
                    │ 05 - Late     │
                    │ Scheduling    │
                    └───────────────┘
                              │
                              ▼
                    ┌───────────────┐
                    │ 06 - Posts    │
                    │ Sync          │
                    └───────────────┘
```

## Webhook URLs

| Workflow | Method | Path |
|----------|--------|------|
| API Endpoints | GET/POST/PUT/DELETE | `/webhook/api?route=...` |
| Late Sync | POST | `/webhook/w0-sync` |
| Late Validate | POST | `/webhook/late-validate` |
| Ingest | POST | `/webhook/w1-ingest` |
| AI Captions | POST | `/webhook/w2-captions` |
| Scheduling | POST | `/webhook/w3-schedule` |
| Posts Sync | POST | `/webhook/w4-posts-sync` |
| Config Agent | POST | `/webhook/w-agent1-config` |
| Batch Agent | POST | `/webhook/w-agent1-batch` |

## Credentials Required

- **lateApi**: Late.com API key (stored in n8n credentials)
- **Ollama**: Local LLM server (no credential, uses host.docker.internal:11434)

## Activation

After importing, **activate each workflow** using the toggle in the top-right corner of the n8n editor. Workflows with webhooks must be active to respond to requests.

## Troubleshooting

### "Webhook not registered" error
- Workflow is not active
- Import the workflow and toggle activation

### "Network error" in UI
- n8n container not running
- Check: `docker ps | grep socialflow-n8n`

### AI captions not generating
- Ollama not running
- Check: `curl http://localhost:11434/api/tags`

### Late.com sync fails
- Invalid API key
- Check credentials in n8n Settings > Credentials

## Version History

- **v17** (Current): Numbered file prefixes, consolidated bug fixes, improved documentation
- **v16**: Profile-based account linking, file uploads, video AI settings
- **v15**: Performance indexes, batch status tracking
- **v12**: Two-agent caption system, image descriptions
