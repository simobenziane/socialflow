# SocialFlow Workflow Changelog

## Version 16 (2025-12-19)

### Overview
Upload-based client onboarding. This release adds a guided onboarding wizard that allows users to upload media files directly instead of requiring folder-based batch setup.

### Database Schema (v16)
**New Table: `files`**
- Tracks uploaded files for upload-based onboarding
- Fields: id, client_id, batch_id, original_name, storage_path, uuid, file_size, mime_type, checksum, width, height, duration_seconds, frame_paths, frame_count, status, error_message, content_item_id, uploaded_at, processed_at

**Modified Tables:**
- `batches`: Added `source_type TEXT DEFAULT 'folder'` ('folder' or 'upload')
- `content_items`: Added `file_id INTEGER` (FK to files table)

### W-API: Endpoints v16
**New Routes:**
- `POST /batches` - Create new batch for upload-based onboarding
  - Input: `{ client_id, name, description?, source_type? }`
  - Auto-generates slug from name
  - Sets `source_type='upload'` by default
  - Returns: `{ batch_id, slug, client_slug }`
- `GET /files/:batch_id` - List uploaded files for a batch
  - Returns all files for the given batch ordered by upload time

### W_Upload v16 (Planned)
**New Workflow - To Be Implemented in n8n UI:**
- Webhook: POST `/w-upload` (multipart/form-data)
- Handles file uploads from frontend
- Saves to `/data/uploads/{client_id}/{batch_id}/{uuid}.ext`
- Extracts video frames using ffmpeg (4 frames per video)
- Updates files table with status

### W_Onboarding_Complete v16 (Planned)
**New Workflow - To Be Implemented in n8n UI:**
- Webhook: POST `/w-onboarding-complete`
- Finalizes upload-based onboarding
- Validates all files are ready
- Creates content_items linked to files
- Updates batch status to 'ready'

### W1: Ingest & Validate v16 (Planned Enhancement)
**Planned Changes:**
- Added `source_type` support for upload vs folder batches
- Upload batches query files table instead of scanning filesystem
- Backward compatible with existing folder-based batches

### React Frontend (socialflow-ui)
**New Components:**
- `FileUploader.tsx` - Drag-and-drop file uploader with previews
  - Supports photos (JPG, PNG, WebP) and videos (MP4, MOV, WebM)
  - 100MB max file size
  - Visual status indicators (pending, uploading, success, error)
- `Onboarding.tsx` - 4-step guided wizard
  - Step 1: Select client
  - Step 2: Create batch (name, description)
  - Step 3: Upload media files
  - Step 4: Review and confirm

**New Hooks:**
- `useUploads.ts` - Upload mutations and batch creation
  - `useUploadFile()` - Single file upload
  - `useUploadFiles()` - Bulk upload with progress
  - `useCompleteOnboarding()` - Finalize onboarding
  - `useCreateBatch()` - Create new batch

**New Routes:**
- `/onboarding` - Guided client onboarding wizard

**Sidebar:**
- Added "New Client" link to navigation

### Docker Infrastructure
- Custom `docker/n8n.Dockerfile` with ffmpeg for video frame extraction
- Added uploads volume: `/data/uploads`
- Updated `docker-compose.yml` and `docker-compose.vps.yml`

### Files Modified
| File | Changes |
|------|---------|
| `workflows/W_API_Endpoints_v16.json` | POST /batches, GET /files |
| `scripts/schema.sql` | files table, source_type, file_id |
| `docker/n8n.Dockerfile` | ffmpeg installation |
| `docker-compose.yml` | uploads volume |
| `docker-compose.vps.yml` | uploads volume |
| `socialflow-ui/src/pages/Onboarding.tsx` | 4-step wizard |
| `socialflow-ui/src/components/onboarding/FileUploader.tsx` | Upload component |
| `socialflow-ui/src/hooks/useUploads.ts` | Upload hooks |
| `socialflow-ui/src/api/client.ts` | Upload API functions |
| `socialflow-ui/src/api/types.ts` | Upload types |

### Remaining Implementation
The following n8n workflows need to be created manually in the n8n UI:

1. **W_Upload**: File upload handler with ffmpeg frame extraction
2. **W_Onboarding_Complete**: Batch finalization and content item creation

See `NEXT_STEPS.md` for detailed implementation instructions.

---

## Version 15.4 (2025-12-12)

### Overview
Content Scheduling Calendar feature implementation. This release adds a visual scheduling interface with week/month views, smart distribution, and bulk schedule updates.

### W-API: Endpoints v15.4
**New Route - Bulk Schedule Update:**
- `POST /batches/:client/:batch/schedule` - Update scheduled dates/times for multiple content items
- Request body: `{ items: [{ id, scheduled_date, scheduled_time, slot }], timezone?: string }`
- Response: `{ success: true, message: "Updated N items", data: { updated: N } }`
- Only affects items with `status='APPROVED'` (other statuses ignored)
- Validates date format (YYYY-MM-DD), time format (HH:MM:SS), and slot values ('feed'/'story')
- Uses client's timezone if not specified in request

**Implementation:**
- Added schedule update route in W-API workflow
- Database query updates `scheduled_date`, `scheduled_time`, and `slot` columns
- Returns count of actually updated items (may differ from requested if some are not approved)
- Proper error handling for invalid dates, times, or missing items

### React Frontend (socialflow-ui)

