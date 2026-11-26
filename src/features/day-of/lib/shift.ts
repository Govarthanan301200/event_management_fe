import type { Task } from '@/features/tasks';
import { minutesOf } from './today';

/** Spec §14 Shift tasks, later only (decision 2026-11-26). */
export const SHIFT_PRESETS = [15, 30, 45, 60] as const;
export const MAX_SHIFT_MIN = 720;
const LAST_MINUTE = 24 * 60 - 1;

export type ShiftPreview =
  | { ok: true; moving: number }
  /** Some task would pass midnight: the server refuses it (SPEC-GAP default), so say so first. */
  | { ok: false; moving: number; limit: number; overflowing: number };

/**
 * What "Shift tasks" would do (mirrors Backend `planShift`): pending tasks with a time move;
 * Done, Issue and untimed tasks stay. The server decides; this only previews the button.
 */
export function shiftPreview(
  tasks: readonly Pick<Task, 'status' | 'dueTime'>[],
  minutes: number,
): ShiftPreview {
  const times = tasks.flatMap((task) =>
    task.status === 'pending' && task.dueTime !== null ? [minutesOf(task.dueTime)] : [],
  );
  const overflowing = times.filter((time) => time + minutes > LAST_MINUTE).length;
  if (overflowing === 0) return { ok: true, moving: times.length };
  return {
    ok: false,
    moving: times.length,
    limit: Math.min(...times.map((time) => LAST_MINUTE - time)),
    overflowing,
  };
}

/** "6 tasks moved 30 min later" (design system voice: past tense). */
export function shiftedMessage(moved: number, minutes: number): string {
  const what = moved === 1 ? '1 task' : `${String(moved)} tasks`;
  return `${what} moved ${String(minutes)} min later`;
}
