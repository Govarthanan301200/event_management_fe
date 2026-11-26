import type { AgendaFunction, AgendaTask, AgendaVendor } from '../api/agenda.schema';

// Realistic day-of data (spec §14 wireframe): Ananya & Rohan's Muhurtham and Reception today.

export const EVENT = 'e1';
export const OTHER_EVENT = 'e2';
export const TODAY = '2099-02-14';

export const floral: AgendaVendor = {
  id: 'v-floral',
  name: 'Floral Studio',
  phone: '+91 98400 12345',
  altPhone: '+91 98400 12346',
  contactPerson: 'Meena',
  contacts: [{ id: 'c-ravi', name: 'Ravi', role: 'Lights', phone: '+91 98400 55555' }],
};

export const beats: AgendaVendor = {
  id: 'v-beats',
  name: 'Beats by Harish',
  phone: '+91 98400 77777',
  altPhone: null,
  contactPerson: null,
  contacts: [],
};

export const agendaFn = (
  id: string,
  name: string,
  startTime: string,
  extra: Partial<AgendaFunction> = {},
): AgendaFunction => ({
  id,
  eventId: EVENT,
  eventName: 'Ananya & Rohan',
  name,
  date: TODAY,
  startTime,
  endTime: null,
  venueName: 'Leela Hall',
  ...extra,
});

export const muhurtham = agendaFn('f-muhurtham', 'Muhurtham', '07:30', {
  endTime: '10:30',
  venueName: 'Temple courtyard',
});
export const reception = agendaFn('f-reception', 'Reception', '18:30', { endTime: '23:00' });

export const agendaTask = (id: string, extra: Partial<AgendaTask> = {}): AgendaTask => ({
  id,
  eventId: EVENT,
  eventName: 'Ananya & Rohan',
  eventFunctionId: reception.id,
  functionName: 'Reception',
  serviceLineId: null,
  serviceName: null,
  vendor: null,
  title: id,
  dueDate: TODAY,
  dueTime: null,
  remindBeforeMin: 15,
  status: 'pending',
  issueNote: null,
  completedAt: null,
  kind: 'day_of',
  ...extra,
});
