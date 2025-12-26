● Build successful. Here's a summary of the fixes implemented from the 6-agent UX/UI review:

  Completed Fixes (7)

  Critical Priority

  1. Skip Link for Accessibility (AppLayout.tsx) - Added a "Skip to main content" link that's visible only when focused, allowing keyboard users to bypass navigation      
  2. Concurrent Workflow Prevention (BatchDetail.tsx) - Fixed all three workflow handlers (handleIngest, handleGenerate, handleSchedule) to check workflowStage !== 'idle' before starting, preventing simultaneous workflows
  3. Global Error Handler (App.tsx) - Added unhandledrejection event listener that catches uncaught promise errors and shows user-friendly toast notifications

  High Priority

  4. Keyboard Accessible Hover Buttons (ContentPreviewCard.tsx) - Added focus-within:opacity-100 to the hover overlay so approve/reject buttons become visible when focused via keyboard

  Medium Priority

  5. StatusIndicator Type Safety (status-indicator.tsx) - Added null coalescing fallback (?? STATUS_CONFIG.PENDING) to all three functions to prevent crashes from invalid status values
  6. Search Performance (ApprovalBoard.tsx) - Added useDeferredValue for search query to prevent blocking UI on rapid typing
  7. Build Verification - All changes compiled successfully with no TypeScript errors

  Remaining Issues (4)

  - Race condition in optimistic updates (useItemActions)
  - Profile unlink uses toast instead of dialog (EditClient)
  - Overly broad query invalidation (useBatches)
  - Form error announcements for screen readers

  Would you like me to continue fixing the remaining high priority issues?
# SocialFlow v16 - Guided Onboarding Implementation Status

## Completed Work

### 1. Database Schema (v16)
- [x] Added `files` table for upload-based onboarding
- [x] Added `source_type` column to batches table ('folder' or 'upload')
- [x] Added `file_id` foreign key to content_items table
- [x] Added indexes for files table queries

### 2. Docker Infrastructure
- [x] Created custom `docker/n8n.Dockerfile` with ffmpeg
- [x] Updated `docker-compose.yml` with uploads volume
- [x] Updated `docker-compose.vps.yml` with uploads volume
- [x] Container now builds from custom image instead of base n8n

### 3. Frontend Components
- [x] Created `FileUploader.tsx` - Drag-and-drop file uploader with previews
- [x] Created `Onboarding.tsx` - 4-step wizard page component
- [x] Created `useUploads.ts` hook with upload mutations
- [x] Added upload types to `api/types.ts`
- [x] Added upload API functions to `api/client.ts`
- [x] Added `/onboarding` route to `App.tsx`
- [x] Added "New Client" link to sidebar navigation

### 4. API Endpoints (v16)
- [x] All workflows renamed from v15.x to v16
- [x] W_API_Endpoints updated with `POST /batches` route
- [x] W_API_Endpoints updated with `GET /files/:batch_id` route
- [x] W_API_Endpoints updated with `POST /w-upload` upload handler
- [x] W_API_Endpoints updated with `POST /w-onboarding-complete` handler

### 5. W1 Upload Support (v16)
- [x] Load Config node: Added source_type retrieval from database
- [x] Validate Context node: Skip READY.txt check for upload batches
- [x] Auto-Discover node: Query files table for upload batches
- [x] Auto-Discover node: Use _db_path, _db_hash, _db_size from database
- [x] Item building: Added file_id tracking for upload batches

### 6. API Endpoints Upload-Aware (v16)
- [x] GET /items: Added source_type, file_id, upload_path, file_uuid to response
- [x] GET /items: Media URL construction is now source_type aware
- [x] Upload batches: Serve from `/uploads/{client_id}/{batch_id}/{uuid}.ext`
- [x] Folder batches: Serve from `/{client}/{batch}/photos|videos/{file_name}`

