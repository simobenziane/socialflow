import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getScheduledPosts, syncScheduledPosts } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

/**
 * Hook to fetch cached scheduled posts for a client
 */
export function useScheduledPosts(slug: string) {
  return useQuery({
    queryKey: queryKeys.posts.scheduled(slug),
    queryFn: () => getScheduledPosts(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to sync scheduled posts from Late.com for a specific client
 */
export function useSyncScheduledPosts(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => syncScheduledPosts(slug),
    onSettled: () => {
      // Invalidate this client's posts cache to trigger refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.scheduled(slug) });
    },
  });
}
