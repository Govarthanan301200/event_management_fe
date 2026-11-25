import { useInfiniteQuery } from '@tanstack/react-query';
import { eventListOptions } from '../api/events.api';
import type { EventView } from '../api/events.schema';

export function useEventList(view: EventView) {
  return useInfiniteQuery(eventListOptions(view));
}
