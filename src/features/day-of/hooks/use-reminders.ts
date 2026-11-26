import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPushConfig, saveSubscription } from '../api/push.api';

// Web Push reminders on this device (spec §14, decision 2026-11-26).

export type ReminderSupport = 'supported' | 'unsupported' | 'install-first';

/** iOS delivers Web Push only to a web app added to the Home Screen (16.4+). */
export function reminderSupport(): ReminderSupport {
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const installed = window.matchMedia('(display-mode: standalone)').matches;
  if (ios && !installed) return 'install-first';
  const ok = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  return ok ? 'supported' : 'unsupported';
}

/** The VAPID key arrives URL-safe base64; PushManager wants bytes. */
export function keyBytes(base64: string): Uint8Array<ArrayBuffer> {
  const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const raw = atob(padded);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

const subscribedKey = ['push', 'subscribed'] as const;

async function isSubscribed(): Promise<boolean> {
  const registration = await navigator.serviceWorker.getRegistration();
  return (await registration?.pushManager.getSubscription()) != null;
}

async function subscribe(): Promise<void> {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('blocked');
  const { publicKey } = await fetchPushConfig();
  if (!publicKey) throw new Error('off');
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: keyBytes(publicKey),
  });
  await saveSubscription(subscription.toJSON());
}

/** Whether reminders are on here, and Turn on reminders (asks for notification permission). */
export function useReminders() {
  const support = reminderSupport();
  const queryClient = useQueryClient();
  const subscribed = useQuery({
    queryKey: subscribedKey,
    queryFn: isSubscribed,
    enabled: support === 'supported',
    networkMode: 'always',
  });
  const enable = useMutation({
    mutationFn: subscribe,
    onSuccess: () => queryClient.setQueryData(subscribedKey, true),
  });
  const blocked = support === 'supported' && Notification.permission === 'denied';
  return { support, on: subscribed.data === true, known: subscribed.isSuccess, blocked, enable };
}
