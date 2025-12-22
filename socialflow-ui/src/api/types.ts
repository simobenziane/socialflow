// ============================================
// Client Types
// ============================================

export interface AccountLink {
  late_account_id: string;
  username: string;
}

export interface Client {
  id: number;
  slug: string;
  name: string;
  type: string;
  language: string;
  timezone: string;
  is_active: boolean;
  accounts?: {
    instagram?: AccountLink;
    tiktok?: AccountLink;
  };
  schedule?: {
    feed_time: string;
    story_time: string;
    // v17.8: Format-specific posting times
    photo_time?: string;
    video_time?: string;
  };
  // AI-generated brand configuration
  brand_voice?: string;
  brand_target_audience?: string;
  brand_description?: string;
  hashtags?: string[];
  onboarding_data?: OnboardingInput;
  ai_generated?: boolean;
  // AI Caption Settings (v16.1, v17.6)
  video_ai_captions?: boolean;  // true = AI generates captions for videos
  photo_ai_captions?: boolean;  // true = AI generates captions for photos (default)
  // Late.com Profile Linking (v16.4)
  late_profile_id?: string;  // Links to Late.com profile; all accounts under this profile belong to this client
  late_profile?: LateProfile;  // Populated from cache when fetching client
}

export interface ClientsResponse {
  success: boolean;
  message?: string;
  data: Client[];
}

export interface ClientResponse {
  success: boolean;
  message?: string;
  data: Client;
}

export interface CreateClientInput {
  name: string;
  slug: string;
  type: string;
  language: string;
  timezone: string;
  // Late.com Profile Linking (v16.4) - replaces individual account selection
  late_profile_id?: string;
  // Legacy: individual account IDs (deprecated, kept for backward compatibility)
  instagram_account_id?: string;
  tiktok_account_id?: string;
  // Schedule times (v17.8) - Format-specific posting times
  photo_time?: string;
  video_time?: string;
  story_time?: string;
  feed_time?: string; // Legacy: kept for backwards compatibility
  // Brand configuration (for update)
  brand_voice?: string;
  brand_target_audience?: string;
  brand_description?: string;
  hashtags?: string[];
  // AI Caption Settings (v16.1, v17.6)
  video_ai_captions?: boolean;
  photo_ai_captions?: boolean;
}

// ============================================
// Late Config Types (v16.9)
// ============================================

export interface LateStatus {
  configured: boolean;
  plan_name?: string;
  connected_at?: string;
  synced_at?: string;
}

export interface LateStatusResponse {
  success: boolean;
  message?: string;
  data: LateStatus;
}

export interface LateConnectResponse {
  success: boolean;
  message?: string;
  error?: string;
  error_code?: string;
  data?: {
    plan_name: string;
    connected_at: string;
    limits?: Record<string, unknown>;
  };
}

export interface LateSyncResponse {
  success: boolean;
  workflow: string;
  version?: string;
  message?: string;
  error?: string;
  error_code?: string;
  error_message?: string;
  generated_at?: string;
  duration_seconds?: number;
  summary?: {
    profiles_synced: number;
    accounts_synced: number;
    usernames_updated_in_db: number;
  };
  health?: {
    total_accounts: number;
    healthy: number;
    warning: number;
    expired: number;
  };
  accounts_by_platform?: Record<string, number>;
  database_updates?: Array<{
    client: string;
    platform: string;
    old_username: string;
    new_username: string;
  }>;
  warnings?: string[];
  errors?: Array<{
    endpoint: string;
    code: string;
    message: string;
    statusCode?: number;
  }>;
  next_steps?: string[];
}

export interface LateProfilesResponse {
  success: boolean;
  message?: string;
  data: {
    profiles: {
      late_profile_id: string;
      name: string;
      color: string;
      is_default: boolean;
      accounts_count: number;
    }[];
    synced_at: string | null;
  };
}

// ============================================
// Late Account Types
// ============================================

export type HealthStatus = 'healthy' | 'warning' | 'expired';
export type Platform = 'instagram' | 'tiktok';

export interface LateAccount {
  id: string;
  platform: Platform;
  username: string;
  display_name: string;
  profile_picture?: string;
  is_active: boolean;
  token_expires_at: string;
  permissions: string[];
  late_profile_id: string;
  late_profile_name: string;
  health: HealthStatus;
  days_until_expiry: number;
}

export interface LateProfile {
  id: string;
  name: string;
  description?: string;
  color: string;
  is_default: boolean;
}

