# Client Onboarding Automation Plan

## Goal

Automate client onboarding with:
- Files stored in database/centralized storage (not client folders)
- Self-service client creation via UI
- Automated batch creation from uploaded files
- No manual folder structure required

---

## Current Flow (File-Based)

```
Manual Process:
1. Create client folder: /Clients/client-name/
2. Create client.yaml manually
3. Create batch folder with READY.txt
4. Add photos/videos to batch folder
5. Trigger ingest via API
6. AI generates captions
7. Review and approve
8. Schedule
```

**Problems:**
- Requires file system access
- Manual folder/file creation
- Can't work with remote clients uploading files
- No self-service for clients

---

## New Flow (Database-Based)

```
Automated Process:
1. User creates client via UI form
2. User uploads files via drag-and-drop
3. System auto-creates batch from upload
4. Files stored in centralized storage (S3/local/database)
5. Ingest runs automatically
6. AI generates captions
7. Review and approve
8. Schedule
```

---

## Architecture Changes

### Current Architecture
```
┌─────────────────────────────────────────────┐
│              File System                     │
│  /Clients/                                   │
│    ├── client-a/                            │
│    │   ├── client.yaml                      │
│    │   └── batch-1/                         │
│    │       ├── READY.txt                    │
│    │       └── photos/                      │
│    └── client-b/                            │
└─────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────┐
│              SQLite Database                 │
│  - clients table (references folder)        │
│  - batches table (references folder)        │
│  - content_items (references file path)     │
└─────────────────────────────────────────────┘
```

### New Architecture
```
┌─────────────────────────────────────────────┐
│              File Storage                    │
│  Option A: S3/R2 Bucket                     │
│  Option B: Local uploads/ folder            │
│  Option C: Database BLOBs (small files)     │
│                                              │
│  Structure:                                  │
│    /uploads/{client_id}/{batch_id}/         │
│      ├── {uuid}.jpg                         │
│      └── {uuid}.mp4                         │
└─────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────┐
│              SQLite Database                 │
│  - clients (full data, no folder ref)       │
│  - batches (full data, no folder ref)       │
│  - content_items (storage_path, metadata)   │
│  - files (original name, storage path, type)│
└─────────────────────────────────────────────┘
```

---

## Database Schema Changes

### New Tables

```sql
-- Files table (tracks uploaded files)
CREATE TABLE files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    batch_id INTEGER,
    original_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,        -- /uploads/abc123/def456/uuid.jpg
    storage_type TEXT DEFAULT 'local', -- local, s3, r2
    mime_type TEXT,
    file_size INTEGER,
    checksum TEXT,                     -- For deduplication
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (batch_id) REFERENCES batches(id)
);

-- Extend clients table
ALTER TABLE clients ADD COLUMN logo_file_id INTEGER;
ALTER TABLE clients ADD COLUMN brief TEXT;           -- Stored in DB, not file
ALTER TABLE clients ADD COLUMN hashtags TEXT;        -- Stored in DB, not file
ALTER TABLE clients ADD COLUMN instructions TEXT;    -- AI instructions

-- Extend batches table
ALTER TABLE batches ADD COLUMN instructions TEXT;    -- Batch-specific AI instructions
ALTER TABLE batches ADD COLUMN auto_created BOOLEAN DEFAULT 0;

-- Extend content_items table
ALTER TABLE content_items ADD COLUMN file_id INTEGER;
ALTER TABLE content_items ADD COLUMN frame_file_ids TEXT; -- JSON array for video frames
```

### Data Migration

```sql
-- Migrate existing file references
UPDATE content_items
SET storage_path = media_path,
    storage_type = 'legacy'
WHERE storage_path IS NULL;
```

---

## API Changes

