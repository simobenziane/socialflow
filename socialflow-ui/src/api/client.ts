import axios, { AxiosError } from 'axios';
import type {
  HealthResponse,
  ClientsResponse,
  ClientResponse,
  CreateClientInput,
  AccountsResponse,
  ScheduledPostsResponse,
  BatchesResponse,
  BatchStatusResponse,
  SettingsResponse,
  Settings,
  WorkflowResponse,
  StatsResponse,
  ContentItemsResponse,
  ContentItemResponse,
  ContentItemsOptions,
  ItemActionResponse,
  BulkApproveResponse,
  JobsResponse,
  ArchivedClientsResponse,
  AgentInstructionsResponse,
  AgentInstructionResponse,
  AgentType,
  InstructionScope,
  OnboardingInput,
  GenerateConfigResponse,
  GenerateBriefInput,
  GenerateBriefResponse,
  AgentSettingsResponse,
  GenerationProgressResponse,
  IngestProgressResponse,
  AIConversationsResponse,
  UploadResponse,
  UploadBatchResponse,
  OnboardingCompleteInput,
  OnboardingCompleteResponse,
  // Late Config types (v16.10)
  LateSyncResponse,
} from './types';

// ============================================
// Constants
// ============================================

export const API_TIMEOUTS = {
  DEFAULT: 60_000,        // 60 seconds
  TUNNEL_TEST: 15_000,    // 15 seconds for Cloudflare test
  WORKFLOW: 120_000,      // 2 minutes for workflows
} as const;

/**
 * Helper to encode URL path segments - reduces repeated encodeURIComponent calls
 */
const encodeRoute = (...segments: string[]): string =>
  segments.map(encodeURIComponent).join('/');

// ============================================
// Input Validation Helpers
// ============================================

/**
 * Validates a slug parameter to prevent path traversal attacks
 * @throws Error if slug contains forbidden characters
 */
function validateSlug(slug: string): void {
  if (!slug || typeof slug !== 'string') {
    throw new Error('Invalid slug: must be non-empty string');
  }
  if (slug.includes('..') || slug.includes('/') || slug.includes('\\')) {
    throw new Error('Invalid slug: contains forbidden characters');
  }
  if (slug.length > 100) {
    throw new Error('Invalid slug: exceeds maximum length');
  }
}

/**
 * Validates and normalizes an ID parameter
 * @returns Validated ID as string
 * @throws Error if ID is not a valid positive integer
 */
function validateId(id: string | number): string {
  const numId = typeof id === 'string' ? parseInt(id, 10) : id;
  if (!Number.isInteger(numId) || numId < 1) {
    throw new Error('Invalid ID: must be positive integer');
  }
  return String(numId);
}

/**
 * Sanitizes error messages to prevent XSS attacks
 */
function sanitizeErrorMessage(msg: unknown): string {
  if (typeof msg !== 'string') return 'Unknown error';
  return msg
    .replace(/<[^>]*>/g, '')  // Remove HTML tags
    .replace(/[<>'"]/g, '')   // Remove dangerous chars
    .slice(0, 500);           // Limit length
}

// ============================================
// Axios Instance
// ============================================

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5678/webhook';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000, // 60 seconds for long operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Error interceptor with improved network error handling and XSS protection
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string; message?: string }>) => {
    // Handle network errors (no response received)
    if (!error.response) {
      const networkMessage =
        error.code === 'ECONNABORTED'
          ? 'Request timed out - please try again'
          : error.code === 'ERR_NETWORK'
            ? 'Network error - check your connection'
            : 'Unable to reach server';
      return Promise.reject(new Error(networkMessage));
    }

    // Handle API errors (response received) - sanitize to prevent XSS
    const rawMessage =
      error.response.data?.error ||
      error.response.data?.message ||
      `Server error (${error.response.status})`;
    const message = sanitizeErrorMessage(rawMessage);
    return Promise.reject(new Error(message));
  }
);

// ============================================
// Workflow Response Validation
// ============================================

function validateWorkflowResponse(data: unknown, defaultError: string): WorkflowResponse {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid workflow response format');
  }
  const response = data as Record<string, unknown>;
  if (response.success === false) {
    throw new Error((response.error as string) || (response.message as string) || defaultError);
  }
  return data as WorkflowResponse;
}

