import type { ReactNode } from 'react';

type FormSectionProps = {
  title: string;
  description?: string;
  /** Right-aligned header action (e.g. "Add contact"). */
  action?: ReactNode;
  children: ReactNode;
};

/** One of the four S4 parts: a card with an overline heading. */
export function FormSection({ title, description, action, children }: FormSectionProps) {
  const id = `form-${title.toLowerCase().replace(/\W+/g, '-')}`;
  return (
    <section aria-labelledby={id} className="rounded-md border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div className="flex flex-col">
          <h2 id={id} className="text-overline text-muted-foreground">
            {title}
          </h2>
          {description ? <p className="text-caption text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}
