import { previewLines } from '../lib/preview';
import type { SheetPlan } from '../lib/sheet';
import { STATUS_LABELS } from '../lib/status';

type ImportPreviewProps = { fileName: string; plan: SheetPlan };

/** What the file holds, before anything is saved: the summary, then the first five rows. */
export function ImportPreview({ fileName, plan }: ImportPreviewProps) {
  return (
    <>
      <div role="status" className="flex flex-col gap-1">
        <p className="text-body font-semibold">{fileName}</p>
        <ul className="list-disc pl-5 text-body text-muted-foreground">
          {previewLines(plan).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
      <PreviewTable plan={plan} />
    </>
  );
}

/** The first five rows, as the planner will see them in the table. */
function PreviewTable({ plan }: { plan: SheetPlan }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-left text-body">
        <caption className="sr-only">First rows of the sheet</caption>
        <thead className="bg-muted text-label text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Name</th>
            <th className="px-3 py-2 font-medium">Hotel</th>
            <th className="px-3 py-2 font-medium">Room No</th>
            <th className="px-3 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {plan.rows.slice(0, 5).map((row, index) => (
            // Preview rows have no ids yet; the five never change while the preview is shown.
            <tr key={index} className="border-t border-border">
              <td className="px-3 py-2">{row.name}</td>
              <td className="px-3 py-2">{row.hotelName ?? '—'}</td>
              <td className="px-3 py-2">{row.roomNo ?? '—'}</td>
              <td className="px-3 py-2">{row.status ? STATUS_LABELS[row.status] : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
