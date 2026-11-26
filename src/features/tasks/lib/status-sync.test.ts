import { describe, expect, it } from 'vitest';
import type { Task } from '../api/tasks.schema';
import { applyStatus, previousStatus, statusRequest } from './status-sync';

const task: Task = {
  id: 't1',
  eventId: 'e1',
  eventFunctionId: null,
  functionName: null,
  serviceLineId: null,
  serviceName: null,
  vendor: null,
  title: 'Sound check',
  dueDate: '2099-02-14',
  dueTime: '17:00',
  remindBeforeMin: 15,
  status: 'pending',
  issueNote: null,
  completedAt: null,
  kind: 'day_of',
};

describe('statusRequest (spec §14 offline sync)', () => {
  it('fixes the device time and the Idempotency-Key when the planner acts', () => {
    const request = statusRequest(
      { eventId: 'e1', taskId: 't1' },
      { status: 'done' },
      new Date('2099-02-14T10:35:00Z'),
      'key-1',
    );
    expect(request).toEqual({
      eventId: 'e1',
      taskId: 't1',
      change: { status: 'done' },
      changedAt: '2099-02-14T10:35:00.000Z',
      idempotencyKey: 'key-1',
    });
  });

  it('gives each change its own key, so Done then Undo are two changes, not a replay', () => {
    const done = statusRequest({ eventId: 'e1', taskId: 't1' }, { status: 'done' });
    const undo = statusRequest({ eventId: 'e1', taskId: 't1' }, { status: 'pending' });
    expect(done.idempotencyKey).not.toBe(undo.idempotencyKey);
    expect(undo.changedAt >= done.changedAt).toBe(true);
  });
});

describe('applyStatus (optimistic, also offline)', () => {
  const at = (change: Parameters<typeof statusRequest>[1]) =>
    statusRequest({ eventId: 'e1', taskId: 't1' }, change, new Date('2099-02-14T10:35:00Z'), 'k');

  it('Done stamps the device time; Issue keeps its note; Pending clears both', () => {
    expect(applyStatus(task, at({ status: 'done' }))).toMatchObject({
      status: 'done',
      completedAt: new Date('2099-02-14T10:35:00Z'),
    });
    expect(applyStatus(task, at({ status: 'issue', issueNote: 'Mic dead' }))).toMatchObject({
      status: 'issue',
      issueNote: 'Mic dead',
    });
    expect(
      applyStatus({ ...task, status: 'issue', issueNote: 'x' }, at({ status: 'pending' })),
    ).toMatchObject({
      status: 'pending',
      issueNote: null,
      completedAt: null,
    });
  });

  it('leaves other tasks alone', () => {
    const other = { ...task, id: 't2' };
    expect(applyStatus(other, at({ status: 'done' }))).toBe(other);
  });

  it('keeps extra fields (Today’s vendor contacts)', () => {
    const rich = { ...task, eventName: 'Ananya & Rohan' };
    expect(applyStatus(rich, at({ status: 'done' }))).toMatchObject({
      eventName: 'Ananya & Rohan',
    });
  });
});

describe('previousStatus (Undo after Done)', () => {
  it('goes back to the Issue with its note, else to Pending', () => {
    expect(previousStatus({ status: 'issue', issueNote: 'Late' })).toEqual({
      status: 'issue',
      issueNote: 'Late',
    });
    expect(previousStatus({ status: 'pending', issueNote: null })).toEqual({ status: 'pending' });
  });
});
