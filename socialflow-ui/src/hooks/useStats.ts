import { useQuery } from '@tanstack/react-query';
import { getStats } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import { useVisibility } from './useVisibility';
import { TIMING } from '@/config/constants';

export function useStats() {
  const isVisible = useVisibility();

  return useQuery({
    queryKey: queryKeys.stats.all,
    queryFn: getStats,
    staleTime: TIMING.JOBS_POLL_INTERVAL / 2, // Half the poll interval for proper tab visibility handling
    refetchInterval: isVisible ? TIMING.JOBS_POLL_INTERVAL : false, // Poll with jobs for dashboard consistency
  });
}