// ============================================
// API Route Helper
// ============================================

async function apiGet<T>(route: string): Promise<T> {
  const { data } = await api.get('/api', { params: { route } });
  if (data.success === false) {
    throw new Error(data.error || 'API request failed');
  }
  return data;
}

async function apiPost<T>(route: string, body?: object): Promise<T> {
  const { data } = await api.post('/api', body, { params: { route } });
  if (data.success === false) {
    throw new Error(data.error || 'API request failed');
  }
  return data;
}

async function apiPut<T>(route: string, body?: object): Promise<T> {
  const { data } = await api.put('/api', body, { params: { route } });
  if (data.success === false) {
    throw new Error(data.error || 'API request failed');
  }
  return data;
}

async function apiDelete<T>(route: string): Promise<T> {
  const { data } = await api.delete('/api', { params: { route } });
  if (data.success === false) {
    throw new Error(data.error || 'API request failed');
  }
  return data;
}

// ============================================
// Health
// ============================================

/**
 * Fetches the health status of the API backend
 * @returns Promise resolving to health check response
 * @throws Error if API is unreachable or unhealthy
 */
export async function getHealth(): Promise<HealthResponse> {
  return apiGet<HealthResponse>('/health');
}

// ============================================
// Clients
// ============================================

/**
 * Fetches all clients from the API
 * @returns Promise resolving to array of Client objects with success status
 * @throws Error if API request fails
 */
export async function getClients(): Promise<ClientsResponse> {
  return apiGet<ClientsResponse>('/clients');
}

/**
 * Fetches a single client by slug identifier
 * @param slug - Unique client slug (e.g., "berlin-doner")
 * @returns Promise resolving to single Client object with success status
 * @throws Error if client not found or API request fails
 */
export async function getClient(slug: string): Promise<ClientResponse> {
  validateSlug(slug);
  return apiGet<ClientResponse>(`/clients/${encodeRoute(slug)}`);
}

/**
 * Creates a new client in the system
 * @param input - Client creation data (name, slug, type, language, timezone)
 * @returns Promise resolving to created Client object with success status
 * @throws Error if validation fails or API request fails
 */
export async function createClient(input: CreateClientInput): Promise<ClientResponse> {
  return apiPost<ClientResponse>('/clients', input);
}

/**
 * Updates an existing client by slug identifier
 * @param slug - Unique client slug to update
 * @param input - Partial client data to update
 * @returns Promise resolving to updated client data
 * @throws Error if client not found or API request fails
 */
export async function updateClient(
  slug: string,
  input: Partial<CreateClientInput>
): Promise<ClientResponse> {
  validateSlug(slug);
  return apiPut<ClientResponse>(`/clients/${encodeRoute(slug)}`, input);
}

/**
 * Deletes a client by slug identifier
 * @param slug - Unique client slug to delete
 * @returns Promise resolving to success status and message
 * @throws Error if client not found or API request fails
 */
export async function deleteClient(slug: string): Promise<{ success: boolean; message: string }> {
  validateSlug(slug);
  return apiDelete<{ success: boolean; message: string }>(`/clients/${encodeRoute(slug)}`);
}

/**
 * Deletes all clients and their associated data
 * @returns Promise resolving to success status, message, and count of deleted clients
 * @throws Error if API request fails
 */
export async function deleteAllClients(): Promise<{ success: boolean; message: string; deleted: number }> {
  return apiDelete<{ success: boolean; message: string; deleted: number }>('/clients');
}

// ============================================
// Late Config (v16.10)
// ============================================

/**
 * Syncs profiles and accounts from Late.com via W0 webhook
 * Uses the axios client which has the correct VITE_API_BASE configured
 * @returns Promise resolving to sync result with counts
 * @throws Error if sync times out or fails
 */
export async function syncLate(): Promise<LateSyncResponse> {
  // Use axios client with 2 minute timeout for long-running sync
  const response = await api.post<LateSyncResponse>('/w0-sync', {}, {
    timeout: API_TIMEOUTS.WORKFLOW // 120000ms = 2 minutes
  });
  return response.data;
}

// ============================================
// Late Accounts
// ============================================

/**
 * Fetches all Late.com connected accounts
 * @returns Promise resolving to accounts list with profiles and sync timestamp
 * @throws Error if API request fails
 */
