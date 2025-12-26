-- ═══════════════════════════════════════════════════════════════════════════════
-- SOCIALFLOW v17 DATABASE SCHEMA
-- SQLite Database for local content management
--
-- Version History:
-- v12: Added image_description, ai_conversations table, generation_progress
-- v15: Added batch_status composite index for performance
-- v16: Added files table for upload-based onboarding, source_type for batches
-- v16.1: Added video_ai_captions setting to clients and batches
-- v16.4: Added late_profile_id for profile-based account linking
-- v16.9: Added late_config table for secure API key storage
-- v17: Workflow reorganization, numbered prefixes, bug fixes consolidated
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- ═══════════════════════════════════════════════════════════════════════════════
-- CLIENTS TABLE
-- Stores client configuration and brand information
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'business',  -- 'restaurant', 'cafe', 'bar', 'retail', 'other'
    is_active INTEGER DEFAULT 1,
    language TEXT DEFAULT 'fr',
    timezone TEXT DEFAULT 'Europe/Paris',

    -- Posting Schedule
    feed_time TEXT DEFAULT '20:00',
    story_time TEXT DEFAULT '18:30',

    -- Brand info
    brand_voice TEXT,
    brand_target_audience TEXT,
    brand_description TEXT,

    -- Hashtags (JSON array)
    hashtags TEXT,  -- JSON: ["#tag1", "#tag2"]

    -- Platform defaults (JSON)
    platform_defaults TEXT,  -- JSON: {photos: {feed: "ig"}, videos: {feed: "ig,tt"}}

    -- Policy (JSON)
    policy TEXT,  -- JSON: {require_video_frames: true, ...}

    -- AI Generation (Phase 3)
    onboarding_data TEXT,  -- JSON: original form responses from onboarding
    ai_generated INTEGER DEFAULT 0,  -- 1 if config files were AI-generated

    -- AI Caption Settings (v16.1)
    video_ai_captions INTEGER DEFAULT 0,  -- 0 = skip AI (manual captions), 1 = generate AI captions for videos
    photo_ai_captions INTEGER DEFAULT 1,  -- 0 = skip AI (manual captions), 1 = generate AI captions for photos

    -- Late.com Profile Linking (v16.4)
    late_profile_id TEXT,  -- Links to Late.com profile ID; all accounts under this profile belong to this client

    -- Timestamps
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ACCOUNTS TABLE
-- Per-client social media accounts (multiple per platform supported)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    platform TEXT NOT NULL,  -- 'instagram', 'tiktok'
    late_account_id TEXT NOT NULL,
    username TEXT,
    display_name TEXT,
    profile_picture_url TEXT,
    is_active INTEGER DEFAULT 1,
    is_default INTEGER DEFAULT 0,
    last_sync_at TEXT,

    -- Late API metadata
    access_token_expires_at TEXT,
    account_status TEXT DEFAULT 'healthy',  -- 'healthy', 'token_expired', 'disconnected'

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    UNIQUE(client_id, platform, late_account_id)
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- BATCHES TABLE
-- Batch/project configuration per client
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,

    -- Brief for AI caption generation
    brief TEXT,

    -- Hashtags (JSON array)
    hashtags TEXT,

    -- Schedule config (JSON)
    schedule_config TEXT,  -- JSON: {start_date, strategy, defaults, ...}

    -- Folder path (for legacy folder-based batches)
    folder_path TEXT,

    -- Source type (v16): how content was added
    source_type TEXT DEFAULT 'folder',  -- 'folder' (legacy) or 'upload' (new)

    -- Status
    status TEXT DEFAULT 'draft',  -- draft, ready, processing, completed

    -- AI Generation (Phase 3)
    ai_generated_brief INTEGER DEFAULT 0,  -- 1 if brief was AI-generated

    -- AI Caption Settings (v16.1)
    video_ai_captions INTEGER DEFAULT NULL,  -- NULL = inherit from client, 0 = skip, 1 = generate
    photo_ai_captions INTEGER DEFAULT NULL,  -- NULL = inherit from client, 0 = skip, 1 = generate

    -- Generation Progress (v12)
    generation_progress TEXT,  -- JSON: {current: 5, total: 20, stage: 'generating', round: 2}
    generation_started_at TEXT,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    UNIQUE(client_id, slug)
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- CONTENT ITEMS TABLE
-- Main content tracking table
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS content_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id TEXT UNIQUE NOT NULL,  -- e.g., "client__20241209__feed__photo__01"

    -- Relationships
    client_id INTEGER NOT NULL,
    batch_id INTEGER NOT NULL,

    -- Media info
    media_type TEXT NOT NULL,  -- 'photo', 'video'
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_hash TEXT,
    file_size INTEGER,
    media_url TEXT,
    preview_url TEXT,

    -- Video extras
    frames_used TEXT,  -- Semicolon-separated paths
    cover_path TEXT,
    story_path TEXT,

    -- Scheduling
    scheduled_date TEXT NOT NULL,
    scheduled_time TEXT NOT NULL,
    schedule_at TEXT NOT NULL,
    timezone TEXT DEFAULT 'Europe/Berlin',
    slot TEXT DEFAULT 'feed',  -- 'feed', 'story'
    platforms TEXT DEFAULT 'ig',  -- 'ig', 'tt', 'ig,tt'

    -- Image Analysis (v12 - Two-Agent System)
    image_description TEXT,  -- VLM-generated objective description of the image
    description_generated_at TEXT,

    -- Captions
    caption_ig TEXT,
    caption_tt TEXT,
    caption_override TEXT,
    hashtags_final TEXT,

    -- Status workflow
    status TEXT DEFAULT 'PENDING',
    -- PENDING → NEEDS_AI → NEEDS_REVIEW → APPROVED → SCHEDULED → PUBLISHED
    -- Special: BLOCKED, FAILED, REJECTED

    error_code TEXT,  -- Error code for categorizing failures (e.g., 'LATE_AUTH_EXPIRED', 'RATE_LIMITED', 'EMPTY_CAPTION')
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    -- Late API
    late_media_id TEXT,
    late_media_url TEXT,
    late_post_id TEXT,

    -- Account IDs (from client accounts)
    instagram_account_id TEXT,
    tiktok_account_id TEXT,

    -- Audit trail
    notes TEXT,
    fingerprint TEXT,
    ingest_id TEXT,

    -- Link to uploaded file (v16)
    file_id INTEGER,  -- References files table for upload-based content

    -- Timestamps
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT,
    validated_at TEXT,
    caption_generated_at TEXT,
    approved_at TEXT,
    approved_by TEXT,
    approved_file_hash TEXT,
    scheduled_at TEXT,
    published_at TEXT,

    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE SET NULL
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- AGENT INSTRUCTIONS TABLE
-- Stores editable AI agent prompts at system, client, and batch levels
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS agent_instructions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_type TEXT NOT NULL,       -- 'config_generator', 'caption_generator'
    scope TEXT NOT NULL,            -- 'system', 'client', 'batch'
    scope_id INTEGER,               -- NULL for system, client_id for client, batch_id for batch
    instruction_key TEXT NOT NULL,  -- 'master_prompt', 'photo_rules', 'video_rules', etc.
    instruction_value TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),

    UNIQUE(agent_type, scope, scope_id, instruction_key)
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- AUDIT LOG TABLE
-- Track all changes for accountability
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,  -- 'content_item', 'client', 'batch', 'account'
    entity_id INTEGER NOT NULL,
    action TEXT NOT NULL,  -- 'create', 'update', 'approve', 'reject', 'schedule', 'delete'
    field_changed TEXT,  -- Which field was changed
    old_value TEXT,  -- JSON or plain text
    new_value TEXT,  -- JSON or plain text
    changes TEXT,  -- JSON object with all changes
    user_id TEXT,
    user_ip TEXT,
    performed_by TEXT,  -- Workflow or user that made the change
    created_at TEXT DEFAULT (datetime('now'))
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- AI CONVERSATIONS TABLE (v12)
-- Stores all agent conversation rounds for debugging and quality analysis
-- Used by the two-agent caption generation system (Generator + Supervisor)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS ai_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id TEXT NOT NULL,            -- Link to content_items.content_id
    batch_id INTEGER NOT NULL,           -- Denormalized for query performance

    -- Session tracking
    session_id TEXT NOT NULL,            -- Unique ID for this generation session

    -- Agent info
    agent_type TEXT NOT NULL,            -- 'image_describer', 'caption_generator', 'caption_supervisor'
    agent_model TEXT NOT NULL,           -- 'llava:7b', 'llama3.2:3b'

    -- Conversation round
    round_number INTEGER NOT NULL,       -- 1, 2, 3...
    role TEXT NOT NULL,                  -- 'user', 'assistant'

    -- Content
    prompt TEXT,                         -- The prompt sent to the agent
    response TEXT,                       -- The agent's response

    -- Metadata
    tokens_used INTEGER,                 -- Token count if available
    duration_ms INTEGER,                 -- How long the call took
    status TEXT DEFAULT 'success',       -- 'success', 'error', 'timeout'
    error_message TEXT,                  -- Error details if failed

    -- Timestamps
    created_at TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- FILES TABLE (v16)
