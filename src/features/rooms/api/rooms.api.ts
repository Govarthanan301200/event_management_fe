import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { getAccessToken } from '@/features/auth/api/supabase';
import { eventsKeys } from '@/features/events';
import { apiRequest, dataOf } from '@/lib/api-client';
import {
  guestRowSchema,
  hotelSchema,
  importResultSchema,
  roomsSchema,
  type GuestRowInput,
  type GuestValues,
  type HotelInput,
  type ImportRowInput,
} from './rooms.schema';

export const roomsKeys = {
  /** Under the event, so an event refetch also refreshes its rooms. */
  event: (eventId: string) => [...eventsKeys.detail(eventId), 'rooms'] as const,
  /** Autosaves share a key, so the header can say "Saving…". */
  save: (eventId: string) => ['rooms', 'save', eventId] as const,
};

const roomsPath = (eventId: string) => `/api/v1/events/${encodeURIComponent(eventId)}/rooms`;

/** S14 (spec §10): the event's hotels and guest rows. */
export function roomsOptions(eventId: string) {
  return queryOptions({
    queryKey: roomsKeys.event(eventId),
    queryFn: async () =>
      apiRequest(roomsPath(eventId), dataOf(roomsSchema), { token: await getAccessToken() }),
  });
}

const noContent = z.unknown();

export async function addRows(eventId: string, rows: GuestRowInput[]) {
  return apiRequest(`${roomsPath(eventId)}/rows`, dataOf(z.array(guestRowSchema)), {
    method: 'POST',
    token: await getAccessToken(),
    body: { rows },
  });
}

export async function updateRow(eventId: string, rowId: string, change: Partial<GuestValues>) {
  return apiRequest(
    `${roomsPath(eventId)}/rows/${encodeURIComponent(rowId)}`,
    dataOf(guestRowSchema),
    { method: 'PATCH', token: await getAccessToken(), body: change },
  );
}

export async function deleteRows(eventId: string, ids: string[]) {
  await apiRequest(`${roomsPath(eventId)}/rows/delete`, noContent, {
    method: 'POST',
    token: await getAccessToken(),
    body: { ids },
  });
}

/** XLSX import and multi-row paste: rows with hotel names, appended unless `replace`. */
export async function importRows(
  eventId: string,
  input: { rows: ImportRowInput[]; replace: boolean },
  idempotencyKey: string,
) {
  return apiRequest(`${roomsPath(eventId)}/import`, dataOf(importResultSchema), {
    method: 'POST',
    token: await getAccessToken(),
    body: input,
    headers: { 'Idempotency-Key': idempotencyKey },
  });
}

export async function createHotel(eventId: string, input: HotelInput) {
  return apiRequest(`${roomsPath(eventId)}/hotels`, dataOf(hotelSchema), {
    method: 'POST',
    token: await getAccessToken(),
    body: input,
  });
}

export async function updateHotel(eventId: string, hotelId: string, input: HotelInput) {
  return apiRequest(
    `${roomsPath(eventId)}/hotels/${encodeURIComponent(hotelId)}`,
    dataOf(hotelSchema),
    { method: 'PATCH', token: await getAccessToken(), body: input },
  );
}

export async function deleteHotel(eventId: string, hotelId: string) {
  await apiRequest(`${roomsPath(eventId)}/hotels/${encodeURIComponent(hotelId)}`, noContent, {
    method: 'DELETE',
    token: await getAccessToken(),
  });
}
