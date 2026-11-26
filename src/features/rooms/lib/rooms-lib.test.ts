import { describe, expect, it } from 'vitest';
import type { GuestRow, Hotel } from '../api/rooms.schema';
import { parseCount, parseDate, parseText } from './cells';
import { cellChange, cellValue } from './cell-edit';
import { columnForHeader, COLUMNS } from './columns';
import { exportFileName, exportSheet } from './export';
import { isBlockPaste, parseClipboard, rowsFromSheet } from './sheet';
import { parseStatus, STATUS_LABELS } from './status';
import { applyView, nextSort, readView, type RoomsView } from './view';

const hotels: Hotel[] = [
  { id: 'h-a', name: 'Hotel A', area: 'ECR', contact: null },
  { id: 'h-b', name: 'Hotel B', area: 'Guindy', contact: null },
];

const guest = (id: string, extra: Partial<GuestRow> = {}): GuestRow => ({
  id,
  gId: null,
  srNo: null,
  cluster: null,
  groupId: null,
  name: `Guest ${id}`,
  contact: null,
  eventHotelId: null,
  roomNo: null,
  status: null,
  pax: null,
  rc: null,
  hamper: null,
  checkInDate: null,
  arrivalTime: null,
  departureDate: null,
  ...extra,
});

describe('columns (spec §10, in sheet order)', () => {
  it('lists the planner’s sheet columns plus Hotel', () => {
    expect(COLUMNS.map((column) => column.title)).toEqual([
      'G ID',
      'Sr No',
      'Cluster',
      'ID',
      'Name',
      'Contact',
      'Hotel',
      'Room No',
      'Status',
      'PAX',
      'RC',
      'Hamper',
      'Check-in date',
      'Arrival time',
      'Departure date',
    ]);
  });

  it('matches header spellings ignoring case, spaces and dots', () => {
    expect(columnForHeader('Sr. No')?.key).toBe('srNo');
    expect(columnForHeader('ROOM NO')?.key).toBe('roomNo');
    expect(columnForHeader('Check In')?.key).toBe('checkInDate');
    expect(columnForHeader('Mobile')?.key).toBe('contact');
    expect(columnForHeader('Notes')).toBeUndefined();
  });
});

describe('parseStatus (loose, decision 2026-11-27)', () => {
  it.each([
    ['Expected', 'expected'],
    ['In', 'checked_in'],
    ['checked in', 'checked_in'],
    ['C/O', 'checked_out'],
    ['co', 'checked_out'],
    ['No-show', 'no_show'],
    ['Canceled', 'cancelled'],
    ['', null],
    ['Maybe', undefined],
  ])('%j → %j', (text, expected) => {
    expect(parseStatus(text)).toBe(expected);
  });

  it('reads every label it writes', () => {
    for (const [key, label] of Object.entries(STATUS_LABELS)) expect(parseStatus(label)).toBe(key);
  });
});

describe('parseDate', () => {
  it.each([
    [new Date('2027-02-08T00:00:00Z'), '2027-02-08'],
    [46_426, '2027-02-08'], // an Excel serial
    ['2027-02-08', '2027-02-08'],
    ['8/2/2027', '2027-02-08'], // day first (India)
    ['08-02-27', '2027-02-08'],
    ['8.2.2027', '2027-02-08'],
    ['8 Feb 2027', '2027-02-08'],
    ['8th February 2027', '2027-02-08'],
    ['8-Feb-27', '2027-02-08'],
    [' ', null],
    [null, null],
  ])('%j → %j', (cell, expected) => {
    expect(parseDate(cell)).toBe(expected);
  });

  it.each([['31/2/2027'], ['8 Feb'], ['8th midnight'], ['13/13/2027'], [true]])(
    '%j is unreadable',
    (cell) => {
      expect(parseDate(cell)).toBeUndefined();
    },
  );
});