**New Components (src/components/scheduling/):**
- `index.tsx` - Main SchedulingCalendar component with week/month view toggle
- `WeekView.tsx` - Recurring weekday selector with start date picker
- `MonthView.tsx` - Visual month calendar for selecting specific dates
- `SchedulePreview.tsx` - Preview table showing scheduled items before saving
- `TimeConfig.tsx` - Time configuration for feed/story posts
- `types.ts` - TypeScript interfaces for scheduling
- `scheduleUtils.ts` - Date generation and item distribution utilities
- Full light/dark mode support with consistent theming

**UI Features:**
- **Week View**: Select recurring weekdays (Mon, Wed, Fri, etc.) + start date
- **Month View**: Click specific dates on visual calendar
- **Time Configuration**:
  - Feed posts: default 20:00 (8:00 PM), configurable
  - Story posts: default 18:30 (6:30 PM), configurable
- **Distribution Settings**:
  - Max items per day: 1-5 (default: 2)
  - Alphabetical distribution of approved content
  - Preview shows which items assigned to which dates
- **Save Actions**:
  - Preview before committing
  - Bulk update via API
  - Toast notifications for success/errors
  - Auto-refresh of batch data after save

**BatchDetail.tsx Integration:**
- New "Scheduling Calendar" tab
- Only available when batch has approved items
- Loads approved items filtered by `status='APPROVED'`
- Uses TanStack Query for data fetching and mutations
- Proper loading states and error handling

**New API Functions (src/api/client.ts):**
- `bulkUpdateSchedule(client, batch, items, timezone?)` - Calls bulk schedule endpoint
- Input validation for client/batch slugs
- Timeout: 60 seconds (standard request)

**New Hooks (src/hooks/useScheduleItems.ts):**
- `useScheduleItems({ clientSlug, batchSlug })` - Mutation hook for schedule updates
- Invalidates relevant queries on success: batch status, content items
- Error handling with toast notifications

**New Types (src/api/types.ts):**
- `ScheduleUpdate` - Individual item schedule update structure
- `UpdateBatchScheduleRequest` - Request payload type
- `UpdateBatchScheduleResponse` - Response structure

### User Workflow
1. Navigate to Batch Detail page
2. Click "Scheduling Calendar" tab (appears when approved items exist)
3. Choose view mode: Week or Month
4. **Week View**:
   - Select recurring weekdays (checkboxes)
   - Choose start date
   - Set feed/story times
   - Set max items per day
5. **Month View**:
   - Click dates on calendar to select
   - Set feed/story times
   - Set max items per day
6. Click "Preview Schedule" to see distribution
7. Review assignments in preview table
8. Click "Save Schedule" to commit
9. Success toast + data refresh

### Technical Details
**Date Distribution Algorithm:**
- Fetches approved items sorted alphabetically by filename
- Distributes items round-robin across selected dates
- Respects max items per day limit
- Alternates between feed and story slots
- Generates `scheduled_date`, `scheduled_time`, `slot` for each item

**Timezone Handling:**
- Uses client's configured timezone from `client.yaml`
- Can override via API request parameter
- Times stored in HH:MM:SS format (24-hour)

**Dark Mode Support:**
- Calendar component uses theme-aware colors
- Hover states adjust based on theme
- Selected dates highlighted appropriately
- Icons and text properly contrasted

### Testing Checklist
- [x] API endpoint validates date/time formats
- [x] API endpoint filters by APPROVED status
- [x] API endpoint returns correct update count
- [x] Week view selects recurring weekdays
- [x] Month view selects specific dates
- [x] Preview shows correct distribution
- [x] Save updates database correctly
- [x] Query invalidation refreshes UI
- [x] Dark mode renders properly
- [x] Error messages display for invalid inputs
- [x] Toast notifications work for success/error

### Files Modified
| File | Changes |
|------|---------|
| `W_API_Endpoints_v15.4.json` | Added `/batches/:client/:batch/schedule` route |
| `docs/API_REFERENCE.md` | Documented bulk schedule endpoint |
| `src/components/scheduling/index.tsx` | New SchedulingCalendar component |
| `src/components/scheduling/WeekView.tsx` | New week view component |
| `src/components/scheduling/MonthView.tsx` | New month view component |
| `src/components/scheduling/SchedulePreview.tsx` | New preview component |
| `src/components/scheduling/TimeConfig.tsx` | New time configuration component |
| `src/components/scheduling/types.ts` | New scheduling types |
| `src/components/scheduling/scheduleUtils.ts` | New utility functions |
| `src/pages/BatchDetail.tsx` | Added scheduling calendar tab |
| `src/api/client.ts` | Added `bulkUpdateSchedule` function |
| `src/api/types.ts` | Added schedule update types |
| `src/hooks/useScheduleItems.ts` | New hook for schedule mutations |

---

## Version 15.3 (2025-12-12)

### Overview
Batch isolation fix for content_id generation. Copying batches with identical files now creates separate database records instead of updating existing ones.

### W1: Ingest & Validate v15.3
**Critical Fix - Batch Isolation:**
- **Problem**: When copying a batch folder (e.g., `janvier` → `mars`) with identical files, the `content_id` was the same for both batches, causing SQLite `ON CONFLICT` to update existing records instead of inserting new ones. Result: "Ingested (0)" for copied batches.
- **Solution**: Added `batchName` to the `generateContentId` function.

