import { describe, expect, it } from 'vitest';
import { shiftedMessage, shiftPreview } from './shift';

describe('shiftPreview (spec §14 Shift tasks)', () => {
  const tasks = [
    { status: 'pending' as const, dueTime: '16:30' },
    { status: 'pending' as const, dueTime: '17:00' },
    { status: 'done' as const, dueTime: '16:00' },
    { status: 'issue' as const, dueTime: '17:15' },
    { status: 'pending' as const, dueTime: null },
  ];

  it('moves pending timed tasks only', () => {
    expect(shiftPreview(tasks, 30)).toEqual({ ok: true, moving: 2 });
  });

  it('warns before a shift past midnight, with the largest that fits', () => {
    const late = [
      { status: 'pending' as const, dueTime: '23:00' },
      { status: 'pending' as const, dueTime: '23:14' },
    ];
    expect(shiftPreview(late, 60)).toEqual({ ok: false, moving: 2, limit: 45, overflowing: 2 });
    expect(shiftPreview(late, 45)).toEqual({ ok: true, moving: 2 });
  });

  it('a Done task late at night never blocks a shift', () => {
    expect(shiftPreview([{ status: 'done', dueTime: '23:50' }], 60)).toEqual({
      ok: true,
      moving: 0,
    });
  });

  it('says what moved', () => {
    expect(shiftedMessage(6, 30)).toBe('6 tasks moved 30 min later');
    expect(shiftedMessage(1, 15)).toBe('1 task moved 15 min later');
  });
});
