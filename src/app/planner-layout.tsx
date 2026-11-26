import {
  CalendarCheck,
  CalendarDays,
  LayoutDashboard,
  List,
  ListTodo,
  LogOut,
  Store,
  type LucideIcon,
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MobileTabBar } from './mobile-tab-bar';
import { MobileTopBar } from './mobile-top-bar';
import { useSignOut } from './use-sign-out';

type Section = { to: string; label: string; icon: LucideIcon };

/**
 * Spec §3 sections that exist so far, Dashboard first (Module 9, decision 2026-11-26). Inventory
 * (Module 10) joins the list when it is built (decision 2026-11-24). Today and Upcoming, the mobile
 * app's tabs, also work on the web (decision 2026-11-26).
 */
const mainSections: Section[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/events', label: 'Events', icon: CalendarDays },
  { to: '/today', label: 'Today', icon: CalendarCheck },
  { to: '/upcoming', label: 'Upcoming', icon: ListTodo },
  { to: '/vendors', label: 'Vendors', icon: Store },
  { to: '/settings', label: 'Services', icon: List },
];

/**
 * Planner web shell (design system: left sidebar on `surface-sunken`, active item with a
 * `gold-soft` fill and a 3px `gold` bar). Below 1024px the sidebar collapses to icons; below 640px
 * the bottom tab bar (Today · Upcoming · Events) replaces it (decision 2026-11-26).
 */
export function PlannerLayout() {
  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 flex h-dvh w-14 shrink-0 flex-col border-r border-border bg-sidebar py-4 max-sm:hidden lg:w-sidebar">
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
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <main className="min-w-0 flex-1 px-4 pt-6 pb-24 sm:px-8 sm:py-8">
          <div className="mx-auto w-full max-w-content">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileTabBar />
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
  const signOut = useSignOut();
  return (
    <Button
      variant="ghost"
      title="Sign out"
      className="h-10 w-full justify-center gap-3 px-2 text-muted-foreground lg:justify-start lg:px-3"
      onClick={signOut}
    >
      <LogOut className="size-5" strokeWidth={1.5} aria-hidden="true" />
      <span className="sr-only lg:not-sr-only">Sign out</span>
    </Button>
  );
}