export async function getAccounts(): Promise<AccountsResponse> {
  return apiGet<AccountsResponse>('/late/accounts');
}

/**
 * Triggers sync of Late.com accounts to local cache
 * Calls W0 webhook directly with timeout handling
 * @returns Promise resolving to sync result
 * @throws Error if sync fails or times out
 */
export async function syncAccounts(): Promise<LateSyncResponse> {
  // Use syncLate() which has proper timeout handling
  return syncLate();
}

// ============================================
// Scheduled Posts (v16.5)
// ============================================

/**
 * Gets cached scheduled posts for a client from Late.com
 */
export async function getScheduledPosts(slug: string): Promise<ScheduledPostsResponse> {
  validateSlug(slug);
  return apiGet<ScheduledPostsResponse>(`/clients/${encodeRoute(slug)}/posts`);
}

/**
 * Syncs scheduled posts from Late.com for a specific client
 * This fetches fresh data from Late API and caches it
 */
export async function syncScheduledPosts(slug: string): Promise<WorkflowResponse> {
  validateSlug(slug);
  const { data } = await api.post(
    `/w4-posts-sync?slug=${encodeRoute(slug)}`,
    {},
    { timeout: API_TIMEOUTS.WORKFLOW }
  );
  return validateWorkflowResponse(data, 'Posts sync workflow failed');
}

// ============================================
// Batches
// ============================================

/**
 * Fetches all batches for a specific client
 * @param client - Client slug identifier
 * @returns Promise resolving to batches list with counts
 * @throws Error if client not found or API request fails
 */
export async function getBatches(client: string): Promise<BatchesResponse> {
  validateSlug(client);
  return apiGet<BatchesResponse>(`/clients/${encodeRoute(client)}/batches`);
}

/**
 * Fetches status counts for a specific batch
 * @param client - Client slug identifier
 * @param batch - Batch name identifier
 * @returns Promise resolving to batch status with content counts by status
 * @throws Error if batch not found or API request fails
 */
export async function getBatchStatus(client: string, batch: string): Promise<BatchStatusResponse> {
  validateSlug(client);
  validateSlug(batch);
  return apiGet<BatchStatusResponse>(`/batches/${encodeRoute(client, batch)}/status`);
}

// ============================================
// Workflow Triggers (direct webhook calls)
// ============================================

/**
 * Triggers W1 workflow to ingest media from batch folder
 * @param client - Client slug identifier
 * @param batch - Batch name identifier
 * @returns Promise resolving to workflow execution response
 * @throws Error if workflow trigger fails
 */
export async function triggerIngest(client: string, batch: string): Promise<WorkflowResponse> {
  validateSlug(client);
  validateSlug(batch);
  const { data } = await api.post('/w1-ingest', { client, batch });
  return validateWorkflowResponse(data, 'Ingest workflow failed');
}

/**
 * Triggers W2 workflow to generate AI captions for batch content
 * @param client - Client slug identifier
 * @param batch - Batch name identifier
 * @returns Promise resolving to workflow execution response
 * @throws Error if workflow trigger fails
 */
export async function triggerGenerate(client: string, batch: string): Promise<WorkflowResponse> {
  validateSlug(client);
  validateSlug(batch);
  const { data } = await api.post('/w2-captions', { client, batch });
  return validateWorkflowResponse(data, 'Caption generation workflow failed');
}

/**
 * Triggers W3 workflow to schedule approved content to Late.com
 * @param client - Client slug identifier
 * @param batch - Batch name identifier
 * @returns Promise resolving to workflow execution response
 * @throws Error if workflow trigger fails
 */
export async function triggerSchedule(client: string, batch: string): Promise<WorkflowResponse> {
  validateSlug(client);
  validateSlug(batch);
  const { data } = await api.post('/w3-schedule', { client, batch });
  return validateWorkflowResponse(data, 'Schedule workflow failed');
}

/**
 * Resets a batch by deleting all content items while preserving client config
 * @param client - Client slug identifier
 * @param batch - Batch name identifier
 * @returns Promise resolving to success status and count of deleted items
 * @throws Error if batch not found or API request fails
 */