describe('parseCount', () => {
  it('reads whole numbers 0–99,999, blanks as none', () => {
    expect(parseCount(2)).toBe(2);
    expect(parseCount('0')).toBe(0);
    expect(parseCount('1,200')).toBe(1200);
    expect(parseCount('')).toBeNull();
  });

  it('refuses fractions, negatives and words', () => {
    expect(parseCount(1.5)).toBeUndefined();
    expect(parseCount(-1)).toBeUndefined();
    expect(parseCount('two')).toBeUndefined();
    expect(parseCount(100_000)).toBeUndefined();
  });
});

describe('parseText', () => {
  it('trims, keeps number digits, reads an Excel time as a clock time', () => {
    expect(parseText('  G01 ', 40)).toEqual({ value: 'G01', shortened: false });
    expect(parseText(206, 40)).toEqual({ value: '206', shortened: false });
    expect(parseText(new Date('1899-12-30T20:30:00Z'), 120).value).toBe('8:30 PM');
    expect(parseText('', 40).value).toBeNull();
  });

  it('cuts text over the column length and says so', () => {
    expect(parseText('x'.repeat(45), 40)).toEqual({ value: 'x'.repeat(40), shortened: true });
  });
});

describe('parseClipboard (Excel / Google Sheets)', () => {
  it('splits tabs and lines, drops the trailing line break, keeps empty cells', () => {
    expect(parseClipboard('G01\t1\t\tLakshmi R\r\nG02\t1\t\tRavi R\r\n')).toEqual([
      ['G01', '1', '', 'Lakshmi R'],
      ['G02', '1', '', 'Ravi R'],
    ]);
  });

  it('reads quoted cells with tabs, quotes and line breaks inside', () => {
    expect(parseClipboard('"Room ""A""\twing"\t"line one\nline two"\tx')).toEqual([
      ['Room "A"\twing', 'line one\nline two', 'x'],
    ]);
  });

  it('tells a block from a single value', () => {
    expect(isBlockPaste('206')).toBe(false);
    expect(isBlockPaste('206\n')).toBe(false);
    expect(isBlockPaste('206\t207')).toBe(true);
    expect(isBlockPaste('Lakshmi\nRavi')).toBe(true);
  });
});

describe('rowsFromSheet', () => {
  it('maps columns in table order without a header (spec: "columns map in order")', () => {
    const plan = rowsFromSheet(
      [
        [
          'G01',
          '1',
          'C',
          'AC',
          'Lakshmi R',
          '98400 12345',
          'Hotel A',
          '206',
          'C/O',
          '2',
          '1',
          '1',
          '8/2/2027',
          '8th midnight',
          '10/2/2027',
        ],
      ],
      hotels,
    );
    expect(plan.headerSkipped).toBe(false);
    expect(plan.rows).toEqual([
      {
        gId: 'G01',
        srNo: '1',
        cluster: 'C',
        groupId: 'AC',
        name: 'Lakshmi R',
        contact: '98400 12345',
        hotelName: 'Hotel A',
        roomNo: '206',
        status: 'checked_out',
        pax: 2,
        rc: 1,
        hamper: 1,
        checkInDate: '2027-02-08',
        arrivalTime: '8th midnight',
        departureDate: '2027-02-10',
      },
    ]);
    expect(plan.newHotels).toEqual([]);
  });

  it('skips a header row and maps its columns by title, whatever their order', () => {
    const plan = rowsFromSheet(
      [
        ['Name', 'Room no.', 'Notes', 'Hotel'],
        ['Lakshmi R', 206, 'ignored', 'hotel c'],
        ['Ravi R', '208', '', 'Hotel C'],
      ],
      hotels,
    );
    expect(plan.headerSkipped).toBe(true);
    expect(plan.rows).toEqual([
      { name: 'Lakshmi R', roomNo: '206', hotelName: 'hotel c' },
      { name: 'Ravi R', roomNo: '208', hotelName: 'Hotel C' },
    ]);
    // One new hotel, named as first written; "Hotel A" style matches ignore case.
    expect(plan.newHotels).toEqual(['hotel c']);
  });

  it('leaves out blank rows silently and counts rows without a name', () => {
    const plan = rowsFromSheet(
      [
        ['G01', '', '', '', 'Lakshmi R'],
        ['', '', '', '', ''],
        ['G02', '1', '', '', ''],
      ],
      hotels,
    );
    expect(plan.rows.map((row) => row.name)).toEqual(['Lakshmi R']);
    expect(plan.skippedNoName).toBe(1);
  });

  it('keeps unreadable cells blank and counts them per column', () => {
    const plan = rowsFromSheet(
      [
        ['Name', 'Status', 'PAX', 'Check-in date'],
        ['Lakshmi R', 'Maybe', 'two', '8 Feb'],
        ['Ravi R', 'In', '3', '9 Feb'],
      ],
      hotels,
    );
    expect(plan.rows).toEqual([
      { name: 'Lakshmi R' },
      { name: 'Ravi R', status: 'checked_in', pax: 3 },
    ]);
    expect(plan.unreadable).toEqual([
      { column: 'Status', count: 1 },
      { column: 'PAX', count: 1 },
      { column: 'Check-in date', count: 2 },
    ]);
  });
});

