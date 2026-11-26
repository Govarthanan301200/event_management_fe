import { formatDay } from '@/lib/format';
import type { AgendaTask } from '../api/agenda.schema';

/** Spec §14: "pre-event tasks for the next 14 days". */
export const UPCOMING_DAYS = 14;
/**
 * SPEC-GAP: the spec doesn't say where a task left pending after its date goes once it's off
 * Today. Default (2026-11-26): Upcoming opens with an Overdue group for the past week's open tasks.
 */
export const LOOKBACK_DAYS = 7;

/** A "YYYY-MM-DD" calendar date plus whole days. */
export function addDays(date: string, days: number): string {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export type UpcomingGroup = { id: string; title: string; overdue: boolean; tasks: AgendaTask[] };

function byWhen(a: AgendaTask, b: AgendaTask): number {
  if (a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
  if (a.dueTime !== b.dueTime) {
    if (a.dueTime === null) return 1;
    if (b.dueTime === null) return -1;
    return a.dueTime < b.dueTime ? -1 : 1;
  }
  return a.title.localeCompare(b.title);
}

/** "Today", "Tomorrow", else "Sat · 28 Nov". */
export function dayTitle(date: string, today: string): string {
  if (date === today) return 'Today';
  if (date === addDays(today, 1)) return 'Tomorrow';
  const weekday = new Intl.DateTimeFormat('en-IN', { weekday: 'short', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`),
  );
  return `${weekday} · ${formatDay(date)}`;
}

/**
 * Upcoming (spec §14, decision 2026-11-26): every task that isn't day-of (pre-event and after
 * the event), today and the next 13 days, grouped by date. First, the past week's tasks still
 * open, of any kind (SPEC-GAP default above).
 */
export function groupUpcoming(tasks: readonly AgendaTask[], today: string): UpcomingGroup[] {
  const last = addDays(today, UPCOMING_DAYS - 1);
  const sorted = [...tasks].sort(byWhen);
  const overdue = sorted.filter((task) => task.dueDate < today && task.status !== 'done');
  const ahead = sorted.filter(
    (task) => task.kind !== 'day_of' && task.dueDate >= today && task.dueDate <= last,
  );
  const groups: UpcomingGroup[] = [];
  if (overdue.length > 0)
    groups.push({ id: 'overdue', title: 'Overdue', overdue: true, tasks: overdue });
  for (const date of new Set(ahead.map((task) => task.dueDate))) {
    groups.push({
      id: date,
      title: dayTitle(date, today),
      overdue: false,
      tasks: ahead.filter((task) => task.dueDate === date),
    });
  }
  return groups;
}