**Old Format:**
```
{clientSlug}__{date}__{slot}__{mediaType}__{seq}
Example: iliass__20250115__feed__photo__01
```

**New Format:**
```
{clientSlug}__{batchName}__{date}__{slot}__{mediaType}__{seq}
Example: iliass__janvier__20250115__feed__photo__01
Example: iliass__mars__20250115__feed__photo__01
```

**Language-Specific Image Descriptions:**
- VLM prompts now use client's language (from `client.yaml`)
- Supported languages: French (fr), English (en), German (de)
- Default: French if language not specified
- Updated in both "Build VLM Request" and "Prepare VLM Retry" nodes

**Changes:**
- Modified `generateContentId(clientSlug, batchName, date, slot, mediaType, index)` to include batch name
- Updated function call to pass `ctx.batch_name`
- Added language-specific VLM prompts for image description
- Version comment updated to v15.3

**Migration Note:**
Existing content items retain old format IDs. Re-running ingest on existing batches will create new records with the new format (old records remain until manually cleaned).

---

## Version 15.2 (2025-12-11)

### Overview
W1 Ingest Progress Tracking + Database Schema Audit. This release adds real-time progress tracking to W1 (Ingest workflow) matching the W2 pattern, and consolidates all workflows to v15.2 for consistency.

### W1: Ingest & Validate v15.2
**New Features - Progress Tracking:**
- Real-time progress updates stored in `batches.ingest_progress` column
- Progress stages: `discovering` → `validating` → `describing` → `saving`
- File name tracking during processing
- Automatic cleanup on completion (sets progress to NULL)

**Implementation:**
- Progress initialization in "Auto-Discover & Schedule" node
- Progress updates in "Validate Media" node (validating stage)
- Progress updates in "Build VLM Request" node (describing stage)
- Progress cleanup in "Batch Report" node

**Progress JSON Structure:**
```json
{
  "current": 3,
  "total": 7,
  "stage": "describing",
  "file_name": "photo_003.jpg",
  "started_at": "2025-12-11T10:00:00.000Z"
}
```

### W-API: Endpoints v15.2
**New Route:**
- `GET /batches/:client/:batch/ingest-progress` - Real-time progress for W1 ingest

**Response:**
```json
{
  "success": true,
  "data": {
    "progress": { "current": 3, "total": 7, "stage": "describing", "file_name": "photo_003.jpg" },
    "started_at": "2025-12-11T10:00:00Z",
    "is_running": true
  }
}
```

### Database Schema Additions
**batches table - New Columns:**
- `ingest_progress TEXT` - JSON progress data for W1
- `ingest_started_at TEXT` - Timestamp when ingest started

**agent_instructions table - New Table:**
- Created for Phase 3 AI instruction cascade support
- Columns: id, agent_type, scope, scope_id, instruction_key, instruction_value, is_active, created_at, updated_at

### React Frontend (socialflow-ui)
**New Types (src/api/types.ts):**
- `IngestStage` - 'discovering' | 'validating' | 'describing' | 'saving'
- `IngestProgress` - Progress tracking structure
- `IngestProgressResponse` - API response wrapper

**New Query Key (src/api/queryKeys.ts):**
- `ingestProgress.byBatch(client, batch)` - Cache key for polling

**New API Function (src/api/client.ts):**
- `getIngestProgress(client, batch)` - Fetch ingest progress

**New Hook (src/hooks/useBatches.ts):**
- `useIngestProgress(client, batch, isIngesting)` - Polls every 2s while ingesting

**BatchDetail.tsx Enhancements:**
- Real-time progress bar during W1 ingest (was indeterminate spinner)
- Shows "Validating 3/7" or "Describing 3/7" with actual progress
- Displays current file being processed
- Progress bar fills based on completion percentage
- **NEW: "Batch Brief" tab** - Allows editing batch-level AI instructions
  - Describe what the batch is about (promo event, course pitch, etc.)
  - Instructions cascade: System → Client → Batch level
  - Saved to `agent_instructions` table with `scope='batch'`
  - Used by W2 when generating captions

### All Workflows Updated to v15.2
| Workflow | Previous | New |
|----------|----------|-----|
| W-API: Endpoints | v15 | v15.2 |
| W0: Late Account Sync | v15 | v15.2 |
| W1: Ingest & Validate | v15.1 | v15.2 |
| W2: AI Captions | v15 | v15.2 |
| W3: Late Scheduling | v15 | v15.2 |
| W-Agent1: Config Generator | v15 | v15.2 |
| W-Agent1: Batch Brief Generator | v15 | v15.2 |

### Test Results
- All 515 tests pass
- TypeScript type check passes
- All workflow JSON files validate

### Files Modified
| File | Changes |
|------|---------|
| `W1_Ingest_Validate_v15.2.json` | Progress init/update/cleanup in 4 nodes |
| `W_API_Endpoints_v15.2.json` | Added `/ingest-progress` endpoint |
| `src/api/types.ts` | IngestProgress types |
| `src/api/queryKeys.ts` | ingestProgress query key |
| `src/api/client.ts` | getIngestProgress function |
| `src/hooks/useBatches.ts` | useIngestProgress hook |
| `src/pages/BatchDetail.tsx` | Real-time progress UI, **Batch Brief tab** with AI instructions |

---

## Version 15.1 (2025-12-10)

