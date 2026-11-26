export type EventChoice = { id: string; name: string };

/** The events a list touches, in first-seen order. */
export function eventsIn(items: readonly { eventId: string; eventName: string }[]): EventChoice[] {
  const byId = new Map<string, string>();
  for (const item of items) if (!byId.has(item.eventId)) byId.set(item.eventId, item.eventName);
  return [...byId].map(([id, name]) => ({ id, name }));
}
