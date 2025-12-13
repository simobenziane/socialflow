import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAccounts, syncAccounts } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

export function useAccounts() {
  return useQuery({
    queryKey: queryKeys.accounts.all,
    queryFn: getAccounts,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSyncAccounts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncAccounts,
    // Use onSettled only - called after both success and error
    // This avoids duplicate invalidation when onSuccess and onSettled both fire
    onSettled: () => {
      // Invalidate to refetch fresh data from the updated cache
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });
}