describe('export → import round-trip (spec §10 acceptance)', () => {
  it('reads back every value it writes', () => {
    const rows = [
      guest('1', {
        gId: 'G01',
        srNo: '1',
        cluster: 'C',
        groupId: 'AC',
        name: 'Lakshmi R',
        contact: '98400 12345',
        eventHotelId: 'h-a',
        roomNo: '206',
        status: 'checked_out',
        pax: 2,
        rc: 1,
        hamper: 0,
        checkInDate: '2027-02-08',
        arrivalTime: '8th midnight',
        departureDate: '2027-02-10',
      }),
      guest('2', { name: 'Ravi R', roomNo: '206' }),
    ];
    const sheet = exportSheet(rows, hotels);
    expect(sheet[0]?.[0]).toEqual({ value: 'G ID', type: String, fontWeight: 'bold' });
    // What read-excel-file hands back: plain values (dates as Date, numbers as numbers).
    const cells = sheet.map((row) => row.map((cell) => (cell === null ? null : cell.value)));
    const plan = rowsFromSheet(cells, hotels);
    expect(plan.newHotels).toEqual([]);
    expect(plan.rows).toEqual([
      {
        gId: 'G01',
        srNo: '1',
        cluster: 'C',
        groupId: 'AC',
        name: 'Lakshmi R',
        contact: '98400 12345',
        hotelName: 'Hotel A',
        roomNo: '206',
        status: 'checked_out',
        pax: 2,
        rc: 1,
        hamper: 0,
        checkInDate: '2027-02-08',
        arrivalTime: '8th midnight',
        departureDate: '2027-02-10',
      },
      { name: 'Ravi R', roomNo: '206' },
    ]);
  });

  it('names the file after the event, and the hotel when filtered to one', () => {
    expect(exportFileName('Ananya & Rohan')).toBe('Ananya & Rohan rooming list.xlsx');
    expect(exportFileName('Ananya / Rohan', 'Hotel A')).toBe(
      'Ananya Rohan · Hotel A rooming list.xlsx',
    );
  });
});

