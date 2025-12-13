import { useQuery } from '@tanstack/react-query';
import { getContentItems, getContentItem } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { ContentItemsOptions } from '@/api/types';

export function useContentItems(
  client: string | undefined,
  batch: string | undefined,
  options?: ContentItemsOptions
) {
  return useQuery({
    queryKey: queryKeys.contentItems.byBatch(client, batch, options),
    // Type-safe: enabled guard ensures client/batch are defined when queryFn runs
    queryFn: () => {
      if (!client || !batch) {
        return Promise.reject(new Error('Missing client or batch parameter'));
      }
      return getContentItems(client, batch, options);
    },
    enabled: !!client && !!batch,
    staleTime: 5 * 60 * 1000, // 5 minutes - content only changes on user action
  });
}

export function useContentItem(id: string | number | undefined) {
  return useQuery({
    // Use null instead of placeholder string for disabled queries
    queryKey: id != null ? queryKeys.contentItems.detail(id) : ['content-items', 'detail', null],
    // Type-safe: enabled guard ensures id is defined when queryFn runs
    queryFn: () => {
      if (id == null) {
        return Promise.reject(new Error('Missing item ID'));
      }
      return getContentItem(id);
    },
    enabled: id != null,
    staleTime: 5 * 60 * 1000, // 5 minutes - content only changes on user action
  });
}
