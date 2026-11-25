import { useQueryClient } from '@tanstack/react-query';
import { CalendarDays, List, LogOut, Store, type LucideIcon } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { signOut } from '@/features/auth';
import { cn } from '@/lib/utils';

type Section = { to: string; label: string; icon: LucideIcon };

/**
 * Spec §3 sections that exist so far. Dashboard (Module 9) and Inventory (Module 10) join the
 * list when they are built (decision 2026-11-24).
 */
const mainSections: Section[] = [
  { to: '/events', label: 'Events', icon: CalendarDays },
  { to: '/vendors', label: 'Vendors', icon: Store },
  { to: '/settings', label: 'Services', icon: List },
];

/**
 * Planner web shell (design system: left sidebar on `surface-sunken`, active item with a
 * `gold-soft` fill and a 3px `gold` bar). Below 1024px the sidebar collapses to icons.
 */
export function PlannerLayout() {
  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 flex h-dvh w-14 shrink-0 flex-col border-r border-border bg-sidebar py-4 lg:w-sidebar">
        <div className="flex h-10 items-center px-2 lg:px-5">
          <span className="hidden text-title-serif font-display lg:inline">Wedding planner</span>
          <span className="mx-auto text-title-serif font-display lg:hidden" aria-hidden="true">
            W
          </span>
        </div>
        <nav aria-label="Main" className="mt-6 flex flex-1 flex-col gap-1 px-2 lg:px-3">
          {mainSections.map((section) => (
            <SidebarLink key={section.to} section={section} />
          ))}
        </nav>
        <div className="px-2 lg:px-3">
          <SignOutButton />
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8">
        <div className="mx-auto w-full max-w-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

type SidebarLinkProps = { section: Section };

function SidebarLink({ section }: SidebarLinkProps) {
  const Icon = section.icon;
  return (
    <NavLink
      to={section.to}
      title={section.label}
      className={({ isActive }) =>
        cn(
          'flex h-10 items-center justify-center gap-3 rounded-sm border-l-3 px-2 text-label transition-colors duration-200 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:justify-start lg:px-3',
          isActive
            ? 'border-gold bg-gold-soft text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground',
        )
      }
    >
      <Icon className="size-5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
      <span className="sr-only lg:not-sr-only">{section.label}</span>
    </NavLink>
  );
}

function SignOutButton() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return (
    <Button
      variant="ghost"
      title="Sign out"
      className="h-10 w-full justify-center gap-3 px-2 text-muted-foreground lg:justify-start lg:px-3"
      onClick={() => {
        void signOut().then(() => {
          queryClient.clear();
          void navigate('/sign-in');
        });
      }}
    >
      <LogOut className="size-5" strokeWidth={1.5} aria-hidden="true" />
      <span className="sr-only lg:not-sr-only">Sign out</span>
    </Button>
  );
}
