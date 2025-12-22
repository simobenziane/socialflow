# SocialFlow Changelog

## v16.9.1 - Late API Authentication Fix (2025-12-20)

### Fix
Fixed Late.com API authentication to use `X-API-Key` header instead of `Authorization: Bearer` for `sk_` prefixed API keys.

### Changes
- Updated `/late/connect` endpoint to use `X-API-Key` header with Bearer fallback
- Updated `/late/sync` endpoint to use `X-API-Key` header
- Created `scripts/update-api-late-endpoints-v3.js` update script

### Deployment
1. Run: `node scripts/update-api-late-endpoints-v3.js`
2. Re-import `W_API_Endpoints_v16.json` in n8n

---

## v16.9 - Late.com API Key Management (2025-12-20)

### Feature
Manage Late.com API key directly from the Settings page. The API key is securely stored in the database and never returned to the frontend after saving.

### New Settings Section
- **Late.com Integration**: First collapsible section in Settings
- **API Key Input**: Password field for entering Late.com API key
- **Connect Button**: Validates key with Late.com API before storing
- **Sync Button**: Refreshes profiles and accounts from Late.com
- **Disconnect Button**: Removes stored API key

### New API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/late/status` | GET | Check if API key is configured |
| `/late/connect` | POST | Validate and store API key |
| `/late/sync` | POST | Sync profiles and accounts |
| `/late/profiles` | GET | Get cached profiles |
| `/late/disconnect` | POST | Remove API key |

### Database Changes
- Added `late_config` table for secure API key storage
- Migration script: `scripts/migrate-late-config.js`

### Files Created
| File | Description |
|------|-------------|
| `scripts/migrate-late-config.js` | Database migration script |
| `scripts/update-api-late-endpoints.js` | Workflow update script |
| `socialflow-ui/src/hooks/useLateConfig.ts` | React hooks for Late config |

### Files Modified
| File | Changes |
|------|---------|
| `scripts/schema.sql` | Added late_config table |
| `workflows/W_API_Endpoints_v16.json` | Added Late API endpoints |
| `socialflow-ui/src/api/types.ts` | Added Late config types |
| `socialflow-ui/src/api/client.ts` | Added Late API functions |
| `socialflow-ui/src/api/queryKeys.ts` | Added Late query keys |
| `socialflow-ui/src/hooks/index.ts` | Exported Late hooks |
| `socialflow-ui/src/pages/Settings.tsx` | Added Late Integration section |

### Deployment
1. Run migration: `node scripts/migrate-late-config.js`
2. Re-import `W_API_Endpoints_v16.json` in n8n
3. Deploy frontend: `docker-compose up -d --build`

---

## v16.8 - UI Cleanup (2025-12-20)

### Changes
- **Removed Sidebar "New Client"**: Eliminated redundant navigation entry (still accessible from Dashboard Quick Actions and Clients page header)
- **Cleaner Sidebar**: Now 4 items: Dashboard, Accounts, Clients, Settings

### Files Modified
| File | Changes |
|------|---------|
| `socialflow-ui/src/components/layout/Sidebar.tsx` | Removed "New Client" nav item |

### Files Deleted
| File | Reason |
|------|--------|
| `socialflow-ui/src/components/StatusCard.tsx` | Never imported/used |
| `socialflow-ui/src/UI-Tests/components/StatusCard.test.tsx` | Tested unused component |
| `socialflow-ui/src/UI-Tests/pages/Onboarding.test.tsx` | Tested deleted page |

---

## v16.7 - Consolidated Client Creation (2025-12-20)

### Feature
Merged two duplicate client creation pages (`/onboarding` and `/clients/new`) into a single wizard-style page at `/clients/new`. Removed unused file upload components.

### Changes
- **Single Entry Point**: All "New Client" links now go to `/clients/new`
- **Wizard-Style UI**: 3-step progress bar with Back/Next navigation
- **All Features Combined**: Includes all fields from both previous pages
- **Code Cleanup**: Removed ~500 lines of unused upload code

### New Wizard Structure
1. **Client Info**: Name, slug, type, language, timezone, business description, target audience, brand personality, advanced AI config (collapsible)
2. **Connect & Configure**: Late.com profile selection, Video AI captions toggle, posting schedule
3. **Review**: Summary of all settings, AI configuration info, Create button

### Files Rewritten
| File | Changes |
|------|---------|
| `socialflow-ui/src/pages/CreateClient.tsx` | Complete rewrite as 3-step wizard |

