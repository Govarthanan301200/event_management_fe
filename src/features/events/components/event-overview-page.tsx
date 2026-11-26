import { useWorkspaceEvent } from '../hooks/use-workspace-event';
import { ClientDetailsCard } from './client-details-card';
import { FormLinkCard } from './form-link-card';
import { FunctionsSection } from './functions-section';
import { QuickCounts } from './quick-counts';
import { RequestedServicesPanel } from './requested-services-panel';

/**
 * S6 event overview (spec §10): quick counts, functions, client details, form link and what the
 * client asked for.
 */
export function EventOverviewPage() {
  const { event, editDetails } = useWorkspaceEvent();
  return (
    <div className="flex flex-col gap-8">
      <QuickCounts event={event} />
      <FunctionsSection event={event} />
      <ClientDetailsCard event={event} onEdit={editDetails} />
      <FormLinkCard event={event} />
      <RequestedServicesPanel event={event} />
    </div>
  );
}
