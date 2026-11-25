import { useOutletContext } from 'react-router';
import type { EventDetail } from '../api/events.schema';

export type WorkspaceContext = {
  event: EventDetail;
  /** Opens S6 Edit details (also in the header's ⋯ menu). */
  editDetails: () => void;
};

/** The event loaded by `EventWorkspace`, for its tabs (Overview, Plan by category). */
export function useWorkspaceEvent(): WorkspaceContext {
  return useOutletContext<WorkspaceContext>();
}
