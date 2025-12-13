import { useQuery } from '@tanstack/react-query';
import { getJobs } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import { useVisibility } from './useVisibility';
import { TIMING } from '@/config/constants';

/**
 * Hook for tracking workflow execution jobs.
 * Polls every 10 seconds to keep status updated.
 * Pauses polling when tab is not visible.
 */
export function useJobs() {
  const isVisible = useVisibility();

  return useQuery({
    queryKey: queryKeys.jobs.all,
    queryFn: getJobs,
    staleTime: TIMING.JOBS_POLL_INTERVAL / 2, // Half the poll interval for proper tab visibility handling
    refetchInterval: isVisible ? TIMING.JOBS_POLL_INTERVAL : false,
  });
}
