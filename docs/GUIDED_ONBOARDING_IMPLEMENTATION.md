# Guided Client Onboarding - Implementation Plan

> **STATUS: PARTIALLY IMPLEMENTED in v16**
>
> v16 implements the 4-step onboarding wizard with folder-based file storage.
> The file upload infrastructure (Steps 3-4 in this doc) is **deferred to v17+**.
>
> **What's Implemented in v16:**
> - Step 1: Client Info (fully working)
> - Step 2: Account Selection (fully working)
> - Step 3: Upload Media (UI exists, but uses folder-based storage, not database uploads)
> - Step 4: Generate (triggers existing W1/W2 workflows)
>
> **Deferred to v17+:**
> - Database-based file storage (`files` table)
> - W-Upload workflow
> - Automatic frame extraction

## Overview

A step-by-step wizard that guides users through client setup and content upload. Everything is stored in the **database on the VPS** - no manual folder creation needed.

---

## User Experience Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        GUIDED ONBOARDING WIZARD                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Step 1          Step 2          Step 3          Step 4                │
│  ┌─────┐         ┌─────┐         ┌─────┐         ┌─────┐               │
│  │  1  │────────▶│  2  │────────▶│  3  │────────▶│  4  │               │
│  └─────┘         └─────┘         └─────┘         └─────┘               │
│  Client          Accounts        Upload          Review &              │
│  Info            Setup           Media           Generate              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Client Info

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 1 of 4: Client Information                    [━━━━━░░░░░░░░] 25% │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Let's set up your new client. This info helps generate better         │
│  captions for their social media content.                              │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Client Name *                                                    │   │
│  │ [Café Central Berlin                                      ]     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Business Type                                                    │   │
│  │ [▼ Café / Coffee Shop                                     ]     │   │
│  │    • Restaurant                                                  │   │
│  │    • Café / Coffee Shop  ✓                                      │   │
│  │    • Bar / Nightclub                                            │   │
│  │    • Retail / Shop                                              │   │
│  │    • Service Business                                           │   │
│  │    • Other                                                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────┐ ┌─────────────────────────────────┐   │
│  │ Language *                  │ │ Timezone *                      │   │
│  │ [▼ Français              ] │ │ [▼ Europe/Berlin             ] │   │
│  └─────────────────────────────┘ └─────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Brand Description (helps AI understand your brand)              │   │
│  │ ┌─────────────────────────────────────────────────────────────┐ │   │
│  │ │ A cozy specialty coffee shop in Berlin Mitte, known for    │ │   │
│  │ │ artisan pastries and a warm atmosphere. We focus on        │ │   │
│  │ │ sustainability and local ingredients.                       │ │   │
│  │ │                                                             │ │   │
│  │ └─────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Target Audience                                                  │   │
│  │ [Young professionals, coffee enthusiasts, 25-40 years     ]     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Default Hashtags (comma separated)                              │   │
│  │ [#berlincoffe, #specialtycoffee, #berlinmitte             ]     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│                                            [Cancel]  [Next: Accounts →] │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Data Saved to Database:**
```sql
INSERT INTO clients (slug, name, type, language, timezone, brand_description,
                     brand_target_audience, hashtags)
VALUES ('cafe-central-berlin', 'Café Central Berlin', 'cafe', 'fr',
        'Europe/Berlin', '...', '...', '["#berlincoffee", "..."]');
```

---

## Step 2: Connect Accounts

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 2 of 4: Connect Social Accounts               [━━━━━━━━░░░░░] 50% │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Connect this client's social media accounts for scheduling.           │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  📷 Instagram                                                    │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │ [▼ Select Instagram Account                            ]  │  │   │
│  │  │    • @cafecentralberlin (Business) ✓                      │  │   │
│  │  │    • @cafe_stories (Creator)                              │  │   │
│  │  │    • + Connect new account                                │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  │                                                                  │   │
│  │  ✅ Selected: @cafecentralberlin                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  🎵 TikTok                                                       │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │ [▼ Select TikTok Account                               ]  │  │   │
│  │  │    • @cafecentralberlin ✓                                 │  │   │
│  │  │    • + Connect new account                                │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  │                                                                  │   │
│  │  ✅ Selected: @cafecentralberlin                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ℹ️  Accounts are managed through Late.com. If you don't see   │   │
│  │     an account, connect it in Late.com first, then refresh.     │   │
│  │                                                                  │   │
│  │     [🔄 Refresh Accounts from Late.com]                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│                                      [← Back]  [Skip]  [Next: Upload →] │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Data Saved:**
```sql
INSERT INTO accounts (client_id, platform, late_account_id, username, is_default)
VALUES
    (1, 'instagram', 'acc_xxx', '@cafecentralberlin', 1),
    (1, 'tiktok', 'acc_yyy', '@cafecentralberlin', 1);
```

---

## Step 3: Upload Media

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 3 of 4: Upload Content                        [━━━━━━━━━━━░░] 75% │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Upload photos and videos for this client's first batch.               │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Batch Name (optional)                                            │   │
│  │ [January 2025                                               ]   │   │
│  │ Leave empty to auto-generate: "Batch 2025-01-15"                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │     ┌─────────────────────────────────────────────────────┐     │   │
│  │     │                                                     │     │   │
│  │     │           📁 Drag & Drop Files Here                │     │   │
│  │     │                                                     │     │   │
│  │     │              or click to browse                     │     │   │
│  │     │                                                     │     │   │
│  │     │     Accepts: JPG, PNG, MP4, MOV (max 100MB each)   │     │   │
│  │     │                                                     │     │   │
│  │     └─────────────────────────────────────────────────────┘     │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Uploaded Files: 8 files (124.5 MB)                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ✅ coffee_latte.jpg ............................ 2.3 MB  [🗑️]  │   │
│  │ ✅ pastry_croissant.jpg ........................ 1.8 MB  [🗑️]  │   │
│  │ ✅ interior_morning.jpg ........................ 3.1 MB  [🗑️]  │   │
│  │ ✅ barista_action.mp4 ......................... 45.2 MB  [🗑️]  │   │
│  │    └─ 🎬 Extracting 4 frames for AI...                          │   │
│  │ ✅ team_photo.jpg .............................. 2.4 MB  [🗑️]  │   │
│  │ ⏳ latte_art.mp4 .............................. 52.1 MB         │   │
│  │    └─ ⬆️ Uploading... 67%                                       │   │
│  │ ⏳ espresso_pour.jpg ........................... 1.9 MB         │   │
│  │ ⏳ outdoor_seating.jpg ......................... 2.2 MB         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Scheduling Options                                               │   │
│  │                                                                  │   │
│  │ Start Date: [📅 2025-01-20        ]                             │   │
│  │                                                                  │   │
│  │ Post Time:  [🕐 20:00             ] (local timezone)            │   │
│  │                                                                  │   │
│  │ Frequency:  [▼ 1 post per day     ]                             │   │
│  │               • 1 post per day                                   │   │
│  │               • 2 posts per day                                  │   │
│  │               • Every other day                                  │   │
│  │               • Custom...                                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│                                  [← Back]  [Next: Generate Captions →] │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**What Happens on Upload:**

1. File uploaded to VPS: `/opt/socialflow-data/uploads/{client_id}/{batch_id}/{uuid}.jpg`
2. Record created in `files` table
3. For videos: ffmpeg extracts 4 frames, saves to same folder
4. Batch record created in `batches` table
5. When "Next" clicked: triggers W1 ingest + W2 caption generation

---

## Step 4: Review & Generate

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 4 of 4: Review & Generate Captions           [━━━━━━━━━━━━━━] 99% │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🤖 AI Caption Generation                                        │   │
│  │                                                                  │   │
│  │    Processing: 5 of 8 items                                     │   │
│  │    [━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░] 62%                        │   │
│  │                                                                  │   │
│  │    Current: barista_action.mp4                                  │   │
│  │    Status: Generating Instagram caption...                      │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Preview (completed items):                                            │
│  ┌────────────┬────────────────────────────────────────────────────┐   │
│  │            │ coffee_latte.jpg                                   │   │
│  │   [IMG]    │                                                    │   │
│  │            │ "Start your morning right with our signature      │   │
│  │            │ latte. Smooth, creamy, and made with love ☕"     │   │
│  │            │                                                    │   │
│  │            │ #berlincoffee #latteart #morningvibes             │   │
│  │            │                                                    │   │
│  │            │ 📅 Jan 20, 2025 @ 20:00  📱 Instagram             │   │
│  ├────────────┼────────────────────────────────────────────────────┤   │
│  │            │ pastry_croissant.jpg                               │   │
│  │   [IMG]    │                                                    │   │
│  │            │ "Fresh from the oven every morning. Our butter    │   │
│  │            │ croissants are the perfect coffee companion 🥐"   │   │
│  │            │                                                    │   │
│  │            │ 📅 Jan 21, 2025 @ 20:00  📱 Instagram             │   │
│  └────────────┴────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ℹ️  You can edit captions and approve content on the Review     │   │
│  │     Board after setup is complete.                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│                                          [← Back]  [Finish Setup ✓]    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Completion Screen

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                            ✅ Setup Complete!                           │
│                                                                         │
│           Café Central Berlin is ready for content management          │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │   📊 Summary                                                     │   │
│  │                                                                  │   │
│  │   Client:     Café Central Berlin                               │   │
│  │   Accounts:   Instagram, TikTok                                 │   │
│  │   Batch:      January 2025 (8 items)                            │   │
│  │   Scheduled:  Jan 20 - Jan 27, 2025                             │   │
│  │                                                                  │   │
│  │   Items Status:                                                  │   │
│  │   • 6 ready for review                                          │   │
│  │   • 2 still generating                                          │   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  What's Next?                                                          │
│                                                                         │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐   │
│  │                   │  │                   │  │                   │   │
│  │  📝 Review Board  │  │  📤 Add More      │  │  ➕ New Client    │   │
│  │                   │  │     Content       │  │                   │   │
│  │  Review & approve │  │  Upload more      │  │  Set up another   │   │
│  │  captions         │  │  photos/videos    │  │  client           │   │
│  │                   │  │                   │  │                   │   │
│  └───────────────────┘  └───────────────────┘  └───────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Updates

### New Files Table

```sql
-- Add to schema.sql
CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    batch_id INTEGER,

    -- File info
    original_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,      -- /uploads/{client_id}/{batch_id}/{uuid}.ext
    file_size INTEGER,
    mime_type TEXT,
    checksum TEXT,                   -- SHA256 for deduplication

    -- Media metadata
    width INTEGER,
    height INTEGER,
    duration_seconds REAL,           -- For videos

    -- Video frames (JSON array of storage paths)
    frame_paths TEXT,                -- ["path/frame1.jpg", "path/frame2.jpg", ...]

    -- Processing status
    status TEXT DEFAULT 'uploaded',  -- uploaded, processing, ready, error
    error_message TEXT,

    -- Timestamps
    uploaded_at TEXT DEFAULT (datetime('now')),
    processed_at TEXT,

    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_files_client ON files(client_id);
CREATE INDEX IF NOT EXISTS idx_files_batch ON files(batch_id);
CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);
```

### Extend Existing Tables

```sql
-- Add to batches table
ALTER TABLE batches ADD COLUMN source_type TEXT DEFAULT 'folder';  -- 'folder' or 'upload'

-- Add to content_items table
ALTER TABLE content_items ADD COLUMN file_id INTEGER REFERENCES files(id);
```

---

## API Endpoints

### New Upload Endpoints

```
POST /api/upload
  - Multipart file upload
  - Saves to /opt/socialflow-data/uploads/{client_id}/{batch_id}/
  - Creates files table record
  - For videos: queues frame extraction

POST /api/upload/batch
  - Bulk upload + auto-create batch
  - Body: { client_id, batch_name?, files[], schedule_config }
  - Returns: { batch_id, file_count, status }

GET /api/files/{id}
  - Get file info and download URL

DELETE /api/files/{id}
  - Delete file from storage and database
```

### Onboarding Wizard Endpoint

```
POST /api/onboarding/complete
  - Body: {
      client: { name, type, language, timezone, ... },
      accounts: [{ platform, late_account_id }, ...],
      batch: { name, schedule_config },
      files: [{ file_id }, ...],
      auto_generate: true
    }
  - Creates client, links accounts, creates batch, triggers W1+W2
  - Returns: { client_id, batch_id, redirect_url }
```

---

## Storage Structure (VPS)

```
/opt/socialflow-data/
├── _config/
│   └── socialflow.db              # SQLite database
│
├── uploads/                        # NEW: Uploaded media
│   ├── 1/                         # client_id
│   │   ├── 1/                     # batch_id
│   │   │   ├── a1b2c3d4.jpg      # UUID filename
│   │   │   ├── e5f6g7h8.mp4
│   │   │   ├── e5f6g7h8_f1.jpg   # Video frame 1
│   │   │   ├── e5f6g7h8_f2.jpg   # Video frame 2
│   │   │   ├── e5f6g7h8_f3.jpg   # Video frame 3
│   │   │   └── e5f6g7h8_f4.jpg   # Video frame 4
│   │   └── 2/
│   │       └── ...
│   └── 2/
│       └── ...
│
└── legacy/                         # Old folder-based clients (optional)
    └── ...
```

---

## n8n Workflow: W-Upload

```
Trigger: Webhook POST /upload

1. Receive multipart form data
2. Validate file type (jpg/png/mp4/mov)
3. Validate file size (< 100MB)
4. Generate UUID filename
5. Save to /opt/socialflow-data/uploads/{client_id}/{batch_id}/
6. Calculate checksum (for dedup)
7. Insert into files table
8. If video:
   a. Extract 4 frames using ffmpeg
   b. Save frames to same folder
   c. Update files.frame_paths
9. Return file info
```

---

## Frontend Components

### New Components Needed

| Component | Description |
|-----------|-------------|
| `OnboardingWizard.tsx` | Main wizard container with steps |
| `ClientInfoStep.tsx` | Step 1: Client form |
| `AccountsStep.tsx` | Step 2: Account selection |
| `UploadStep.tsx` | Step 3: Drag-drop upload |
| `GenerateStep.tsx` | Step 4: AI generation progress |
| `OnboardingComplete.tsx` | Success screen |
| `FileUploader.tsx` | Reusable drag-drop component |
| `UploadProgress.tsx` | File upload progress list |

### Routes

```tsx
/onboarding              → OnboardingWizard (new client)
/clients/:id/upload      → UploadStep (add batch to existing client)
/clients/:id/batches/new → UploadStep (alternative path)
```

---

## Implementation Phases

### Phase 1: File Upload Infrastructure (3-4 days)

1. Add `files` table to schema
2. Create W-Upload workflow in n8n
3. Create `/api/upload` endpoint
4. Add ffmpeg to Docker container for video frames
5. Create `FileUploader.tsx` component
6. Test: upload → storage → database

### Phase 2: Onboarding Wizard UI (3-4 days)

1. Create `OnboardingWizard.tsx` with step navigation
2. Implement `ClientInfoStep.tsx` (form → API)
3. Implement `AccountsStep.tsx` (fetch from Late.com)
4. Implement `UploadStep.tsx` (uses FileUploader)
5. Implement `GenerateStep.tsx` (progress tracking)
6. Create completion screen

### Phase 3: Connect to Existing Workflows (2-3 days)

1. Modify W1-Ingest to support `source_type: upload`
2. W1 reads from `files` table instead of folder scan
3. W2 works unchanged (uses content_items)
4. Create `/api/onboarding/complete` endpoint
5. Test full flow: wizard → upload → ingest → generate

### Phase 4: Polish & Testing (2-3 days)

1. Error handling (upload failures, network issues)
2. File validation (size, type, dimensions)
3. Progress indicators
4. Mobile responsiveness
5. Browser testing
6. Documentation

---

## Total Effort: ~2 weeks

| Phase | Days | Deliverables |
|-------|------|--------------|
| 1. Upload Infrastructure | 3-4 | Files table, upload API, storage |
| 2. Wizard UI | 3-4 | 4-step wizard, all components |
| 3. Workflow Integration | 2-3 | Modified W1, onboarding API |
| 4. Polish | 2-3 | Error handling, testing, docs |

---

## Docker Changes

### Add ffmpeg to n8n Container

```dockerfile
# In n8n Dockerfile
RUN apt-get update && apt-get install -y ffmpeg
```

### Volume for Uploads

```yaml
# docker-compose.yml
services:
  socialflow-n8n:
    volumes:
      - ${DATA_PATH:-./data}:/data/clients
      - ${DATA_PATH:-./data}/uploads:/data/uploads  # NEW
```

---

## Migration Path

### Existing File-Based Clients

- Keep working with `source_type: folder`
- W1 checks `source_type` to decide scan method
- No forced migration

### New Clients

- Always use `source_type: upload`
- All data in database
- Files in `/uploads/` folder

---

## Next Steps

1. **Approve this plan** - Any changes needed?
2. **Start Phase 1** - Files table + upload workflow
3. **Create FileUploader component** - Drag-drop UI
4. **Build wizard steps** - One by one
5. **Connect workflows** - Modify W1 for uploads
6. **Test end-to-end** - Full onboarding flow
