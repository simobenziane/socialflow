import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBatches,
  getBatchStatus,
  triggerIngest,
  triggerGenerate,
  triggerSchedule,
  getGenerationProgress,
  getIngestProgress,
  resetBatch,
} from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import { useVisibility } from './useVisibility';
import { TIMING } from '@/config/constants';

export function useBatches(client: string) {
  return useQuery({
    queryKey: queryKeys.batches.byClient(client),
    queryFn: () => getBatches(client),
    enabled: !!client,
    staleTime: 60 * 1000, // 1 minute (batches change with workflow progress)
  });
}

export function useBatchStatus(client: string, batch: string) {
  const isVisible = useVisibility();

  return useQuery({
    queryKey: queryKeys.batches.status(client, batch),
    queryFn: () => getBatchStatus(client, batch),
    enabled: !!client && !!batch,
    // Set staleTime to half the poll interval to handle tab visibility changes properly
    staleTime: TIMING.BATCH_STATUS_POLL_INTERVAL / 2,
    refetchInterval: isVisible ? TIMING.BATCH_STATUS_POLL_INTERVAL : false,
    refetchOnWindowFocus: true,
  });
}

export function useIngest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ client, batch }: { client: string; batch: string }) =>
      triggerIngest(client, batch),
    onSuccess: (_, { client, batch }) => {
      // Invalidate batches list to refresh status counts
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.byClient(client) });
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.status(client, batch) });
      // Use predicate for content items to match all queries with different options
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === 'content-items';
        },
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
  });
}

export function useGenerate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ client, batch }: { client: string; batch: string }) =>
      triggerGenerate(client, batch),
    onSuccess: (_, { client, batch }) => {
      // Invalidate batches list to refresh status counts
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.byClient(client) });
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.status(client, batch) });
      // Use predicate for content items to match all queries with different options
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === 'content-items';
        },
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
  });
}

export function useSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ client, batch }: { client: string; batch: string }) =>
      triggerSchedule(client, batch),
    onSuccess: (_, { client, batch }) => {
      // Invalidate batches list to refresh status counts
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.byClient(client) });
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.status(client, batch) });
      // Use predicate for content items to match all queries with different options
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === 'content-items';
        },
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
  });
}

export function useGenerationProgress(client: string, batch: string, isGenerating: boolean) {
  return useQuery({
    queryKey: queryKeys.generationProgress.byBatch(client, batch),
    queryFn: () => getGenerationProgress(client, batch),
    enabled: !!client && !!batch && isGenerating,
    refetchInterval: isGenerating ? 2000 : false, // Poll every 2 seconds while generating
    staleTime: 1000, // Allow request batching within 1 second window
    retry: false, // Don't retry on errors during polling
  });
}

export function useIngestProgress(client: string, batch: string, isIngesting: boolean) {
  return useQuery({
    queryKey: queryKeys.ingestProgress.byBatch(client, batch),
    queryFn: () => getIngestProgress(client, batch),
    enabled: !!client && !!batch && isIngesting,
    refetchInterval: isIngesting ? 1000 : false, // Poll every 1 second while ingesting (faster to catch progress)
    staleTime: 500, // Allow request batching within 500ms window
    retry: false, // Don't retry on errors during polling
  });
}

export function useResetBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ client, batch }: { client: string; batch: string }) =>
      resetBatch(client, batch),
    onSuccess: (_, { client, batch }) => {
      // Invalidate batches list to refresh status counts
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.byClient(client) });
      queryClient.invalidateQueries({ queryKey: queryKeys.batches.status(client, batch) });
      // Use predicate for content items to match all queries with different options
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === 'content-items';
        },
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
  });
}
