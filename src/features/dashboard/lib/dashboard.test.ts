import { describe, expect, it } from 'vitest';
import {
  categoriesOverLabel,
  dueLabel,
  greeting,
  links,
  longDate,
  moneyLabel,
  moreCount,
  overLines,
  sentLabel,
  spanLabel,
  taskContext,
} from './dashboard';

describe('greeting (company time)', () => {
  it.each([
    ['00:30', 'Good morning'],
    ['11:59', 'Good morning'],
    ['12:00', 'Good afternoon'],
    ['16:59', 'Good afternoon'],
    ['17:00', 'Good evening'],
    ['23:59', 'Good evening'],
  ])('%s → %s', (time, expected) => {
    expect(greeting(time)).toBe(expected);
  });
});

describe('longDate', () => {
  it('reads "Sat 14 Feb 2099"', () => {
    expect(longDate('2099-02-14')).toBe('Sat 14 Feb 2099');
  });
});

describe('links (spec §15: each widget links to the screen that resolves it)', () => {
  it('sends a function to S12 on it, or to S9', () => {
    expect(links.today('f1')).toBe('/today?scope=f1');
    expect(links.todayGeneral('e1')).toBe('/today?scope=general-e1');
    expect(links.byFunction('e1', 'f1')).toBe('/events/e1/by-function?fn=f1');
  });

  it('sends a task to its event’s Tasks tab, scrolled to it (decision 2026-11-26)', () => {
    expect(links.task({ id: 't1', eventId: 'e1' })).toBe('/events/e1/tasks?task=t1');
  });

  it('sends submissions and upcoming events to S6, over budget to S10', () => {
    expect(links.event('e1')).toBe('/events/e1');
    expect(links.summary('e1')).toBe('/events/e1/summary');
  });
});

describe('dueLabel', () => {
  const today = '2099-02-14';
  it('shows only the time (or "Today") for today', () => {
    expect(dueLabel({ dueDate: today, dueTime: '16:30' }, today)).toBe('4:30 PM');
    expect(dueLabel({ dueDate: today, dueTime: null }, today)).toBe('Today');
  });

  it('shows the date, with the year outside the current one', () => {
    expect(dueLabel({ dueDate: '2099-02-18', dueTime: '10:00' }, today)).toBe(
      '18 Feb 2099 · 10:00 AM',
    );
    expect(dueLabel({ dueDate: '2098-06-01', dueTime: null }, today)).toBe('1 Jun 2098');
  });
});

describe('taskContext', () => {
  it('names the event, and the function when there is one', () => {
    expect(taskContext({ eventName: 'Priya & Arjun', functionName: 'Reception' })).toBe(
      'Priya & Arjun · Reception',
    );
    expect(taskContext({ eventName: 'Priya & Arjun', functionName: null })).toBe('Priya & Arjun');
  });
});

describe('spanLabel', () => {
  it('reads the event span, or says there are no functions', () => {
    expect(spanLabel('2099-03-05', '2099-03-07')).toBe('5–7 Mar 2099');
    expect(spanLabel(null, null)).toBe('No functions yet');
  });
});

describe('moneyLabel (compact form: dashboard rows only)', () => {
  it('reads planned of budget', () => {
    expect(moneyLabel(18_20_000, 22_00_000)).toBe('₹18.2L of ₹22L');
  });

  it('says when no budget is set', () => {
    expect(moneyLabel(9_50_000, null)).toBe('₹9.5L planned · no budget');
  });
});

describe('categoriesOverLabel', () => {
  const c = (name: string) => ({ id: name, name, overBy: 1 });
  it('names up to two categories, then a count', () => {
    expect(categoriesOverLabel([])).toBeNull();
    expect(categoriesOverLabel([c('Decor')])).toBe('Decor over');
    expect(categoriesOverLabel([c('Decor'), c('Catering')])).toBe('Decor, Catering over');
    expect(categoriesOverLabel([c('Decor'), c('Catering'), c('Photo'), c('DJ')])).toBe(
      'Decor, Catering +2 over',
    );
  });
});

describe('overLines', () => {
  it('lists the overall overrun first, then each category', () => {
    expect(overLines(1_20_000, [{ id: 'd', name: 'Decor', overBy: 50_000 }])).toEqual([
      '₹1.2L over budget',
      'Decor ₹50,000 over',
    ]);
    expect(overLines(null, [])).toEqual([]);
  });
});

describe('sentLabel (company time)', () => {
  const tz = 'Asia/Kolkata';
  it('counts days in the company time zone', () => {
    // 23:00 IST on the 13th is still "yesterday" on the 14th, though it is 17:30 UTC.
    expect(sentLabel(new Date('2099-02-13T17:30:00Z'), '2099-02-14', tz)).toBe('Sent yesterday');
    // 00:30 IST on the 14th is "today", though it is the 13th in UTC.
    expect(sentLabel(new Date('2099-02-13T19:00:00Z'), '2099-02-14', tz)).toBe('Sent today');
    expect(sentLabel(new Date('2099-02-11T05:00:00Z'), '2099-02-14', tz)).toBe('Sent 3 days ago');
    expect(sentLabel(new Date('2099-01-20T05:00:00Z'), '2099-02-14', tz)).toBe('Sent 20 Jan 2099');
  });

  it('is null for a form never sent', () => {
    expect(sentLabel(null, '2099-02-14', tz)).toBeNull();
  });
});

describe('moreCount', () => {
  it('is the rows left out', () => {
    expect(moreCount({ total: 11, items: [1, 2, 3, 4, 5, 6, 7, 8] })).toBe(3);
    expect(moreCount({ total: 0, items: [] })).toBe(0);
  });
});