### New Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/upload` | POST | Upload files (multipart form) |
| `/upload/batch` | POST | Upload multiple files, auto-create batch |
| `/clients/:id/files` | GET | List client files |
| `/batches/:id/files` | GET | List batch files |
| `/files/:id` | GET | Get file info |
| `/files/:id/download` | GET | Download file |
| `/files/:id` | DELETE | Delete file |

### Upload Endpoint

```javascript
// POST /upload
// Content-Type: multipart/form-data

{
  "client_id": 123,
  "batch_id": 456,        // Optional - creates new batch if not provided
  "files": [File, File, File]
}

// Response
{
  "batch_id": 456,
  "files": [
    {
      "id": 1,
      "original_name": "photo1.jpg",
      "storage_path": "/uploads/123/456/abc.jpg",
      "status": "uploaded"
    }
  ]
}
```

### Batch Upload (Auto-Create)

```javascript
// POST /upload/batch
{
  "client_id": 123,
  "batch_name": "January 2025",  // Optional, auto-generated if not provided
  "files": [File, File],
  "auto_ingest": true,           // Trigger W1 after upload
  "auto_generate": true          // Trigger W2 after ingest
}

// Response
{
  "batch": {
    "id": 456,
    "name": "January 2025",
    "item_count": 10
  },
  "auto_ingest_triggered": true,
  "auto_generate_triggered": true
}
```

---

## Frontend Changes

### New Upload Component

