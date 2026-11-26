import { useEffect } from 'react';
import { useLocation } from 'react-router';

/**
 * Scrolls to `#<id>` once the page has rendered it (S10 links to S7 bands as `#band-<categoryId>`).
 * React Router doesn't scroll to hashes itself; this syncs with the browser's scroll position.
 */
export function useScrollToHash(ready: boolean) {
  const { hash } = useLocation();
  useEffect(() => {
    if (!ready || hash.length < 2) return;
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    target?.scrollIntoView({ block: 'start' });
  }, [ready, hash]);
}
