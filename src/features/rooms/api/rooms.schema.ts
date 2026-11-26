import { z } from 'zod';

// Mirrors Backend/src/modules/rooms/rooms.schema.ts (S14, spec §10).

export const ROOM_GUEST_STATUSES = [
  'expected',
  'checked_in',
  'checked_out',
  'no_show',
  'cancelled',
] as const;
export type RoomGuestStatus = (typeof ROOM_GUEST_STATUSES)[number];

export const hotelSchema = z.object({
  id: z.string(),
  name: z.string(),
  area: z.string().nullable(),
  contact: z.string().nullable(),
});
export type Hotel = z.infer<typeof hotelSchema>;

export const guestRowSchema = z.object({
  id: z.string(),
  gId: z.string().nullable(),
  srNo: z.string().nullable(),
  cluster: z.string().nullable(),
  groupId: z.string().nullable(),
  name: z.string(),
  contact: z.string().nullable(),
  eventHotelId: z.string().nullable(),
  roomNo: z.string().nullable(),
  status: z.enum(ROOM_GUEST_STATUSES).nullable(),
  pax: z.number().int().nullable(),
  rc: z.number().int().nullable(),
  hamper: z.number().int().nullable(),
  checkInDate: z.iso.date().nullable(),
  arrivalTime: z.string().nullable(),
  departureDate: z.iso.date().nullable(),
});
export type GuestRow = z.infer<typeof guestRowSchema>;

export const roomsSchema = z.object({
  hotels: z.array(hotelSchema),
  rows: z.array(guestRowSchema),
});
export type Rooms = z.infer<typeof roomsSchema>;

export const importResultSchema = roomsSchema.extend({
  added: z.number().int(),
  hotelsAdded: z.array(z.string()),
});
export type ImportResult = z.infer<typeof importResultSchema>;

/** The editable values of a row (everything but its id). */
export type GuestValues = Omit<GuestRow, 'id'>;
/** A row to add from the grid: a name, anything else optional. */
export type GuestRowInput = Partial<GuestValues> & { name: string };
/** A row from a paste or an XLSX file: hotels travel by name. */
export type ImportRowInput = Partial<Omit<GuestValues, 'eventHotelId'>> & {
  name: string;
  hotelName?: string | null;
};
export type HotelInput = { name: string; area: string | null; contact: string | null };
