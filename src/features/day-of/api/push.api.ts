import { z } from 'zod';
import { getAccessToken } from '@/features/auth/api/supabase';
import { apiRequest, dataOf } from '@/lib/api-client';

// Web Push subscriptions for task reminders (spec §14, decision 2026-11-26).

export async function fetchPushConfig() {
  return apiRequest('/api/v1/push/config', dataOf(z.object({ publicKey: z.string().nullable() })), {
    token: await getAccessToken(),
  });
}

export async function saveSubscription(subscription: PushSubscriptionJSON) {
  return apiRequest('/api/v1/push/subscriptions', z.undefined(), {
    method: 'POST',
    token: await getAccessToken(),
    body: subscription,
  });
}

export async function removeSubscription(endpoint: string) {
  return apiRequest('/api/v1/push/subscriptions', z.undefined(), {
    method: 'DELETE',
    token: await getAccessToken(),
    body: { endpoint },
  });
}
