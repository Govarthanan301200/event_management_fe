import { useLocation } from 'react-router';
import { z } from 'zod';

const fromState = z.object({ from: z.string() });

/** The directory view to go back to: its filters travel in navigation state as a query string. */
export function useDirectoryOrigin(): { from: string; href: string } {
  const state = fromState.safeParse(useLocation().state);
  const from = state.success ? state.data.from : '';
  return { from, href: from ? `/vendors?${from}` : '/vendors' };
}
