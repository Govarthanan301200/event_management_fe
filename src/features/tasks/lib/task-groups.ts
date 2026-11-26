import { formatDay } from '@/lib/format';
import { taskStatusSchema, type Task, type TaskKind, type TaskStatus } from '../api/tasks.schema';

type FunctionInfo = { id: string; name: string; date: string };

export type TaskSection = {
  id: string;
  kind: TaskKind;
  /** "Pre-event", "Day-of", "After the event". */
  title: string;
  /** Day-of only: "Sangeet · 12 Feb" or "General · 12 Feb". */
  detail: string | null;
  tasks: Task[];
};

/** Within a day: timed tasks by time, then the ones for any time that day; then oldest first. */
function byWhen(a: Task, b: Task): number {
  if (a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
  if (a.dueTime !== b.dueTime) {
    if (a.dueTime === null) return 1;
    if (b.dueTime === null) return -1;
    return a.dueTime < b.dueTime ? -1 : 1;
  }
  return 0;
}

/**
 * S11 (spec §13): Pre-event by date; Day-of by date, then function (event order, General last),
 * then time; After the event by date (decision 2026-11-26). The kind comes from the server.
 */
export function groupTasks(
  tasks: readonly Task[],
  functions: readonly FunctionInfo[],
): TaskSection[] {
  const sorted = [...tasks].sort(byWhen);
  const sections: TaskSection[] = [];
  const pre = sorted.filter((task) => task.kind === 'pre_event');
  if (pre.length > 0)
    sections.push({ id: 'pre', kind: 'pre_event', title: 'Pre-event', detail: null, tasks: pre });

  const dayOf = sorted.filter((task) => task.kind === 'day_of');
  const days = [...new Set(dayOf.map((task) => task.dueDate))];
  for (const day of days) {
    const ofDay = dayOf.filter((task) => task.dueDate === day);
    for (const fn of functions) {
      const linked = ofDay.filter((task) => task.eventFunctionId === fn.id);
      if (linked.length > 0) {
        sections.push({
          id: `day-${day}-${fn.id}`,
          kind: 'day_of',
          title: 'Day-of',
          detail: `${fn.name} · ${formatDay(day)}`,
          tasks: linked,
        });
      }
    }
    const known = new Set(functions.map((fn) => fn.id));
    const general = ofDay.filter(
      (task) => task.eventFunctionId === null || !known.has(task.eventFunctionId),
    );
    if (general.length > 0) {
      sections.push({
        id: `day-${day}-general`,
        kind: 'day_of',
        title: 'Day-of',
        detail: `General · ${formatDay(day)}`,
        tasks: general,
      });
    }
  }

  const after = sorted.filter((task) => task.kind === 'after_event');
  if (after.length > 0) {
    sections.push({
      id: 'after',
      kind: 'after_event',
      title: 'After the event',
      detail: null,
      tasks: after,
    });
  }
  return sections;
}

/** S11 filters, kept in the URL (decision 2026-11-26). `fn=none` is "No function". */
export type TaskFilters = { status: TaskStatus | null; fn: string | null; vendor: string | null };

export const NO_FUNCTION = 'none';

export function readFilters(params: URLSearchParams): TaskFilters {
  const status = taskStatusSchema.safeParse(params.get('status'));
  return {
    status: status.success ? status.data : null,
    fn: params.get('fn'),
    vendor: params.get('vendor'),
  };
}

export function hasFilters(filters: TaskFilters): boolean {
  return filters.status !== null || filters.fn !== null || filters.vendor !== null;
}

export function applyFilters(tasks: readonly Task[], filters: TaskFilters): Task[] {
  return tasks.filter(
    (task) =>
      (filters.status === null || task.status === filters.status) &&
      (filters.fn === null ||
        (filters.fn === NO_FUNCTION
          ? task.eventFunctionId === null
          : task.eventFunctionId === filters.fn)) &&
      (filters.vendor === null || task.vendor?.id === filters.vendor),
  );
}

/** Vendor filter choices: the vendors the event's tasks show, by name. */
export function vendorOptions(tasks: readonly Task[]): { id: string; name: string }[] {
  const byId = new Map<string, string>();
  for (const task of tasks) if (task.vendor) byId.set(task.vendor.id, task.vendor.name);
  return [...byId].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
}

/** "Now" in the company time zone as calendar date and wall-clock time. */
export function nowIn(timeZone = 'Asia/Kolkata', now = new Date()): { date: string; time: string } {
  const date = new Intl.DateTimeFormat('en-CA', { timeZone }).format(now);
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now);
  return { date, time };
}

/** A pending task past its day, or past its time today. Issues already carry their own ⚠. */
export function isOverdue(
  task: Pick<Task, 'status' | 'dueDate' | 'dueTime'>,
  now: { date: string; time: string },
) {
  if (task.status !== 'pending') return false;
  if (task.dueDate !== now.date) return task.dueDate < now.date;
  return task.dueTime !== null && task.dueTime < now.time;
}
