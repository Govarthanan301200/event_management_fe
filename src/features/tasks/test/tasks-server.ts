import { http, HttpResponse } from 'msw';
import type { CreateTaskInput, StatusChange, Task, UpdateTaskInput } from '../api/tasks.schema';

// An in-memory tasks backend for MSW (S11, the S9 panel, S8 and S7). The kind is derived from
// the date as the server does (core rule 8; tested in Backend/src/modules/tasks/tasks.rules.ts).

export const API = 'http://api.test/api/v1';

type FunctionRef = { id: string; name: string; date: string };
type LineRef = {
  id: string;
  serviceName: string;
  vendor: { id: string; name: string; phone: string } | null;
};

type Options = {
  functions: () => readonly FunctionRef[];
  lines: () => readonly LineRef[];
  seed?: Task[];
};

function kindOf(date: string, functions: readonly FunctionRef[]): Task['kind'] {
  const dates = functions.map((fn) => fn.date);
  if (dates.includes(date)) return 'day_of';
  const last = [...dates].sort().at(-1);
  return last !== undefined && date > last ? 'after_event' : 'pre_event';
}

export function createTasksBackend({ functions, lines, seed = [] }: Options) {
  let tasks: Task[] = structuredClone(seed);
  let nextId = 1;
  const bodies: unknown[] = [];

  const build = (
    id: string,
    input: Omit<UpdateTaskInput, 'eventFunctionId'>,
    fnId: string | null,
    base?: Task,
  ): Task => {
    const fn = functions().find((f) => f.id === fnId);
    const line = lines().find((l) => l.id === input.serviceLineId);
    const dueDate = fn?.date ?? input.dueDate ?? '2099-01-01';
    return {
      id,
      eventFunctionId: fn?.id ?? null,
      functionName: fn?.name ?? null,
      serviceLineId: line?.id ?? null,
      serviceName: line?.serviceName ?? null,
      vendor: line?.vendor ?? null,
      title: input.title,
      dueDate,
      dueTime: input.dueTime,
      remindBeforeMin: input.remindBeforeMin,
      status: base?.status ?? 'pending',
      issueNote: base?.issueNote ?? null,
      completedAt: base?.completedAt ?? null,
      kind: kindOf(dueDate, functions()),
    };
  };
  const notFound = () =>
    HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Task not found' } }, { status: 404 });

  const handlers = [
    http.get(`${API}/events/:id/tasks`, () => HttpResponse.json({ data: tasks })),
    http.post(`${API}/events/:id/tasks`, async ({ request }) => {
      const body = (await request.json()) as CreateTaskInput;
      bodies.push(body);
      const slots = body.eventFunctionIds.length === 0 ? [null] : body.eventFunctionIds;
      const created = slots.map((fnId) => build(`t-new-${nextId++}`, body, fnId));
      tasks = [...tasks, ...created];
      return HttpResponse.json({ data: created }, { status: 201 });
    }),
    http.put(`${API}/events/:id/tasks/:taskId`, async ({ request, params }) => {
      const body = (await request.json()) as UpdateTaskInput;
      bodies.push(body);
      const current = tasks.find((t) => t.id === params.taskId);
      if (!current) return notFound();
      const next = build(current.id, body, body.eventFunctionId, current);
      tasks = tasks.map((t) => (t.id === current.id ? next : t));
      return HttpResponse.json({ data: next });
    }),
    http.patch(`${API}/events/:id/tasks/:taskId/status`, async ({ request, params }) => {
      const change = (await request.json()) as StatusChange;
      bodies.push(change);
      const current = tasks.find((t) => t.id === params.taskId);
      if (!current) return notFound();
      const next: Task = {
        ...current,
        status: change.status,
        issueNote: change.status === 'issue' ? change.issueNote : null,
        completedAt: change.status === 'done' ? new Date('2099-02-12T10:00:00Z') : null,
      };
      tasks = tasks.map((t) => (t.id === current.id ? next : t));
      return HttpResponse.json({ data: next });
    }),
    http.delete(`${API}/events/:id/tasks/:taskId`, ({ params }) => {
      if (!tasks.some((t) => t.id === params.taskId)) return notFound();
      tasks = tasks.filter((t) => t.id !== params.taskId);
      return new HttpResponse(null, { status: 204 });
    }),
  ];

  return {
    handlers,
    bodies,
    openCount: () => tasks.filter((t) => t.status !== 'done').length,
    /** Removing a line unlinks its tasks (decision 2026-11-26). */
    unlinkLine: (lineId: string) => {
      tasks = tasks.map((t) =>
        t.serviceLineId === lineId
          ? { ...t, serviceLineId: null, serviceName: null, vendor: null }
          : t,
      );
    },
  };
}
