import { useQueryClient } from '@tanstack/react-query';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { signOut } from '@/features/auth';
import { cn } from '@/lib/utils';

const mainSections = [
  { to: '/events', label: 'Events' },
  { to: '/settings', label: 'Settings' },
];

/**
 * Planner web shell. Only Events and Settings exist so far, so the sidebar of section 3
 * (Dashboard, Vendors, Inventory) is a slim top bar until those modules land.
 */
export function PlannerLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-muted">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-8">
          <div className="flex items-center gap-6">
            <span className="text-title-serif font-display">Wedding planner</span>
            <nav aria-label="Main" className="flex gap-6">
              {mainSections.map((section) => (
                <NavLink
                  key={section.to}
                  to={section.to}
                  className={({ isActive }) =>
                    cn(
                      'border-b-2 py-4 text-label',
                      isActive
                        ? 'border-gold text-foreground'
                        : 'border-transparent text-muted-foreground',
                    )
                  }
                >
                  {section.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              void signOut().then(() => {
                queryClient.clear();
                void navigate('/sign-in');
              });
            }}
          >
            Sign out
          </Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-8">
        <Outlet />
      </main>
    </div>
  );
}
