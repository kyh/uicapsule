import { Amount } from "./amount";
import { Avatar } from "./avatar";
import { Button } from "./button";
import { formatAmount } from "../lib/format";

import "./split-request.css";

export interface SplitShare {
  name: string;
  share: number;
}

interface SplitRequestProps {
  place: string;
  paid: number;
  shares: readonly SplitShare[];
  included: readonly string[];
  onIncludedChange: (names: string[]) => void;
  onRequest: (total: number) => void;
  sent?: boolean;
}

/** A bill you paid, one row per person with their share, and one request for everyone still in. */
export const SplitRequest = ({
  place,
  paid,
  shares,
  included,
  onIncludedChange,
  onRequest,
  sent = false,
}: SplitRequestProps) => {
  const total = shares
    .filter((person) => included.includes(person.name))
    .reduce((sum, person) => sum + person.share, 0);

  return (
    <div className="cl-split-req">
      <div className="cl-split-req__head">
        <span className="cl-row__title">{place}</span>
        <span className="cl-split-req__paid">You paid {formatAmount(paid)}</span>
      </div>
      <ul className="cl-split-req__people">
        {shares.map((person) => {
          const on = included.includes(person.name);

          return (
            <li data-off={on ? undefined : true} key={person.name}>
              <Avatar name={person.name} />
              <span className="cl-row__title">{person.name}</span>
              <span className="cl-split-req__share">{formatAmount(person.share)}</span>
              <button
                aria-label={`${on ? "Leave out" : "Include"} ${person.name}`}
                className="cl-link"
                disabled={sent}
                onClick={() => {
                  onIncludedChange(
                    on
                      ? included.filter((name) => name !== person.name)
                      : [...included, person.name],
                  );
                }}
                type="button"
              >
                {on ? "Leave out" : "Include"}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="cl-pay-row">
        <Button
          block
          disabled={total === 0 || sent}
          onClick={() => {
            onRequest(total);
          }}
        >
          {sent ? "Asked" : "Ask for the money"}
        </Button>
        <Amount size="lg" tone="accent" value={total} />
      </div>
    </div>
  );
};
