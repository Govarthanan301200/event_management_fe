import { useInfiniteQuery } from '@tanstack/react-query';
import { eventListOptions } from '../api/events.api';

export function useEventList() {
  return useInfiniteQuery(eventListOptions());
}
