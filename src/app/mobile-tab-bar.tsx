import { CalendarCheck, CalendarDays, ListTodo, type LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router';
import { overdueToday, useNow, useTodayAgenda } from '@/features/day-of';
import { cn } from '@/lib/utils';

type Tab = { to: string; label: string; icon: LucideIcon };

/** Spec §3 planner mobile app: Today · Upcoming · Events (decision 2026-11-26: below 640px). */
const tabs: Tab[] = [
  { to: '/today', label: 'Today', icon: CalendarCheck },
  { to: '/upcoming', label: 'Upcoming', icon: ListTodo },
  { to: '/events', label: 'Events', icon: CalendarDays },
];

/**
 * The phone's bottom tab bar (design system Mobile Today): the active tab has a gold dot and an ink
 * label. Today carries the overdue count (status: a number with its word, never colour alone).
 */
export function MobileTabBar() {
  const now = useNow();
  const agenda = useTodayAgenda(now.date);
  const overdue = agenda.data ? overdueToday(agenda.data.tasks, now).length : 0;
  return (
    <nav
      aria-label="Day of"
      data-tab-bar
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card pb-[env(safe-area-inset-bottom)] sm:hidden sunlight:border-t-2"
    >
      {tabs.map((tab) => (
        <TabLink key={tab.to} tab={tab} badge={tab.to === '/today' ? overdue : 0} />
      ))}
    </nav>
  );
}

function TabLink({ tab, badge }: { tab: Tab; badge: number }) {
  const Icon = tab.icon;
  return (
    <NavLink
      to={tab.to}
      className={({ isActive }) =>
        cn(
          'relative flex min-h-16 flex-1 flex-col items-center justify-center gap-0.5 text-label focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
          isActive ? 'text-foreground' : 'text-muted-foreground',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            aria-hidden="true"
            className={cn(
              'size-1.5 rounded-full transition-colors duration-200',
              isActive ? 'bg-gold' : 'bg-transparent',
            )}
          />
          <span className="relative">
            <Icon className="size-6" strokeWidth={1.5} aria-hidden="true" />
            {badge > 0 ? (
              <span
                aria-hidden="true"
                className="absolute -top-1.5 -right-3 min-w-5 rounded-full bg-danger-soft px-1 text-center text-caption font-medium text-danger tabular-nums"
              >
                {badge}
              </span>
            ) : null}
          </span>
          <span>
            {tab.label}
            {badge > 0 ? <span className="sr-only">, {badge} overdue</span> : null}
          </span>
        </>
      )}
    </NavLink>
  );
}
