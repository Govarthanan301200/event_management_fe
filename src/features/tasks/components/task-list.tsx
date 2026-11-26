import type { Task } from '../api/tasks.schema';
import type { TaskActions } from '../hooks/use-task-dialogs';
import { isOverdue, type TaskSection } from '../lib/task-groups';
import { TaskRow } from './task-row';

type TaskListProps = {
  sections: readonly TaskSection[];
  now: { date: string; time: string };
  actions: TaskActions;
  arrivedId?: string | null;
};

/** S11 sections (spec §13 wireframe): a sunken overline band per group, then its tasks. */
export function TaskList({ sections, now, actions, arrivedId = null }: TaskListProps) {
  return (
    <div className="flex flex-col gap-4">
      {sections.map((section) => (
        <section
          key={section.id}
          aria-labelledby={`tasks-${section.id}`}
          className="overflow-hidden rounded-md border border-border"
        >
          <h3
            id={`tasks-${section.id}`}
            // An explicit name: name computation drops the space before the inline detail.
            aria-label={section.detail ? `${section.title} · ${section.detail}` : undefined}
            className="bg-muted px-4 py-2 text-overline"
          >
            {section.title}
            {section.detail ? <span className="normal-case"> · {section.detail}</span> : null}
          </h3>
          <TaskRows
            tasks={section.tasks}
            showDate={section.kind !== 'day_of'}
            now={now}
            actions={actions}
            arrivedId={arrivedId}
          />
        </section>
      ))}
    </div>
  );
}

type TaskRowsProps = {
  tasks: readonly Task[];
  showDate: boolean;
  now: { date: string; time: string };
  actions: TaskActions;
  arrivedId?: string | null;
};

export function TaskRows({ tasks, showDate, now, actions, arrivedId = null }: TaskRowsProps) {
  return (
    <ul className="divide-y divide-border">
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          showDate={showDate}
          overdue={isOverdue(task, now)}
          actions={actions}
          arrived={task.id === arrivedId}
        />
      ))}
    </ul>
  );
}
