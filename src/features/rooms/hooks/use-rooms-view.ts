import { useSearchParams } from 'react-router';
import type { Rooms } from '../api/rooms.schema';
import { applyView, readView, type RoomsView } from '../lib/view';

/** S14 filters and sort, kept in the URL (`?q=&hotel=&status=&sort=&dir=`), and the rows they show. */
export function useRoomsView(rooms: Rooms) {
  const [params, setParams] = useSearchParams();
  const view = readView(params);
  const shown = applyView(rooms.rows, rooms.hotels, view);

  const setView = (patch: Partial<Record<keyof RoomsView, string | null>>) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(patch)) {
          if (value === null) next.delete(key);
          else next.set(key, value);
        }
        return next;
      },
      { replace: true },
    );
  };

  return { view, setView, shown, shownIds: shown.map((row) => row.id) };
}