-- Tracks uploaded files for database-based onboarding
-- Files are stored in /uploads/{client_id}/{batch_id}/{uuid}.ext
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    batch_id INTEGER,

    -- File identification
    original_name TEXT NOT NULL,          -- Original filename from upload
    storage_path TEXT NOT NULL,           -- /uploads/{client_id}/{batch_id}/{uuid}.ext
    uuid TEXT NOT NULL,                   -- UUID used for storage filename

    -- File metadata
    file_size INTEGER,                    -- Size in bytes
    mime_type TEXT,                       -- image/jpeg, video/mp4, etc.
    checksum TEXT,                        -- SHA256 for deduplication

    -- Media dimensions
    width INTEGER,
    height INTEGER,
    duration_seconds REAL,                -- For videos only

    -- Video frame extraction (JSON array of paths)
    frame_paths TEXT,                     -- ["path/uuid_f1.jpg", "path/uuid_f2.jpg", ...]
    frame_count INTEGER DEFAULT 0,

    -- Processing status
    status TEXT DEFAULT 'uploaded',       -- uploaded, processing, ready, error
    error_message TEXT,

    -- Link to content_item after ingest
    content_item_id INTEGER,

    -- Timestamps
    uploaded_at TEXT DEFAULT (datetime('now')),
    processed_at TEXT,

    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL,
    FOREIGN KEY (content_item_id) REFERENCES content_items(id) ON DELETE SET NULL
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- LATE CONFIG TABLE (v16.9)
-- Stores Late.com API configuration (single row table)
-- API key is stored securely - never returned to frontend after save
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS late_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),  -- Enforce single row
    api_key TEXT NOT NULL,                   -- Late.com API key
    plan_name TEXT,                          -- User's Late.com plan
    connected_at TEXT,                       -- When API key was first saved
    synced_at TEXT,                          -- Last successful sync timestamp
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- INDEXES
-- Performance optimization for common queries
-- ═══════════════════════════════════════════════════════════════════════════════

