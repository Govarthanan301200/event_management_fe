import { describe, expect, it } from 'vitest';
import type { Task } from '../api/tasks.schema';
import {
  NO_LINE,
  remindLabel,
  taskFormSchema,
  toCreateInput,
  toggleFunction,
  toTaskForm,
  toUpdateInput,
} from './task-form';

const saved: Task = {
  id: 't1',
  eventId: 'e1',
  eventFunctionId: 'sangeet',
  functionName: 'Sangeet',
  serviceLineId: 'l-dj',
  serviceName: 'DJ / VDJ',
  vendor: null,
  title: 'Sound check',
  dueDate: '2099-02-12',
  dueTime: '17:00',
  remindBeforeMin: 30,
  status: 'pending',
  issueNote: null,
  completedAt: null,
  kind: 'day_of',
};

describe('remindLabel', () => {
  it('reads minutes, hours and days, and 9:00 AM for a task with no time (spec §13)', () => {
    expect(remindLabel(0, true)).toBe('At the due time');
    expect(remindLabel(15, true)).toBe('15 min before');
    expect(remindLabel(60, true)).toBe('1 hr before');
    expect(remindLabel(120, true)).toBe('2 hrs before');
    expect(remindLabel(1440, true)).toBe('1 day before');
    expect(remindLabel(15, false)).toBe('9:00 AM on the day');
  });
});

describe('task form', () => {
  it('starts from an S8 preset: its line and functions, a 15-minute reminder', () => {
    expect(
      toTaskForm({ preset: { functionIds: ['sangeet', 'reception'], serviceLineId: 'l-dj' } }),
    ).toEqual({
      title: '',
      functionIds: ['sangeet', 'reception'],
      dueDate: '',
      dueTime: '',
      serviceLineId: 'l-dj',
      remindBeforeMin: '15',
    });
  });

  it('round-trips a saved task into an edit', () => {
    expect(toUpdateInput(toTaskForm({ task: saved }))).toEqual({
      title: 'Sound check',
      eventFunctionId: 'sangeet',
      dueDate: null,
      dueTime: '17:00',
      serviceLineId: 'l-dj',
      remindBeforeMin: 30,
    });
  });

  it('sends one task per function, or the typed date when none is picked', () => {
    const form = { ...toTaskForm({ preset: {} }), title: ' Food tasting ', dueDate: '2099-02-03' };
    expect(toCreateInput(form)).toEqual({
      title: 'Food tasting',
      eventFunctionIds: [],
      dueDate: '2099-02-03',
      dueTime: null,
      serviceLineId: null,
      remindBeforeMin: 15,
    });
    expect(toCreateInput({ ...form, functionIds: ['a', 'b'] })).toMatchObject({
      eventFunctionIds: ['a', 'b'],
      dueDate: null,
    });
  });

  it('needs a title, and a function or a date', () => {
    const blank = { ...toTaskForm({ preset: {} }), serviceLineId: NO_LINE };
    const result = taskFormSchema.safeParse(blank);
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual(['title', 'dueDate']);
    expect(
      taskFormSchema.safeParse({ ...blank, title: 'x'.repeat(121), functionIds: ['a'] }).success,
    ).toBe(false);
  });

  it('ticks several functions in Add and at most one in Edit', () => {
    expect(toggleFunction(['a'], 'b', true)).toEqual(['a', 'b']);
    expect(toggleFunction(['a'], 'b', false)).toEqual(['b']);
    expect(toggleFunction(['a', 'b'], 'a', true)).toEqual(['b']);
  });
});