export interface AccountsResponse {
  success: boolean;
  message?: string;
  data: {
    accounts: LateAccount[];
    profiles: LateProfile[];
    synced_at: string | null;
  };
}

// ============================================
// Late Post Types (v16.5)
// ============================================

export interface LatePostMedia {
  type: 'image' | 'video';
  url: string;
  thumbnail_url?: string;
  filename?: string;
  mimeType?: string;
}

export interface LatePostPlatform {
  platform: Platform;
  accountId: string;
  status: 'pending' | 'published' | 'failed';
  platformPostUrl?: string | null;
}

export interface LatePost {
  id: string;
  content: string;
  scheduled_for: string;
  timezone?: string;
  platforms: LatePostPlatform[];
  media: LatePostMedia[];
  status: 'scheduled' | 'published' | 'failed' | 'draft';
  created_at?: string;
}

export interface ScheduledPostsResponse {
  success: boolean;
  message?: string;
  data: {
    posts: LatePost[];
    synced_at: string | null;
    total: number;
    profile_id?: string;
  };
}

// ============================================
// Batch Types
// ============================================

export type BatchStatus = 'draft' | 'ready' | 'processing' | 'reviewing' | 'scheduled';
export type BatchSource = 'folder' | 'upload';

export interface Batch {
  name: string;
  slug: string;
  has_ready: boolean;
  has_config: boolean;
  photo_count: number;
  video_count: number;
  ingested: boolean;
  item_count: number;
  needs_ai: number;
  needs_review: number;
  approved: number;
  scheduled: number;
  source: BatchSource;
  id?: number;
  status?: BatchStatus;
  /** Optional client slug for test compatibility */
  client?: string;
  /** AI Caption Settings (v16.1, v17.6) - null = inherit from client */
  video_ai_captions?: boolean | null;
  photo_ai_captions?: boolean | null;
  /** Schedule config (v17.8) - JSON with photo_time, video_time, story_time */
  schedule_config?: string | ScheduleConfigObject;
}

export interface BatchesResponse {
  success: boolean;
  message?: string;
  data: {
    batches: Batch[];
    client: string;
  };
}

export interface BatchStatusCounts {
  total: number;
  pending: number;
  needs_ai: number;
  needs_review: number;
  approved: number;
  scheduled: number;
  failed: number;
}

export interface BatchStatusResponse {
  success: boolean;
  message?: string;
  data: {
    counts: BatchStatusCounts;
    client: string;
    batch: string;
  };
}

// ============================================
// Content Types
// ============================================

export type ContentStatus =
  | 'PENDING'
  | 'NEEDS_AI'
  | 'NEEDS_REVIEW'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'BLOCKED'
  | 'FAILED';

export type MediaType = 'photo' | 'video';
export type SlotType = 'feed' | 'story';

// Platform codes: 'ig' for Instagram, 'tt' for TikTok, comma-separated for multiple
export type PlatformCode = 'ig' | 'tt' | 'ig,tt' | 'tt,ig';

// Schedule config can come from DB as string or be parsed as object
export interface ScheduleConfigObject {
  photo_time?: string;
  video_time?: string;
  story_time?: string;
  feed_time?: string;  // Legacy: used if photo_time not set
  start_date?: string;
  strategy?: 'daily' | 'weekdays' | 'custom';
}

/**
 * Parse schedule_config from string or object
 * Safely handles both DB string format and already-parsed objects
 */
export function parseScheduleConfig(config: string | ScheduleConfigObject | null | undefined): ScheduleConfigObject {
  if (!config) return {};
  if (typeof config === 'object') return config;
  try {
    return JSON.parse(config) as ScheduleConfigObject;
  } catch {
    return {};
  }
}

export interface ContentItem {
  // Core identifiers
  // Note: id is optional in TypeScript but always present in API responses
  // This allows the type to be used for both creation and retrieval
  id?: number;
  content_id: string;
  client_slug: string;
  batch_name: string;

  // Media info
  media_type: MediaType;
  file: string;
  file_name?: string;
  file_path?: string;
  file_hash?: string;
  file_size?: number;
  media_url: string;
  preview_url: string;
  cover_path?: string;  // Video cover image path (for thumbnails)
  frames_used?: string; // Semicolon-separated frame paths

  // Schedule info
  date: string;
  scheduled_date?: string;
  scheduled_time?: string;
  slot: SlotType;
  schedule_at: string;
  timezone?: string;

  // Platform config - format: 'ig', 'tt', or 'ig,tt' for multiple
  platforms: PlatformCode | string; // Allow string for DB compatibility
  instagram_account_id?: string;
  tiktok_account_id?: string;