```
┌─────────────────────────────────────────────────────────────┐
│  Create Batch                                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Client: [Dropdown: Select Client]                         │
│                                                             │
│  Batch Name: [Optional - auto-generated if empty]          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │     Drag & Drop Files Here                         │   │
│  │                                                     │   │
│  │     or click to browse                             │   │
│  │                                                     │   │
│  │     Supports: JPG, PNG, MP4, MOV                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Uploaded Files:                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☑ photo1.jpg ............................ 2.3 MB   │   │
│  │ ☑ photo2.jpg ............................ 1.8 MB   │   │
│  │ ☑ video1.mp4 ........................... 45.2 MB   │   │
│  │   ↳ Extracting frames...                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Options:                                                   │
│  ☑ Auto-run AI caption generation after upload             │
│  ☐ Schedule immediately after approval                     │
│                                                             │
│  [Cancel]                              [Create Batch →]    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Client Form Updates

```
┌─────────────────────────────────────────────────────────────┐
│  Create Client                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Client Name: [________________________________]            │
│                                                             │
│  Language: [Dropdown: English / French / German]           │
│                                                             │
│  Timezone: [Dropdown: Europe/Berlin]                       │
│                                                             │
│  Brief/Context:                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Describe the brand, tone, audience...              │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Default Hashtags:                                         │
│  [#brand #social #content________________________]         │
│                                                             │
│  AI Instructions:                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Special instructions for caption generation...     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Late.com Accounts:                                        │
│  Instagram: [Dropdown: Select Account]                     │
│  TikTok:    [Dropdown: Select Account]                     │
│                                                             │
│  [Cancel]                              [Create Client →]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Workflow Changes

### W1 - Ingest (Updated)

**Current:** Scans folder for files
**New:** Reads from files table, downloads from storage

```javascript
// New W1 logic
1. Query files table for batch_id
2. For each file:
   a. Get storage_path
   b. Download/read file
   c. Extract metadata (dimensions, duration)
   d. For videos: extract frames, upload to storage
   e. Create content_item record
3. Update batch status
```

### W-Upload (New Workflow)

```javascript
// Handles file upload processing
1. Receive multipart upload
2. For each file:
   a. Generate UUID filename
   b. Save to storage (local/S3)
   c. Create files table record
   d. For videos: extract frames
3. If auto_ingest: trigger W1
4. Return batch info
```

---

## Storage Options

### Option A: Local Storage (Simplest)

```
/uploads/
  ├── {client_id}/
  │   └── {batch_id}/
  │       ├── {uuid}.jpg
  │       └── {uuid}.mp4
```

**Pros:** Simple, no external dependencies
**Cons:** Harder to scale, needs backup strategy

### Option B: Cloudflare R2 (Recommended for VPS)

```javascript
// .env
STORAGE_TYPE=r2
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY=xxx
R2_SECRET_KEY=xxx
R2_BUCKET=socialflow-media
R2_PUBLIC_URL=https://media.yourdomain.com
```

**Pros:** Cheap, S3-compatible, CDN included, no egress fees
**Cons:** External dependency

### Option C: S3 Compatible

```javascript
// .env
STORAGE_TYPE=s3
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=xxx
S3_SECRET_KEY=xxx
S3_BUCKET=socialflow-media
S3_REGION=us-east-1
```

**Pros:** Standard, many providers
**Cons:** Egress costs

---

## Implementation Phases

### Phase 1: Upload Infrastructure (Week 1-2)

1. Add files table to schema
2. Create upload storage service
3. Create `/upload` endpoint in n8n
4. Add file upload component to frontend
5. Test upload → storage → database flow

### Phase 2: Batch Auto-Creation (Week 2-3)

1. Extend batch creation to work without folders
2. Create `/upload/batch` endpoint
3. Modify W1 to read from files table
4. Add auto-ingest option
5. Test full upload → ingest flow

### Phase 3: Client Form Updates (Week 3)

1. Update client form with brief/hashtags fields
2. Store client config in database
3. Modify W2 to read from database instead of files
4. Test AI generation with DB-stored instructions

### Phase 4: Video Frame Extraction (Week 3-4)

1. Add ffmpeg to n8n container (or use separate service)
2. Extract frames on upload
3. Store frames in storage
4. Link frames to content_items
5. Test video → frames → AI flow

### Phase 5: Migration & Cleanup (Week 4)

1. Create migration script for existing file-based clients
2. Update documentation
3. Deprecate folder-based approach
4. Test both old and new clients work

---

## File Structure After Changes

```
socialflow/
├── uploads/                    # NEW: Local file storage
│   └── {client_id}/
│       └── {batch_id}/
│           ├── {uuid}.jpg
│           └── {uuid}.mp4
│
├── data/                       # Simplified
│   └── _config/
│       └── socialflow.db      # All data in DB
│
├── config/                     # AI prompts (templates)
│   └── agents/
│       └── caption_generator.md
│
└── ... (rest unchanged)
```

---

## API Flow Diagrams

### Current (File-Based)
```
User → Create Folder → Add Files → Call API → Ingest → Generate → Review → Schedule
       ^^^^^^^^^^^^   ^^^^^^^^^
       Manual steps
```

### New (Upload-Based)
```
User → UI Form → Upload Files → Auto-Ingest → Auto-Generate → Review → Schedule
       ^^^^^^^   ^^^^^^^^^^^^
       Self-service
```

---

## Backward Compatibility

- Keep file-based ingest for existing setups
- Add `source_type` field: `folder` | `upload`
- W1 checks source_type to determine how to find files
- Gradual migration path

---

## Security Considerations

1. **File validation**: Check MIME types, file sizes
2. **Path traversal**: Sanitize filenames, use UUIDs
3. **Access control**: Verify client ownership before download
4. **Rate limiting**: Prevent upload abuse
5. **Virus scanning**: Optional integration with ClamAV

---

## Cost Estimates

| Storage | Monthly Cost (100GB) |
|---------|---------------------|
| Local disk | $0 (included in VPS) |
| Cloudflare R2 | ~$1.50 |
| AWS S3 | ~$2.30 + egress |
| Backblaze B2 | ~$0.50 |

---

## Next Steps

1. **Decision needed**: Which storage option? (Recommend: Local for MVP, R2 for scale)
2. **Decision needed**: Keep file-based as option or fully migrate?
3. **Decision needed**: Implement ffmpeg in container or external service?
4. Start Phase 1: Upload Infrastructure