describe('view: filter and sort (spec §10)', () => {
  const view = (patch: Partial<RoomsView>): RoomsView => ({
    q: '',
    hotel: null,
    status: null,
    sort: null,
    dir: 'asc',
    ...patch,
  });
  const rows = [
    guest('1', {
      gId: 'G10',
      name: 'Lakshmi R',
      eventHotelId: 'h-a',
      status: 'checked_in',
      pax: 2,
    }),
    guest('2', { gId: 'G9', name: 'Ravi R', eventHotelId: 'h-b', pax: 10 }),
    guest('3', { gId: null, name: 'Meena K', eventHotelId: null, status: 'checked_in' }),
  ];
  const ids = (list: GuestRow[]) => list.map((row) => row.id);

  it('reads the view from the URL, ignoring unknown values', () => {
    expect(readView(new URLSearchParams('q=ravi&hotel=h-a&status=none&sort=pax&dir=desc'))).toEqual(
      view({ q: 'ravi', hotel: 'h-a', status: 'none', sort: 'pax', dir: 'desc' }),
    );
    expect(readView(new URLSearchParams('status=happy&sort=companyId'))).toEqual(view({}));
  });

  it('quick filters by hotel and status, including "none"', () => {
    expect(ids(applyView(rows, hotels, view({ hotel: 'h-a' })))).toEqual(['1']);
    expect(ids(applyView(rows, hotels, view({ hotel: 'none' })))).toEqual(['3']);
    expect(ids(applyView(rows, hotels, view({ status: 'checked_in' })))).toEqual(['1', '3']);
    expect(ids(applyView(rows, hotels, view({ status: 'none' })))).toEqual(['2']);
  });

  it('finds text in any column, hotel and status names included', () => {
    expect(ids(applyView(rows, hotels, view({ q: 'meena' })))).toEqual(['3']);
    expect(ids(applyView(rows, hotels, view({ q: 'hotel b' })))).toEqual(['2']);
    expect(ids(applyView(rows, hotels, view({ q: 'checked in' })))).toEqual(['1', '3']);
  });

  it('sorts naturally ("G9" before "G10"), numbers numerically, blanks last either way', () => {
    expect(ids(applyView(rows, hotels, view({ sort: 'gId' })))).toEqual(['2', '1', '3']);
    expect(ids(applyView(rows, hotels, view({ sort: 'gId', dir: 'desc' })))).toEqual([
      '1',
      '2',
      '3',
    ]);
    expect(ids(applyView(rows, hotels, view({ sort: 'pax', dir: 'desc' })))).toEqual([
      '2',
      '1',
      '3',
    ]);
    expect(ids(applyView(rows, hotels, view({ sort: 'hotel' })))).toEqual(['1', '2', '3']);
  });

  it('cycles a header: ascending, descending, stored order', () => {
    expect(nextSort(view({}), 'name')).toEqual({ sort: 'name', dir: 'asc' });
    expect(nextSort(view({ sort: 'name' }), 'name')).toEqual({ sort: 'name', dir: 'desc' });
    expect(nextSort(view({ sort: 'name', dir: 'desc' }), 'name')).toEqual({
      sort: null,
      dir: 'asc',
    });
  });
});

describe('cellChange (autosave)', () => {
  it('trims text and saves an empty cell as none', () => {
    expect(cellChange('roomNo', ' 208 ')).toEqual({ ok: true, change: { roomNo: '208' } });
    expect(cellChange('roomNo', '')).toEqual({ ok: true, change: { roomNo: null } });
  });

  it('refuses an empty name and a non-whole count', () => {
    expect(cellChange('name', ' ')).toEqual({ ok: false, message: 'Name is required' });
    expect(cellChange('pax', '2.5')).toEqual({ ok: false, message: 'PAX takes a whole number' });
    expect(cellChange('pax', '3')).toEqual({ ok: true, change: { pax: 3 } });
  });

  it('maps the hotel and status selects', () => {
    expect(cellChange('hotel', 'h-a')).toEqual({ ok: true, change: { eventHotelId: 'h-a' } });
    expect(cellChange('hotel', '')).toEqual({ ok: true, change: { eventHotelId: null } });
    expect(cellChange('status', 'no_show')).toEqual({ ok: true, change: { status: 'no_show' } });
    expect(cellChange('checkInDate', '2027-02-08')).toEqual({
      ok: true,
      change: { checkInDate: '2027-02-08' },
    });
  });

  it('shows each field as its input expects', () => {
    const row = guest('1', { eventHotelId: 'h-a', pax: 0 });
    expect(cellValue(row, 'hotel')).toBe('h-a');
    expect(cellValue(row, 'pax')).toBe('0');
    expect(cellValue(row, 'roomNo')).toBe('');
  });
});
