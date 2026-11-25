import { NavLink, Outlet } from 'react-router';
import { cn } from '@/lib/utils';

const sections = [
  { to: '/settings/catalogue', label: 'Service catalogue' },
  { to: '/settings/function-types', label: 'Function types' },
];

/**
 * Spec §3 Settings. Company profile (name, logo for the client form) waits for file storage
 * (decision 2026-11-24), so only the catalogue and function types are here.
 */
export function SettingsLayout() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-headline">Services</h1>
      <nav aria-label="Services sections" className="flex gap-6 border-b border-border">
        {sections.map((section) => (
          <NavLink
            key={section.to}
            to={section.to}
            className={({ isActive }) =>
              cn(
                '-mb-px border-b-2 pb-2 text-label transition-colors duration-200',
                isActive
                  ? 'border-gold text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )
            }
          >
            {section.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
