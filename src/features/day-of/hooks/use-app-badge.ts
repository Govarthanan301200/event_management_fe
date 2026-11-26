import { useEffect } from 'react';

/**
 * The overdue count on the app icon (spec §14 design ideas; Badging API, installed app only).
 * Syncs an external system, so an effect. Ignored where the browser has no badge.
 */
export function useAppBadge(count: number) {
  useEffect(() => {
    if (!('setAppBadge' in navigator)) return;
    const done = count > 0 ? navigator.setAppBadge(count) : navigator.clearAppBadge();
    done.catch(() => undefined); // permission or platform refused: the in-app count still shows
  }, [count]);
}
