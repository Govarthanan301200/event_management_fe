import { MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSignOut } from './use-sign-out';

/**
 * Below 640px the sidebar gives way to the tab bar (decision 2026-11-26), so the rest of the web
 * app's sections (Dashboard, Vendors, Services) and Sign out sit in this bar's ⋯ menu.
 */
export function MobileTopBar() {
  const signOut = useSignOut();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background px-4 sm:hidden">
      <span className="text-title-serif font-display">Wedding planner</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="More" className="size-12">
            <MoreHorizontal className="size-6" strokeWidth={1.5} aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuItem asChild className="h-12">
            <Link to="/dashboard">Dashboard</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="h-12">
            <Link to="/vendors">Vendors</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="h-12">
            <Link to="/settings">Services</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="h-12" onSelect={signOut}>
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
