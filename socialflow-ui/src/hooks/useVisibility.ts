import { useState, useEffect } from 'react';

/**
 * Hook that tracks document visibility state.
 * Returns false when tab is hidden, true when visible.
 * Useful for pausing polling when user is not actively viewing the page.
 */
export function useVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(() => {
    // SSR safety: default to true if document is not available
    if (typeof document === 'undefined') return true;
    return document.visibilityState === 'visible';
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}
