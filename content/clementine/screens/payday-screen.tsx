import { useEffect, useState } from "react";

import { Badge } from "../components/badge";
import { Button } from "../components/button";
import { PayRing } from "../components/pay-ring";
import type { RingPart } from "../components/pay-ring";
import { Status } from "../components/status";
import { Stepper } from "../components/stepper";
import { Switch } from "../components/switch";
import { LAST_FORTNIGHT, PAYCHECK, POTS, RENT } from "../data/money";
import { formatAmount } from "../lib/format";

import "./app.css";

import "./payday.css";

const noop = () => null;

type PotId = (typeof POTS)[number]["id"];

type Stage = "editing" | "saving" | "saved";

const START = Object.fromEntries(POTS.map((pot) => [pot.id, pot.start])) as Record<PotId, number>;

export const PaydayScreen = () => {
  const [amounts, setAmounts] = useState(START);
  const [roundUps, setRoundUps] = useState(true);
  const [stage, setStage] = useState<Stage>("editing");
  const [undone, setUndone] = useState(false);
  const planned = RENT.amount + POTS.reduce((sum, pot) => sum + amounts[pot.id], 0);
  const spending = PAYCHECK.amount - planned;
  const tight = spending < LAST_FORTNIGHT;

  useEffect(() => {
    if (stage !== "saving") {
      return noop;
    }

    const done = window.setTimeout(() => {
      setStage("saved");
    }, 900);

    return () => {
      window.clearTimeout(done);
    };
  }, [stage]);

  const parts: RingPart[] = [
    { amount: RENT.amount, name: RENT.name, tone: "ink" },
    ...POTS.map((pot) => ({ amount: amounts[pot.id], name: pot.name, tone: pot.tone })),
    { amount: spending, name: "Spending", tone: "open" },
  ];

  const change = (id: PotId, value: number) => {
    setAmounts((current) => ({ ...current, [id]: value }));
    setUndone(false);

    if (stage === "saved") {
      setStage("editing");
    }
  };

  let note = `Leaves ${formatAmount(spending)} for two weeks, about what you spent last time.`;

  if (tight) {
    note = `Leaves ${formatAmount(spending)} for two weeks. Last time you spent ${formatAmount(LAST_FORTNIGHT)}.`;
  }

  return (
    <div className="cl-app">
      <header className="cl-app__bar">
        <p className="cl-app__hello">Payday plan</p>
        <Status label={`${PAYCHECK.lands}, 6:00 am`} status="scheduled" />
      </header>
      <div className="cl-payday">
        <div className="cl-payday__ring">
          <PayRing
            centerLabel="to spend until Dec 11"
            centerValue={spending}
            parts={parts}
            total={PAYCHECK.amount}
          />
          <p className="cl-app__lead">
            {formatAmount(PAYCHECK.amount)} from {PAYCHECK.from} lands {PAYCHECK.lands}. The plan
            runs at 6:00 am, a day before rent leaves.
          </p>
        </div>
        <div className="cl-payday__plan">
          <h4 className="cl-app__h">Where it goes</h4>
          <ul className="cl-pots">
            <li className="cl-pot">
              <span aria-hidden className="cl-pot__dot" data-tone="ink" />
              <span className="cl-pot__text">
                <span className="cl-row__title">{RENT.name}</span>
                <span className="cl-row__desc">{RENT.leaves}</span>
              </span>
              <Badge>Fixed</Badge>
              <span className="cl-pot__fixed">{formatAmount(RENT.amount)}</span>
            </li>
            {POTS.map((pot) => (
              <li className="cl-pot" key={pot.id}>
                <span aria-hidden className="cl-pot__dot" data-tone={pot.tone} />
                <span className="cl-pot__text">
                  <span className="cl-row__title">{pot.name}</span>
                  <span className="cl-row__desc">{pot.detail}</span>
                </span>
                <Stepper
                  label={pot.name}
                  max={amounts[pot.id] + spending - 100}
                  onValueChange={(value) => {
                    change(pot.id, value);
                  }}
                  value={amounts[pot.id]}
                />
              </li>
            ))}
            <li className="cl-pot">
              <span aria-hidden className="cl-pot__dot" data-tone="open" />
              <span className="cl-pot__text">
                <span className="cl-row__title">Spending</span>
                <span className="cl-row__desc">Stays in Everyday</span>
              </span>
              <span className="cl-pot__fixed">{formatAmount(spending)}</span>
            </li>
          </ul>
          <Switch
            checked={roundUps}
            description="Card payments round up to the next dollar, about $26.00 a month"
            label="Round-ups to Kyoto in April"
            onCheckedChange={(next) => {
              setRoundUps(next);

              if (stage === "saved") {
                setStage("editing");
              }
            }}
          />
          <p aria-live="polite" className="cl-app__lead" data-tone={tight ? "warn" : undefined}>
            {stage === "saved" && !undone
              ? `Saved. On ${PAYCHECK.lands} at 6:00 am, ${formatAmount(planned)} moves into ${String(POTS.length + 1)} pots and ${formatAmount(spending)} stays in Everyday.`
              : note}
            {undone ? " The plan is off; your pay will land in Everyday untouched." : ""}
          </p>
          <div className="cl-pay-row">
            {stage === "saved" && !undone ? (
              <>
                <Button
                  onClick={() => {
                    setUndone(true);
                  }}
                  variant="outline"
                >
                  Undo
                </Button>
                <Button
                  block
                  onClick={() => {
                    setStage("editing");
                  }}
                >
                  Done
                </Button>
              </>
            ) : (
              <Button
                block
                onClick={() => {
                  setUndone(false);
                  setStage("saving");
                }}
                pending={stage === "saving"}
                size="lg"
              >
                Save plan for Friday
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
