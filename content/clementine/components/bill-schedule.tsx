import { Check } from "lucide-react";

import { formatAmount } from "../lib/format";

import "./bill-schedule.css";

export interface Bill {
  name: string;
  due: Date;
  amount: number;
  pay: "autopay" | "manual";
  paid?: boolean;
}

const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const full = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "long", weekday: "long" });

const owedThrough = (bills: readonly Bill[], index: number) =>
  bills
    .slice(0, index + 1)
    .filter((bill) => !bill.paid)
    .reduce((sum, bill) => sum + Math.abs(bill.amount), 0);

const noteFor = (bill: Bill, covered: boolean, autopayLabel: string) => {
  if (bill.paid) {
    return "Paid";
  }

  const who = bill.pay === "autopay" ? autopayLabel : "Yours to pay";

  return covered ? who : `Everyday falls short here. ${who}`;
};

export const BillSchedule = ({
  bills,
  available,
  autopayLabel = "Pays itself",
}: {
  bills: readonly Bill[];
  available?: number;
  autopayLabel?: string;
}) => (
  <ol className="cl-bills">
    {bills.map((bill, index) => {
      const covered =
        Boolean(bill.paid) || available === undefined || owedThrough(bills, index) <= available;

      return (
        <li
          className="cl-bill"
          data-paid={bill.paid || undefined}
          data-short={covered ? undefined : true}
          key={`${bill.name}-${bill.due.toISOString()}`}
        >
          <time className="cl-bill__date" dateTime={bill.due.toISOString().slice(0, 10)}>
            <span aria-hidden className="cl-bill__dow">
              {weekday.format(bill.due)}
            </span>
            <span aria-hidden className="cl-bill__day">
              {bill.due.getDate()}
            </span>
            <span className="cl-sr">{full.format(bill.due)}</span>
          </time>
          <span className="cl-row__text">
            <span className="cl-row__title">{bill.name}</span>
            <span className="cl-row__desc cl-bill__note">
              {bill.paid ? <Check aria-hidden size={12} strokeWidth={2.5} /> : null}
              {noteFor(bill, covered, autopayLabel)}
            </span>
          </span>
          <span className="cl-bill__amount">{formatAmount(bill.amount)}</span>
        </li>
      );
    })}
  </ol>
);
