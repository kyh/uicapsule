import { Check, Plus, TriangleAlert } from "lucide-react";

import { formatAmount } from "../lib/format";

import "./receipt-match.css";

import "./bill-schedule.css";

const NOTE = {
  matched: "paired with its receipt",
  missing: "photo still to take",
  review: "totals differ",
} as const;

interface ReceiptMatchProps {
  merchant: string;
  date: string;
  amount: number;
  state: keyof typeof NOTE;
  note?: string;
  onAdd?: () => void;
}

const Paper = ({ state }: { state: keyof typeof NOTE }) => (
  <span aria-hidden className="cl-paper" data-state={state}>
    <span className="cl-paper__lines">
      <span />
      <span />
      <span />
      <span className="cl-paper__total" />
    </span>
    <span className="cl-paper__mark">
      {state === "matched" ? (
        <Check size={10} strokeWidth={3} />
      ) : (
        <TriangleAlert size={10} strokeWidth={2.5} />
      )}
    </span>
  </span>
);

export const ReceiptMatch = ({ merchant, date, amount, state, note, onAdd }: ReceiptMatchProps) => (
  <li className="cl-match" data-state={state}>
    {state === "missing" ? (
      <button
        aria-label={`Take the receipt photo for ${merchant}`}
        className="cl-paper cl-paper--empty"
        onClick={onAdd}
        type="button"
      >
        <Plus aria-hidden size={16} strokeWidth={1.75} />
      </button>
    ) : (
      <Paper state={state} />
    )}
    <span className="cl-row__text">
      <span className="cl-row__title">{merchant}</span>
      <span className="cl-row__desc cl-match__note">
        {date}, {note ?? NOTE[state]}
      </span>
    </span>
    <span className="cl-bill__amount">{formatAmount(amount)}</span>
  </li>
);
