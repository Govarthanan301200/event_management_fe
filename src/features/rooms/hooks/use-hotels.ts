import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createHotel, deleteHotel, roomsKeys, updateHotel } from '../api/rooms.api';
import type { HotelInput, Rooms } from '../api/rooms.schema';

/** The event's hotel list (spec §10 "Hotels: typed per event"). */
export function useHotels(eventId: string) {
  const queryClient = useQueryClient();
  const key = roomsKeys.event(eventId);
  const setRooms = (update: (rooms: Rooms) => Rooms) => {
    queryClient.setQueryData<Rooms>(key, (rooms) => (rooms ? update(rooms) : rooms));
  };

  const create = useMutation({
    mutationFn: (input: HotelInput) => createHotel(eventId, input),
    onSuccess: (hotel) => {
      setRooms((rooms) => ({ ...rooms, hotels: [...rooms.hotels, hotel] }));
    },
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: HotelInput }) =>
      updateHotel(eventId, id, input),
    onSuccess: (hotel) => {
      setRooms((rooms) => ({
        ...rooms,
        hotels: rooms.hotels.map((item) => (item.id === hotel.id ? hotel : item)),
      }));
    },
  });

  /** Rows that used the hotel keep everything else (the server clears their hotel). */
  const remove = useMutation({
    mutationFn: (id: string) => deleteHotel(eventId, id),
    onSuccess: (_result, id) => {
      setRooms((rooms) => ({
        hotels: rooms.hotels.filter((hotel) => hotel.id !== id),
        rows: rooms.rows.map((row) =>
          row.eventHotelId === id ? { ...row, eventHotelId: null } : row,
        ),
      }));
    },
  });

  return { create, update, remove };
}
