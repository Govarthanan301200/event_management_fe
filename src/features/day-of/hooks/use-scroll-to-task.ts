import { useEffect } from 'react';

/** Opened from a reminder (`?task=`): bring that task into view once (a DOM side effect). */
export function useScrollToTask(taskId: string | null) {
  useEffect(() => {
    if (taskId === null) return;
    document.getElementById(`task-${taskId}`)?.scrollIntoView({ block: 'center' });
  }, [taskId]);
}