  // Image Analysis (v15)
  image_description?: string;
  description_generated_at?: string;

  // Captions
  caption_ig?: string;
  caption_tt?: string;
  caption_override?: string;
  hashtags_final?: string;

  // Status
  status: ContentStatus;
  error_message?: string;
  retry_count?: number;

  // Late.com integration
  late_post_id?: string;
  late_media_id?: string;
  late_media_url?: string;

  // Approval tracking
  approved_at?: string;
  approved_by?: string;
  approved_file_hash?: string;

  // Metadata
  notes?: string;
  fingerprint?: string;
  ingest_id?: string;
  validated_at?: string;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// Pagination Types
// ============================================

export interface Pagination {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}

// ============================================
// Content Items Response
// ============================================

export interface ContentItemsResponse {
  success: boolean;
  message?: string;
  data: PaginatedResponse<ContentItem>;
}

export interface ContentItemResponse {
  success: boolean;
  message?: string;
  data: ContentItem;
}

// ============================================
// Item Action Types
// ============================================

export interface ItemActionResponse {
  success: boolean;
  message: string;
  data: ContentItem;
  timestamp?: string;
}

export interface BulkApproveResponse {
  success: boolean;
  message: string;
  data: {
    approved: number;
    total: number;
  };
}

export interface ContentItemsOptions {
  status?: ContentStatus;
  limit?: number;
  offset?: number;
}

// ============================================
// Dashboard Stats Types
// ============================================

export interface DashboardStats {
  clients: number;
  batches: number;
  content_items: {
    total: number;
    pending: number;
    needs_ai: number;
    needs_review: number;
    approved: number;
    scheduled: number;
    failed: number;
  };
  accounts: number;
}

export interface StatsResponse {
  success: boolean;
  message?: string;
  data: DashboardStats;
}

// ============================================
// Settings Types
// ============================================

export interface OllamaModels {
  image_describer: string;      // Visual LLM for image description (W1)
  caption_generator: string;     // Text LLM for caption generation (W2)
  caption_supervisor: string;    // Text LLM for caption review (W2)
  config_generator: string;      // Text LLM for config generation (W-Agent1)
}

export interface CaptionGenerationConfig {
  max_revision_rounds: number;
  description_timeout_ms: number;
  generator_timeout_ms: number;
  supervisor_timeout_ms: number;
  vlm_max_retries?: number;
  vlm_temperature?: number;
  vlm_max_tokens?: number;
}

export interface Settings {
  cloudflare_tunnel_url: string;
  ai_provider?: 'ollama' | 'gemini';
  paths: {
    docker_base: string;
  };
  ollama: {
    model: string;               // Legacy fallback model
    models?: OllamaModels;       // Per-agent model configuration
    timeout_ms: number;
    url_docker?: string;
  };
  gemini?: {
    api_key: string;
    model: string;
    timeout_ms: number;
  };
  caption_generation?: CaptionGenerationConfig;
}

export interface SettingsResponse {
  success: boolean;
  message?: string;
  data: Settings;
}

/**
 * Default settings values for when fields are missing
 * Prevents crashes when settings.json is incomplete
 */
export const DEFAULT_SETTINGS: Settings = {
  cloudflare_tunnel_url: '',
  ai_provider: 'ollama',
  paths: {
    docker_base: '/data/clients',
  },
  ollama: {
    model: 'llama3.2:3b',
    timeout_ms: 120000,
    url_docker: 'http://host.docker.internal:11434/api/generate',
    models: {
      image_describer: 'llava:7b',
      caption_generator: 'llama3.2:3b',
      caption_supervisor: 'llama3.2:3b',
      config_generator: 'llama3.2:3b',
    },
  },
  caption_generation: {
    max_revision_rounds: 3,
    description_timeout_ms: 120000,
    generator_timeout_ms: 120000,
    supervisor_timeout_ms: 60000,
  },
};

/**
 * Merge partial settings with defaults to prevent missing field errors
 */
export function mergeWithDefaults(settings: Partial<Settings> | null | undefined): Settings {
  if (!settings) return { ...DEFAULT_SETTINGS };

  // Merge nested objects carefully to avoid undefined spreading
  const mergedOllamaModels: OllamaModels = {
    image_describer: settings.ollama?.models?.image_describer ?? DEFAULT_SETTINGS.ollama.models!.image_describer,
    caption_generator: settings.ollama?.models?.caption_generator ?? DEFAULT_SETTINGS.ollama.models!.caption_generator,
    caption_supervisor: settings.ollama?.models?.caption_supervisor ?? DEFAULT_SETTINGS.ollama.models!.caption_supervisor,
    config_generator: settings.ollama?.models?.config_generator ?? DEFAULT_SETTINGS.ollama.models!.config_generator,
  };

  const mergedCaptionGeneration: CaptionGenerationConfig = {
    max_revision_rounds: settings.caption_generation?.max_revision_rounds ?? DEFAULT_SETTINGS.caption_generation!.max_revision_rounds,
    description_timeout_ms: settings.caption_generation?.description_timeout_ms ?? DEFAULT_SETTINGS.caption_generation!.description_timeout_ms,
    generator_timeout_ms: settings.caption_generation?.generator_timeout_ms ?? DEFAULT_SETTINGS.caption_generation!.generator_timeout_ms,
    supervisor_timeout_ms: settings.caption_generation?.supervisor_timeout_ms ?? DEFAULT_SETTINGS.caption_generation!.supervisor_timeout_ms,
    vlm_max_retries: settings.caption_generation?.vlm_max_retries,
    vlm_temperature: settings.caption_generation?.vlm_temperature,
    vlm_max_tokens: settings.caption_generation?.vlm_max_tokens,
  };

  return {
    cloudflare_tunnel_url: settings.cloudflare_tunnel_url ?? DEFAULT_SETTINGS.cloudflare_tunnel_url,
    ai_provider: settings.ai_provider ?? DEFAULT_SETTINGS.ai_provider,
    paths: {
      docker_base: settings.paths?.docker_base ?? DEFAULT_SETTINGS.paths.docker_base,
    },
    ollama: {
      model: settings.ollama?.model ?? DEFAULT_SETTINGS.ollama.model,
      timeout_ms: settings.ollama?.timeout_ms ?? DEFAULT_SETTINGS.ollama.timeout_ms,
      url_docker: settings.ollama?.url_docker ?? DEFAULT_SETTINGS.ollama.url_docker,
      models: mergedOllamaModels,
    },
    gemini: settings.gemini,
    caption_generation: mergedCaptionGeneration,
  };
}

// ============================================
// Workflow Response Types
// ============================================

export interface WorkflowResponse {
  success: boolean;
  workflow: string;
  client?: string;
  batch?: string;
  action?: string;
  error_code?: string;
  error_message?: string;
  data?: {
    summary?: Record<string, number>;
    total?: number;
    [key: string]: unknown;
  };
  summary?: {
    total?: number;
    processed?: number;
    ready_for_ai?: number;
    blocked?: number;
    scheduled?: number;
    failed?: number;
  };
  error?: string;
  message?: string;
}

// ============================================
// Health Check
// ============================================

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  endpoints: string[];
}