### Files Modified
| File | Changes |
|------|---------|
| `socialflow-ui/src/App.tsx` | Removed `/onboarding` route |
| `socialflow-ui/src/components/layout/Sidebar.tsx` | Changed "New Client" link to `/clients/new` |
| `socialflow-ui/src/hooks/index.ts` | Removed `useUploads` export |

### Files Deleted
| File | Reason |
|------|--------|
| `socialflow-ui/src/pages/Onboarding.tsx` | Replaced by new CreateClient wizard |
| `socialflow-ui/src/components/onboarding/FileUploader.tsx` | Never used |
| `socialflow-ui/src/components/onboarding/index.tsx` | Only exported deleted component |
| `socialflow-ui/src/hooks/useUploads.ts` | Never used |

---

## v16.6 - Late.com Scheduled Posts Display (2025-12-20)

### Feature
Display scheduled posts from Late.com directly in the client detail page. Posts are fetched on-demand via a Sync button and cached locally for fast loading.

### New Workflow
- **W4_Late_Posts_Sync_v16.json** - Syncs scheduled posts from Late.com API
  - Webhook trigger: `POST /w4-posts-sync?slug={clientSlug}`
  - Fetches posts with `status=scheduled` from Late API
  - Caches to `/data/clients/{slug}/scheduled_posts.json`
  - Returns sync summary with post count

### New API Endpoint
- **GET /clients/:slug/posts** - Returns cached scheduled posts
  - Reads from `scheduled_posts.json` cache file
  - Returns empty array if no cache exists yet

### New UI Components
- **ScheduledPostCard** - Individual post card with:
  - 4:5 aspect ratio media preview
  - Video hover-to-play (muted autoplay)
  - Platform badges (IG/TT)
  - Scheduled date/time display
  - Caption preview (line-clamp-2)

