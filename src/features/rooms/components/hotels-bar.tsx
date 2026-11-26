import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Hotel } from '../api/rooms.schema';

type HotelsBarProps = {
  hotels: readonly Hotel[];
  onOpen: (hotel: Hotel | null) => void;
};

/** Spec §10 "Hotels: typed per event in a small list at the top of S14". A chip opens its edit. */
export function HotelsBar({ hotels, onOpen }: HotelsBarProps) {
  return (
    <section aria-labelledby="rooms-hotels" className="flex flex-wrap items-center gap-2">
      <h2 id="rooms-hotels" className="text-label text-muted-foreground">
        Hotels for this event:
      </h2>
      {hotels.length === 0 ? (
        <span className="text-label text-muted-foreground">none yet</span>
      ) : (
        hotels.map((hotel) => (
          <button
            key={hotel.id}
            type="button"
            // An explicit name: name computation drops the space before the inline area.
            aria-label={hotel.area ? `${hotel.name} · ${hotel.area}` : hotel.name}
            onClick={() => {
              onOpen(hotel);
            }}
            className="inline-flex h-8 items-center rounded-full border border-input px-3 text-label hover:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {hotel.name}
            {hotel.area ? (
              <span className="text-muted-foreground">&nbsp;· {hotel.area}</span>
            ) : null}
          </button>
        ))
      )}
      <Button
        variant="ghost"
        className="h-8 gap-1 px-2"
        onClick={() => {
          onOpen(null);
        }}
      >
        <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
        Add hotel
      </Button>
    </section>
  );
}