// ============================================
// Jobs/Execution Tracking Types
// ============================================

export type JobStatus = 'success' | 'partial' | 'failed';

export interface JobError {
  content_id?: string;
  code: string;
  message: string;
}

export interface JobExecution {
  last_run: string;
  status: JobStatus;
  client?: string;
  batch?: string;
  duration_ms: number;
  summary?: Record<string, number>;
  errors?: JobError[];
  error_code?: string;
  error_message?: string;
}

export interface JobsData {
  current: {
    client: string | null;
    batch: string | null;
  };
  executions: {
    W0: JobExecution | null;
    W1: JobExecution | null;
    W2: JobExecution | null;
    W3: JobExecution | null;
  };
}

export interface JobsResponse {
  success: boolean;
  data: JobsData;
}

// ============================================
// Archive Types
// ============================================

export interface ArchivedClient {
  id: number;
  slug: string;
  name: string;
  language: string;
  timezone: string;
  type: string;
  original_created_at: string;
  archived_at: string;
  batch_count: number;
  item_count: number;
}

export interface ArchivedClientsResponse {
  success: boolean;
  message: string;
  data: ArchivedClient[];
}

// ============================================
// Agent Types (Phase 3)
// ============================================

export type AgentType = 'config_generator' | 'caption_generator';
export type InstructionScope = 'system' | 'client' | 'batch';

