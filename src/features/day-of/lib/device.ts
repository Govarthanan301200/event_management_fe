import { removeSubscription } from '../api/push.api';
import { clearOfflineCache } from './offline-cache';

/**
 * Before sign-out (needs the session): this device stops getting the planner's reminders, and the
 * offline cache of tasks and contacts is wiped. Best effort: sign-out goes ahead regardless.
 */
export async function forgetThisDevice(): Promise<void> {
  try {
    // Insecure origins and some browsers have no service worker at all.
    const registration =
      'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
      await removeSubscription(subscription.endpoint).catch(() => undefined);
      await subscription.unsubscribe();
    }
  } catch {
    // No service worker or push here: nothing to forget.
  }
  await clearOfflineCache().catch(() => undefined);
}
