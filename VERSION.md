# SocialFlow Version Status

**Current Version:** v16.9.1
**Last Updated:** 2025-12-20

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| v16.9.1 | 2025-12-20 | Fixed Late API authentication (X-API-Key header) |
| v16.9 | 2025-12-20 | Late.com API key management from Settings page |
| v16.8 | 2025-12-20 | UI cleanup: removed redundant nav, deleted unused components |
| v16.7 | 2025-12-20 | Consolidated client creation: single wizard at /clients/new |
| v16.6 | 2025-12-20 | Late.com scheduled posts display with media previews |
| v16.5 | 2025-12-20 | Simplified onboarding: 3 steps, auto-sync, no uploads |
| v16.4 | 2025-12-20 | Late.com profile linking: select profile instead of individual accounts |
| v16.3 | 2025-12-20 | UI bug fixes: memory leaks, optimistic updates, null safety |
| v16.2 | 2025-12-20 | Workflow fixes: delete all clients, variable scope, LLM prompts |
| v16.1 | 2025-12-19 | Batch settings: video AI toggle, brief editing |
| v16.0 | 2025-12-18 | Guided onboarding wizard, AI config generation |

---

## v16.9 Features

### Late.com API Key Management
- **Settings Page Integration**: Enter Late.com API key directly from Settings
- **Secure Storage**: API key stored in SQLite database (never returned to frontend)
- **Validation**: Key validated with Late.com API before storing
- **Sync Button**: One-click sync of profiles and accounts after connecting
- **Disconnect Option**: Remove API key and disconnect from Late.com

### New API Endpoints
- `GET /late/status` - Check if API key is configured
- `POST /late/connect` - Validate and store API key
- `POST /late/sync` - Sync profiles and accounts
- `GET /late/profiles` - Get cached profiles
- `POST /late/disconnect` - Remove API key

### Database Changes
- Added `late_config` table for secure API key storage

---

## v16.8 Features

### UI Cleanup
- **Removed Sidebar "New Client"**: Redundant - available via Dashboard + Clients page
- **Cleaner Sidebar**: 4 items (Dashboard, Accounts, Clients, Settings)
- **Deleted Unused Code**: StatusCard component, orphan test files

---

## v16.7 Features

### Consolidated Client Creation
- **Single Entry Point**: `/clients/new` is now the only client creation page
- **Wizard UI**: 3-step progress bar (Client Info → Connect & Configure → Review)
- **All Features**: Includes Video AI toggle, posting schedule, advanced AI config
- **Test Data Button**: Quick fill with French bakery example data
- **Auto-Sync**: Late.com accounts sync automatically on page load

### Code Cleanup
- Deleted `/onboarding` route and page
- Removed unused FileUploader component
- Removed unused useUploads hooks
- ~500 lines of dead code removed

### Files Deleted
- `socialflow-ui/src/pages/Onboarding.tsx`
- `socialflow-ui/src/components/onboarding/` folder
- `socialflow-ui/src/hooks/useUploads.ts`

---

## v16.6 Features

### Late.com Scheduled Posts Display
- **On-Demand Sync**: Click Sync button to fetch latest posts from Late.com
- **Media Previews**: 4:5 aspect ratio with video hover-to-play
- **Platform Badges**: Instagram (IG) and TikTok (TT) indicators
- **Schedule Info**: Date/time display for each post
- **Caption Preview**: Truncated caption text
- **Cache-First**: Fast loading from local cache

### New Components
- `ScheduledPostCard` - Individual post preview card
- `ScheduledPostsSection` - Collapsible section in ClientDetail

### New Workflow
- `W4_Late_Posts_Sync_v16.json` - Syncs posts from Late API

### Files Created
- `workflows/W4_Late_Posts_Sync_v16.json`
- `socialflow-ui/src/hooks/usePosts.ts`
- `socialflow-ui/src/components/ScheduledPostCard.tsx`
- `socialflow-ui/src/components/ScheduledPostsSection.tsx`