- **ScheduledPostsSection** - Collapsible section with:
  - Post count in header
  - Sync button with loading spinner
  - Last synced timestamp
  - Link to Late.com dashboard
  - Responsive grid: `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
  - Empty state with CTA

### New TypeScript Types
- `LatePost` - Scheduled post object
- `LatePostMedia` - Media item (image/video with URL)
- `LatePostPlatform` - Platform info (instagram/tiktok)
- `ScheduledPostsResponse` - API response wrapper

### New React Hooks
- `useScheduledPosts(slug)` - Fetch cached posts
- `useSyncScheduledPosts(slug)` - Trigger sync from Late.com

### Files Created
| File | Description |
|------|-------------|
| `workflows/W4_Late_Posts_Sync_v16.json` | Posts sync workflow |
| `socialflow-ui/src/hooks/usePosts.ts` | React hooks for posts |
| `socialflow-ui/src/components/ScheduledPostCard.tsx` | Post card component |
| `socialflow-ui/src/components/ScheduledPostsSection.tsx` | Section wrapper |
| `scripts/update-api-posts-endpoint.js` | Script to add API endpoint |

### Files Modified
| File | Changes |
|------|---------|
| `workflows/W_API_Endpoints_v16.json` | Added GET /clients/:slug/posts endpoint |
| `socialflow-ui/src/api/types.ts` | Added LatePost types |
| `socialflow-ui/src/api/client.ts` | Added getScheduledPosts, syncScheduledPosts |
| `socialflow-ui/src/api/queryKeys.ts` | Added posts query keys |
| `socialflow-ui/src/hooks/index.ts` | Exported new hooks |
| `socialflow-ui/src/pages/ClientDetail.tsx` | Integrated ScheduledPostsSection |

### Deployment
1. Re-import `W_API_Endpoints_v16.json` in n8n
2. Import `W4_Late_Posts_Sync_v16.json` as a new workflow in n8n
3. Deploy frontend build

---

## v16.5 - Simplified Onboarding (2025-12-20)

### Feature
Streamlined the onboarding wizard from 4 steps to 3 steps by removing the media upload step. Users now select a Late.com profile during onboarding and media is managed from the client detail page after creation.

### Changes
- **Removed Upload Step**: Onboarding no longer includes file uploads
- **Auto-Sync**: Late.com accounts automatically sync when opening the onboarding page
- **Manual Sync Button**: Added Sync button on Step 2 for manual refresh
- **Simplified Flow**:
  1. Client Info (name, slug, type, language, timezone, business description)
  2. Select Profile (Late.com profile with linked accounts preview)
  3. Generate (summary + create client with AI config)

### UI Improvements
- Cleaner 3-step progress indicator
- Summary screen shows all settings before creation
- AI configuration info card
- Memory leak prevention with `isMountedRef` checks

### Files Modified
| File | Changes |
|------|---------|
| `socialflow-ui/src/pages/Onboarding.tsx` | Complete rewrite: 3 steps, auto-sync, no uploads |

---

## v16.4 - Late.com Profile Linking (2025-12-20)

### Feature
Link clients to Late.com **profiles** instead of individual accounts. When selecting a profile during onboarding or client creation, all accounts under that profile are automatically linked.

### Database Changes
- Added `late_profile_id` column to `clients` table
- Run `scripts/migrate-late-profile.js` to add column to existing database

### API Changes
- `POST /clients` now accepts `late_profile_id`
- `PUT /clients/:slug` supports updating `late_profile_id`
- `GET /clients/:slug` returns `late_profile` object from cache
- Helper functions: `lookupProfileAccounts()`, `lookupProfile()`

### UI Changes
- **Onboarding Step 2**: Single profile dropdown replaces two account dropdowns
- **CreateClient**: Profile dropdown with preview of linked accounts
- **EditClient**: Profile dropdown with warning when changing profiles

### Files Modified
| File | Changes |
|------|---------|
| `scripts/schema.sql` | Added `late_profile_id` column |
| `scripts/migrate-late-profile.js` | Migration script (NEW) |
| `scripts/update-api-late-profile.js` | Workflow update script (NEW) |
| `socialflow-ui/src/api/types.ts` | Added `late_profile_id` to Client types |
| `workflows/W_API_Endpoints_v16.json` | Updated client CRUD handlers |
| `socialflow-ui/src/pages/Onboarding.tsx` | Profile dropdown in Step 2 |
| `socialflow-ui/src/pages/CreateClient.tsx` | Profile dropdown |
| `socialflow-ui/src/pages/EditClient.tsx` | Profile dropdown with change warning |

### Migration
1. Re-import `W_API_Endpoints_v16.json` in n8n
2. Run `node scripts/migrate-late-profile.js` on server to add column

---

## v16.3 - UI Bug Fixes (2025-12-20)

### Critical Bug Fixes

#### Memory Leak Prevention
- **CreateClient.tsx**: Added `isMountedRef` checks throughout `handleSubmit` async handler
  - Prevents React state updates on unmounted components
  - Wraps all `setSubmitPhase`, `toast`, and `navigate` calls with mount checks
  - File: `socialflow-ui/src/pages/CreateClient.tsx`

- **ClientDetail.tsx**: Added `isMountedRef` checks to workflow button handlers
  - `handleIngest`, `handleGenerate`, `handleSchedule` now check mount state before toast calls
  - Prevents memory leaks when navigating away during workflow operations
  - File: `socialflow-ui/src/pages/ClientDetail.tsx`

- **Settings.tsx**: Fixed missing `isMountedRef` check in final error handler
  - `setTestResult` and `setIsTesting` now wrapped in mount check
  - File: `socialflow-ui/src/pages/Settings.tsx`

#### Optimistic Update Rollback
- **BatchDetail.tsx**: Added rollback mechanism for `handleVideoAiSettingChange`
  - Stores previous value before optimistic update
  - Reverts to previous value on API error
  - Shows error toast on failure
  - File: `socialflow-ui/src/pages/BatchDetail.tsx`

### High Priority Fixes

#### API Client Improvements
- **syncAccounts timeout**: Changed from default 60s to `API_TIMEOUTS.WORKFLOW` (120s)
  - Prevents timeout during Late.com account sync
  - File: `socialflow-ui/src/api/client.ts:291`

- **URL encoding consistency**: Changed `createClientFolder` to use `encodeRoute(slug)` instead of `encodeURIComponent(slug)`
  - Maintains consistency with all other API functions
  - File: `socialflow-ui/src/api/client.ts:783`

- **rejectItem body fix**: Changed undefined body to empty object `{}`
  - `reason ? { reason } : {}` instead of `reason ? { reason } : undefined`
  - Ensures consistent request body format
  - File: `socialflow-ui/src/api/client.ts:618`

### Medium Priority Fixes

#### Null Safety
- **uploadFiles null safety**: Added optional chaining and filter
  - `results.map(r => r.data?.file).filter(Boolean)` prevents crashes on failed uploads
  - File: `socialflow-ui/src/api/client.ts:1035`

- **Onboarding.tsx batch_id check**: Added null check with proper error handling
  - Uses `batchResult.data?.batch_id` with error throw if undefined
  - Prevents runtime errors if batch creation fails silently
  - File: `socialflow-ui/src/pages/Onboarding.tsx:222-225`

---

## v16.2 - Workflow Bug Fixes (2025-12-20)

### n8n Workflow Fixes

#### W_API_Endpoints_v16.json

##### Delete All Clients Endpoint
- Added `DELETE /clients` endpoint handler
- Condition: `parts.length === 1 && method === 'DELETE'`
- Deletes all clients with cascade to batches and content_items
- Returns `{ success: true, message, deleted: count }`

##### Variable Scope Fix (igUsername)
- **Problem**: `const igUsername` declared inside `if` block but used outside
- **Error**: "igUsername is not defined" when creating clients
- **Fix**: Changed to `let igUsername = ''` declared before the if blocks
- Applied same fix to `ttUsername`

##### Account Username Lookup
- Added `lookupAccountUsername(accountId, platform)` helper function
- Reads from `/data/clients/_config/late_accounts.json` cache
- Falls back to accountId if username not found
- Used when populating `ig_username` and `tt_username` in client responses

#### W_Agent1_Config_v16.json

##### LLM Prompt Improvements
- Updated prompts to explicitly say "RESPOND ONLY WITH the actual content"
- Added instruction to never include greetings or conversational text
- Examples: "Avoid phrases like 'Here is...', 'Sure!', 'Voici...'"

##### Cleanup Regex Enhancement
- Added patterns for French preambles: "Bonjour", "Je suis ravi", "Voici"
- Added patterns for English preambles: "Here is", "Sure", "Certainly"
- Improved multiline cleanup with `.replace(/^[^{]*?(?=\{)/s, '')`

##### Temperature Adjustment
- Lowered LLM temperature from 0.4 to 0.3 for more deterministic outputs

---

## v16.1 - Batch Settings (Previous)

### Features
- Video AI caption setting per batch (inherit/enabled/disabled)
- Batch brief/description editing
- Generation progress tracking

---

## v16.0 - Guided Onboarding (Previous)

### Features
- 4-step onboarding wizard (Client Info, Connect Accounts, Upload Media, Generate)
- AI-generated client configuration
- File upload with progress tracking
- Batch creation during onboarding
- Schedule strategy selection (daily/weekdays/custom)

### Database Changes
- Added `id` to clients table
- Added `video_ai_captions` to batches table
- Added `files` table for upload tracking

---

## Files Modified in v16.3

| File | Changes |
|------|---------|
| `socialflow-ui/src/pages/CreateClient.tsx` | isMountedRef checks in handleSubmit |
| `socialflow-ui/src/pages/ClientDetail.tsx` | isMountedRef checks in workflow handlers |
| `socialflow-ui/src/pages/Settings.tsx` | isMountedRef check in error handler |
| `socialflow-ui/src/pages/BatchDetail.tsx` | Optimistic update rollback |
| `socialflow-ui/src/pages/Onboarding.tsx` | Null check for batch_id |
| `socialflow-ui/src/api/client.ts` | syncAccounts timeout, encoding, null safety |

## Files Modified in v16.2

| File | Changes |
|------|---------|
| `workflows/W_API_Endpoints_v16.json` | Delete all clients, variable scope, username lookup |
| `workflows/W_Agent1_Config_v16.json` | LLM prompts, cleanup regex, temperature |

---

## Migration Scripts Created

### v16.2 Scripts (in `/scripts`)
- `fix-account-usernames.js` - Adds username lookup helper to W_API_Endpoints
- `fix-llm-prompts.js` - Updates LLM prompts and cleanup in W_Agent1_Config

### Usage
```bash
cd scripts
npm install
node fix-account-usernames.js
node fix-llm-prompts.js
```

---

## Deployment

### Frontend Build & Deploy
```bash
cd socialflow-ui
npm run build
docker-compose up -d --build
```

### Container Ports
- Frontend (socialflow-ui): `http://localhost:3000`
- n8n Backend: `http://localhost:5678`

---

## Known Issues Resolved

1. **Spinning buttons after navigation** - Fixed with isMountedRef checks
2. **Delete all clients not working** - Added missing DELETE /clients endpoint
3. **"igUsername is not defined" error** - Fixed variable scope issue
4. **LLM outputs preamble text** - Improved prompts and cleanup regex
5. **Account usernames not showing** - Added lookup from late_accounts.json cache
6. **syncAccounts timing out** - Extended to 120s workflow timeout
7. **Optimistic updates not rolling back** - Added proper error handling with revert
