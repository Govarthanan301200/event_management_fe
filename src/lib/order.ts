/**
 * Ordering helpers for sortable lists (catalogue, function types, event functions). The API needs every id in a scope (archived ones
 * included); the UI only lets the planner arrange the active ones, so archived ids keep their
 * relative order at the end.
 */

/** Moves `id` to the position of `overId`, like dropping a dragged row on another. */
export function moveTo(ids: readonly string[], id: string, overId: string): string[] {
  const from = ids.indexOf(id);
  const to = ids.indexOf(overId);
  if (from === -1 || to === -1 || from === to) return [...ids];
  const next = [...ids];
  next.splice(from, 1);
  next.splice(to, 0, id);
  return next;
}

/** Moves `id` one place up (-1) or down (+1); unchanged at either end. */
export function moveBy(ids: readonly string[], id: string, delta: -1 | 1): string[] {
  const from = ids.indexOf(id);
  const neighbour = ids[from + delta];
  if (from === -1 || neighbour === undefined) return [...ids];
  return moveTo(ids, id, neighbour);
}

/** The full order the API expects: the arranged active ids, then archived ones as they were. */
export function withArchivedLast(
  activeIds: readonly string[],
  items: readonly { id: string; archivedAt: Date | null }[],
): string[] {
  return [...activeIds, ...items.filter((item) => item.archivedAt).map((item) => item.id)];
}

/** Puts `items` in the order of `ids`; items not listed keep their place after the listed ones. */
export function sortByIds<T extends { id: string }>(
  items: readonly T[],
  ids: readonly string[],
): T[] {
  const position = new Map(ids.map((id, index) => [id, index]));
  return [...items].sort(
    (a, b) =>
      (position.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
      (position.get(b.id) ?? Number.MAX_SAFE_INTEGER),
  );
}