### 7. Frontend Type Fix (v16)
- [x] Added `id: number` to Client interface in types.ts
- [x] Simplified client ID extraction in Onboarding.tsx
- [x] Fixed unused imports (Progress, UploadedFile)
- [x] Fixed SettingsResponse type access
- [x] Frontend builds successfully

---

## Workflow Compatibility Audit

| Workflow | Compatible | Notes |
|----------|------------|-------|
| W1_Ingest_Validate_v16 | ✅ | Updated with source_type support |
| W2_AI_Captions_v15.2 | ✅ | Works from database, no changes needed |
| W3_Late_Scheduling_v15.2 | ✅ | Uses media_url, batch-type agnostic |
| W_API_Endpoints_v16 | ✅ | Updated GET /items for upload support |
| W0_Late_Account_Sync | ✅ | N/A (account sync only) |
| W_Agent1_Config/Batch | ✅ | N/A (config generation only) |

---

## Implementation Complete

All v16 onboarding workflows have been implemented. The following endpoints are now available:

### Upload Endpoint (`POST /w-upload`)
- Receives multipart/form-data with client_id, batch_id, and file
- Saves file to `/data/uploads/{client_id}/{batch_id}/{uuid}.ext`
- Computes MD5 checksum
- Inserts record into `files` table
- Returns file metadata with storage path

### Onboarding Complete Endpoint (`POST /w-onboarding-complete`)
- Receives client_id, batch_id, start_date, schedule_strategy
- Creates content_items from uploaded files
- Calculates schedule dates based on strategy
- Updates batch status to 'ready'

### W1 Ingest Workflow
- Now supports `source_type='upload'` batches
- Queries files table instead of filesystem for upload batches
- Skips READY.txt check for upload batches
- Uses database-stored file metadata (path, hash, size)

---

## Reference Documentation

The following sections are kept for reference but the implementation is complete.

### 1. W-Upload Workflow
**Webhook path:** `/w-upload`
**Method:** POST (multipart/form-data)

**Purpose:** Handle file uploads from the frontend

**Input:**
```json
{
  "client_id": 123,
  "batch_id": 456,   // optional
  "file": <binary>
}
```

**Logic:**
1. Receive file via webhook (multipart/form-data)
2. Generate UUID for storage filename
3. Save file to `/data/uploads/{client_id}/{batch_id}/{uuid}.{ext}`
4. If video: extract 4 frames using ffmpeg
5. Insert record into `files` table
6. Return file metadata

**Output:**
```json
{
  "success": true,
  "data": {
    "file": {
      "id": 789,
      "uuid": "abc123",
      "storage_path": "/data/uploads/123/456/abc123.jpg",
      "status": "ready"
    }
  }
}
```

### 2. W-Onboarding-Complete Workflow
**Webhook path:** `/w-onboarding-complete`
**Method:** POST

**Purpose:** Finalize onboarding - convert uploads to content items

**Input:**
```json
{
  "client_id": 123,
  "batch_id": 456,
  "batch_name": "January Content",
  "batch_description": "Winter campaign",
  "start_date": "2025-01-15",
  "schedule_strategy": "daily"
}
```

**Logic:**
1. Update batch with brief, schedule config
2. Query all files for this batch
3. For each file:
   - Generate content_id
   - Calculate schedule date based on strategy
   - Create content_item with status='NEEDS_AI'
   - Link file_id to content_item
4. Update batch status to 'ready'
5. Optionally trigger W2 for caption generation

**Output:**
```json
{
  "success": true,
  "data": {
    "client_slug": "berlin-bistro",
    "batch_slug": "january-content",
    "file_count": 15,
    "content_items_created": 15
  }
}
```

---

## n8n Implementation Guide

### Creating W_Upload Workflow in n8n

1. **Create new workflow**: Name it "W-Upload v16"

2. **Add Webhook node**:
   - Path: `w-upload`
   - Method: POST
   - Response Mode: "Last Node"
   - Options > Binary Property: `file`

