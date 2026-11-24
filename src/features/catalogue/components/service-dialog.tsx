import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { CatalogueCategory } from '../api/catalogue.schema';
import type { ServiceDialogMode } from '../lib/service-form';
import { ServiceForm } from './service-form';

type ServiceDialogProps = {
  mode: ServiceDialogMode | null;
  /** Active categories, for "Move to category". */
  categories: CatalogueCategory[];
  onClose: () => void;
};

/** S2 Add service / Edit service. The form remounts on every open, so it starts from the item. */
export function ServiceDialog({ mode, categories, onClose }: ServiceDialogProps) {
  return (
    <Dialog
      open={mode !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        {mode ? <ServiceForm mode={mode} categories={categories} onDone={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}
