import { Check, ChevronDown, Pencil, X } from "lucide-react";
import { useId, useState } from "react";

import { amountAffordability, formatAmount } from "../lib/format";
import { Amount } from "./amount";
import { Button } from "./button";

import "./approval-request.css";

export interface Reason {
  text: string;
  source: string;
}

interface ApprovalRequestProps {
  title: string;
  amount: number;
  reason: string;
  reasons?: readonly Reason[];
  available?: number;
  state?: "waiting" | "approved" | "declined";
  pending?: boolean;
  onApprove: () => void;
  onEdit?: () => void;
  onDecline: () => void;
}

export const ApprovalRequest = ({
  title,
  amount,
  reason,
  reasons,
  available,
  state = "waiting",
  pending = false,
  onApprove,
  onEdit,
  onDecline,
}: ApprovalRequestProps) => {
  const [why, setWhy] = useState(false);
  const titleId = useId();
  const whyId = useId();
  const short = amountAffordability(amount, available) === "insufficient";

  return (
    <fieldset aria-labelledby={titleId} className="cl-approval">
      <div className="cl-approval__head">
        <p className="cl-approval__title" id={titleId}>
          {title}
        </p>
        <Amount available={available} value={amount} />
      </div>
      <p className="cl-approval__reason">{reason}</p>
      {short && available !== undefined ? (
        <p className="cl-approval__short">
          {formatAmount(Math.abs(amount) - available)} short: Everyday has {formatAmount(available)}
        </p>
      ) : null}
      {reasons?.length ? (
        <>
          <button
            aria-controls={whyId}
            aria-expanded={why}
            className="cl-approval__why"
            onClick={() => setWhy(!why)}
            type="button"
          >
            How I decided
            <ChevronDown aria-hidden size={14} strokeWidth={2} />
          </button>
          <ul className="cl-approval__reasons" hidden={!why} id={whyId}>
            {reasons.map((item) => (
              <li key={item.text}>
                <span>{item.text}</span>
                <span className="cl-approval__source">{item.source}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <div aria-live="polite" className="cl-approval__foot">
        {state === "waiting" ? (
          <>
            <Button block disabled={short} onClick={onApprove} pending={pending}>
              Approve
            </Button>
            {onEdit ? (
              <Button
                aria-label="Change the amount"
                disabled={pending}
                onClick={onEdit}
                size="icon"
                variant="secondary"
              >
                <Pencil aria-hidden size={16} strokeWidth={1.75} />
              </Button>
            ) : null}
            <Button disabled={pending} onClick={onDecline} variant="ghost">
              Decline
            </Button>
          </>
        ) : (
          <p className="cl-approval__done" data-state={state}>
            {state === "approved" ? (
              <Check aria-hidden size={16} strokeWidth={2.25} />
            ) : (
              <X aria-hidden size={16} strokeWidth={2} />
            )}
            {state === "approved" ? "Approved, it goes out today" : "Left unpaid. Nothing moved."}
          </p>
        )}
      </div>
    </fieldset>
  );
};
