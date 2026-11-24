import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { errorMessage } from '@/lib/api-client';
import type { CategoryChange } from '../api/catalogue.api';
import type { Category } from '../api/catalogue.schema';
import { useUpdateCategory } from '../hooks/use-catalogue';
import { ParameterToggle } from './parameter-toggle';
import { SizeLabelsEditor } from './size-labels-editor';

type CategorySettingsProps = { category: Category };

/**
 * S2 category rules (spec §4, §8): parameters, pax pre-fill, and size labels when the category
 * has Size. The pending change shows straight away (from the mutation's variables) and the
 * saved value takes over once the catalogue refetches.
 */
export function CategorySettings({ category }: CategorySettingsProps) {
  const update = useUpdateCategory();
  const pending: CategoryChange = update.isPending ? update.variables.change : {};
  const parameters = pending.parameters ?? category.parameters;
  const hasPax = parameters.includes('pax');
  const paxPrefill = hasPax && (pending.paxPrefill ?? category.paxPrefill);
  const readOnly = category.archivedAt !== null;

  const save = (change: CategoryChange) => {
    update.mutate(
      { id: category.id, change },
      { onError: (error) => toast.error(errorMessage(error, "Couldn't save. Try again.")) },
    );
  };

  return (
    <section aria-label={`${category.name} settings`} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <span id="parameters-label" className="w-28 shrink-0 text-label text-muted-foreground">
          Parameters
        </span>
        <ParameterToggle
          label={`Parameters for ${category.name}`}
          value={parameters}
          disabled={readOnly}
          aria-describedby="parameters-help"
          onChange={(next) => {
            save({ parameters: next });
          }}
        />
      </div>

      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
        <span className="w-28 shrink-0 text-label text-muted-foreground">Pax pre-fill</span>
        <div className="flex items-center gap-3">
          <Switch
            id="pax-prefill"
            checked={paxPrefill}
            disabled={!hasPax || readOnly}
            aria-describedby={hasPax ? undefined : 'pax-prefill-help'}
            onCheckedChange={(checked) => {
              save({ paxPrefill: checked });
            }}
          />
          <Label htmlFor="pax-prefill" className="text-body font-normal">
            Pre-fill pax from guest count · {paxPrefill ? 'On' : 'Off'}
          </Label>
        </div>
        {hasPax ? null : (
          <span id="pax-prefill-help" className="text-caption text-muted-foreground">
            Turn on Pax to use pre-fill.
          </span>
        )}
      </div>

      {parameters.includes('size') ? (
        <SizeLabelsEditor
          categoryName={category.name}
          labels={pending.sizeLabels ?? category.sizeLabels}
          disabled={readOnly}
          onChange={(sizeLabels) => {
            save({ sizeLabels });
          }}
        />
      ) : null}

      <p id="parameters-help" className="text-caption text-muted-foreground">
        Changes apply to new function rows. Existing quantities are kept.
      </p>
    </section>
  );
}
