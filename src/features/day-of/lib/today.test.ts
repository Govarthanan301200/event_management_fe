import { describe, expect, it } from 'vitest';
import { agendaFn, agendaTask, muhurtham, OTHER_EVENT, reception, TODAY } from '../test/fixtures';
import {
  defaultScope,
  groupToday,
  overdueToday,
  progressOf,
  scopeLabel,
  scopeOf,
  tasksInScope,
  todayGroupOf,
  todayScopes,
} from './today';

const ids = (groups: ReturnType<typeof groupToday>) =>
  groups.map((group) => [group.id, group.tasks.map((task) => task.id)]);

describe('groupToday (spec §14)', () => {
  const now = '16:45';

  it('orders Overdue · Next up · Later · Anytime today · Done, each by time', () => {
    const tasks = [
      agendaTask('photo', { dueTime: '16:30', status: 'done' }),
      agendaTask('chairs'),
      agendaTask('counters', { dueTime: '18:00' }),
      agendaTask('dj', { dueTime: '17:30' }),
      agendaTask('decor', { dueTime: '16:30' }),
      agendaTask('valet', { dueTime: '17:45' }),
      agendaTask('stage', { dueTime: '15:00' }),
    ];
    expect(ids(groupToday(tasks, now))).toEqual([
      ['overdue', ['stage', 'decor']],
      ['next', ['dj', 'valet']],
      ['later', ['counters']],
      ['anytime', ['chairs']],
      ['done', ['photo']],
    ]);
  });

  it('pins an Issue on top whatever its time, until it is Done', () => {
    const issue = agendaTask('generator', {
      dueTime: '22:00',
      status: 'issue',
      issueNote: 'Second unit late',
    });
    const groups = groupToday([agendaTask('decor', { dueTime: '16:00' }), issue], now);
    expect(groups[0]).toMatchObject({ id: 'issue', title: 'Issue' });
    expect(ids(groupToday([{ ...issue, status: 'done', issueNote: null }], now))).toEqual([
      ['done', ['generator']],
    ]);
  });

  it('is Next up from exactly now to exactly 60 minutes ahead', () => {
    expect(todayGroupOf(agendaTask('a', { dueTime: '16:45' }), now)).toBe('next');
    expect(todayGroupOf(agendaTask('a', { dueTime: '17:45' }), now)).toBe('next');
    expect(todayGroupOf(agendaTask('a', { dueTime: '17:46' }), now)).toBe('later');
    expect(todayGroupOf(agendaTask('a', { dueTime: '16:44' }), now)).toBe('overdue');
  });

  it('a task with no time is never overdue on its day', () => {
    expect(todayGroupOf(agendaTask('a'), '23:59')).toBe('anytime');
  });

  it('leaves empty groups out', () => {
    expect(groupToday([], now)).toEqual([]);
  });
});

describe('Today scopes and the default function', () => {
  const tasks = [
    agendaTask('decor', { eventFunctionId: reception.id }),
    agendaTask('cash', { eventFunctionId: null }),
  ];

  it('lists today’s functions by start time, then General for unlinked tasks', () => {
    const scopes = todayScopes(
      [reception, muhurtham, agendaFn('f-old', 'Sangeet', '18:00', { date: '2099-02-12' })],
      tasks,
      TODAY,
    );
    expect(scopes.map((scope) => scope.id)).toEqual(['f-muhurtham', 'f-reception', 'general-e1']);
    expect(scopes.map((scope) => scopeLabel(scope, scopes))).toEqual([
      'Muhurtham',
      'Reception',
      'General',
    ]);
  });

  it('names the event on each chip when today spans two events', () => {
    const other = agendaFn('f-haldi', 'Haldi', '09:00', {
      eventId: OTHER_EVENT,
      eventName: 'Priya & Karthik',
    });
    const scopes = todayScopes([reception, other], [], TODAY);
    expect(scopes.map((scope) => scopeLabel(scope, scopes))).toEqual([
      'Haldi · Priya & Karthik',
      'Reception · Ananya & Rohan',
    ]);
  });

  it('defaults to the current function, else the next, else the last', () => {
    const scopes = todayScopes([muhurtham, reception], [], TODAY);
    expect(defaultScope(scopes, '06:00')?.id).toBe('f-muhurtham'); // next
    expect(defaultScope(scopes, '08:00')?.id).toBe('f-muhurtham'); // current
    expect(defaultScope(scopes, '11:00')?.id).toBe('f-reception'); // Muhurtham ended at 10:30: next
    expect(defaultScope(scopes, '19:00')?.id).toBe('f-reception'); // current
    expect(defaultScope(scopes, '23:30')?.id).toBe('f-reception'); // all ended: the last
  });

  it('a function with no end time runs until a later one starts', () => {
    const scopes = todayScopes([agendaFn('f-haldi', 'Haldi', '09:00'), reception], [], TODAY);
    expect(defaultScope(scopes, '17:00')?.id).toBe('f-haldi');
  });

  it('a function that runs past midnight is still current late at night', () => {
    const late = agendaFn('f-sangeet', 'Sangeet', '20:00', { endTime: '01:00' });
    expect(defaultScope(todayScopes([late], [], TODAY), '23:30')?.id).toBe('f-sangeet');
  });

  it('with no function today, General is the scope', () => {
    const scopes = todayScopes([], tasks, TODAY);
    const general = defaultScope(scopes, '10:00');
    expect(general?.id).toBe('general-e1');
    if (!general) throw new Error('No scope');
    expect(tasksInScope(tasks, general, scopes).map((task) => task.id)).toEqual(['decor', 'cash']);
  });

  it('finds the scope of a task opened from a reminder', () => {
    const scopes = todayScopes([muhurtham, reception], tasks, TODAY);
    const [decor, cash] = tasks;
    if (!decor || !cash) throw new Error('Fixture');
    expect(scopeOf(decor, scopes)?.id).toBe('f-reception');
    expect(scopeOf(cash, scopes)?.id).toBe('general-e1');
  });
});

describe('progress and overdue', () => {
  it('counts done of all, Issue and Pending alike', () => {
    expect(
      progressOf([
        agendaTask('a', { status: 'done' }),
        agendaTask('b', { status: 'issue', issueNote: 'x' }),
        agendaTask('c'),
      ]),
    ).toEqual({ done: 1, total: 3 });
    expect(progressOf([])).toEqual({ done: 0, total: 0 });
  });

  it('overdue today spans every scope but not other days or other statuses', () => {
    const overdue = overdueToday(
      [
        agendaTask('late', { dueTime: '09:00', eventFunctionId: muhurtham.id }),
        agendaTask('later', { dueTime: '12:00', eventFunctionId: null }),
        agendaTask('done', { dueTime: '09:00', status: 'done' }),
        agendaTask('tomorrow', { dueTime: '09:00', dueDate: '2099-02-15' }),
      ],
      { date: TODAY, time: '13:00' },
    );
    expect(overdue.map((task) => task.id)).toEqual(['late', 'later']);
  });
});
