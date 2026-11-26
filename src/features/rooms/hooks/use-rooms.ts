import { useQuery } from '@tanstack/react-query';
import { roomsOptions } from '../api/rooms.api';

export function useRooms(eventId: string) {
  return useQuery(roomsOptions(eventId));
}
