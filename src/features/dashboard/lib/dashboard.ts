import { formatClock, formatDateRange, formatDay, formatINRCompact } from '@/lib/format';
import type { CategoryOver, DashboardTask } from '../api/dashboard.schema';

// S13 Dashboard (spec §15). Pure helpers: wording and where each row leads. The counts themselves
// come from the server (Backend dashboard.rules.ts), so they match the data behind them.

/** "Good morning" until noon, "Good afternoon" until 5 PM, then "Good evening" (company time). */
export function greeting(time: string): string {
  const hour = Number(time.slice(0, 2));
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** "Thu 26 Nov 2026": the page date, with its weekday. */
export function longDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  const weekday = new Intl.DateTimeFormat('en-IN', { weekday: 'short', timeZone: 'UTC' }).format(
    date,
  );
  const rest = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
  return `${weekday} ${rest}`;
}

/** Spec §15 acceptance: each widget links to the screen that resolves it. */
export const links = {
  /** S12 on that function (Today's switcher reads `?scope=`). */
  today: (functionId: string) => `/today?scope=${encodeURIComponent(functionId)}`,
  /** S12's General chip for an event's unlinked tasks. */
  todayGeneral: (eventId: string) => `/today?scope=${encodeURIComponent(`general-${eventId}`)}`,
  /** S9 for that function. */
  byFunction: (eventId: string, functionId: string) =>
    `/events/${encodeURIComponent(eventId)}/by-function?fn=${encodeURIComponent(functionId)}`,
  /** S11, scrolled to the task (decision 2026-11-26: works for a task of any age). */
  task: (task: Pick<DashboardTask, 'id' | 'eventId'>) =>
    `/events/${encodeURIComponent(task.eventId)}/tasks?task=${encodeURIComponent(task.id)}`,
  /** S6: the requested services panel and the event's overview. */
  event: (eventId: string) => `/events/${encodeURIComponent(eventId)}`,
  /** S10: where envelopes and the overall budget are compared. */
  summary: (eventId: string) => `/events/${encodeURIComponent(eventId)}/summary`,
};

/** When a task is due: "4:30 PM" or "Today" today; else "28 Nov · 4:30 PM", or "1 Jun 2098". */
export function dueLabel(task: Pick<DashboardTask, 'dueDate' | 'dueTime'>, today: string): string {
  const time = task.dueTime === null ? null : formatClock(task.dueTime);
  if (task.dueDate === today) return time ?? 'Today';
  return [formatDay(task.dueDate), time].filter(Boolean).join(' · ');
}

/** "Priya & Arjun · Reception", or just the event for a task on no function. */
export function taskContext(task: Pick<DashboardTask, 'eventName' | 'functionName'>): string {
  return task.functionName ? `${task.eventName} · ${task.functionName}` : task.eventName;
}

/** The event's dates: "5–7 Dec"; "No functions yet" without any. */
export function spanLabel(first: string | null, last: string | null): string {
  if (first === null || last === null) return 'No functions yet';
  return formatDateRange(first, last);
}

/** "₹18.2L of ₹22L", or "₹9.5L planned · no budget" (compact form: dashboard rows only). */
export function moneyLabel(planned: number, overallBudget: number | null): string {
  if (overallBudget === null) return `${formatINRCompact(planned)} planned · no budget`;
  return `${formatINRCompact(planned)} of ${formatINRCompact(overallBudget)}`;
}

/** The wireframe's tag: "Decor over"; "Decor, Catering over"; "Decor, Catering +2 over". */
export function categoriesOverLabel(categories: readonly CategoryOver[]): string | null {
  if (categories.length === 0) return null;
  const names = categories.slice(0, 2).map((category) => category.name);
  const more = categories.length > 2 ? ` +${String(categories.length - 2)}` : '';
  return `${names.join(', ')}${more} over`;
}

/** Over budget lines: "₹1.2L over budget", "Decor ₹50,000 over". */
export function overLines(overBy: number | null, categories: readonly CategoryOver[]): string[] {
  return [
    ...(overBy === null ? [] : [`${formatINRCompact(overBy)} over budget`]),
    ...categories.map((category) => `${category.name} ${formatINRCompact(category.overBy)} over`),
  ];
}

/** "Sent today", "Sent yesterday", "Sent 3 days ago", else "Sent 14 Feb". */
export function sentLabel(sentAt: Date | null, today: string, timeZone: string): string | null {
  if (sentAt === null) return null;
  const sentOn = new Intl.DateTimeFormat('en-CA', { timeZone }).format(sentAt);
  const days = Math.round(
    (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${sentOn}T00:00:00Z`)) / 86_400_000,
  );
  if (days <= 0) return 'Sent today';
  if (days === 1) return 'Sent yesterday';
  if (days < 7) return `Sent ${String(days)} days ago`;
  return `Sent ${formatDay(sentOn, timeZone)}`;
}

/** "3 more": the rows a widget leaves out. */
export function moreCount(list: { total: number; items: readonly unknown[] }): number {
  return Math.max(list.total - list.items.length, 0);
}
