import { describe, expect, it } from 'vitest';
import type { Task } from '../api/tasks.schema';
import {
  applyFilters,
  groupTasks,
  hasFilters,
  isOverdue,
  NO_FUNCTION,
  nowIn,
  readFilters,
  vendorOptions,
} from './task-groups';

const functions = [
  { id: 'mehendi', name: 'Mehendi', date: '2099-02-12' },
  { id: 'sangeet', name: 'Sangeet', date: '2099-02-12' },
  { id: 'reception', name: 'Reception', date: '2099-02-14' },
];
const beat = { id: 'v-beat', name: 'Beat Republic', phone: '+91 98400 12345' };
const anna = { id: 'v-anna', name: 'Annapoorna Caterers', phone: '+91 98400 11111' };

const task = (id: string, extra: Partial<Task>): Task => ({
  id,
  eventId: 'e1',
  eventFunctionId: null,
  functionName: null,
  serviceLineId: null,
  serviceName: null,
  vendor: null,
  title: id,
  dueDate: '2099-02-01',
  dueTime: null,
  remindBeforeMin: 15,
  status: 'pending',
  issueNote: null,
  completedAt: null,
  kind: 'pre_event',
  ...extra,
});

const tasks = [
  task('settle', { dueDate: '2099-02-20', kind: 'after_event' }),
  task('tasting', { dueDate: '2099-02-03' }),
  task('playlist', { dueDate: '2099-02-01', dueTime: '11:00', vendor: beat }),
  task('wheelchair', { dueDate: '2099-02-14', dueTime: '18:00', kind: 'day_of' }),
  task('decor', {
    dueDate: '2099-02-14',
    dueTime: '16:30',
    kind: 'day_of',
    eventFunctionId: 'reception',
  }),
  task('soundcheck', {
    dueDate: '2099-02-12',
    dueTime: '17:00',
    kind: 'day_of',
    eventFunctionId: 'sangeet',
    vendor: beat,
  }),
  task('arrive', {
    dueDate: '2099-02-12',
    dueTime: '16:00',
    kind: 'day_of',
    eventFunctionId: 'sangeet',
    vendor: beat,
  }),
  task('henna', {
    dueDate: '2099-02-12',
    kind: 'day_of',
    eventFunctionId: 'mehendi',
    status: 'done',
  }),
  task('chairs', {
    dueDate: '2099-02-12',
    kind: 'day_of',
    vendor: anna,
    status: 'issue',
    issueNote: 'Short by 40',
  }),
];

describe('groupTasks (S11, spec §13)', () => {
  it('orders Pre-event, Day-of by date then function then General, then After the event', () => {
    const sections = groupTasks(tasks, functions);
    expect(sections.map((s) => [s.title, s.detail, s.tasks.map((t) => t.id)])).toEqual([
      ['Pre-event', null, ['playlist', 'tasting']],
      ['Day-of', expect.stringContaining('Mehendi'), ['henna']],
      ['Day-of', expect.stringContaining('Sangeet'), ['arrive', 'soundcheck']],
      ['Day-of', expect.stringContaining('General'), ['chairs']],
      ['Day-of', expect.stringContaining('Reception'), ['decor']],
      ['Day-of', expect.stringContaining('General'), ['wheelchair']],
      ['After the event', null, ['settle']],
    ]);
  });

  it('puts timed tasks first within a day, then the ones for any time', () => {
    const sameDay = [
      task('anytime', { dueDate: '2099-02-01' }),
      task('morning', { dueDate: '2099-02-01', dueTime: '09:00' }),
    ];
    expect(groupTasks(sameDay, functions)[0]?.tasks.map((t) => t.id)).toEqual([
      'morning',
      'anytime',
    ]);
  });

  it('has no sections without tasks', () => {
    expect(groupTasks([], functions)).toEqual([]);
  });
});

describe('filters (URL, decision 2026-11-26)', () => {
  it('reads status, function and vendor, ignoring an unknown status', () => {
    expect(readFilters(new URLSearchParams('status=done&fn=sangeet&vendor=v-beat'))).toEqual({
      status: 'done',
      fn: 'sangeet',
      vendor: 'v-beat',
    });
    expect(readFilters(new URLSearchParams('status=late'))).toEqual({
      status: null,
      fn: null,
      vendor: null,
    });
    expect(hasFilters(readFilters(new URLSearchParams()))).toBe(false);
  });

  it('filters by status, function (or none) and vendor together', () => {
    const ids = (filters: Parameters<typeof applyFilters>[1]) =>
      applyFilters(tasks, filters).map((t) => t.id);
    expect(ids({ status: 'issue', fn: null, vendor: null })).toEqual(['chairs']);
    expect(ids({ status: null, fn: 'sangeet', vendor: null })).toEqual(['soundcheck', 'arrive']);
    expect(ids({ status: null, fn: NO_FUNCTION, vendor: 'v-beat' })).toEqual(['playlist']);
    expect(ids({ status: 'pending', fn: 'sangeet', vendor: 'v-beat' })).toEqual([
      'soundcheck',
      'arrive',
    ]);
  });

  it('offers the vendors the tasks show, by name', () => {
    expect(vendorOptions(tasks)).toEqual([
      { id: 'v-anna', name: 'Annapoorna Caterers' },
      { id: 'v-beat', name: 'Beat Republic' },
    ]);
  });
});

describe('isOverdue', () => {
  const now = { date: '2099-02-12', time: '16:30' };
  it('is a pending task past its day, or past its time today', () => {
    expect(isOverdue({ status: 'pending', dueDate: '2099-02-11', dueTime: null }, now)).toBe(true);
    expect(isOverdue({ status: 'pending', dueDate: '2099-02-12', dueTime: '16:00' }, now)).toBe(
      true,
    );
  });
  it('is not overdue later today, any time today, in the future, or when not pending', () => {
    expect(isOverdue({ status: 'pending', dueDate: '2099-02-12', dueTime: '17:00' }, now)).toBe(
      false,
    );
    expect(isOverdue({ status: 'pending', dueDate: '2099-02-12', dueTime: null }, now)).toBe(false);
    expect(isOverdue({ status: 'pending', dueDate: '2099-02-13', dueTime: null }, now)).toBe(false);
    expect(isOverdue({ status: 'done', dueDate: '2099-02-01', dueTime: null }, now)).toBe(false);
    expect(isOverdue({ status: 'issue', dueDate: '2099-02-01', dueTime: null }, now)).toBe(false);
  });
});

describe('nowIn', () => {
  it('is the date and 24-hour time in the company time zone', () => {
    expect(nowIn('Asia/Kolkata', new Date('2099-02-11T20:00:00Z'))).toEqual({
      date: '2099-02-12',
      time: '01:30',
    });
  });
});
