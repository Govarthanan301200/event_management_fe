import { ROOM_GUEST_STATUSES, type RoomGuestStatus } from '../api/rooms.schema';

/** Spec §10 Status dropdown: "Expected, Checked in, C/O, No-show, Cancelled". */
export const STATUS_LABELS: Record<RoomGuestStatus, string> = {
  expected: 'Expected',
  checked_in: 'Checked in',
  checked_out: 'C/O',
  no_show: 'No-show',
  cancelled: 'Cancelled',
};

const SPELLINGS: Record<string, RoomGuestStatus> = {
  expected: 'expected',
  exp: 'expected',
  checkedin: 'checked_in',
  checkin: 'checked_in',
  in: 'checked_in',
  ci: 'checked_in',
  co: 'checked_out',
  checkedout: 'checked_out',
  checkout: 'checked_out',
  out: 'checked_out',
  noshow: 'no_show',
  ns: 'no_show',
  cancelled: 'cancelled',
  canceled: 'cancelled',
  cancel: 'cancelled',
};

/**
 * A status as typed in a sheet, matched loosely (decision 2026-11-27): "In" → Checked in,
 * "CO" or "C/O" → C/O. Blank → null; a word it can't place → undefined (reported, kept blank).
 */
export function parseStatus(text: string): RoomGuestStatus | null | undefined {
  const key = text.toLowerCase().replace(/[^a-z]/g, '');
  if (key === '') return null;
  if ((ROOM_GUEST_STATUSES as readonly string[]).includes(key)) return key as RoomGuestStatus;
  return SPELLINGS[key];
}
