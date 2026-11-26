/// <reference lib="webworker" />
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

// The planner app's service worker (spec §14 as decided 2026-11-22: "mobile app" = this web app).
// 1. Offline: the app shell is precached, so Today opens without a network; data comes from the
//    IndexedDB query cache the app keeps (48 hours).
// 2. Reminders: shows the server's Web Push and opens the task when tapped.

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: (string | { url: string; revision: string | null })[];
};

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
// Every app route opens the cached shell; the API is never served from here.
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), { denylist: [/^\/api\//] }),
);

type ReminderPush = { title: string; body: string; url: string; tag: string };

function isReminder(value: unknown): value is ReminderPush {
  if (typeof value !== 'object' || value === null) return false;
  const push = value as Record<string, unknown>;
  return ['title', 'body', 'url', 'tag'].every((key) => typeof push[key] === 'string');
}

/** Only in-app paths: a push can't send the planner to another site. */
function safePath(url: string): string {
  return url.startsWith('/') && !url.startsWith('//') ? url : '/today';
}

self.addEventListener('push', (event) => {
  let data: unknown = null;
  try {
    data = event.data?.json();
  } catch {
    data = null;
  }
  if (!isReminder(data)) return;
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      tag: data.tag, // one per task: a repeat would replace, never stack
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-96.png',
      data: { url: safePath(data.url) },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const { url } = (event.notification.data ?? {}) as { url?: string };
  const target = new URL(safePath(url ?? '/today'), self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const open = windows.find((client) => new URL(client.url).origin === self.location.origin);
      if (open) {
        try {
          await open.focus();
          await open.navigate(target); // throws for a window this worker doesn't control yet
          return;
        } catch {
          // Fall through and open the task in a new window.
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});

self.addEventListener('message', (event) => {
  if ((event.data as { type?: string } | null)?.type === 'SKIP_WAITING') void self.skipWaiting();
});