export async function resetBatch(
  client: string,
  batch: string
): Promise<{ success: boolean; message: string; deleted: number }> {
  validateSlug(client);
  validateSlug(batch);
  return apiPost<{ success: boolean; message: string; deleted: number }>(
    `/batches/${encodeRoute(client, batch)}/reset`
  );
}

/**
 * Updates batch settings (v16.1)
 * @param client - Client slug identifier
 * @param batch - Batch slug identifier
 * @param updates - Partial batch settings to update
 * @returns Promise resolving to updated batch
 */
export interface UpdateBatchInput {
  video_ai_captions?: boolean | null;  // null = inherit from client
  photo_ai_captions?: boolean | null;  // null = inherit from client
  brief?: string;
  description?: string;
  schedule_config?: string;  // JSON string with photo_time, video_time, story_time (v17.8)
}

export async function updateBatch(
  client: string,
  batch: string,
  updates: UpdateBatchInput
): Promise<{ success: boolean; message: string; data: unknown }> {
  validateSlug(client);
  validateSlug(batch);
  return apiPut<{ success: boolean; message: string; data: unknown }>(
    `/batches/${encodeRoute(client, batch)}`,
    updates
  );
}

// ============================================
// Settings
// ============================================

/**
 * Fetches global application settings
 * @returns Promise resolving to settings object (Cloudflare URL, Ollama config)
 * @throws Error if API request fails
 */
export async function getSettings(): Promise<SettingsResponse> {
  return apiGet<SettingsResponse>('/settings');
}

/**
 * Updates global application settings
 * @param updates - Partial settings object with fields to update
 * @returns Promise resolving to success status and message
 * @throws Error if validation fails or API request fails
 */
export async function updateSettings(updates: Partial<Settings>): Promise<{ success: boolean; message: string }> {
  return apiPut('/settings', updates);
}

/**
 * Test a Cloudflare tunnel URL for connectivity.
 * Can be used to test any URL (e.g., form input before saving).
 *
 * @param cfUrl - The Cloudflare tunnel URL to test
 * @returns Promise with success status and message
 */
export async function testCloudflareUrl(cfUrl: string): Promise<{
  success: boolean;
  message: string;
  url?: string;
  status_code?: number;
}> {
  // Validate URL
  if (!cfUrl || !cfUrl.startsWith('https://')) {
    return {
      success: false,
      message: 'URL must start with https://',
      url: cfUrl,
    };
  }

  // Test by fetching a known file through the tunnel
  // Use crypto.randomUUID() for cache busting (with fallback for older browsers)
  const cacheBuster = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const testUrl = `${cfUrl}/_config/settings.json?_t=${cacheBuster}`;

  // Use try-finally pattern to ensure timeout cleanup
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const controller = new AbortController();

  try {
    timeoutId = setTimeout(() => {
      controller.abort();
      timeoutId = null;
    }, API_TIMEOUTS.TUNNEL_TEST);

    const response = await fetch(testUrl, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
      signal: controller.signal,
    });

    if (response.ok) {
      return {
        success: true,
        message: `Tunnel is working! (${response.status})`,
        url: cfUrl,
        status_code: response.status,
      };
    } else {
      return {
        success: false,
        message: `Tunnel returned error: ${response.status} ${response.statusText}`,
        url: cfUrl,
        status_code: response.status,
      };
    }
  } catch (err) {
    // Check for abort (timeout)
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        success: false,
        message: 'Connection timed out - tunnel may be offline',
        url: cfUrl,
      };
    }

    // CORS error or network error - try fallback with no-cors
    const message = err instanceof Error ? err.message : 'Connection failed';

    // Fallback fetch with proper cleanup
    let fallbackTimeoutId: ReturnType<typeof setTimeout> | null = null;
    const fallbackController = new AbortController();

    try {
      fallbackTimeoutId = setTimeout(() => {
        fallbackController.abort();
        fallbackTimeoutId = null;
      }, API_TIMEOUTS.TUNNEL_TEST);

      await fetch(testUrl, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: fallbackController.signal,
      });

      // no-cors returns opaque response, we can't read status but if it doesn't throw, server is reachable
      return {
        success: true,
        message: 'Tunnel is reachable (CORS restricted)',
        url: cfUrl,
      };
    } catch (fallbackErr) {
      // Check if fallback also timed out
      if (fallbackErr instanceof Error && fallbackErr.name === 'AbortError') {
        return {
          success: false,
          message: 'Connection timed out - tunnel may be offline',
          url: cfUrl,
        };
      }
      return {
        success: false,
        message: `Cannot reach tunnel: ${message}`,
        url: cfUrl,
      };
    } finally {
      if (fallbackTimeoutId !== null) {
        clearTimeout(fallbackTimeoutId);
      }
    }
  } finally {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Test the saved Cloudflare tunnel URL for connectivity.
 * Fetches URL from saved settings first.
 */
export async function testCloudflareConnection(): Promise<{
  success: boolean;
  message: string;
  url?: string;
  status_code?: number;
}> {
  // Get the saved URL from settings
  const settings = await getSettings();
  const cfUrl = settings.data?.cloudflare_tunnel_url;

  if (!cfUrl) {
    return {
      success: false,
      message: 'No Cloudflare URL configured',
      url: cfUrl,
    };
  }

  return testCloudflareUrl(cfUrl);
}

// ============================================
// Dashboard Stats
// ============================================

/**
 * Fetches dashboard statistics (client count, batch count, content pipeline)
 * @returns Promise resolving to stats object with counts
 * @throws Error if API request fails
 */
export async function getStats(): Promise<StatsResponse> {
  return apiGet<StatsResponse>('/stats');
}

// ============================================
// Content Items
// ============================================

/**
 * Fetches content items for a specific batch with optional filtering
 * @param client - Client slug identifier
 * @param batch - Batch name identifier
 * @param options - Optional filters (status, limit, offset)
 * @returns Promise resolving to paginated content items list
 * @throws Error if batch not found or API request fails
 */
export async function getContentItems(
  client: string,
  batch: string,
  options?: ContentItemsOptions
): Promise<ContentItemsResponse> {
  validateSlug(client);
  validateSlug(batch);
  const params = new URLSearchParams();
  if (options?.status) params.set('status', options.status);
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.offset) params.set('offset', options.offset.toString());

  const queryString = params.toString();
  const route = `/items/${encodeRoute(client, batch)}${queryString ? `?${queryString}` : ''}`;
  return apiGet<ContentItemsResponse>(route);
}

