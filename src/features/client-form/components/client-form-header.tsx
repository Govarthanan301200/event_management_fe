import type { ReactNode } from 'react';
import { initials } from '@/lib/format';

type ClientFormHeaderProps = {
  company: { name: string; logoUrl: string | null };
  title: string;
  children?: ReactNode;
};

/** The planner company's logo, or its initials as a gold monogram (design system: S1). */
export function ClientFormHeader({ company, title, children }: ClientFormHeaderProps) {
  return (
    <header className="flex flex-col items-start gap-4 pt-12">
      <div className="flex items-center gap-3">
        {company.logoUrl ? (
          <img src={company.logoUrl} alt="" className="size-12 rounded-md object-contain" />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-12 items-center justify-center rounded-full border border-gold text-title-serif font-display text-gold"
          >
            {initials(company.name)}
          </span>
        )}
        <span className="text-label text-muted-foreground">{company.name}</span>
      </div>
      <h1 className="text-display">{title}</h1>
      {children}
    </header>
  );
}