---

## v16.5 Features

### Simplified Onboarding
- **3-Step Flow**: Client Info → Select Profile → Generate
- **Auto-Sync**: Late.com accounts sync automatically on page load
- **No Uploads**: Media is managed from client detail page after creation
- **Summary Screen**: Review all settings before creating client

### Files Modified
- `socialflow-ui/src/pages/Onboarding.tsx`

---

## v16.3 Features & Fixes

### Bug Fixes
- **Memory Leak Prevention**: Added `isMountedRef` checks in CreateClient, ClientDetail, and Settings pages
- **Optimistic Update Rollback**: BatchDetail now reverts on API errors
- **Null Safety**: Fixed potential crashes in uploadFiles and Onboarding
- **API Timeouts**: syncAccounts now uses 120s timeout
- **URL Encoding**: Consistent use of `encodeRoute` helper

### Files Modified
- `socialflow-ui/src/pages/CreateClient.tsx`
- `socialflow-ui/src/pages/ClientDetail.tsx`
- `socialflow-ui/src/pages/Settings.tsx`
- `socialflow-ui/src/pages/BatchDetail.tsx`
- `socialflow-ui/src/pages/Onboarding.tsx`
- `socialflow-ui/src/api/client.ts`

---

## v16.2 Features & Fixes

### Workflow Fixes
- **Delete All Clients**: Added `DELETE /clients` endpoint
- **Variable Scope**: Fixed `igUsername`/`ttUsername` declaration
- **Account Username Lookup**: Added helper to read from late_accounts.json cache

### LLM Improvements
- Improved prompts to output only content (no preambles)
- Enhanced cleanup regex for French/English greetings
- Lowered temperature from 0.4 to 0.3

### Files Modified
- `workflows/W_API_Endpoints_v16.json`
- `workflows/W_Agent1_Config_v16.json`

---

## v16 Architecture

### Frontend (React + TypeScript)
- **Location**: `socialflow-ui/`
- **Port**: 3000
- **Build**: `npm run build`
- **Deploy**: `docker-compose up -d`

### Backend (n8n Workflows)
- **Location**: `workflows/`
- **Port**: 5678
- **Workflows**:
  - `W_API_Endpoints_v16.json` - REST API
  - `W1_Ingest_Validate_v16.json` - Media ingestion
  - `W2_AI_Captions_v16.json` - AI caption generation
  - `W_Agent1_Config_v16.json` - Client config generation
  - `W4_Late_Posts_Sync_v16.json` - Late.com posts sync (v16.6)

### Database (SQLite)
- **Location**: `/data/clients/_config/socialflow.db`
- **Schema**: `scripts/schema.sql`

---

## Deferred Features (v17+)

The following features are documented but **not implemented**:

1. **Database-based file uploads**
   - `files` table for upload tracking
   - W-Upload workflow for handling uploads
   - Automatic video frame extraction

2. **S3/R2 Cloud Storage**
   - External storage integration
   - CDN delivery

See `docs/CLIENT_ONBOARDING_PLAN.md` for full details.

---

## Quick Start

```bash
# Frontend
cd socialflow-ui
npm install
npm run build
docker-compose up -d

# Access
# Frontend: http://localhost:3000
# n8n: http://localhost:5678
```

---

## Documentation

| Document | Description |
|----------|-------------|
| `CHANGELOG.md` | Detailed change log for all versions |
| `docs/SETUP.md` | Initial setup instructions |
| `docs/API_REFERENCE.md` | API endpoint documentation |
| `docs/WEBHOOK_API_REFERENCE.md` | Workflow webhook documentation |
| `docs/CLIENT_ONBOARDING_PLAN.md` | Deferred upload feature plan |
| `docs/GUIDED_ONBOARDING_IMPLEMENTATION.md` | Onboarding wizard details |