/**
 * Fetches a single content item by ID
 * @param id - Content item ID (numeric or string)
 * @returns Promise resolving to content item details
 * @throws Error if item not found or API request fails
 */
export async function getContentItem(id: string | number): Promise<ContentItemResponse> {
  const validatedId = validateId(id);
  return apiGet<ContentItemResponse>(`/item/${validatedId}`);
}

// ============================================
// Item Actions
// ============================================

/**
 * Approves a content item for scheduling
 * @param id - Content item ID to approve
 * @returns Promise resolving to action response with updated item
 * @throws Error if item not found or API request fails
 */
export async function approveItem(id: string | number): Promise<ItemActionResponse> {
  const validatedId = validateId(id);
  return apiPost<ItemActionResponse>(`/item/${validatedId}/approve`);
}

/**
 * Rejects a content item with optional reason
 * @param id - Content item ID to reject
 * @param reason - Optional rejection reason
 * @returns Promise resolving to action response with updated item
 * @throws Error if item not found or API request fails
 */
export async function rejectItem(
  id: string | number,
  reason?: string
): Promise<ItemActionResponse> {
  const validatedId = validateId(id);
  return apiPost<ItemActionResponse>(`/item/${validatedId}/reject`, reason ? { reason } : {});
}

/**
 * Updates captions for a content item
 * @param id - Content item ID to update
 * @param captions - Caption fields to update (Instagram, TikTok, or override)
 * @returns Promise resolving to action response with updated item
 * @throws Error if item not found or API request fails
 */
export async function updateItemCaption(
  id: string | number,
  captions: { caption_ig?: string; caption_tt?: string; caption_override?: string }
): Promise<ItemActionResponse> {
  const validatedId = validateId(id);
  return apiPost<ItemActionResponse>(`/item/${validatedId}/caption`, captions);
}

/**
 * Updates platforms for a content item (v17.8)
 * @param id - Content item ID to update
 * @param platforms - Platform string: 'ig', 'tt', or 'ig,tt'
 * @returns Promise resolving to action response with updated platforms
 * @throws Error if item not found or API request fails
 */
