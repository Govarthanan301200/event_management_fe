import { describe, expect, it } from 'vitest';
import type { EventFunction } from '../api/events.schema';
import { deleteImpactText, savedMessage, toFunctionForm, toFunctionInput } from './function-form';

const sangeet: EventFunction = {
  id: 'f1',
  functionTypeId: 't-sangeet',
  customName: null,
  name: 'Sangeet',
  functionTypeArchived: false,
  date: '2099-02-12',
  startTime: '18:30',
  endTime: null,
  venueName: 'Leela Palace',
  venueAddress: null,
  guestCount: 400,
  sortOrder: 0,
};

describe('function form mapping', () => {
  it('round-trips a typed function', () => {
    expect(toFunctionInput(toFunctionForm(sangeet))).toEqual({
      functionTypeId: 't-sangeet',
      customName: null,
      date: '2099-02-12',
      startTime: '18:30',
      endTime: null,
      venueName: 'Leela Palace',
      venueAddress: '',
      guestCount: 400,
    });
  });

  it('sends "Other" as no type plus the custom name', () => {
    const form = {
      ...toFunctionForm(),
      functionTypeId: 'other',
      customName: ' Nalangu ',
      guestCount: '80',
    };
    expect(toFunctionInput(form)).toMatchObject({
      functionTypeId: null,
      customName: 'Nalangu',
      guestCount: 80,
    });
  });

  it('drops a leftover custom name when a type is chosen', () => {
    const form = { ...toFunctionForm(sangeet), customName: 'Old name' };
    expect(toFunctionInput(form).customName).toBeNull();
  });
});

describe('savedMessage', () => {
  it('says Saved when nothing else changed', () => {
    expect(savedMessage({ paxRowsUpdated: 0, tasksMoved: 0 }, '2099-02-13')).toBe('Saved');
  });

  it('names moved tasks and updated pax', () => {
    expect(savedMessage({ paxRowsUpdated: 2, tasksMoved: 3 }, '2099-02-13')).toBe(
      'Saved. 3 tasks moved to 13 Feb 2099; pax updated on 2 services.',
    );
    expect(savedMessage({ paxRowsUpdated: 1, tasksMoved: 0 }, '2099-02-13')).toBe(
      'Saved. Pax updated on 1 service.',
    );
  });
});

describe('deleteImpactText', () => {
  it.each([
    [{ functionRows: 0, tasks: 0, emptiedLines: [] }, 'Nothing is planned for it yet.'],
    [
      { functionRows: 6, tasks: 2, emptiedLines: [] },
      'This removes 6 service rows and unlinks 2 tasks.',
    ],
    [{ functionRows: 1, tasks: 0, emptiedLines: [] }, 'This removes 1 service row.'],
    [
      { functionRows: 0, tasks: 1, emptiedLines: [] },
      'This unlinks 1 task; they stay on your task list.',
    ],
    [
      { functionRows: 2, tasks: 0, emptiedLines: ['DJ / VDJ'] },
      'This removes 2 service rows. DJ / VDJ will cover no functions until you tick one again.',
    ],
  ])('%o → %s', (impact, text) => {
    expect(deleteImpactText(impact)).toBe(text);
  });
});
