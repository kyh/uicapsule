import { Check, TriangleAlert, Undo2 } from "lucide-react";

import "./action-receipt.css";

export interface ReceiptLine {
  label: string;
  detail?: string;
  failed?: boolean;
}

export const ActionReceipt = ({
  lines,
  summary,
  undone = false,
  onUndo,
  name = "Clementine",
}: {
  lines: readonly ReceiptLine[];
  summary?: string;
  undone?: boolean;
  onUndo?: () => void;
  name?: string;
}) => (
  <div className="cl-receipt" data-undone={undone || undefined}>
    <span className="cl-sr">{name} did this:</span>
    {summary ? <p className="cl-receipt__summary">{summary}</p> : null}
    <ul className="cl-receipt__lines">
      {lines.map((line) => {
        let word = "Done";

        if (undone) {
          word = "Undone";
        } else if (line.failed) {
          word = "Failed";
        }

        return (
          <li data-failed={line.failed || undefined} key={line.label}>
            {line.failed ? (
              <TriangleAlert aria-hidden size={16} strokeWidth={1.75} />
            ) : (
              <Check aria-hidden size={16} strokeWidth={2.25} />
            )}
            <span className="cl-sr">{word}: </span>
            <span className="cl-receipt__label">{line.label}</span>
            {line.detail ? <span className="cl-receipt__detail">{line.detail}</span> : null}
          </li>
        );
      })}
    </ul>
    <div aria-live="polite" className="cl-receipt__foot">
      {undone ? (
        <span className="cl-receipt__undone">Reversed. Everything is back as it was.</span>
      ) : null}
      {!undone && onUndo ? (
        <button
          className="cl-btn"
          data-size="sm"
          data-variant="outline"
          onClick={onUndo}
          type="button"
        >
          <span className="cl-btn__body">
            <Undo2 aria-hidden size={14} strokeWidth={1.75} />
            Undo
          </span>
        </button>
      ) : null}
    </div>
  </div>
);