export async function updateItemPlatforms(
  id: string | number,
  platforms: 'ig' | 'tt' | 'ig,tt'
): Promise<ItemActionResponse> {
  const validatedId = validateId(id);
  return apiPut<ItemActionResponse>(`/item/${validatedId}/platforms`, { platforms });
}

/**
 * Bulk approves multiple content items
 * @param ids - Array of content item IDs to approve
 * @returns Promise resolving to bulk action response with counts
 * @throws Error if any item not found or API request fails
 */
export async function approveBatchItems(ids: (string | number)[]): Promise<BulkApproveResponse> {
  const validatedIds = ids.map((id) => validateId(id));
  return apiPost<BulkApproveResponse>('/approve-batch', { ids: validatedIds });
}

// ============================================
// Jobs/Execution Tracking
// ============================================

/**
 * Fetches recent job executions (workflow runs)
 * @returns Promise resolving to jobs list with execution status
 * @throws Error if API request fails
 */
export async function getJobs(): Promise<JobsResponse> {
  return apiGet<JobsResponse>('/jobs');
}

// ============================================
// Archive
// ============================================

// Re-export types from types.ts for backwards compatibility
export type { ArchivedClient, ArchivedClientsResponse } from './types';

export async function archiveClient(slug: string): Promise<{ success: boolean; message: string }> {
  validateSlug(slug);
  return apiPost<{ success: boolean; message: string }>(`/clients/${encodeRoute(slug)}/archive`);
}

export async function getArchivedClients(): Promise<ArchivedClientsResponse> {
  return apiGet<ArchivedClientsResponse>('/archive/clients');
}

export async function restoreClient(id: number): Promise<{ success: boolean; message: string }> {
  const validatedId = validateId(id);
  return apiPost<{ success: boolean; message: string }>(`/archive/clients/${validatedId}/restore`);
}

export async function deleteArchivedClient(id: number): Promise<{ success: boolean; message: string }> {
  const validatedId = validateId(id);
  return apiDelete<{ success: boolean; message: string }>(`/archive/clients/${validatedId}`);
}

// ============================================
// Agent Instructions (Phase 3)
// ============================================

export async function getAgentInstructions(
  scope: InstructionScope,
  scopeId?: string
): Promise<AgentInstructionsResponse> {
  let route = '/agents/instructions';
  if (scope === 'client' && scopeId) {
    validateSlug(scopeId);
    route = `/clients/${encodeRoute(scopeId)}/instructions`;
  } else if (scope === 'batch' && scopeId) {
    // scopeId format: "client/batch"
    const parts = String(scopeId).split('/');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new Error(`Invalid batch scopeId format: expected 'client/batch', got '${scopeId}'`);
    }
    const [clientSlug, batchSlug] = parts;
    validateSlug(clientSlug);
    validateSlug(batchSlug);
    route = `/batches/${encodeRoute(clientSlug, batchSlug)}/instructions`;
  }
  return apiGet<AgentInstructionsResponse>(route);
}

export async function updateAgentInstruction(
  agentType: AgentType,
  scope: InstructionScope,
  instructionKey: string,
  instructionValue: string,
  scopeId?: string | number
): Promise<AgentInstructionResponse> {
  let route = '/agents/instructions';
  if (scope === 'client' && scopeId) {
    const clientSlug = String(scopeId);
    validateSlug(clientSlug);
    route = `/clients/${encodeRoute(clientSlug)}/instructions`;
  } else if (scope === 'batch' && scopeId) {
    // scopeId format: "client/batch"
    const parts = String(scopeId).split('/');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new Error(`Invalid batch scopeId format: expected 'client/batch', got '${scopeId}'`);
    }
    const [clientSlug, batchSlug] = parts;
    validateSlug(clientSlug);
    validateSlug(batchSlug);
    route = `/batches/${encodeRoute(clientSlug, batchSlug)}/instructions`;
  }
  return apiPut<AgentInstructionResponse>(route, {
    agent_type: agentType,
    instruction_key: instructionKey,
    instruction_value: instructionValue,
  });
}

export async function getAgentSettings(): Promise<AgentSettingsResponse> {
  return apiGet<AgentSettingsResponse>('/agents/settings');
}

