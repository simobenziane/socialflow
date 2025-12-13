/**
 * React Query configuration for stale times
 *
 * Different data types have different update frequencies, so we tune
 * the stale time accordingly to optimize for cache hits vs freshness.
 */

export const STALE_TIMES = {
  /** Settings rarely change - 30 minutes */
  SETTINGS: 30 * 60 * 1000,

  /** Clients are infrequently updated - 10 minutes */
  CLIENTS: 10 * 60 * 1000,

  /** Accounts may need periodic refresh - 5 minutes */
  ACCOUNTS: 5 * 60 * 1000,

  /** Batch status changes during workflows - 2 minutes */
  BATCH_STATUS: 2 * 60 * 1000,

  /** Content items change during approval - 1 minute */
  CONTENT_ITEMS: 1 * 60 * 1000,

  /** Progress data should always be fresh (polling) - 0 */
  PROGRESS: 0,

  /** Stats overview - 2 minutes */
  STATS: 2 * 60 * 1000,

  /** Batches list - 3 minutes */
  BATCHES: 3 * 60 * 1000,
} as const;

export type StaleTimeKey = keyof typeof STALE_TIMES;
