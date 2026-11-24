import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MAX_SIZE_LABELS, sizeLabelSchema } from '../api/catalogue.schema';
import { NameDialog } from './name-dialog';

type SizeLabelsEditorProps = {
  categoryName: string;
  labels: string[];
  disabled: boolean;
  onChange: (labels: string[]) => void;
};

/**
 * Spec §4: Decor-style categories label their measurements (Stage, Hall, Lawn). The planner can
 * rename or add labels; each function row holds up to three measurements.
 */
export function SizeLabelsEditor({
  categoryName,
  labels,
  disabled,
  onChange,
}: SizeLabelsEditorProps) {
  const [draft, setDraft] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const isDuplicate = (value: string, except?: string) =>
    labels.some((label) => label !== except && label.toLowerCase() === value.toLowerCase());

  const add = () => {
    const parsed = sizeLabelSchema.safeParse(draft);
    if (!parsed.success) {
      setProblem(parsed.error.issues[0]?.message ?? 'Enter a label');
      return;
    }
    if (isDuplicate(parsed.data)) {
      setProblem(`${parsed.data} is already a label.`);
      return;
    }
    onChange([...labels, parsed.data]);
    setDraft('');
    setProblem(null);
  };

  const full = labels.length >= MAX_SIZE_LABELS;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
      <span className="w-28 shrink-0 pt-1.5 text-label text-muted-foreground">Size labels</span>
      <div className="flex min-w-0 flex-col gap-2">
        <ul aria-label={`Size labels for ${categoryName}`} className="flex flex-wrap gap-2">
          {labels.map((label) => (
            <li
              key={label}
              className="flex h-8 items-center rounded-full border border-input pr-1 pl-3 text-label"
            >
              <button
                type="button"
                disabled={disabled}
                className="rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                aria-label={`Rename ${label}`}
                onClick={() => {
                  setRenaming(label);
                }}
              >
                {label}
              </button>
              <Button
                variant="ghost"
                size="icon-xs"
                disabled={disabled}
                aria-label={`Remove ${label}`}
                onClick={() => {
                  onChange(labels.filter((item) => item !== label));
                }}
              >
                <X strokeWidth={1.5} aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
        {full || disabled ? null : (
          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              add();
            }}
          >
            <Input
              value={draft}
              aria-label="New size label"
              placeholder="e.g. Entrance"
              aria-invalid={problem ? true : undefined}
              aria-describedby={problem ? 'size-label-error' : 'size-label-help'}
              className="h-8 w-40"
              onChange={(event) => {
                setDraft(event.target.value);
              }}
            />
            <Button type="submit" variant="outline" size="sm">
              <Plus strokeWidth={1.5} aria-hidden="true" />
              Add label
            </Button>
          </form>
        )}
        {problem ? (
          <p id="size-label-error" role="alert" className="text-caption text-danger">
            ⚠ {problem}
          </p>
        ) : (
          <p id="size-label-help" className="text-caption text-muted-foreground">
            Each function row can hold up to 3 measurements.
          </p>
        )}
      </div>
      <NameDialog
        open={renaming !== null}
        onOpenChange={(open) => {
          if (!open) setRenaming(null);
        }}
        title="Rename size label"
        label="Label"
        initialName={renaming ?? ''}
        maxLength={40}
        submitLabel="Rename"
        pendingLabel="Renaming…"
        validate={(name) =>
          isDuplicate(name, renaming ?? undefined) ? `${name} is already a label.` : undefined
        }
        onSubmit={(name) => {
          onChange(labels.map((label) => (label === renaming ? name : label)));
          return Promise.resolve();
        }}
      />
    </div>
  );
}
