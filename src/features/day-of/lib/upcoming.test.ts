import { describe, expect, it } from 'vitest';
import { agendaTask, TODAY } from '../test/fixtures';
import { addDays, dayTitle, groupUpcoming } from './upcoming';

describe('groupUpcoming (spec §14, decision 2026-11-26)', () => {
  const tasks = [
    agendaTask('pay-advance', {
      kind: 'pre_event',
      dueDate: '2099-02-16',
      dueTime: '11:00',
      eventFunctionId: null,
    }),
    agendaTask('tasting', { kind: 'pre_event', dueDate: '2099-02-16', eventFunctionId: null }),
    agendaTask('playlist', {
      kind: 'pre_event',
      dueDate: '2099-02-15',
      dueTime: '10:00',
      eventFunctionId: null,
    }),
    agendaTask('return-chairs', {
      kind: 'after_event',
      dueDate: '2099-02-20',
      eventFunctionId: null,
    }),
    agendaTask('stage', { kind: 'day_of', dueDate: '2099-02-15' }),
    agendaTask('too-far', { kind: 'pre_event', dueDate: '2099-02-28', eventFunctionId: null }),
    agendaTask('missed', { kind: 'day_of', dueDate: '2099-02-12' }),
    agendaTask('missed-done', { kind: 'pre_event', dueDate: '2099-02-10', status: 'done' }),
  ];

  it('groups every non-day-of task of the next 14 days by date, pre-event and after the event', () => {
    const groups = groupUpcoming(tasks, TODAY);
    expect(groups.map((group) => [group.title, group.tasks.map((task) => task.id)])).toEqual([
      ['Overdue', ['missed']],
      ['Tomorrow', ['playlist']],
      ['Mon · 16 Feb 2099', ['pay-advance', 'tasting']],
      ['Fri · 20 Feb 2099', ['return-chairs']],
    ]);
  });

  it('leaves out day-of tasks (they are on Today) and anything past 14 days', () => {
    const shown = groupUpcoming(tasks, TODAY).flatMap((group) =>
      group.tasks.map((task) => task.id),
    );
    expect(shown).not.toContain('stage');
    expect(shown).not.toContain('too-far');
    expect(
      groupUpcoming(
        [agendaTask('last', { kind: 'pre_event', dueDate: addDays(TODAY, 13) })],
        TODAY,
      ),
    ).toHaveLength(1);
    expect(
      groupUpcoming([agendaTask('out', { kind: 'pre_event', dueDate: addDays(TODAY, 14) })], TODAY),
    ).toHaveLength(0);
  });

  it('opens with the past week’s open tasks, never Done ones (SPEC-GAP default)', () => {
    const [first] = groupUpcoming(tasks, TODAY);
    expect(first).toMatchObject({ id: 'overdue', overdue: true });
    expect(first?.tasks.map((task) => task.id)).toEqual(['missed']);
  });

  it('is empty with nothing ahead', () => {
    expect(groupUpcoming([], TODAY)).toEqual([]);
  });
});

describe('dates', () => {
  it('adds days across month ends', () => {
    expect(addDays('2099-02-27', 2)).toBe('2099-03-01');
    expect(addDays('2099-03-01', -7)).toBe('2099-02-22');
  });

  it('says Today and Tomorrow, else the weekday and date', () => {
    expect(dayTitle(TODAY, TODAY)).toBe('Today');
    expect(dayTitle('2099-02-15', TODAY)).toBe('Tomorrow');
    expect(dayTitle('2099-02-16', TODAY)).toBe('Mon · 16 Feb 2099');
  });
});
