import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAccounts, syncAccounts } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';

export function useAccounts() {
  return useQuery({
    queryKey: queryKeys.accounts.all,
    queryFn: getAccounts,
    staleTime: 4 * 60 * 1000, // N12: 4 minutes - longer than sync timeout (2 min) to avoid redundant requests
  });
}

/**
 * Hook to sync profiles and accounts from Late.com
 * Calls W0 webhook with timeout handling
 */
export function useSyncAccounts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncAccounts,
    onSettled: () => {
      // Invalidate to refetch fresh data from the updated cache
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });
}
