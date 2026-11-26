import { expect, test, type Page } from '@playwright/test';

/**
 * Spec §17: "create event → submit form → add service → add task → receive reminder → mark done".
 *
 * Needs the real stack, so it is skipped unless configured:
 * - Backend on E2E_API_URL (default http://localhost:8000) started with
 *   `E2E_HOOKS=true PUSH_TRANSPORT=memory` against a TEST database (never the live one);
 * - a planner made with `npm run company:create` in that database: E2E_PLANNER_EMAIL and
 *   E2E_PLANNER_PASSWORD; the FE dev server pointing at that backend.
 * Push is recorded by the backend's memory transport, since a headless browser has no push service;
 * the reminder tick runs on demand through the test-only hook instead of waiting a minute.
 */

const email = process.env.E2E_PLANNER_EMAIL;
const password = process.env.E2E_PLANNER_PASSWORD;
const api = (process.env.E2E_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');

test.skip(
  !email || !password,
  'Set E2E_PLANNER_EMAIL and E2E_PLANNER_PASSWORD (see the header comment)',
);

/** Company-local (Asia/Kolkata) date and a time `minutes` from now, capped before midnight. */
function istNow(minutes: number) {
  const at = new Date(Date.now() + minutes * 60_000);
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(at);
  return { date, time: time < '00:30' ? '23:58' : time };
}

/** The signed-in planner's Supabase token, read from the session the app keeps. */
async function accessToken(page: Page): Promise<string> {
  return page.evaluate(() => {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i) ?? '';
      if (/^sb-.*-auth-token$/.test(key)) {
        const session = JSON.parse(localStorage.getItem(key) ?? '{}') as { access_token?: string };
        if (session.access_token) return session.access_token;
      }
    }
    throw new Error('Not signed in');
  });
}

test('create event → submit form → add service → add task → receive reminder → mark done', async ({
  page,
  context,
}) => {
  const stamp = Date.now().toString(36);
  const client = `E2E Lakshmi ${stamp}`;
  const taskTitle = `Stage decor complete ${stamp}`;
  const { date: today, time: dueTime } = istNow(10);

  // Sign in.
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(email ?? '');
  await page.getByLabel('Password').fill(password ?? '');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/\/(events|today)/);

  // 1. Create the event, with a Reception today (so the task is on Today).
  await page.goto('/events');
  await page.getByRole('button', { name: 'Create event' }).click();
  const create = page.getByRole('dialog', { name: 'Create event' });
  await create.getByLabel('Client name').fill(client);
  await create.getByLabel('Client phone').fill('+91 90000 12345');
  await create.getByRole('button', { name: 'Create event' }).click();
  await page.waitForURL(/\/events\/[0-9a-f-]{36}$/);
  const eventUrl = page.url();

  await page.getByRole('button', { name: 'Add function' }).first().click();
  const fnDialog = page.getByRole('dialog', { name: 'Add function' });
  await fnDialog.getByLabel('Function', { exact: true }).click();
  await page.getByRole('option', { name: /Other/ }).click();
  await fnDialog.getByLabel('Function name').fill('Reception');
  await fnDialog.getByLabel('Date').fill(today);
  await fnDialog.getByLabel('Start').fill('18:30');
  await fnDialog.getByLabel('Guests').fill('300');
  await fnDialog.getByRole('button', { name: 'Add function' }).click();
  await expect(fnDialog).toBeHidden();

  // 2. The client submits the form from its public link.
  const link = (await page.getByTitle(/\/f\//).getAttribute('title')) ?? '';
  const clientPage = await context.newPage();
  await clientPage.goto(new URL(link).pathname);
  await clientPage.getByRole('checkbox').first().check();
  await clientPage.getByRole('button', { name: /Send to planner/ }).click();
  await expect(clientPage.getByText('Thank you! Your planner has your list.')).toBeVisible();
  await clientPage.close();

  // 3. The planner adds the requested service to the plan.
  await page.reload();
  await page
    .getByRole('link', { name: /Add .* to plan/ })
    .first()
    .click();
  await page.getByRole('button', { name: 'Save service' }).click();
  await expect(page.getByRole('button', { name: 'Save service' })).toBeHidden();

  // 4. Add a task for Reception, due in 10 minutes (reminder 15 minutes before: due now).
  await page.goto(`${eventUrl}/tasks`);
  await page.getByRole('button', { name: 'Add task' }).click();
  const taskDialog = page.getByRole('dialog', { name: 'Add task' });
  await taskDialog.getByLabel('Title').fill(taskTitle);
  await taskDialog.getByRole('button', { name: /Reception/ }).click();
  await taskDialog.getByLabel('Time (optional)').fill(dueTime);
  await taskDialog.getByRole('button', { name: 'Add task' }).click();
  await expect(page.getByText('Task added')).toBeVisible();

  // 5. This device subscribes, then the scheduler runs: exactly one reminder, with the spec text.
  const token = await accessToken(page);
  const auth = { Authorization: `Bearer ${token}` };
  const subscribe = await page.request.post(`${api}/api/v1/push/subscriptions`, {
    headers: auth,
    data: {
      endpoint: `https://fcm.googleapis.com/fcm/send/e2e-${stamp}`,
      keys: { p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA', auth: 'tBHItJI5svbpez7KI4CCXg' },
    },
  });
  expect(subscribe.status()).toBe(204);
  await page.request.post(`${api}/api/v1/__e2e__/reminders/run`, { data: {} });
  await page.request.post(`${api}/api/v1/__e2e__/reminders/run`, { data: {} }); // never twice
  const pushes = (await (await page.request.get(`${api}/api/v1/__e2e__/pushes`)).json()) as {
    data: { endpoint: string; payload: { body: string; url: string; tag: string } }[];
  };
  const mine = pushes.data.filter(
    (push) => push.endpoint.endsWith(`e2e-${stamp}`) && push.payload.body.startsWith(taskTitle),
  );
  expect(mine).toHaveLength(1);
  const reminder = mine.at(0);
  if (!reminder) throw new Error('No reminder');
  expect(reminder.payload.body).toMatch(
    new RegExp(`^${taskTitle} · Reception · due \\d{1,2}:\\d{2} [AP]M$`),
  );

  // 6. Tapping the reminder opens the task on Today; mark it done.
  await page.goto(reminder.payload.url);
  await expect(page.getByRole('heading', { level: 1, name: 'Reception' })).toBeVisible();
  await page.getByRole('button', { name: `Mark “${taskTitle}” done` }).click();
  await expect(page.getByText('Marked done')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: /Done · \d+/ }).click();
  await expect(page.getByRole('button', { name: `Mark “${taskTitle}” not done` })).toBeVisible();
});
