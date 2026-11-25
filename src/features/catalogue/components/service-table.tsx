import { Button } from '@/components/ui/button';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { CatalogueCategory, Service } from '../api/catalogue.schema';
import { useReorderServices, useUpdateService } from '../hooks/use-catalogue';
import { archiveWithUndo } from '@/lib/archive-with-undo';
import { moveBy, moveTo, withArchivedLast } from '@/lib/order';
import { ArchivedSection } from './archived-section';
import { ServiceRow } from './service-row';
import { SortableList } from '@/components/shared/sortable-list';

type ServiceTableProps = {
  category: CatalogueCategory;
  onAdd: () => void;
  onEdit: (service: Service) => void;
};

/** S2 right pane: the category's active services (drag to reorder) and its archived ones. */
export function ServiceTable({ category, onAdd, onEdit }: ServiceTableProps) {
  const reorder = useReorderServices(category.id);
  const update = useUpdateService();
  const active = category.services.filter((service) => !service.archivedAt);
  const archived = category.services.filter((service) => service.archivedAt);
  const ids = active.map((service) => service.id);
  const save = (nextIds: string[]) => {
    reorder.mutate(withArchivedLast(nextIds, category.services));
  };

  return (
    <div className="flex flex-col gap-4">
      {active.length === 0 ? (
        <div className="flex flex-col items-start gap-2 rounded-md border border-border bg-card px-4 py-8">
          <h3 className="text-title-serif">Add the first service in {category.name}</h3>
          <p className="text-body text-muted-foreground">
            Services are what clients tick on their form and what you plan for each function.
          </p>
          {category.archivedAt ? null : (
            <Button variant="outline" onClick={onAdd}>
              Add service
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <Table className="table-fixed">
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="w-8">
                  <span className="sr-only">Reorder</span>
                </TableHead>
                <TableHead className="text-label text-muted-foreground">Service</TableHead>
                <TableHead className="hidden w-36 text-label text-muted-foreground md:table-cell">
                  Parameters
                </TableHead>
                <TableHead className="w-32 text-label text-muted-foreground">Client form</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <SortableList
              ids={ids}
              nameOf={(id) => active.find((service) => service.id === id)?.name ?? 'service'}
              onMove={(id, overId) => {
                save(moveTo(ids, id, overId));
              }}
            >
              <TableBody>
                {active.map((service, index) => (
                  <ServiceRow
                    key={service.id}
                    service={service}
                    actions={[
                      {
                        label: 'Edit service',
                        onSelect: () => {
                          onEdit(service);
                        },
                      },
                      {
                        label: 'Move up',
                        disabled: index === 0,
                        onSelect: () => {
                          save(moveBy(ids, service.id, -1));
                        },
                      },
                      {
                        label: 'Move down',
                        disabled: index === active.length - 1,
                        onSelect: () => {
                          save(moveBy(ids, service.id, 1));
                        },
                      },
                      {
                        label: 'Archive service',
                        tone: 'danger',
                        onSelect: () => {
                          archiveWithUndo(update.mutate, service);
                        },
                      },
                    ]}
                  />
                ))}
              </TableBody>
            </SortableList>
          </Table>
        </div>
      )}
      <ArchivedSection
        title="Archived services"
        items={archived}
        onRestore={(service) => {
          update.mutate({ id: service.id, change: { archived: false } });
        }}
      />
    </div>
  );
}