3. **Add Code node "Process Upload"**:
```javascript
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Database = require('better-sqlite3');

const { client_id, batch_id } = $input.first().json;
const binary = $input.first().binary?.file;

if (!binary) {
  return [{ json: { success: false, error: 'No file provided' } }];
}

if (!client_id) {
  return [{ json: { success: false, error: 'client_id required' } }];
}

// Generate UUID and paths
const uuid = crypto.randomUUID();
const ext = path.extname(binary.fileName || '.bin').toLowerCase();
const storagePath = `/data/uploads/${client_id}/${batch_id || 'pending'}`;
const fullPath = `${storagePath}/${uuid}${ext}`;

// Create directory
fs.mkdirSync(storagePath, { recursive: true });

// Write file from base64
const buffer = Buffer.from(binary.data, 'base64');
fs.writeFileSync(fullPath, buffer);

// Determine type
const mimeType = binary.mimeType || 'application/octet-stream';
const isVideo = mimeType.startsWith('video/');

// Insert into database
const db = new Database('/data/clients/_config/socialflow.db');
const info = db.prepare(`
  INSERT INTO files (client_id, batch_id, original_name, storage_path, uuid,
                     file_size, mime_type, status, uploaded_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, 'uploaded', datetime('now'))
`).run(client_id, batch_id, binary.fileName, fullPath, uuid, buffer.length, mimeType);
db.close();

return [{
  json: {
    success: true,
    data: {
      file: {
        id: info.lastInsertRowid,
        uuid,
        storage_path: fullPath,
        is_video: isVideo,
        status: isVideo ? 'needs_frames' : 'ready'
      }
    }
  }
}];
```

4. **Add IF node** for video detection:
   - Condition: `{{ $json.data.file.is_video }} === true`

5. **Add Execute Command node** for ffmpeg (video branch):
```bash
ffmpeg -i {{ $json.data.file.storage_path }} \
  -vf "select='eq(n,0)+eq(n,30)+eq(n,60)+eq(n,90)',setpts=N/FRAME_RATE/TB" \
  -vsync vfr -q:v 2 \
  {{ $json.data.file.storage_path.replace(/\.\w+$/, '') }}_f%d.jpg
```

6. **Add Code node "Update File Status"**:
```javascript
const Database = require('better-sqlite3');
const fileId = $input.first().json.data.file.id;

const db = new Database('/data/clients/_config/socialflow.db');
db.prepare(`
  UPDATE files SET status = 'ready', processed_at = datetime('now')
  WHERE id = ?
`).run(fileId);
db.close();

return $input.all();
```

### Creating W_Onboarding_Complete Workflow in n8n

1. **Create new workflow**: Name it "W-Onboarding-Complete v16"

2. **Add Webhook node**:
   - Path: `w-onboarding-complete`
   - Method: POST
   - Response Mode: "Last Node"

3. **Add Code node "Create Content Items"**:
```javascript
const Database = require('better-sqlite3');
const input = $input.first().json;
const { client_id, batch_id, start_date, schedule_strategy } = input;

const db = new Database('/data/clients/_config/socialflow.db');

// Get client and batch info
const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(client_id);
const batch = db.prepare('SELECT * FROM batches WHERE id = ?').get(batch_id);
const files = db.prepare('SELECT * FROM files WHERE batch_id = ? AND status = ?')
  .all(batch_id, 'ready');

if (!files.length) {
  db.close();
  return [{ json: { success: false, error: 'No ready files found' } }];
}

// Generate schedule dates
const startDate = new Date(start_date);
const daysToAdd = schedule_strategy === 'daily' ? 1 : 7;
let currentDate = startDate;
let created = 0;

const insertItem = db.prepare(`
  INSERT INTO content_items (
    content_id, client_id, batch_id, media_type, file_name, file_path,
    file_size, scheduled_date, scheduled_time, slot, platforms,
    status, file_id, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, '20:00:00', 'feed', 'ig', 'NEEDS_AI', ?, datetime('now'))
