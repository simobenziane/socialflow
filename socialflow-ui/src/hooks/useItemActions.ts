import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  approveItem,
  rejectItem,
  updateItemCaption,
  approveBatchItems,
  updateItemPlatforms,
} from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { ContentItemsResponse, ContentItem } from '@/api/types';

/**
 * Helper to update a single item in the content items cache
 */
function updateItemInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  itemId: string | number,
  updater: (item: ContentItem) => ContentItem
) {
  // Normalize ID to string for consistent comparison
  const normalizedId = String(itemId);

  // Get all matching queries (could be multiple with different options)
  queryClient.setQueriesData<ContentItemsResponse>(
    { queryKey: queryKeys.contentItems.all },
    (old) => {
      if (!old?.data?.items) return old;
      return {
        ...old,
        data: {
          ...old.data,
          items: old.data.items.map((item) =>
            String(item.id) === normalizedId || String(item.content_id) === normalizedId
              ? updater(item)
              : item
          ),
        },
      };
    }
  );
}

export function useApproveItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => approveItem(id),
    retry: 1,
    retryDelay: 1000,
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.contentItems.all });

      // Snapshot the previous value
      const previousData = queryClient.getQueriesData<ContentItemsResponse>({
        queryKey: queryKeys.contentItems.all,
      });

      // Optimistically update to the new value
      updateItemInCache(queryClient, id, (item) => ({
        ...item,
        status: 'APPROVED',
      }));

      return { previousData };
    },
    onError: (err, _id, context) => {
      // Log error and rollback
      console.error('[useApproveItem] Failed:', err);
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Only invalidate stats and batch status - specific item updates are handled optimistically
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
      // Only invalidate batch STATUS queries (key[3] === 'status'), not batch lists
      // This prevents unnecessary re-fetching of batch lists when only status counts changed
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === 'batches' && key[3] === 'status';
        },
      });
    },
  });
}

export function useRejectItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string | number; reason?: string }) =>
      rejectItem(id, reason),
    retry: 1,
    retryDelay: 1000,
    onMutate: async ({ id }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.contentItems.all });

      // Snapshot the previous value
      const previousData = queryClient.getQueriesData<ContentItemsResponse>({
        queryKey: queryKeys.contentItems.all,
      });

      // Optimistically update to the new value
      updateItemInCache(queryClient, id, (item) => ({
        ...item,
        status: 'BLOCKED',
      }));

      return { previousData };
    },
    onError: (err, _vars, context) => {
      // Log error and rollback
      console.error('[useRejectItem] Failed:', err);
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Only invalidate stats and batch status - specific item updates are handled optimistically
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
      // Only invalidate batch STATUS queries (key[3] === 'status'), not batch lists
      // This prevents unnecessary re-fetching of batch lists when only status counts changed
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === 'batches' && key[3] === 'status';
        },
      });
    },
  });
}

export function useUpdateItemCaption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      captions,
    }: {
      id: string | number;
      captions: { caption_ig?: string; caption_tt?: string; caption_override?: string };
    }) => updateItemCaption(id, captions),
    retry: 1,
    retryDelay: 1000,
    onMutate: async ({ id, captions }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.contentItems.all });

      // Snapshot the previous value
      const previousData = queryClient.getQueriesData<ContentItemsResponse>({
        queryKey: queryKeys.contentItems.all,
      });

      // Optimistically update the caption
      updateItemInCache(queryClient, id, (item) => ({
        ...item,
        caption_ig: captions.caption_ig ?? item.caption_ig,
        caption_tt: captions.caption_tt ?? item.caption_tt,
        caption_override: captions.caption_override ?? item.caption_override,
      }));

      return { previousData };
    },
    onError: (err, _vars, context) => {
      // Log error and rollback
      console.error('[useUpdateItemCaption] Failed:', err);
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Invalidate to ensure consistency with server state
      queryClient.invalidateQueries({ queryKey: queryKeys.contentItems.all });
    },
  });
}

export function useApproveBatchItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: (string | number)[]) => approveBatchItems(ids),
    retry: 1,
    retryDelay: 1000,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contentItems.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
      // Only invalidate batch STATUS queries (key[3] === 'status'), not batch lists
      // This prevents unnecessary re-fetching of batch lists when only status counts changed
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === 'batches' && key[3] === 'status';
        },
      });
    },
  });
}

/**
 * Hook for updating item platforms (IG/TT) - v17.8
 * Used for per-item platform selection via toggleable badges
 */
export function useUpdateItemPlatforms() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      platforms,
    }: {
      id: string | number;
      platforms: 'ig' | 'tt' | 'ig,tt';
    }) => updateItemPlatforms(id, platforms),
    retry: 1,
    retryDelay: 1000,
    onMutate: async ({ id, platforms }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.contentItems.all });

      // Snapshot the previous value
      const previousData = queryClient.getQueriesData<ContentItemsResponse>({
        queryKey: queryKeys.contentItems.all,
      });

      // Optimistically update the platforms
      updateItemInCache(queryClient, id, (item) => ({
        ...item,
        platforms,
      }));

      return { previousData };
    },
    onError: (err, _vars, context) => {
      // Log error and rollback
      console.error('[useUpdateItemPlatforms] Failed:', err);
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Invalidate to ensure consistency with server state
      queryClient.invalidateQueries({ queryKey: queryKeys.contentItems.all });
    },
  });
}
