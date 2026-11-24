import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type VendorSearchProps = {
  /** The search in the URL. */
  value: string;
  onSearch: (text: string) => void;
};

const DEBOUNCE_MS = 300;

/**
 * S3 search by name, city or phone. Typing is local and reaches the URL (and the server) after a
 * short pause, so each keystroke doesn't start a request. A URL change this box didn't send
 * (the empty state's Clear search, Back) replaces what is typed.
 */
export function VendorSearch({ value, onSearch }: VendorSearchProps) {
  const [text, setText] = useState(value);
  // The URL value at the last render, and the last search this box sent.
  const [seen, setSeen] = useState(value);
  const [sent, setSent] = useState(value);
  const timer = useRef<number | undefined>(undefined);

  // Adjusting state to a prop during render (React docs), not in an effect: when the URL
  // changes to something this box didn't send, show it.
  if (value !== seen) {
    setSeen(value);
    if (value !== sent) setText(value);
  }

  const send = (next: string) => {
    window.clearTimeout(timer.current);
    setSent(next);
    onSearch(next);
  };

  // The debounce timer is an external system: clear it if the field unmounts mid-pause.
  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
    },
    [],
  );

  const schedule = (next: string) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      send(next.trim());
    }, DEBOUNCE_MS);
  };

  return (
    <div className="relative w-full sm:max-w-80">
      <label htmlFor="vendor-search" className="sr-only">
        Search vendors
      </label>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle-foreground"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <Input
        id="vendor-search"
        type="search"
        value={text}
        placeholder="Search name, city or phone"
        className="h-10 pr-9 pl-9"
        onChange={(event) => {
          setText(event.target.value);
          schedule(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            send(text.trim());
          }
        }}
      />
      {text ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Clear search"
          className="absolute top-1/2 right-1 -translate-y-1/2"
          onClick={() => {
            setText('');
            send('');
          }}
        >
          <X strokeWidth={1.5} aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}
