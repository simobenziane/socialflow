// ============================================
// Client Types
// ============================================

export interface AccountLink {
  late_account_id: string;
  username: string;
}

export interface Client {
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
  };
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
  instagram_account_id?: string;
  tiktok_account_id?: string;
  feed_time?: string;
  story_time?: string;
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
// Batch Types
// ============================================

export type BatchStatus = 'draft' | 'ready' | 'processing' | 'reviewing' | 'scheduled';
export type BatchSource = 'filesystem' | 'database';

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

export interface ContentItem {
  // Core identifiers
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

  // Platform config
  platforms: string;
  instagram_account_id?: string;
  tiktok_account_id?: string;

  // Image Analysis (v15)
  image_description?: string;
  description_generated_at?: string;

  // Captions
  caption_ig: string;
  caption_tt: string;
  caption_override?: string;
  hashtags_final: string;

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