export interface AgentInstruction {
  id: number;
  agent_type: AgentType;
  scope: InstructionScope;
  scope_id: number | null;
  instruction_key: string;
  instruction_value: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentInstructionsResponse {
  success: boolean;
  message?: string;
  data: AgentInstruction[];
}

export interface AgentInstructionResponse {
  success: boolean;
  message?: string;
  data: AgentInstruction;
}

// Onboarding input for AI config generation
export interface OnboardingInput {
  business_name: string;
  business_description: string;
  target_audience: string;
  brand_personality: string;
  language: string;
  content_themes: string;
  call_to_actions: string;
  things_to_avoid: string;
}

// Create client with AI generation
export interface CreateClientWithAI extends CreateClientInput {
  onboarding?: OnboardingInput;
  generate_config?: boolean;
}

// Generated config files from Agent 1
export interface GeneratedConfig {
  client_yaml: string;
  brief_txt: string;
  hashtags_txt: string;
}

export interface GenerateConfigResponse {
  success: boolean;
  message?: string;
  data: {
    config: GeneratedConfig;
    client_slug: string;
  };
}

// Batch brief generation
export interface GenerateBriefInput {
  client: string;
  batch: string;
  description: string;
}

export interface GenerateBriefResponse {
  success: boolean;
  message?: string;
  data: {
    brief: string;
    batch: string;
    client: string;
  };
}

// Agent settings (for settings page)
export interface AgentSettings {
  config_generator: {
    model: string;
    master_prompt: string;
  };
  caption_generator: {
    model: string;
    master_prompt: string;
  };
}

export interface AgentSettingsResponse {
  success: boolean;
  message?: string;
  data: AgentSettings;
}

// ============================================
// Generation Progress Types (v15)
// ============================================

export interface GenerationProgress {
  current: number;
  total: number;
  stage: 'starting' | 'generating' | 'revising';
  round: number;
  content_id?: string;
  started_at?: string;
}

export interface GenerationProgressResponse {
  success: boolean;
  message?: string;
  data: {
    progress: GenerationProgress | null;
    started_at: string | null;
    is_running: boolean;
  };
}

// ============================================
// Ingest Progress Types (v15.2)
// ============================================

export type IngestStage = 'discovering' | 'validating' | 'describing' | 'saving';

export interface IngestProgress {
  current: number;
  total: number;
  stage: IngestStage;
  file_name?: string;
  started_at: string;
}

export interface IngestProgressResponse {
  success: boolean;
  message?: string;
  data: {
    progress: IngestProgress | null;
    started_at: string | null;
    is_running: boolean;
  };
}

// ============================================
// File Upload Types (v16)
// ============================================

export type FileStatus = 'uploaded' | 'processing' | 'ready' | 'error';

export interface UploadedFile {
  id: number;
  client_id: number;
  batch_id: number | null;
  original_name: string;
  storage_path: string;
  uuid: string;
  file_size: number | null;
  mime_type: string | null;
  checksum: string | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  frame_paths: string | null;
  frame_count: number;
  status: FileStatus;
  error_message: string | null;
  content_item_id: number | null;
  uploaded_at: string;
  processed_at: string | null;
}

export interface UploadResponse {
  success: boolean;
  message?: string;
  data: {
    file: UploadedFile;
  };
}

export interface UploadBatchResponse {
  success: boolean;
  message?: string;
  data: {
    files: UploadedFile[];
    successful: number;
    failed: number;
  };
}

export interface OnboardingCompleteInput {
  client_id: number;
  batch_id: number;
  batch_name: string;
  batch_description?: string;
  brief?: string;
  start_date: string;
  schedule_strategy: 'daily' | 'weekdays' | 'custom';
}

export interface OnboardingCompleteResponse {
  success: boolean;
  message?: string;
  data: {
    client_slug: string;
    batch_slug: string;
    file_count: number;
    content_items_created: number;
  };
}

// ============================================
// AI Conversation Types (v15)
// ============================================

export type ConversationRole = 'user' | 'assistant';
export type ConversationStatus = 'success' | 'error' | 'timeout';
export type ConversationAgentType = 'image_describer' | 'caption_generator' | 'caption_supervisor';

export interface AIConversation {
  id: number;
  content_id: string;
  batch_id: number;
  session_id: string;
  agent_type: ConversationAgentType;
  agent_model: string;
  round_number: number;
  role: ConversationRole;
  prompt: string | null;
  response: string | null;
  duration_ms: number | null;
  status: ConversationStatus;
  error_message: string | null;
  created_at: string;
}

export interface AIConversationSession {
  session_id: string;
  rounds: AIConversation[];
}

export interface AIConversationsResponse {
  success: boolean;
  message?: string;
  data: {
    content_id: string;
    sessions: AIConversationSession[];
    total_conversations: number;
  };
}