### Overview
Deep code review fixes addressing 63 issues (5 P0 Critical, 17 P1 High, 22 P2 Medium, 19 P3 Low) across the React frontend API layer, hooks, and components.

### React API Layer (socialflow-ui/src/api)

#### Critical Security Fixes (P0)
- **client.ts**: Added `validateSlug()` helper to prevent path traversal attacks
  - Validates slug is non-empty string, rejects `..`, `/`, `\` characters, limits to 100 chars
  - Applied to all 18 functions accepting slug parameters
- **client.ts**: Added `validateId()` helper to prevent SQL injection via ID parameters
  - Validates and normalizes to positive integer
  - Applied to all 10 functions accepting ID parameters
- **client.ts**: Added `sanitizeErrorMessage()` to prevent XSS via backend error messages
  - Strips HTML tags and dangerous characters, limits to 500 chars
  - Applied in axios error interceptor
- **client.ts**: Added `API_TIMEOUTS` constant object
  - `DEFAULT: 60_000ms`, `TUNNEL_TEST: 15_000ms`, `WORKFLOW: 120_000ms`
- **client.ts**: Fixed race condition in `testCloudflareConnection()`
  - Replaced completion flag pattern with proper try-finally timeout cleanup
  - Added fallback for `crypto.randomUUID()` in older browsers

#### Query Key Fix (P1)
- **queryKeys.ts**: Replaced `JSON.stringify()` with explicit array structure in `contentItems.byBatch()`
  - Prevents cache key collision from inconsistent JSON serialization
  - Now uses ordered array: `[client, batch, status, limit, offset]`

### React Hooks (socialflow-ui/src/hooks)

#### Cache Invalidation Fix (P1)
- **useClients.ts**: Enhanced `useDeleteClient` mutation
  - Now invalidates `stats.all` query
  - Removes deleted client's detail cache via `removeQueries()`
  - Removes deleted client's batches cache

### React Components (socialflow-ui/src/components)

#### Memory Leak Prevention (P1)
- **ClientCard.tsx**: Added `isMountedRef` pattern with cleanup useEffect
  - Guards state updates and toasts in async `handleDelete` handler

#### Accessibility (P2)
- **ClientCard.tsx**: Added `aria-label` to delete button: `Delete ${client.name}`

### React Pages (socialflow-ui/src/pages)

#### Critical Fix (P0)
- **Settings.tsx**: Added `refetch` to useSettings destructuring (was undefined, caused crash)

#### Memory Leak Prevention (P1)
- **Clients.tsx**: Added `isMountedRef` guards to `handleDeleteAll` handler
- **BatchDetail.tsx**: Added `isMountedRef` guards to `handleReset` handler

#### Image Error Handling (P1)
- **BatchDetail.tsx**: Changed image `onError` from hiding element to showing SVG placeholder
  - Now displays broken image icon instead of disappearing

### Test Results
- All 515 tests pass
- TypeScript type check passes

### Files Modified
| File | Changes |
|------|---------|
| `src/api/client.ts` | validateSlug, validateId, sanitizeErrorMessage, API_TIMEOUTS, timeout race fix |
| `src/api/queryKeys.ts` | Explicit array structure for cache keys |
| `src/hooks/useClients.ts` | Enhanced cache invalidation in useDeleteClient |
| `src/components/ClientCard.tsx` | isMountedRef pattern, aria-label |
| `src/pages/Settings.tsx` | Added refetch to destructuring |
| `src/pages/Clients.tsx` | isMountedRef guards in handleDeleteAll |
| `src/pages/BatchDetail.tsx` | isMountedRef guards, image error placeholder |

---

## Version 15 (2025-12-10)

### Overview
Two-Agent Caption Generation System. This major release implements VLM-powered image description during ingest (W1) and a Generator + Supervisor agent loop for caption generation (W2) with full conversation logging.

### W1: Ingest & Validate v15
**New Features - VLM Image Description:**
- VLM image description generation for photos (videos skip - use frames in W2)
- Retry logic for VLM failures (max 1 retry, then continue without description)
- Objective description prompts: factual, not interpretive
- Smart skipping: videos, errors, missing files continue gracefully

**Implementation:**
- New nodes: Prepare Image Description, Call VLM, Handle VLM Response, Needs Retry?, Prepare VLM Retry
- Model: configurable via `settings.ollama.models.image_describer` (default: llava:7b)
- Timeout: configurable via `settings.caption_generation.description_timeout_ms` (default: 60s)
- VLM artifacts cleaned from responses ("The image shows...", etc.)

**Database:**
- Added `image_description TEXT` column to `content_items`
- Added `description_generated_at TEXT` column to `content_items`
- Existing descriptions preserved on re-ingest via COALESCE

### W2: AI Captions v15
**New Features - Two-Agent System:**
- **Caption Generator** (llama3.2:3b): Generates captions using image_description from W1
- **Caption Supervisor** (llama3.2:3b): Reviews quality, returns APPROVED or REVISION_NEEDED
- Revision loop: max 3 rounds (configurable), feedback passed between rounds
- Generation progress tracking: real-time updates in `batches.generation_progress`
- AI conversation logging: full history in `ai_conversations` table

**Implementation:**
- Text-only generation (VLM runs once in W1, text LLM iterates quickly in W2)
- Session tracking with unique IDs per generation attempt
- Revision history accumulated across rounds
- Graceful degradation: supervisor failures auto-approve, max rounds accept caption
- Multi-language support: French/English prompts for both agents

**Prompt Templates:**
- Generator: Brand voice + batch brief + image description → draft caption
- Supervisor: Evaluates emotion, hook, CTA, length, brand match → APPROVED/REVISION_NEEDED

### W_API: Endpoints v15
**New Routes:**
- `GET /batches/:client/:batch/generation-progress` - Real-time progress for UI polling
- `GET /items/:client/:batch/:content_id/conversations` - AI conversation log per item

**Progress Response:**
```json
{
  "progress": { "current": 5, "total": 20, "stage": "generating", "round": 2 },
  "started_at": "2025-12-10T14:30:00Z",
  "is_running": true
}
```

**Conversations Response:**
- Grouped by `session_id` for multi-round display
- Includes agent_type, model, round_number, role, prompt/response, duration_ms

### React Frontend (socialflow-ui)
**New Components:**
- `AIConversationViewer.tsx` - Dialog to view AI conversation history per item
- Integration in `ContentPreviewCard.tsx` - "AI Log" button for NEEDS_REVIEW items

**BatchDetail.tsx Enhancements:**
- Progress indicator during W2 generation
- Polls `/generation-progress` every 2s
- Shows current item, total, and revision round
- Purple-themed progress bar with Bot icon

**New API Functions:**
- `getGenerationProgress(client, batch)` - Fetch generation progress
- `getItemConversations(client, batch, contentId)` - Fetch AI conversation logs

**New Types:**
- `GenerationProgress` - Progress tracking structure
- `AIConversation`, `AIConversationSession` - Conversation log types

### Database Schema (v12)
**New Table:**
```sql
CREATE TABLE ai_conversations (
    id INTEGER PRIMARY KEY,
    content_id TEXT NOT NULL,
    batch_id INTEGER NOT NULL,
    session_id TEXT NOT NULL,
    agent_type TEXT NOT NULL,      -- 'image_describer', 'caption_generator', 'caption_supervisor'
    agent_model TEXT NOT NULL,
    round_number INTEGER NOT NULL,
    role TEXT NOT NULL,            -- 'user', 'assistant'
    prompt TEXT,
    response TEXT,
    duration_ms INTEGER,
    status TEXT DEFAULT 'success',
    error_message TEXT,
    created_at TEXT
);
```

**Modified Tables:**
- `content_items`: Added `image_description`, `description_generated_at`
- `batches`: Added `generation_progress`, `generation_started_at`

### Configuration (settings.json)
**New Settings:**
```json
{
  "ollama": {
    "models": {
      "image_describer": "llava:7b",
      "caption_generator": "llama3.2:3b",
      "caption_supervisor": "llama3.2:3b"
    }
  },
  "caption_generation": {
    "max_revision_rounds": 3,
    "description_timeout_ms": 60000,
    "generator_timeout_ms": 120000,
    "supervisor_timeout_ms": 60000
  }
}
```

### Testing Checklist
- [x] W1: Photo ingest generates VLM description
- [x] W1: Video ingest skips VLM (uses frames in W2)
- [x] W1: VLM failure retries once, then continues
- [x] W2: Generator uses text LLM with image_description
- [x] W2: Supervisor reviews and provides feedback
- [x] W2: Loop exits after APPROVED or max rounds
- [x] W2: Conversations logged to database
- [x] W2: Progress updates during generation
- [x] API: Progress endpoint returns current state
- [x] API: Conversations endpoint returns logs grouped by session
- [x] UI: Progress bar shows during W2 generation
- [x] UI: AI Log button opens conversation viewer

---

## Version 14.4 (2025-12-08)

### Overview
Comprehensive code review fix release addressing 25+ issues across workflows, React components, and API layer. Focus on database connection safety, race condition prevention, cache invalidation improvements, accessibility, and memory leak prevention.

### W0: Late Account Sync v14.4
**Critical Fix:**
- Added `try/finally` pattern for database connection safety - prevents connection leaks on errors

### React API Layer (socialflow-ui)
**Critical Fixes:**
- **queryKeys.ts**: Normalized options object in `contentItems.byBatch` to ensure consistent cache keys - prevents cache misses from undefined vs missing values
- **client.ts**: Fixed Cloudflare timeout race condition using completion flag pattern
- **client.ts**: Added strict validation for batch scopeId format - throws error for invalid `client/batch` format
- **useItemActions.ts**: Added type guards to predicate functions (`Array.isArray(key)`) for type safety
- **useItemActions.ts**: Added error logging to `onError` callbacks

### React Hooks (socialflow-ui)
**Cache Invalidation Fixes:**
- **useBatches.ts**: Changed `staleTime` to half of poll interval for better tab visibility handling
- **useBatches.ts**: Added `refetchOnWindowFocus: true` for immediate refresh when returning to tab
- **useBatches.ts**: Added predicate-based invalidation for content items in all mutations
- **useAccounts.ts**: Removed duplicate invalidation - uses `onSettled` only instead of both `onSuccess` and `onSettled`
- **useContentItems.ts**: Changed disabled query key from `__disabled__` string to `null`

### React Components (socialflow-ui)
**Memory Leak Prevention:**
- **Accounts.tsx**: Added `isMountedRef` pattern for async `handleSync` handler
- **Dashboard.tsx**: Added `isMountedRef` pattern for async `handleSync` handler
- **Clients.tsx**: Added `isMountedRef` pattern for `handleRestore` and `handleDeleteArchived`

**Accessibility Improvements:**
- **ApprovalBoard.tsx**: Added `aria-label` to Select All checkbox
- **Clients.tsx**: Added `aria-label` and `aria-hidden` to delete button/icon

### Files Modified
| File | Changes |
|------|---------|
| `W0_Late_Sync_v14.json` | DB connection try/finally pattern |
| `src/api/queryKeys.ts` | Normalize options for consistent cache keys |
| `src/api/client.ts` | Timeout race condition fix, scopeId validation |
| `src/hooks/useItemActions.ts` | Type guards, error logging |
| `src/hooks/useBatches.ts` | staleTime, refetchOnWindowFocus, predicate invalidation |
| `src/hooks/useAccounts.ts` | Remove duplicate invalidation |
| `src/hooks/useContentItems.ts` | Disabled query key fix |
| `src/pages/Accounts.tsx` | isMountedRef pattern |
| `src/pages/Dashboard.tsx` | isMountedRef pattern |
| `src/pages/Clients.tsx` | isMountedRef, aria-label |
| `src/pages/ApprovalBoard.tsx` | aria-label for checkbox |

---

## Version 14.3 (2025-12-08)

### Overview
Code review fix release addressing critical issues in workflows, API layer, and React components. Focus on database connection safety, URL encoding, memory leak prevention, and cache invalidation improvements.

### W2: AI Captions v14.3
**Critical Fixes:**
- Parse Response node: Added null safety check for previous node data with proper error return
- Load Config node: Fixed database connection leak - added `try/finally` pattern with `overrideDb.close()`

### React API Layer (socialflow-ui)
**Critical Fixes:**
- **client.ts**: Fixed batch route construction in `getAgentInstructions` and `updateAgentInstruction`
  - Now properly splits `client/batch` scopeId format into separate path segments
  - Added `encodeURIComponent()` to all URL route parameters
- **useItemActions.ts**: Fixed cache invalidation - now uses `predicate` function to match all batch queries
- **useAccounts.ts**: Removed `setTimeout` race condition - uses proper query invalidation
- **useBatches.ts**: Added `staleTime` equal to poll interval to prevent unnecessary refetches

### React Components (socialflow-ui)
**Memory Leak Prevention:**
- **BatchDetail.tsx**: Added `isMountedRef` pattern for all three workflow handlers (`handleIngest`, `handleGenerate`, `handleSchedule`)
- **ClientDetail.tsx**: Fixed useEffect dependency issue using `lastInitKey` ref pattern to properly track when to re-initialize instruction state

### Files Modified
| File | Changes |
|------|---------|
| `W2_AI_Captions_v14.json` | Parse Response null check, Load Config DB leak fix |
| `src/api/client.ts` | Batch route fix, URL encoding for all route params |
| `src/hooks/useItemActions.ts` | Cache invalidation pattern fix |
| `src/hooks/useAccounts.ts` | Removed setTimeout, proper invalidation |
| `src/hooks/useBatches.ts` | Added staleTime for refetchInterval |
| `src/pages/BatchDetail.tsx` | isMountedRef pattern for async handlers |
| `src/pages/ClientDetail.tsx` | Fixed useEffect dependency loop |

---

## Version 14.2 (2025-12-07)

### Overview
Comprehensive bug fix release addressing 50+ issues across workflows, React components, and API layer. Focus on null safety, memory leak prevention, and test suite improvements.

### W2: AI Captions v14.2
**Bug Fixes:**
- Fixed null check in Parse Response node: `$('Prepare Request').item?.json` now properly handles undefined
- Added bounds check in Update Database node for empty items array
- Improved error logging with database path validation

### W3: Late Scheduling v14.2
**Bug Fixes:**
- Fixed file hash validation for approved items
- Now validates file changes even when `approved_file_hash` is null
- Added fallback to `file_hash` (ingest hash) when no approval hash exists
- Improved error logging with `FILE_CHANGED_SINCE_INGEST` error code

### W1: Ingest & Validate v14.2
**Bug Fixes:**
- Improved empty batch error message with directory paths
- Added bounds check for `scheduleDates` array logging
- Better handling of edge case when no media files found

### W_API: Endpoints v14.2
**Bug Fixes:**
- Added `fs.existsSync()` check before opening archive database
- Fixed all 3 archive endpoints (archive, list, restore) with proper error handling
- Returns helpful error when archive database not initialized

### React Components (socialflow-ui)
**Memory Leak Prevention:**
- Settings.tsx: Added `isMountedRef` pattern for async handlers
- CreateClient.tsx: Added `isMountedRef` pattern for async handlers
- ClientDetail.tsx: Added `isMountedRef` pattern for async handlers

**Null Safety:**
- ApprovalBoard.tsx: Added ID validation in `handleApprove`, `handleReject`, `handleEditCaption`
- ApprovalBoard.tsx: Fixed `selectAll` to filter out null IDs
- ApprovalBoard.tsx: Fixed `toggleSelection` to handle undefined IDs

### API Layer (socialflow-ui)
**Already Fixed in v14.1:**
- useBatches.ts: Added batch status invalidation to workflow mutations
- useItemActions.ts: Added batch invalidation to approve/reject
- client.ts: Added 15s timeout to testCloudflareConnection
- queryKeys.ts: Fixed mutable object in cache key with JSON.stringify
- useContentItems.ts: Fixed useContentItem fallback key

### Test Suite
**Fixes:**
- Settings.test.tsx: Changed `ollama-model-input` to `ollama-model-select` (6 occurrences)
- Sidebar.test.tsx: Updated version from "Phase 1 • v1.0" to "Phase 2.6 • v2.1"
- handlers.ts: Added dynamic route matching for `/clients/:slug`, `/clients/:slug/batches`, `/batches/:client/:batch/status`

**Results:**
- Improved from 128 test failures to 52 (59% improvement)
- TypeScript passes with no errors

---

## Version 14.1 (2025-12-07)

### Overview
Phase 2.7 Language-Specific Prompts. All AI prompts are now written in the client's native language instead of using runtime translation.

### W2: AI Captions v14.1
**Language-Specific Prompt Loading:**
- Now loads language-specific prompt files (`caption_generator_fr.md` or `caption_generator_en.md`)
- Falls back to default `caption_generator.md` if language-specific file not found
- Uses fully native language prompts in Prepare Request node (French or English)

**Prompt Changes:**
- French clients receive French prompts: "Écrivez une légende pour cette photo..."
- English clients receive English prompts: "Write a caption for this photo..."
- No more "Write in French" instructions in English prompts

### W_Agent1_Config v14.1
**Language-Conditional Prompts:**
- Added `isEnglish` flag in Prepare Context node
- Generate Brief node uses conditional prompts:
  - French: "Vous êtes un stratège de contenu pour les réseaux sociaux..."
  - English: "You are a social media content strategist..."
- Generate Hashtags node uses conditional prompts
- Language-specific fallback briefs in Extract Brief node

### New Files
- `_config/agents/caption_generator_fr.md` - French caption prompt (all instructions in French)
- `_config/agents/caption_generator_en.md` - English caption prompt (all instructions in English)

### Supported Languages
| Code | Language | Status |
|------|----------|--------|
| `fr` | French | Full support |
| `en` | English | Full support |
| `de` | German | Pending (uses French fallback) |

---

## Version 14 (2025-12-07)

### Overview
Phase 3 AI Agent System implementation. Adds instruction cascade support for AI agents, allowing system/client/batch level prompt customization. New W-Agent1 workflows for AI-assisted configuration generation.

### W-API: Endpoints v14
**New Features:**
- Added 8 new API routes for agent instruction management:
  - `GET/PUT /agents/settings` - Manage agent models and master prompts
  - `GET/PUT /agents/instructions` - System-level instruction overrides
  - `GET/PUT /clients/:slug/instructions` - Client-level instruction overrides
  - `GET/PUT /batches/:client/:batch/instructions` - Batch-level instruction overrides
- Per-agent model configuration support in `settings.json`
- Master prompt file management (`_config/agents/*.md`)

### W0: Late Account Sync v14
- Version bump from v13
- Updated console log messages to reflect v14
- No functional changes (account sync doesn't need instruction cascade)

### W1: Ingest & Validate v14
- Version bump from v13
- Updated console log messages to reflect v14
- No functional changes (media ingestion doesn't need instruction cascade)

### W2: AI Captions v14
**Major Changes - Instruction Cascade:**
- Loads system-level master prompt from `_config/agents/caption_generator.md`
- Queries `agent_instructions` table for system/client/batch overrides
- Builds merged instruction context with all levels
- Uses per-agent model from `settings.ollama.models.caption_generator`
- Graceful error handling for missing prompts or database errors

**Instruction Cascade Order:**
1. System prompt (from .md file)
2. System override (from database, scope='system')
3. Client override (from database, scope='client')
4. Batch override (from database, scope='batch')

### W3: Late Scheduling v14
- Version bump from v13
- Updated console log messages to reflect v14
- No functional changes (scheduling doesn't need instruction cascade)

### W_Agent1_Config v14 (New)
**New Workflow:**
- Generates client configuration files from onboarding data
- Outputs: `client.yaml`, `brief.txt`, `hashtags.txt` (brief_short.txt removed - single brief for photos AND videos)
- Strong language support - ALL content generated in the selected language
- Supports system-level instruction overrides from database
- Uses `config_generator` agent type
- Model: `llama3.2:3b` (configurable via settings)
- Improved response parsing with escaped newline handling

### W_Agent1_Batch v14 (New)
**New Workflow:**
- Generates batch brief files for existing clients
- Supports system + client level instruction overrides
- Uses `config_generator` agent type
- Inherits brand voice from existing client configuration

### Database Changes
**New Table: `agent_instructions`**
```sql
CREATE TABLE agent_instructions (
  id INTEGER PRIMARY KEY,
  agent_type TEXT NOT NULL,
  scope TEXT NOT NULL,           -- 'system', 'client', 'batch'
  scope_id INTEGER,              -- NULL for system, or client_id/batch_id
  instruction_key TEXT NOT NULL, -- 'override', 'style', etc.
  instruction_value TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TEXT,
  updated_at TEXT,
  UNIQUE(agent_type, scope, scope_id, instruction_key)
);
```

### Configuration Changes
**settings.json - New Fields:**
```json
{
  "ollama": {
    "models": {
      "caption_generator": "llava:7b",
      "config_generator": "llama3.2:3b"
    }
  }
}
```

**New Files:**
- `_config/agents/caption_generator.md` - Caption generation system prompt
- `_config/agents/config_generator.md` - Config generation system prompt

---

## Version 13 (2025-12-06)

### Overview
Unified version across all workflows. This release focuses on code quality, documentation consistency, and JavaScript tidying.

### All Workflows (W0, W1, W2, W3)
- **Version Unification**: All workflows now at v13 for consistency with W-API
- **JavaScript Tidying**: Refactored all embedded JS code with:
  - JSDoc-style comments (`/** @type {...} */`)
  - Consistent variable naming and formatting
  - Improved inline documentation
  - Better error message formatting
- **Code Cleanup**: Removed redundant code, standardized structure

### W-API: Endpoints v13
- No functional changes from v12
- Already at v13 from Phase 2 implementation
- Full REST API with archive endpoints, job tracking, hybrid batch discovery

### W0: Late Account Sync v13
- Tidied JavaScript code in all Code nodes
- Added JSDoc comments for type hints
- Improved error handling messages

### W1: Ingest & Validate v13
- Refactored all JavaScript sections with proper documentation
- Cleaner config loading and validation logic
- Improved batch report formatting

### W2: AI Captions v13
- Tidied prompt building and response parsing code
- Better structured image loading for Ollama
- Improved error messages for caption failures

### W3: Late Scheduling v13
- Cleaner pre-flight URL validation code
- Improved Late API integration error handling
- Better status update logic

---

## Version 12 (2025-12-05)

### W-API: Endpoints v12
**Major Changes:**
- Added **Archive System** for client management:
  - `POST /clients/:slug/archive` - Archive a client and all associated data
  - `GET /archive/clients` - List all archived clients with batch/item counts
  - `POST /archive/clients/:id/restore` - Restore an archived client
  - `DELETE /archive/clients/:id` - Permanently delete from archive
- Fixed DELETE client route - now includes slug in error messages
- Fixed syntax errors from corrupted code (duplicate closing braces)

**Archive Database Schema** (`socialflow_archive.db`):
- `archived_clients` - Stores archived client records
- `archived_accounts` - Stores archived social accounts
- `archived_batches` - Stores archived batch records
- `archived_content_items` - Stores archived content items

### W0: Late Account Sync v12
- No functional changes from v11
- Version bump for consistency

### W1: Ingest & Validate v12
- No functional changes from v11
- Version bump for consistency

### W2: AI Captions v12
- No functional changes from v11
- Version bump for consistency

### W3: Late Scheduling v12
- No functional changes from v11
- Version bump for consistency

---

## Version 11 (2025-12-05)

### Overview
Complete migration from Google Sheets to SQLite database for better performance and reliability.

### W-API: Endpoints v11
- New REST API layer for UI integration
- CORS support for cross-origin requests
- Routes for clients, batches, items, settings
- Support for GET, POST, PUT, DELETE methods
- Job tracking endpoints for workflow status

### W0: Late Account Sync v11
- Syncs social accounts from Late.com API
- Updates `late_accounts.json` cache file
- Updates usernames in SQLite accounts table
- Health status tracking (healthy/warning/expired)

### W1: Ingest & Validate v11
- Reads batch folders from filesystem
- Validates media files (photos/videos)
- Creates/updates records in SQLite database
- Generates content IDs
- Detects READY.txt gate file

### W2: AI Captions v11
- Generates captions using Ollama (llava:7b)
- Processes items with NEEDS_AI status
- Supports photos and videos (multi-frame analysis)
- Uses client brief files for context

### W3: Late Scheduling v11
- Sends approved content to Late.com
- Freeze-on-approval validation (file hash check)
- Updates status to SCHEDULED
- Stores Late post IDs

---

## File Naming Convention

```
W{N}_{Name}_v{Version}.json

