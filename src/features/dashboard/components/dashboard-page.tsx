import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Dashboard } from '../api/dashboard.schema';
import { useDashboard } from '../hooks/use-dashboard';
import { greeting, longDate } from '../lib/dashboard';
import { OverBudgetWidget } from './over-budget-widget';
import { SubmissionsWidget } from './submissions-widget';
import { TasksWidget } from './tasks-widget';
import { TodayWidget } from './today-widget';
import { UpcomingWidget } from './upcoming-widget';

/**
 * S13 Dashboard (spec §15, widgets confirmed 2026-11-26): "what needs me now?" across events.
 * ≥1024px: Today beside New submissions (the spec wireframe), then full-width rows; below, one
 * column in the same order.
 */
export function DashboardPage() {
  const dashboard = useDashboard();
  if (dashboard.isPending) return <DashboardSkeleton />;
  if (dashboard.isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 py-12">
        <h1 className="text-title-serif font-display">Dashboard</h1>
        <p className="text-body text-danger">⚠ Couldn&apos;t load the dashboard.</p>
        <Button variant="outline" onClick={() => void dashboard.refetch()}>
          Try again
        </Button>
      </div>
    );
  }
  return <DashboardView data={dashboard.data} />;
}

function DashboardView({ data }: { data: Dashboard }) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="text-headline font-display">{greeting(data.now)}</h1>
        <p className="text-caption text-muted-foreground tabular-nums">{longDate(data.today)}</p>
      </header>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* DOM order = visual order at every width (keyboard and screen readers follow it). */}
        <TodayWidget today={data.todayFunctions} className="lg:col-span-3" />
        <SubmissionsWidget
          submissions={data.submissions}
          today={data.today}
          timeZone={data.timeZone}
          className="lg:col-span-2"
        />
        <TasksWidget tasks={data.tasks} today={data.today} className="lg:col-span-5" />
        <UpcomingWidget upcoming={data.upcoming} className="lg:col-span-5" />
        <OverBudgetWidget overBudget={data.overBudget} className="lg:col-span-5" />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading the dashboard" className="flex flex-col gap-6">
      <Skeleton className="h-9 w-56" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Skeleton className="h-48 rounded-md lg:col-span-3" />
        <Skeleton className="h-48 rounded-md lg:col-span-2" />
        <Skeleton className="h-56 rounded-md lg:col-span-5" />
        <Skeleton className="h-40 rounded-md lg:col-span-5" />
      </div>
    </div>
  );
}
