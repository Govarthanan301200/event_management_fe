import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { toast } from 'sonner';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createPlanServer } from '@/features/plan/test/plan-server';
import { renderPlan } from '@/features/plan/test/render';
import type { GuestRow } from '../api/rooms.schema';
import { createRoomsServer } from '../test/rooms-server';

vi.mock('@/features/auth/api/supabase', () => ({
  getAccessToken: () => Promise.resolve('test-token'),
}));
// The XLSX libraries (lazy-loaded in the app) are replaced at this boundary; the cell mapping
// they feed is unit-tested in lib/rooms-lib.test.ts, including the export → import round-trip.
const xlsx = vi.hoisted(() => ({ readXlsx: vi.fn(), writeXlsx: vi.fn() }));
vi.mock('../lib/xlsx', () => xlsx);

const server = setupServer();
beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});
afterEach(() => {
  toast.dismiss();
  server.resetHandlers();
  vi.clearAllMocks();
});
afterAll(() => {
  server.close();
});

function start(
  options: Parameters<typeof createRoomsServer>[0] = {},
  path = '/events/e1/plan/rooms',
) {
  const plan = createPlanServer({ rooms: true });
  const rooms = createRoomsServer(options);
  server.use(...plan.handlers, ...rooms.handlers);
  return { rooms, plan, ...renderPlan(path) };
}

const cell = (label: string) => screen.getByLabelText(label);
const rowNames = () =>
  screen
    .getAllByRole('textbox', { name: /^Name of / })
    .map((input) => (input as HTMLInputElement).value);

function paste(text: string, target: Element = document.body) {
  fireEvent.paste(target, { clipboardData: { getData: () => text } });
}