Current Files (v16):
- W0_Late_Sync_v16.json
- W1_Ingest_Validate_v16.json
- W2_AI_Captions_v16.json
- W3_Late_Scheduling_v16.json
- W_API_Endpoints_v16.json       ← Updated with POST /batches, GET /files
- W_Agent1_Config_v16.json
- W_Agent1_Batch_v16.json
- W_Upload_v16.json              ← NEW (To be created in n8n UI)
- W_Onboarding_Complete_v16.json ← NEW (To be created in n8n UI)
```

## Import Order

When setting up a fresh n8n instance:

1. W_API_Endpoints_v16.json (API layer)
2. W0_Late_Sync_v16.json (Account sync)
3. W1_Ingest_Validate_v16.json (Content ingestion)
4. W2_AI_Captions_v16.json (AI processing)
5. W3_Late_Scheduling_v16.json (Publishing)
6. W_Agent1_Config_v16.json (AI config generation - optional)
7. W_Agent1_Batch_v16.json (AI batch briefs - optional)
8. W_Upload_v16.json (Upload handling - for guided onboarding)
9. W_Onboarding_Complete_v16.json (Onboarding finalization - for guided onboarding)

## Required Credentials

- **Late API Key** - For W0 and W3
- **Google Sheets OAuth2** - (Deprecated in v11+, kept for legacy)

## Database Files

- `C:/Clients/_config/socialflow.db` - Main application database
- `C:/Clients/_config/socialflow_archive.db` - Archive database (v12+)
- `C:/Clients/_config/late_accounts.json` - Late.com account cache
- `C:/Clients/_config/settings.json` - Application settings
