import { useRef, useEffect } from 'react';

/**
 * Hook to track component mount state for safe async operations.
 * Returns a ref that is true while the component is mounted.
 *
 * @example
 * const isMountedRef = useIsMounted();
 *
 * const handleAsync = async () => {
 *   const result = await fetchData();
 *   if (!isMountedRef.current) return;
 *   setState(result);
 * };
 */
export function useIsMounted(): React.MutableRefObject<boolean> {
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return isMountedRef;
}