describe('S14 Rooms and guests (spec §10)', () => {
  it('shows the event’s hotels and rows, every cell editable', async () => {
    start();
    expect(await screen.findByRole('heading', { name: 'Rooms and guests' })).toBeInTheDocument();
    expect(screen.getByText(/guest rows/)).toHaveTextContent('3 guest rows · Saves automatically');
    const hotels = screen.getByRole('region', { name: 'Hotels for this event:' });
    expect(within(hotels).getByRole('button', { name: 'Hotel A · ECR' })).toBeInTheDocument();
    expect(rowNames()).toEqual(['Lakshmi R', 'Ravi R', 'Meena K']);
    expect(cell('Room No for Lakshmi R')).toHaveValue('206');
    expect(cell('Hotel for Lakshmi R')).toHaveDisplayValue('Hotel A');
    expect(cell('Status for Lakshmi R')).toHaveDisplayValue('C/O');
    expect(cell('PAX for Lakshmi R')).toHaveValue('2');
    expect(cell('Check-in date for Lakshmi R')).toHaveValue('2099-02-08');
    expect(screen.getByRole('link', { name: 'Plan' })).toHaveAttribute('href', '/events/e1/plan');
  });

  it('saves a cell on Enter, sending only that field, and moves down', async () => {
    const user = userEvent.setup();
    const { rooms } = start();
    const room = await screen.findByLabelText('Room No for Ravi R');
    await user.clear(room);
    await user.type(room, '208{Enter}');
    await waitFor(() => {
      expect(rooms.calls).toContainEqual(
        expect.objectContaining({ method: 'PATCH', path: '/rows/g2', body: { roomNo: '208' } }),
      );
    });
    expect(cell('Room No for Meena K')).toHaveFocus();
    expect(cell('Room No for Ravi R')).toHaveValue('208');
  });

  it('saves a hotel or status the moment it is picked', async () => {
    const user = userEvent.setup();
    const { rooms } = start();
    await user.selectOptions(await screen.findByLabelText('Hotel for Meena K'), 'Hotel A');
    await user.selectOptions(cell('Status for Ravi R'), 'No-show');
    await waitFor(() => {
      expect(rooms.calls.map((call) => call.body)).toEqual([
        { eventHotelId: 'h-a' },
        { status: 'no_show' },
      ]);
    });
  });

  it('refuses an empty name or a fraction, says why and keeps the saved value', async () => {
    const user = userEvent.setup();
    const { rooms } = start();
    const name = await screen.findByLabelText('Name of Ravi R');
    await user.clear(name);
    await user.tab();
    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(name).toHaveValue('Ravi R');
    const pax = cell('PAX for Ravi R');
    await user.type(pax, '2.5');
    await user.tab();
    expect(await screen.findByText('PAX takes a whole number')).toBeInTheDocument();
    expect(pax).toHaveValue('');
    expect(rooms.calls).toEqual([]);
  });

  it('Esc puts the saved value back without saving', async () => {
    const user = userEvent.setup();
    const { rooms } = start();
    const room = await screen.findByLabelText('Room No for Ravi R');
    await user.type(room, '9{Escape}');
    expect(room).toHaveValue('206');
    await user.tab();
    expect(rooms.calls).toEqual([]);
  });

  it('rolls a failed save back with Retry', async () => {
    const user = userEvent.setup();
    start({ failSave: true });
    const room = await screen.findByLabelText('Room No for Ravi R');
    await user.clear(room);
    await user.type(room, '208');
    await user.tab();
    expect(
      await screen.findByText('Couldn’t save Room No for Ravi R.'.replace('’', "'")),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    await waitFor(() => {
      expect(cell('Room No for Ravi R')).toHaveValue('206');
    });
  });

  it('+ Add row keeps the new row until its name is typed, then saves what was typed', async () => {
    const user = userEvent.setup();
    const { rooms } = start();
    await user.click(await screen.findByRole('button', { name: 'Add row' }));
    await user.type(cell('G ID for the new row'), 'G04');
    await user.tab();
    expect(rooms.calls).toEqual([]);
    await user.type(cell('Name for the new row'), 'Divya S{Enter}');
    await waitFor(() => {
      expect(rooms.calls).toContainEqual(
        expect.objectContaining({
          method: 'POST',
          path: '/rows',
          body: { rows: [{ gId: 'G04', name: 'Divya S' }] },
        }),
      );
    });
    expect(await screen.findByLabelText('Name of Divya S')).toBeInTheDocument();
    expect(screen.getByText(/guest rows/)).toHaveTextContent('4 guest rows');
  });

  it('a pasted block appends rows in column order, with Undo (decision 2026-11-27)', async () => {
    const user = userEvent.setup();
    const { rooms } = start();
    await screen.findByLabelText('Name of Ravi R');
    paste('G04\t3\t\t\tDivya S\t\tHotel C\t301\r\nG05\t3\t\t\tRahul S\t\thotel c\t301\r\n');
    expect(await screen.findByText('Added 2 rows')).toBeInTheDocument();
    const call = rooms.calls.find((item) => item.path === '/import');
    expect(call?.body).toEqual({
      replace: false,
      rows: [
        { gId: 'G04', srNo: '3', name: 'Divya S', hotelName: 'Hotel C', roomNo: '301' },
        { gId: 'G05', srNo: '3', name: 'Rahul S', hotelName: 'hotel c', roomNo: '301' },
      ],
    });
    expect(call?.key).toMatch(/^[\w-]{8,}$/);
    expect(rowNames()).toEqual(['Lakshmi R', 'Ravi R', 'Meena K', 'Divya S', 'Rahul S']);
    expect(screen.getByRole('button', { name: 'Hotel C' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    await waitFor(() => {
      expect(rowNames()).toEqual(['Lakshmi R', 'Ravi R', 'Meena K']);
    });
    expect(rooms.calls.at(-1)).toMatchObject({
      path: '/rows/delete',
      body: { ids: ['g-new-2', 'g-new-3'] },
    });
  });

  it('a single value pasted into a cell just edits it', async () => {
    const { rooms } = start();
    const room = await screen.findByLabelText('Room No for Ravi R');
    paste('301', room);
    expect(rooms.calls).toEqual([]);
  });

  it('pasting into the empty sheet adds the first rows', async () => {
    start({ rows: [] });
    expect(
      await screen.findByRole('heading', { name: 'Add your first guest' }),
    ).toBeInTheDocument();
    paste('G01\t1\t\t\tLakshmi R');
    expect(await screen.findByLabelText('Name of Lakshmi R')).toBeInTheDocument();
  });

  it('filters by text, hotel and status, keeping the view in the URL', async () => {
    const user = userEvent.setup();
    const { router } = start();
    await user.type(await screen.findByRole('searchbox', { name: 'Filter rows' }), 'meena');
    expect(rowNames()).toEqual(['Meena K']);
    expect(router.state.location.search).toBe('?q=meena');
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(rowNames()).toHaveLength(3);

    await user.click(screen.getByRole('combobox', { name: 'Hotel' }));
    await user.click(await screen.findByRole('option', { name: 'Hotel A' }));
    expect(rowNames()).toEqual(['Lakshmi R', 'Ravi R']);
    await user.click(screen.getByRole('combobox', { name: 'Status' }));
    await user.click(await screen.findByRole('option', { name: 'No status' }));
    expect(rowNames()).toEqual(['Ravi R']);
  });

  it('sorts by any column: ascending, descending, then stored order', async () => {
    const user = userEvent.setup();
    start();
    await screen.findByLabelText('Name of Ravi R');
    const header = screen.getByRole('columnheader', { name: 'Name' });
    await user.click(within(header).getByRole('button'));
    expect(header).toHaveAttribute('aria-sort', 'ascending');
    expect(rowNames()).toEqual(['Lakshmi R', 'Meena K', 'Ravi R']);
    await user.click(within(header).getByRole('button'));
    expect(rowNames()).toEqual(['Ravi R', 'Meena K', 'Lakshmi R']);
    await user.click(within(header).getByRole('button'));
    expect(header).not.toHaveAttribute('aria-sort');
    expect(rowNames()).toEqual(['Lakshmi R', 'Ravi R', 'Meena K']);
  });

  it('deletes selected rows after asking', async () => {
    const user = userEvent.setup();
    const { rooms } = start();
    await user.click(await screen.findByRole('checkbox', { name: 'Select Ravi R' }));
    await user.click(screen.getByRole('button', { name: 'Delete 1 row' }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete 1 guest row?' });
    await user.click(within(dialog).getByRole('button', { name: 'Delete rows' }));
    await waitFor(() => {
      expect(rowNames()).toEqual(['Lakshmi R', 'Meena K']);
    });
    expect(rooms.calls).toContainEqual(
      expect.objectContaining({ path: '/rows/delete', body: { ids: ['g2'] } }),
    );
  });

  it('adds a hotel, refusing a name already on the list', async () => {
    const user = userEvent.setup();
    start();
    await user.click(await screen.findByRole('button', { name: 'Add hotel' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add a hotel' });
    await user.type(within(dialog).getByLabelText('Name'), 'hotel a');
    await user.click(within(dialog).getByRole('button', { name: 'Add hotel' }));
    expect(
      await within(dialog).findByText("Hotel A is already in this event's hotel list."),
    ).toBeInTheDocument();
    await user.clear(within(dialog).getByLabelText('Name'));
    await user.type(within(dialog).getByLabelText('Name'), 'Hotel C');
    await user.type(within(dialog).getByLabelText('Area'), 'Adyar');
    await user.click(within(dialog).getByRole('button', { name: 'Add hotel' }));
    expect(await screen.findByRole('button', { name: 'Hotel C · Adyar' })).toBeInTheDocument();
    expect(
      within(cell('Hotel for Ravi R')).getByRole('option', { name: 'Hotel C' }),
    ).toBeInTheDocument();
  });

  it('deletes a hotel after saying how many rows use it; they keep their rows', async () => {
    const user = userEvent.setup();
    start();
    await user.click(await screen.findByRole('button', { name: 'Hotel A · ECR' }));
    await user.click(await screen.findByRole('button', { name: 'Delete hotel' }));
    const confirm = await screen.findByRole('alertdialog', { name: 'Delete Hotel A?' });
    expect(confirm).toHaveTextContent('2 guest rows use it. They stay, with no hotel.');
    await user.click(within(confirm).getByRole('button', { name: 'Delete hotel' }));
    await waitFor(() => {
      expect(cell('Hotel for Lakshmi R')).toHaveDisplayValue('—');
    });
    expect(rowNames()).toHaveLength(3);
  });

  it('imports an XLSX after a preview, replacing the rows when asked (decision 2026-11-27)', async () => {
    const user = userEvent.setup();
    xlsx.readXlsx.mockResolvedValue([
      ['G ID', 'Name', 'Hotel', 'PAX'],
      ['G10', 'Anita P', 'Hotel C', 2],
      ['G11', 'Arjun P', 'hotel a', 'two'],
      ['G12', '', 'Hotel A', 1],
    ]);
    const { rooms } = start();
    await user.click(await screen.findByRole('button', { name: 'Import XLSX' }));
    const dialog = await screen.findByRole('dialog', { name: 'Import rooms and guests' });
    await user.upload(within(dialog).getByLabelText('Sheet'), new File(['x'], 'rooming.xlsx'));
    const summary = await within(dialog).findByRole('status');
    expect(summary).toHaveTextContent('rooming.xlsx');
    expect(summary).toHaveTextContent('2 rows');
    expect(summary).toHaveTextContent('1 new hotel: Hotel C');
    expect(summary).toHaveTextContent('1 row without a name skipped');
    expect(summary).toHaveTextContent("1 value in PAX couldn't be read and stay blank");
    await user.click(within(dialog).getByRole('checkbox', { name: 'Replace existing rows' }));
    await user.click(within(dialog).getByRole('button', { name: 'Import 2 rows' }));
    expect(await screen.findByText('Imported 2 rows')).toBeInTheDocument();
    expect(rooms.calls.at(-1)).toMatchObject({
      path: '/import',
      body: {
        replace: true,
        rows: [
          { gId: 'G10', name: 'Anita P', hotelName: 'Hotel C', pax: 2 },
          { gId: 'G11', name: 'Arjun P', hotelName: 'hotel a' },
        ],
      },
    });
    expect(rowNames()).toEqual(['Anita P', 'Arjun P']);
  });

  it('says so when a file can’t be read', async () => {
    const user = userEvent.setup();
    xlsx.readXlsx.mockRejectedValue(new Error('not a zip'));
    start();
    await user.click(await screen.findByRole('button', { name: 'Import XLSX' }));
    const dialog = await screen.findByRole('dialog', { name: 'Import rooms and guests' });
    await user.upload(within(dialog).getByLabelText('Sheet'), new File(['x'], 'notes.xlsx'));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      "That file couldn't be read. Save it as .xlsx and try again.",
    );
  });

  it('exports the rows shown, named for the hotel when filtered to one', async () => {
    const user = userEvent.setup();
    xlsx.writeXlsx.mockResolvedValue(undefined);
    start({}, '/events/e1/plan/rooms?hotel=h-a&sort=name&dir=desc');
    await user.click(await screen.findByRole('button', { name: 'Export XLSX' }));
    const [rows, hotels, fileName] = xlsx.writeXlsx.mock.calls[0] as [
      GuestRow[],
      unknown[],
      string,
    ];
    expect(rows.map((row) => row.name)).toEqual(['Ravi R', 'Lakshmi R']);
    expect(hotels).toHaveLength(2);
    expect(fileName).toMatch(/ · Hotel A rooming list\.xlsx$/);
  });
});

describe('S7 entry point (decision 2026-11-27)', () => {
  it('a line whose service has rooms opens the event’s table', async () => {
    const user = userEvent.setup();
    start({}, '/events/e1/plan');
    const link = await screen.findByRole('link', { name: 'Manage rooms and guests' });
    expect(link).toHaveAttribute('href', '/events/e1/plan/rooms');
    expect(screen.getAllByRole('link', { name: 'Manage rooms and guests' })).toHaveLength(1);
    await user.click(link);
    expect(await screen.findByRole('heading', { name: 'Rooms and guests' })).toBeInTheDocument();
    // The Plan tab stays current under it.
    expect(screen.getByRole('link', { name: 'Plan by category' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('removing that line says the guest rows stay', async () => {
    const user = userEvent.setup();
    start({}, '/events/e1/plan');
    await user.click(await screen.findByRole('button', { name: 'Actions for Accommodation' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Remove from plan' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(
      await within(dialog).findByText(
        /The 3 guest rows stay and\s+come back when you add Accommodation again\./,
      ),
    ).toBeInTheDocument();
  });
});
