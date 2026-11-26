import { http, HttpResponse } from 'msw';
import type { Agenda, AgendaFunction, AgendaTask } from '../api/agenda.schema';
import { addDays } from '../lib/upcoming';
import { muhurtham, reception } from './fixtures';

// An in-memory day-of backend for MSW (Today, Upcoming, Call, Shift, quick add). Status changes
// follow the server's offline rules (Backend tasks.rules.ts, unit-tested there): last write wins on
// the device's `changedAt`, and a replayed Idempotency-Key changes nothing.

export const API = 'http://api.test/api/v1';

type StatusBody =
  | { status: 'pending'; changedAt: string }
  | { status: 'done'; changedAt: string }
  | { status: 'issue'; issueNote: string; changedAt: string };

type Options = { tasks: AgendaTask[]; functions?: AgendaFunction[] };

const minutes = (time: string) => {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return h * 60 + m;
};
const clock = (total: number) =>
  `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

export function createDayOfServer({ tasks: seed, functions = [muhurtham, reception] }: Options) {
  let tasks: AgendaTask[] = structuredClone(seed);
  const changedAt = new Map<string, string>(
    tasks.map((task) => [task.id, '2000-01-01T00:00:00.000Z']),
  );
  const seenKeys = new Set<string>();
  /** Every status PATCH that reached the server, in arrival order. */
  const statusRequests: {
    taskId: string;
    body: StatusBody;
    key: string | null;
    applied: boolean;
  }[] = [];
  const shiftBodies: unknown[] = [];
  const createBodies: unknown[] = [];
  let agendaCalls = 0;
  let nextId = 1;

  const agenda = (from: string, days: number): Agenda => {
    const to = addDays(from, days - 1);
    return {
      timeZone: 'Asia/Kolkata',
      today: from,
      from,
      to,
      functions: functions.filter((fn) => fn.date >= from && fn.date <= to),
      tasks: tasks.filter((task) => task.dueDate >= from && task.dueDate <= to),
    };
  };

  const eventDetail = (eventId: string) => ({
    id: eventId,
    name: 'Ananya & Rohan',
    clientName: 'Ananya',
    status: 'planning',
    formSubmittedAt: null,
    createdAt: '2026-11-20T10:00:00.000Z',
    firstFunctionDate: '2099-02-14',
    lastFunctionDate: '2099-02-14',
    functionCount: functions.length,
    clientPhone: '+91 98765 43210',
    clientEmail: null,
    overallBudget: null,
    formToken: 'x'.repeat(43),
    formLocked: false,
    requestedServices: [],
    functions: functions
      .filter((fn) => fn.eventId === eventId)
      .map((fn, index) => ({
        id: fn.id,
        functionTypeId: null,
        customName: fn.name,
        name: fn.name,
        functionTypeArchived: false,
        date: fn.date,
        startTime: fn.startTime,
        endTime: fn.endTime,
        venueName: fn.venueName,
        venueAddress: null,
        guestCount: 300,
        sortOrder: index,
      })),
    openTasks: tasks.filter((task) => task.status !== 'done').length,
  });

  const handlers = [
    http.get(`${API}/agenda`, ({ request }) => {
      agendaCalls += 1;
      const url = new URL(request.url);
      return HttpResponse.json({
        data: agenda(
          url.searchParams.get('from') ?? '2099-02-14',
          Number(url.searchParams.get('days') ?? 2),
        ),
      });
    }),
    http.patch(`${API}/events/:eventId/tasks/:taskId/status`, async ({ request, params }) => {
      const body = (await request.json()) as StatusBody;
      const key = request.headers.get('Idempotency-Key');
      const taskId = String(params.taskId);
      const current = tasks.find((task) => task.id === taskId);
      if (!current)
        return HttpResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Task not found' } },
          { status: 404 },
        );
      const replay = key !== null && seenKeys.has(key);
      if (key) seenKeys.add(key);
      const applied = !replay && body.changedAt > (changedAt.get(taskId) ?? '');
      statusRequests.push({ taskId, body, key, applied });
      if (applied) {
        changedAt.set(taskId, body.changedAt);
        const next: AgendaTask = {
          ...current,
          status: body.status,
          issueNote: body.status === 'issue' ? body.issueNote : null,
          completedAt: body.status === 'done' ? new Date(body.changedAt) : null,
        };
        tasks = tasks.map((task) => (task.id === taskId ? next : task));
      }
      const { eventName: _eventName, ...task } = tasks.find((t) => t.id === taskId) ?? current;
      return HttpResponse.json({ data: task, meta: { applied } });
    }),
    http.post(`${API}/events/:eventId/tasks/shift`, async ({ request }) => {
      const body = (await request.json()) as {
        eventFunctionId: string;
        minutes: number;
        taskIds?: string[];
      };
      shiftBodies.push(body);
      const movable = tasks.filter(
        (task) =>
          task.eventFunctionId === body.eventFunctionId &&
          task.status === 'pending' &&
          task.dueTime !== null &&
          (body.taskIds === undefined || body.taskIds.includes(task.id)),
      );
      const moved = movable.map((task) => ({
        ...task,
        dueTime: clock(minutes(task.dueTime ?? '00:00') + body.minutes),
      }));
      tasks = tasks.map((task) => moved.find((m) => m.id === task.id) ?? task);
      return HttpResponse.json({ data: moved });
    }),
    http.post(`${API}/events/:eventId/tasks`, async ({ request, params }) => {
      const body = (await request.json()) as {
        title: string;
        eventFunctionIds: string[];
        dueDate: string | null;
        dueTime: string | null;
        remindBeforeMin: number;
      };
      createBodies.push(body);
      const slots = body.eventFunctionIds.length === 0 ? [null] : body.eventFunctionIds;
      const created = slots.map((fnId): AgendaTask => {
        const fn = functions.find((f) => f.id === fnId);
        return {
          id: `t-new-${String(nextId++)}`,
          eventId: String(params.eventId),
          eventName: 'Ananya & Rohan',
          eventFunctionId: fn?.id ?? null,
          functionName: fn?.name ?? null,
          serviceLineId: null,
          serviceName: null,
          vendor: null,
          title: body.title,
          dueDate: fn?.date ?? body.dueDate ?? '2099-02-14',
          dueTime: body.dueTime,
          remindBeforeMin: body.remindBeforeMin,
          status: 'pending',
          issueNote: null,
          completedAt: null,
          kind: fn ? 'day_of' : 'pre_event',
        };
      });
      tasks = [...tasks, ...created];
      return HttpResponse.json({ data: created }, { status: 201 });
    }),
    http.get(`${API}/events/:eventId`, ({ params }) =>
      HttpResponse.json({ data: eventDetail(String(params.eventId)) }),
    ),
    http.get(`${API}/events/:eventId/service-lines`, () =>
      HttpResponse.json({ data: { lines: [], envelopes: [] } }),
    ),
  ];

  return {
    handlers,
    statusRequests,
    shiftBodies,
    createBodies,
    agendaCalls: () => agendaCalls,
    /** A change saved from another device, at its own time (for last-write-wins tests). */
    setFromElsewhere: (taskId: string, change: StatusBody) => {
      changedAt.set(taskId, change.changedAt);
      tasks = tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: change.status,
              issueNote: change.status === 'issue' ? change.issueNote : null,
              completedAt: change.status === 'done' ? new Date(change.changedAt) : null,
            }
          : task,
      );
    },
    task: (id: string) => tasks.find((task) => task.id === id),
  };
}
