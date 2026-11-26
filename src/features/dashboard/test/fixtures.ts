import { http, HttpResponse } from 'msw';
import type { Dashboard, DashboardTask } from '../api/dashboard.schema';

// S13 responses for MSW. The server computes every count (Backend dashboard.rules.ts, tested
// there); these fixtures stand in for its output.

export const API = 'http://api.test/api/v1';
export const ANANYA = 'e-ananya';
export const MEERA = 'e-meera';
export const DIVYA = 'e-divya';

export const dashTask = (id: string, extra: Partial<DashboardTask> = {}): DashboardTask => ({
  id,
  eventId: ANANYA,
  eventName: 'Ananya & Rohan',
  functionName: 'Reception',
  title: 'Stage decor complete',
  dueDate: '2099-02-14',
  dueTime: '16:30',
  status: 'pending',
  issueNote: null,
  ...extra,
});

/** A busy Saturday, 14 Feb 2099 at 4:45 PM: one of everything. */
export function busyDashboard(): Dashboard {
  return {
    timeZone: 'Asia/Kolkata',
    today: '2099-02-14',
    now: '16:45',
    todayFunctions: {
      functions: [
        {
          id: 'f-reception',
          eventId: ANANYA,
          eventName: 'Ananya & Rohan',
          name: 'Reception',
          startTime: '18:30',
          endTime: '23:00',
          venueName: 'Leela Hall',
          done: 12,
          total: 20,
          overdue: 1,
        },
      ],
      general: [{ eventId: ANANYA, eventName: 'Ananya & Rohan', done: 0, total: 2, overdue: 0 }],
      next: null,
    },
    tasks: {
      issues: {
        total: 1,
        items: [
          dashTask('t-generator', {
            title: 'Generator backup',
            status: 'issue',
            issueNote: 'Backup not booked',
          }),
        ],
      },
      overdue: { total: 1, items: [dashTask('t-stage')] },
      thisWeek: {
        total: 11,
        items: Array.from({ length: 8 }, (_, i) =>
          dashTask(`t-week-${String(i)}`, {
            eventId: MEERA,
            eventName: 'Meera & Karthik',
            functionName: null,
            title: i === 0 ? 'Food tasting' : `Week task ${String(i)}`,
            dueDate: '2099-02-18',
            dueTime: null,
          }),
        ),
      },
    },
    submissions: {
      total: 1,
      items: [
        {
          eventId: MEERA,
          name: 'Meera & Karthik',
          clientName: 'Meera',
          formSubmittedAt: new Date('2099-02-12T05:00:00Z'),
          requested: 12,
          notPlanned: 12,
        },
      ],
    },
    upcoming: {
      total: 2,
      items: [
        {
          eventId: MEERA,
          name: 'Meera & Karthik',
          firstFunctionDate: '2099-03-05',
          lastFunctionDate: '2099-03-07',
          planned: 18_20_000,
          overallBudget: 22_00_000,
          overBy: null,
          categoriesOver: [],
          openTasks: 14,
        },
        {
          eventId: DIVYA,
          name: 'Divya & Rahul',
          firstFunctionDate: '2099-03-19',
          lastFunctionDate: '2099-03-19',
          planned: 9_50_000,
          overallBudget: null,
          overBy: null,
          categoriesOver: [{ id: 'c-decor', name: 'Decor', overBy: 50_000 }],
          openTasks: 1,
        },
      ],
    },
    overBudget: {
      total: 1,
      items: [
        {
          eventId: DIVYA,
          name: 'Divya & Rahul',
          firstFunctionDate: '2099-03-19',
          lastFunctionDate: '2099-03-19',
          planned: 9_50_000,
          overallBudget: null,
          overBy: null,
          categoriesOver: [{ id: 'c-decor', name: 'Decor', overBy: 50_000 }],
        },
      ],
    },
  };
}

export function quietDashboard(): Dashboard {
  const empty = { total: 0, items: [] };
  return {
    ...busyDashboard(),
    now: '09:10',
    todayFunctions: {
      functions: [],
      general: [],
      next: {
        id: 'f-sangeet',
        eventId: MEERA,
        eventName: 'Meera & Karthik',
        name: 'Sangeet',
        date: '2099-03-05',
        startTime: '19:00',
      },
    },
    tasks: { issues: empty, overdue: empty, thisWeek: empty },
    submissions: empty,
    upcoming: empty,
    overBudget: empty,
  };
}

/** GET /dashboard answering `data`, counting calls. */
export function dashboardHandler(data: () => Dashboard | Response) {
  const calls = { count: 0 };
  const handler = http.get(`${API}/dashboard`, () => {
    calls.count += 1;
    const body = data();
    return body instanceof Response ? body : HttpResponse.json({ data: body });
  });
  return { handler, calls };
}