-- Content items indexes
CREATE INDEX IF NOT EXISTS idx_content_items_status ON content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_items_client_batch ON content_items(client_id, batch_id);
CREATE INDEX IF NOT EXISTS idx_content_items_batch_status ON content_items(batch_id, status);
CREATE INDEX IF NOT EXISTS idx_content_items_schedule ON content_items(scheduled_date, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_content_items_content_id ON content_items(content_id);

-- Accounts indexes
CREATE INDEX IF NOT EXISTS idx_accounts_client ON accounts(client_id);
CREATE INDEX IF NOT EXISTS idx_accounts_platform ON accounts(client_id, platform);
CREATE INDEX IF NOT EXISTS idx_accounts_late_account_id ON accounts(late_account_id);

-- Clients indexes
CREATE INDEX IF NOT EXISTS idx_clients_slug ON clients(slug);
CREATE INDEX IF NOT EXISTS idx_clients_active ON clients(is_active);

-- Batches indexes
CREATE INDEX IF NOT EXISTS idx_batches_client ON batches(client_id);
CREATE INDEX IF NOT EXISTS idx_batches_status ON batches(status);
CREATE INDEX IF NOT EXISTS idx_batches_client_slug ON batches(client_id, slug);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);

-- Agent instructions indexes
CREATE INDEX IF NOT EXISTS idx_agent_instructions_lookup ON agent_instructions(agent_type, scope, scope_id, is_active);

-- AI conversations indexes (v12)
CREATE INDEX IF NOT EXISTS idx_ai_conversations_content ON ai_conversations(content_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session ON ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_batch ON ai_conversations(batch_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_agent ON ai_conversations(agent_type);

-- Files indexes (v16)
CREATE INDEX IF NOT EXISTS idx_files_client ON files(client_id);
CREATE INDEX IF NOT EXISTS idx_files_batch ON files(batch_id);
CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);
CREATE INDEX IF NOT EXISTS idx_files_uuid ON files(uuid);
CREATE INDEX IF NOT EXISTS idx_files_content_item ON files(content_item_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TRIGGERS
-- Automatic timestamp updates
-- ═══════════════════════════════════════════════════════════════════════════════

-- Update clients.updated_at on change
CREATE TRIGGER IF NOT EXISTS update_clients_timestamp
AFTER UPDATE ON clients
BEGIN
    UPDATE clients SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Update accounts.updated_at on change
CREATE TRIGGER IF NOT EXISTS update_accounts_timestamp
AFTER UPDATE ON accounts
BEGIN
    UPDATE accounts SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Update batches.updated_at on change
CREATE TRIGGER IF NOT EXISTS update_batches_timestamp
AFTER UPDATE ON batches
BEGIN
    UPDATE batches SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Update content_items.updated_at on change
CREATE TRIGGER IF NOT EXISTS update_content_items_timestamp
AFTER UPDATE ON content_items
BEGIN
    UPDATE content_items SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Update agent_instructions.updated_at on change
CREATE TRIGGER IF NOT EXISTS update_agent_instructions_timestamp
AFTER UPDATE ON agent_instructions
BEGIN
    UPDATE agent_instructions SET updated_at = datetime('now') WHERE id = NEW.id;
END;
