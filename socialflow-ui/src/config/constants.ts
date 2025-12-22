/**
 * Application timing constants
 */
export const TIMING = {
  /** Delay before refetching after account sync (ms) */
  SYNC_REFETCH_DELAY: 2000,
  /** Poll interval for batch status updates (ms) */
  BATCH_STATUS_POLL_INTERVAL: 5000,
  /** Poll interval for job status updates (ms) */
  JOBS_POLL_INTERVAL: 10000,
  /** Poll interval for ingest/generation progress (ms) */
  PROGRESS_POLL_INTERVAL: 2000,
  /** Workflow completion toast duration (ms) */
  WORKFLOW_COMPLETION_DELAY: 3000,
  /** Connection test timeout (ms) */
  CONNECTION_TEST_TIMEOUT: 10000,
  /** Default API request timeout (ms) */
  API_TIMEOUT: 30000,
  /** AI generation timeout (ms) */
  AI_GENERATION_TIMEOUT: 120000,
} as const;

/**
 * External URLs used in the application
 */
export const EXTERNAL_URLS = {
  /** Late.com app base URL */
  LATE_APP: 'https://app.getlate.dev',
  /** n8n dashboard URL - configurable via VITE_N8N_DASHBOARD env var */
  N8N_DASHBOARD: import.meta.env.VITE_N8N_DASHBOARD || 'http://localhost:5678',
} as const;

/**
 * Get the URL for a Late.com post
 */
export function getLatePostUrl(postId: string): string {
  return `${EXTERNAL_URLS.LATE_APP}/posts/${postId}`;
}
