import type { AgendaFunction, AgendaTask } from '../api/agenda.schema';

// S12 Today (spec §14). Pure functions; times are company-local "HH:MM" like the API's.

/** Spec §14: "Next up (due within 60 minutes)". */
export const NEXT_UP_MIN = 60;

export function minutesOf(time: string): number {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * What the Today switcher chooses between: each function dated today, then a General scope per
 * event for tasks linked to no function (decision 2026-11-26: their own chip).
 */
export type TodayScope =
  | { kind: 'function'; id: string; fn: AgendaFunction }
  | { kind: 'general'; id: string; eventId: string; eventName: string };

const generalId = (eventId: string) => `general-${eventId}`;

/** Today's tasks: due today, on events that aren't Cancelled (the server already left those out). */
export function tasksOn(tasks: readonly AgendaTask[], date: string): AgendaTask[] {
  return tasks.filter((task) => task.dueDate === date);
}

export function todayScopes(
  functions: readonly AgendaFunction[],
  tasks: readonly AgendaTask[],
  date: string,
): TodayScope[] {
  const today = functions
    .filter((fn) => fn.date === date)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const known = new Set(today.map((fn) => fn.id));
  const scopes: TodayScope[] = today.map((fn) => ({ kind: 'function', id: fn.id, fn }));
  const generalEvents = new Map<string, string>();
  for (const task of tasksOn(tasks, date)) {
    if (task.eventFunctionId === null || !known.has(task.eventFunctionId)) {
      generalEvents.set(task.eventId, task.eventName);
    }
  }
  for (const [eventId, eventName] of generalEvents) {
    scopes.push({ kind: 'general', id: generalId(eventId), eventId, eventName });
  }
  return scopes;
}

/** Chip text: the event's name is added only when today spans several events. */
export function scopeLabel(scope: TodayScope, scopes: readonly TodayScope[]): string {
  const events = new Set(scopes.map((s) => (s.kind === 'function' ? s.fn.eventId : s.eventId)));
  const name = scope.kind === 'function' ? scope.fn.name : 'General';
  if (events.size < 2) return name;
  return `${name} · ${scope.kind === 'function' ? scope.fn.eventName : scope.eventName}`;
}

/**
 * Spec §14: "defaults to the next or current one". The current function is the latest one that
 * has started and not ended (no end time: it runs until a later one starts); otherwise the next
 * one to start; after the last has ended, the last. With no functions, the first General scope.
 */
export function defaultScope(scopes: readonly TodayScope[], now: string): TodayScope | undefined {
  const fns = scopes.flatMap((scope) => (scope.kind === 'function' ? [scope] : []));
  const nowMin = minutesOf(now);
  const started = fns.filter((scope) => minutesOf(scope.fn.startTime) <= nowMin);
  const current = started.at(-1);
  if (current) {
    const { startTime, endTime } = current.fn;
    const runsPastMidnight = endTime !== null && endTime < startTime;
    if (endTime === null || runsPastMidnight || nowMin < minutesOf(endTime)) return current;
  }
  return fns.find((scope) => minutesOf(scope.fn.startTime) > nowMin) ?? fns.at(-1) ?? scopes[0];
}

/** The scope a task belongs to (opening a reminder selects it). */
export function scopeOf(task: AgendaTask, scopes: readonly TodayScope[]): TodayScope | undefined {
  return (
    scopes.find((scope) => scope.kind === 'function' && scope.id === task.eventFunctionId) ??
    scopes.find((scope) => scope.kind === 'general' && scope.eventId === task.eventId)
  );
}

export function tasksInScope(
  tasks: readonly AgendaTask[],
  scope: TodayScope,
  scopes: readonly TodayScope[],
) {
  return tasks.filter((task) => scopeOf(task, scopes)?.id === scope.id);
}

export type TodayGroupId = 'issue' | 'overdue' | 'next' | 'later' | 'anytime' | 'done';

export type TodayGroup = { id: TodayGroupId; title: string; tasks: AgendaTask[] };

const TITLES: Record<TodayGroupId, string> = {
  issue: 'Issue',
  overdue: 'Overdue',
  next: 'Next up',
  later: 'Later',
  anytime: 'Anytime today',
  done: 'Done',
};
const ORDER: TodayGroupId[] = ['issue', 'overdue', 'next', 'later', 'anytime', 'done'];

/** Timed first by time, then untimed; ties by title so the list never shuffles. */
function byTime(a: AgendaTask, b: AgendaTask): number {
  if (a.dueTime !== b.dueTime) {
    if (a.dueTime === null) return 1;
    if (b.dueTime === null) return -1;
    return a.dueTime < b.dueTime ? -1 : 1;
  }
  return a.title.localeCompare(b.title);
}

/** Which group a task is in at `now` (spec §14). An Issue is pinned on top until it's Done. */
export function todayGroupOf(task: AgendaTask, now: string): TodayGroupId {
  if (task.status === 'issue') return 'issue';
  if (task.status === 'done') return 'done';
  if (task.dueTime === null) return 'anytime';
  const until = minutesOf(task.dueTime) - minutesOf(now);
  if (until < 0) return 'overdue';
  return until <= NEXT_UP_MIN ? 'next' : 'later';
}

/** Spec §14 order: Overdue · Next up · Later · Anytime today · Done, with Issues pinned first. Empty groups are left out. */
export function groupToday(tasks: readonly AgendaTask[], now: string): TodayGroup[] {
  const sorted = [...tasks].sort(byTime);
  return ORDER.map((id) => ({
    id,
    title: TITLES[id],
    tasks: sorted.filter((task) => todayGroupOf(task, now) === id),
  })).filter((group) => group.tasks.length > 0);
}

/** The header's progress bar: done of all of the scope's tasks. */
export function progressOf(tasks: readonly AgendaTask[]): { done: number; total: number } {
  return { done: tasks.filter((task) => task.status === 'done').length, total: tasks.length };
}

/** For the overdue strip, the tab badge and the app icon badge: across every scope today. */
export function overdueToday(
  tasks: readonly AgendaTask[],
  now: { date: string; time: string },
): AgendaTask[] {
  return tasksOn(tasks, now.date)
    .filter((task) => todayGroupOf(task, now.time) === 'overdue')
    .sort(byTime);
}
