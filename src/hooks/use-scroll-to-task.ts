import { useEffect } from 'react';

/**
 * Opened from a reminder or the dashboard (`?task=`): bring that task into view once (a DOM side
 * effect). Today, Upcoming and S11 give each task row the id `task-{id}`.
 */
export function useScrollToTask(taskId: string | null) {
  useEffect(() => {
    if (taskId === null) return;
    document.getElementById(`task-${taskId}`)?.scrollIntoView({ block: 'center' });
  }, [taskId]);
}