export async function updateAgentSettings(
  agentType: AgentType,
  updates: { model?: string; master_prompt?: string }
): Promise<{ success: boolean; message: string }> {
  return apiPut<{ success: boolean; message: string }>('/agents/settings', {
    agent_type: agentType,
    ...updates,
  });
}

// ============================================
// AI Config Generation (Phase 3)
// ============================================

export async function generateClientConfig(
  slug: string,
  onboarding: OnboardingInput
): Promise<GenerateConfigResponse> {
  validateSlug(slug);
  // Direct webhook call to W-Agent1 workflow
  const { data } = await api.post('/w-agent1-config', { slug, onboarding });
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid workflow response format');
  }
  if (data.success === false) {
    throw new Error(data.error || data.message || 'Config generation failed');
  }
  return data as GenerateConfigResponse;
}

/**
 * Creates client folder structure with Photos, Videos, Stories subfolders
 * @param slug - Client slug identifier
 * @returns Promise resolving to folder creation result
 */
export async function createClientFolder(slug: string): Promise<{ success: boolean; message?: string; data?: unknown }> {
  validateSlug(slug);
  const { data } = await api.post(`/clients/${encodeRoute(slug)}/folder`);
  return data;
}

export async function generateBatchBrief(
  input: GenerateBriefInput
): Promise<GenerateBriefResponse> {
  // Direct webhook call to W-Agent1-Batch workflow
  const { data } = await api.post('/w-agent1-batch', input);
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid workflow response format');
  }
  if (data.success === false) {
    throw new Error(data.error || data.message || 'Brief generation failed');
  }
  return data as GenerateBriefResponse;
}

// ============================================
// Generation Progress (v15)
// ============================================

/**
 * Fetches the current AI caption generation progress for a batch
 * @param client - Client slug identifier
 * @param batch - Batch name identifier
 * @returns Promise resolving to generation progress data
 * @throws Error if batch not found or API request fails
 */
export async function getGenerationProgress(
  client: string,
  batch: string
): Promise<GenerationProgressResponse> {
  validateSlug(client);
  validateSlug(batch);
  return apiGet<GenerationProgressResponse>(
    `/batches/${encodeRoute(client, batch)}/generation-progress`
  );
}

// ============================================
// Ingest Progress (v15.2)
// ============================================

/**
 * Get W1 ingest progress for a batch
 * @param client - Client slug
 * @param batch - Batch slug
 * @returns Ingest progress data with current/total counts and stage
 * @throws Error if batch not found or API request fails
 */
export async function getIngestProgress(
  client: string,
  batch: string
): Promise<IngestProgressResponse> {
  validateSlug(client);
  validateSlug(batch);
  return apiGet<IngestProgressResponse>(
    `/batches/${encodeRoute(client, batch)}/ingest-progress`
  );
}

// ============================================
// AI Conversations (v15)
// ============================================

/**
 * Fetches AI conversation logs for a specific content item
 * @param client - Client slug identifier
 * @param batch - Batch name identifier
 * @param contentId - Content item ID
 * @returns Promise resolving to conversation sessions and rounds
 * @throws Error if item not found or API request fails
 */
export async function getItemConversations(
  client: string,
  batch: string,
  contentId: string
): Promise<AIConversationsResponse> {
  validateSlug(client);
  validateSlug(batch);
  // contentId can be numeric ID or string, validate as ID
  const validatedContentId = validateId(contentId);
  return apiGet<AIConversationsResponse>(
    `/items/${encodeRoute(client, batch)}/${validatedContentId}/conversations`
  );
}

// ============================================
// Schedule Management
// ============================================

export interface ScheduleUpdateItem {
  id: number;
  scheduled_date: string;
  scheduled_time: string;
  slot: 'feed' | 'story';
}

export interface BulkScheduleResponse {
  success: boolean;
  message: string;
  data: {
    updated: number;
    total: number;
  };
}

/**
 * Bulk updates schedule for multiple content items
 * @param client - Client slug identifier
 * @param batch - Batch name identifier
 * @param items - Array of items with schedule updates
 * @param timezone - Timezone for scheduling (default: Europe/Berlin)
 * @returns Promise resolving to bulk update response
 * @throws Error if batch not found or API request fails
 */
