import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { TableCell, TableRow } from '@/components/ui/table';
import { errorMessage } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import type { Service } from '../api/catalogue.schema';
import { useUpdateService } from '../hooks/use-catalogue';
import { useSortableRow } from '../hooks/use-sortable-row';
import { parameterList } from '../lib/parameters';
import { DragHandle } from './drag-handle';
import { RowMenu, type RowMenuItem } from './row-menu';

type ServiceRowProps = {
  service: Service;
  /** Edit, Move up / down, Archive. */
  actions: RowMenuItem[];
};

/** One S2 service: drag handle, name, parameters ("Inherit" or the override), client form toggle. */
export function ServiceRow({ service, actions }: ServiceRowProps) {
  const { attachRow, attachHandle, handleProps, style, className, isDragging } = useSortableRow(
    service.id,
  );
  const update = useUpdateService();
  const pendingShown = update.isPending ? update.variables.change.showOnClientForm : undefined;
  const shown = pendingShown ?? service.showOnClientForm;
  const inherits = service.parametersOverride === null;
  const parameters = inherits ? 'Inherit' : parameterList(service.effectiveParameters);

  return (
    <TableRow ref={attachRow} style={style} data-dragging={isDragging} className={className}>
      <TableCell className="w-8 pr-0">
        <DragHandle label={`Reorder ${service.name}`} ref={attachHandle} {...handleProps} />
      </TableCell>
      <TableCell className="max-w-0 whitespace-normal">
        <div className="flex min-w-0 flex-col">
          <span className="text-body font-semibold">{service.name}</span>
          {service.description ? (
            <span
              className="truncate text-caption text-muted-foreground"
              title={service.description}
            >
              {service.description}
            </span>
          ) : null}
          <span className="text-caption text-muted-foreground md:hidden">
            Parameters: {parameters}
          </span>
        </div>
      </TableCell>
      <TableCell
        className={cn('hidden text-label md:table-cell', inherits && 'text-muted-foreground')}
        title={inherits ? `Inherit: ${parameterList(service.effectiveParameters)}` : undefined}
      >
        {parameters}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Switch
            checked={shown}
            aria-label={`Show ${service.name} on the client form`}
            onCheckedChange={(checked) => {
              update.mutate(
                { id: service.id, change: { showOnClientForm: checked } },
                {
                  onError: (error) => toast.error(errorMessage(error, "Couldn't save. Try again.")),
                },
              );
            }}
          />
          <span aria-hidden="true" className="w-12 text-label text-muted-foreground">
            {shown ? 'Shown' : 'Hidden'}
          </span>
        </div>
      </TableCell>
      <TableCell className="w-10 text-right">
        <RowMenu label={`Actions for ${service.name}`} items={actions} />
      </TableCell>
    </TableRow>
  );
}