`);

const updateFile = db.prepare('UPDATE files SET content_item_id = ? WHERE id = ?');

for (let i = 0; i < files.length; i++) {
  const file = files[i];
  const dateStr = currentDate.toISOString().split('T')[0];
  const mediaType = file.mime_type?.startsWith('video') ? 'video' : 'photo';
  const contentId = `${client.slug}__${batch.slug}__${dateStr}__feed__${mediaType}__${String(i+1).padStart(2,'0')}`;

  const info = insertItem.run(
    contentId, client_id, batch_id, mediaType, file.original_name,
    file.storage_path, file.file_size, dateStr, file.id
  );
  updateFile.run(info.lastInsertRowid, file.id);

  currentDate.setDate(currentDate.getDate() + daysToAdd);
  created++;
}

// Update batch status
db.prepare(`UPDATE batches SET status = 'ready' WHERE id = ?`).run(batch_id);
db.close();

return [{
  json: {
    success: true,
    data: {
      client_slug: client.slug,
      batch_slug: batch.slug,
      file_count: files.length,
      content_items_created: created
    }
  }
}];
```

---

## Quick Start

### Build and Start
```bash
# Windows
docker-compose build socialflow-n8n
docker-compose up -d

# Initialize database (adds files table)
docker exec socialflow-n8n sh /opt/scripts/init-db.sh
```

### Access Onboarding
Navigate to: `http://localhost:3000/onboarding`

---

## File Structure After Changes

```
socialflow/
├── docker/
│   └── n8n.Dockerfile           # NEW: Custom n8n image with ffmpeg
│
├── scripts/
│   └── schema.sql               # UPDATED: v16 with files table
│
├── socialflow-ui/src/
│   ├── api/
│   │   ├── client.ts            # UPDATED: Upload functions
│   │   └── types.ts             # UPDATED: Upload types
│   │
│   ├── components/
│   │   └── onboarding/
│   │       ├── FileUploader.tsx # NEW: Drag-drop uploader
│   │       └── index.tsx        # NEW: Component exports
│   │
│   ├── hooks/
│   │   ├── useUploads.ts        # NEW: Upload mutations
│   │   └── index.ts             # UPDATED: Export useUploads
│   │
│   ├── pages/
│   │   └── Onboarding.tsx       # NEW: 4-step wizard
│   │
│   └── App.tsx                  # UPDATED: /onboarding route
│
├── docker-compose.yml           # UPDATED: Build custom image, uploads volume
└── docker-compose.vps.yml       # UPDATED: Same as above
```

---

## Upload Storage Structure

```
/data/uploads/
├── {client_id}/
│   └── {batch_id}/
│       ├── {uuid1}.jpg          # Original photo
│       ├── {uuid2}.mp4          # Original video
│       ├── {uuid2}_f1.jpg       # Video frame 1
│       ├── {uuid2}_f2.jpg       # Video frame 2
│       ├── {uuid2}_f3.jpg       # Video frame 3
│       └── {uuid2}_f4.jpg       # Video frame 4
```

---

## Database Tables Reference

### files (NEW in v16)
```sql
CREATE TABLE files (
    id INTEGER PRIMARY KEY,
    client_id INTEGER NOT NULL,
    batch_id INTEGER,
    original_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    uuid TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    checksum TEXT,
    width INTEGER,
    height INTEGER,
    duration_seconds REAL,
    frame_paths TEXT,           -- JSON array
    frame_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'uploaded',
    error_message TEXT,
    content_item_id INTEGER,
    uploaded_at TEXT,
    processed_at TEXT
);
```

### batches (UPDATED in v16)
```sql
-- Added column:
source_type TEXT DEFAULT 'folder'  -- 'folder' or 'upload'
```

### content_items (UPDATED in v16)
```sql
-- Added column:
file_id INTEGER  -- References files(id)
```
