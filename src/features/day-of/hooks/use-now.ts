import { useSyncExternalStore } from 'react';
import { nowIn } from '@/features/tasks';

/** Re-checked often enough for Next up and Overdue to move on their own while the screen is open. */
const TICK_MS = 30_000;

function subscribe(onChange: () => void) {
  const timer = setInterval(onChange, TICK_MS);
  // Coming back to the tab (phone unlocked at the venue) refreshes at once.
  document.addEventListener('visibilitychange', onChange);
  return () => {
    clearInterval(timer);
    document.removeEventListener('visibilitychange', onChange);
  };
}

/** "Now" in the company time zone, as { date, time }, ticking every 30 seconds (external clock). */
export function useNow(timeZone = 'Asia/Kolkata'): { date: string; time: string } {
  // A string snapshot, so React sees "unchanged" until the minute does.
  const key = useSyncExternalStore(subscribe, () => {
    const now = nowIn(timeZone);
    return `${now.date} ${now.time}`;
  });
  const [date = '', time = ''] = key.split(' ');
  return { date, time };
}