export async function bulkUpdateSchedule(
  client: string,
  batch: string,
  items: ScheduleUpdateItem[],
  timezone: string = 'Europe/Berlin'
): Promise<BulkScheduleResponse> {
  validateSlug(client);
  validateSlug(batch);

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Items array is required and must not be empty');
  }

  // Validate each item
  const validatedItems = items.map((item) => ({
    id: parseInt(validateId(item.id), 10),
    scheduled_date: item.scheduled_date,
    scheduled_time: item.scheduled_time,
    slot: item.slot,
  }));

  return apiPost<BulkScheduleResponse>(
    `/batches/${encodeRoute(client, batch)}/schedule`,
    { items: validatedItems, timezone }
  );
}

// ============================================
// File Upload (v16)
// ============================================

/**
 * Uploads a single file for a client
 * @param clientId - Client database ID
 * @param batchId - Optional batch ID (null for temporary batch)
 * @param file - File to upload
 * @returns Promise resolving to uploaded file info
 * @throws Error if upload fails
 */
export async function uploadFile(
  clientId: number,
  batchId: number | null,
  file: File
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('client_id', String(clientId));
  if (batchId !== null) {
    formData.append('batch_id', String(batchId));
  }

  const { data } = await api.post('/w-upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 120000, // 2 minutes for large files
  });

  if (data.success === false) {
    throw new Error(data.error || data.message || 'Upload failed');
  }
  return data as UploadResponse;
}

/**
 * Uploads a single file with retry logic for resilience
 * @param clientId - Client database ID
 * @param batchId - Optional batch ID
 * @param file - File to upload
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Promise resolving to uploaded file info
 * @throws Error if all retries fail
 */
async function uploadFileWithRetry(
  clientId: number,
  batchId: number | null,
  file: File,
  maxRetries = 3
): Promise<UploadResponse> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadFile(clientId, batchId, file);
    } catch (error) {
      lastError = error as Error;
      // Don't retry for validation errors (4xx responses)
      if (lastError.message.includes('400') || lastError.message.includes('Invalid file')) {
        throw lastError;
      }
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
      }
    }
  }
  throw lastError || new Error('Upload failed after retries');
}

/**
 * Uploads multiple files for a client
 * @param clientId - Client database ID
 * @param batchId - Optional batch ID
 * @param files - Array of files to upload
 * @param onProgress - Optional callback for progress updates
 * @returns Promise resolving to batch upload result
 * @throws Error if upload fails
 */
export async function uploadFiles(
  clientId: number,
  batchId: number | null,
  files: File[],
  onProgress?: (uploaded: number, total: number) => void
): Promise<UploadBatchResponse> {
  const results: UploadResponse[] = [];
  let successful = 0;
  let failed = 0;

  for (let i = 0; i < files.length; i++) {
    try {
      // Use retry logic for resilience against network issues
      const result = await uploadFileWithRetry(clientId, batchId, files[i]);
      results.push(result);
      successful++;
    } catch {
      failed++;
    }
    if (onProgress) {
      onProgress(i + 1, files.length);
    }
  }

  return {
    success: failed === 0,
    message: `Uploaded ${successful} of ${files.length} files`,
    data: {
      files: results.map(r => r.data?.file).filter(Boolean),
      successful,
      failed,
    },
  };
}

/**
 * Completes the onboarding process - converts uploads to content items
 * @param input - Onboarding completion data
 * @returns Promise resolving to created content info
 * @throws Error if onboarding completion fails
 */
export async function completeOnboarding(
  input: OnboardingCompleteInput
): Promise<OnboardingCompleteResponse> {
  const { data } = await api.post('/w-onboarding-complete', input, {
    timeout: 180000, // 3 minutes for processing
  });

  if (data.success === false) {
    throw new Error(data.error || data.message || 'Onboarding completion failed');
  }
  return data as OnboardingCompleteResponse;
}

/**
 * Creates a new batch for a client
 * @param clientId - Client database ID
 * @param name - Batch name
 * @param description - Optional batch description
 * @returns Promise resolving to created batch info
 * @throws Error if batch creation fails
 */
export async function createBatch(
  clientId: number,
  name: string,
  description?: string
): Promise<{ success: boolean; data: { batch_id: number; slug: string } }> {
  return apiPost('/batches', { client_id: clientId, name, description });
}
