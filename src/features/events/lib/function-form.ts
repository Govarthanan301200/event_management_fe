import {
  OTHER_FUNCTION,
  type EventFunction,
  type FunctionEffects,
  type FunctionImpact,
  type FunctionForm,
  type FunctionInput,
} from '../api/events.schema';
import { formatDay } from '@/lib/format';

/** Form values for Add (empty) or Edit (from the saved function). */
export function toFunctionForm(saved?: EventFunction): FunctionForm {
  if (!saved) {
    return {
      functionTypeId: '',
      customName: '',
      date: '',
      startTime: '',
      endTime: '',
      venueName: '',
      venueAddress: '',
      guestCount: '',
    };
  }
  return {
    functionTypeId: saved.functionTypeId ?? OTHER_FUNCTION,
    customName: saved.customName ?? '',
    date: saved.date,
    startTime: saved.startTime,
    endTime: saved.endTime ?? '',
    venueName: saved.venueName ?? '',
    venueAddress: saved.venueAddress ?? '',
    guestCount: String(saved.guestCount),
  };
}

/** The request body. "Other" sends no type and the custom name; empty optional text is sent as "". */
export function toFunctionInput(values: FunctionForm): FunctionInput {
  const isOther = values.functionTypeId === OTHER_FUNCTION;
  return {
    functionTypeId: isOther ? null : values.functionTypeId,
    customName: isOther ? values.customName.trim() : null,
    date: values.date,
    startTime: values.startTime,
    endTime: values.endTime === '' ? null : values.endTime,
    venueName: values.venueName.trim(),
    venueAddress: values.venueAddress.trim(),
    guestCount: Number(values.guestCount),
  };
}

/**
 * The toast after saving a function (spec §10): "Saved" plus what changed elsewhere, e.g.
 * "Saved. 3 tasks moved to 13 Feb." Counts are 0 until Modules 5 and 7.
 */
export function savedMessage(effects: FunctionEffects, date: string): string {
  const parts: string[] = [];
  if (effects.tasksMoved > 0) {
    parts.push(
      `${effects.tasksMoved} ${effects.tasksMoved === 1 ? 'task' : 'tasks'} moved to ${formatDay(date)}`,
    );
  }
  if (effects.paxRowsUpdated > 0) {
    parts.push(
      `pax updated on ${effects.paxRowsUpdated} ${effects.paxRowsUpdated === 1 ? 'service' : 'services'}`,
    );
  }
  return parts.length === 0 ? 'Saved' : `Saved. ${capitalise(parts.join('; '))}.`;
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * The delete warning body (spec §10: counts of affected function rows and tasks). Lines the
 * function alone covers are named: they stay on the plan with no functions (decision 2026-11-25).
 */
export function deleteImpactText(impact: FunctionImpact): string {
  const { functionRows, tasks, emptiedLines } = impact;
  if (functionRows === 0 && tasks === 0) return 'Nothing is planned for it yet.';
  const rows = `${functionRows} service ${functionRows === 1 ? 'row' : 'rows'}`;
  const linked = `${tasks} ${tasks === 1 ? 'task' : 'tasks'}`;
  const main =
    tasks === 0
      ? `This removes ${rows}.`
      : functionRows === 0
        ? `This unlinks ${linked}; they stay on your task list.`
        : `This removes ${rows} and unlinks ${linked}.`;
  if (emptiedLines.length === 0) return main;
  return `${main} ${emptiedLines.join(', ')} will cover no functions until you tick one again.`;
}
