import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type RowMenuItem = {
  label: string;
  onSelect: () => void;
  disabled?: boolean | undefined;
  /** Short reason shown under a disabled item. */
  hint?: string | undefined;
  /** Archive / reset: separated and in danger text. */
  tone?: 'default' | 'danger';
};

type RowMenuProps = {
  /** Accessible name of the ⋯ button, e.g. "Actions for Candid Photography". */
  label: string;
  items: RowMenuItem[];
};

/** The ⋯ menu that holds everything except a view's primary action. */
export function RowMenu({ label, items }: RowMenuProps) {
  const regular = items.filter((item) => item.tone !== 'danger');
  const danger = items.filter((item) => item.tone === 'danger');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={label}>
          <MoreHorizontal strokeWidth={1.5} aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        {regular.map((item) => (
          <MenuEntry key={item.label} item={item} />
        ))}
        {regular.length > 0 && danger.length > 0 ? <DropdownMenuSeparator /> : null}
        {danger.map((item) => (
          <MenuEntry key={item.label} item={item} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type MenuEntryProps = { item: RowMenuItem };

function MenuEntry({ item }: MenuEntryProps) {
  return (
    <DropdownMenuItem
      disabled={item.disabled}
      variant={item.tone === 'danger' ? 'destructive' : 'default'}
      onSelect={item.onSelect}
      className="flex-col items-start gap-0"
    >
      <span>{item.label}</span>
      {item.hint ? <span className="text-caption text-muted-foreground">{item.hint}</span> : null}
    </DropdownMenuItem>
  );
}
