import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bulkUpdateSchedule } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { ScheduledItem, BulkScheduleResponse } from '@/components/scheduling/types';

interface UseScheduleItemsOptions {
  clientSlug: string;
  batchSlug: string;
}

/**
 * Hook for bulk updating content item schedules
 * Invalidates batch status and content items queries on success
 */
export function useScheduleItems({ clientSlug, batchSlug }: UseScheduleItemsOptions) {
  const queryClient = useQueryClient();

  return useMutation<BulkScheduleResponse, Error, ScheduledItem[]>({
    mutationFn: async (items: ScheduledItem[]) => {
      const requestItems = items.map((item) => ({
        id: item.id,
        scheduled_date: item.scheduled_date,
        scheduled_time: item.scheduled_time,
        slot: item.slot,
      }));

      return bulkUpdateSchedule(clientSlug, batchSlug, requestItems);
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.batches.status(clientSlug, batchSlug),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.contentItems.byBatch(clientSlug, batchSlug),
      });
    },
  });
}
