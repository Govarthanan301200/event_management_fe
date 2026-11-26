import type { StatusChange, StatusRequest, Task } from '../api/tasks.schema';

/**
 * Builds a status change at the moment the planner makes it (spec §14 offline sync): the device
 * time and the Idempotency-Key are fixed here, never when it's sent, so retries and an offline
 * replay carry the same ones and the server's last-write-wins sees when it really happened.
 */
export function statusRequest(
  target: { eventId: string; taskId: string },
  change: StatusChange,
  now: Date = new Date(),
  key: string = crypto.randomUUID(),
): StatusRequest {
  return { ...target, change, changedAt: now.toISOString(), idempotencyKey: key };
}

/** The task as the change leaves it, shown at once (optimistic, also offline). */
export function applyStatus<T extends Task>(task: T, request: StatusRequest): T {
  if (task.id !== request.taskId) return task;
  const { change } = request;
  switch (change.status) {
    case 'done':
      return { ...task, status: 'done', issueNote: null, completedAt: new Date(request.changedAt) };
    case 'issue':
      return { ...task, status: 'issue', issueNote: change.issueNote, completedAt: null };
    case 'pending':
      return { ...task, status: 'pending', issueNote: null, completedAt: null };
  }
}

/** Done offers Undo back to how it was: an Issue keeps its note (decision 2026-11-26). */
export function previousStatus(task: Pick<Task, 'status' | 'issueNote'>): StatusChange {
  return task.status === 'issue' && task.issueNote !== null
    ? { status: 'issue', issueNote: task.issueNote }
    : { status: 'pending' };
}
