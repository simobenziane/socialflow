import type { ContentItemsOptions } from './types';

/**
 * Centralized query key factory for TanStack Query
 * Ensures type-safe, consistent cache keys across all hooks
 */

export const queryKeys = {
  // Clients
  clients: {
    all: ['clients'] as const,
    detail: (slug: string) => ['clients', slug] as const,
    archived: ['archived-clients'] as const,
  },

  // Batches
  batches: {
    byClient: (client: string) => ['batches', client] as const,
    status: (client: string, batch: string) => ['batches', client, batch, 'status'] as const,
  },

  // Content Items
  contentItems: {
    all: ['content-items'] as const,
    byBatch: (client?: string, batch?: string, options?: ContentItemsOptions) => {
      // Use explicit array structure instead of JSON.stringify to prevent key collision
      // Sentinel value '__disabled__' prevents collision with valid empty-ish slugs
      return [
        'content-items',
        'batch',
        client ?? '__disabled__',
        batch ?? '__disabled__',
        options?.status ?? null,
        options?.limit ?? null,
        options?.offset ?? null,
      ] as const;
    },
    detail: (id: string | number) => ['content-items', 'detail', id] as const,
  },

  // Accounts
  accounts: {
    all: ['accounts'] as const,
  },

  // Settings
  settings: {
    all: ['settings'] as const,
  },

  // Stats
  stats: {
    all: ['stats'] as const,
  },

  // Jobs
  jobs: {
    all: ['jobs'] as const,
  },

  // Generation Progress (W2)
  generationProgress: {
    byBatch: (client: string, batch: string) => ['generation-progress', client, batch] as const,
  },

  // Ingest Progress (W1 v15.2)
  ingestProgress: {
    byBatch: (client: string, batch: string) => ['ingest-progress', client, batch] as const,
  },

  // Agents (Phase 3)
  agents: {
    instructions: {
      all: ['agent-instructions'] as const,
      system: ['agent-instructions', 'system'] as const,
      byClient: (clientSlug: string) => ['agent-instructions', 'client', clientSlug] as const,
      byBatch: (clientSlug: string, batchSlug: string) =>
        ['agent-instructions', 'batch', clientSlug, batchSlug] as const,
    },
    settings: ['agent-settings'] as const,
  },
} as const;

// Type helpers for query key inference
export type QueryKeys = typeof queryKeys;
