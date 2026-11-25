import { ArrowLeft, Search } from "lucide-react";
import { useState } from "react";

import { Amount } from "../components/amount";
import { Avatar } from "../components/avatar";
import { Button } from "../components/button";
import { Figure } from "../components/figure";
import { Keypad } from "../components/keypad";
import { List, ListItem } from "../components/list";
import { RadioGroup } from "../components/radio";
import { OPENING_BALANCE, PEOPLE } from "../data/money";
import { formatAmount } from "../lib/format";

import "./app.css";

import "./send.css";

type Step = "amount" | "review" | "done";

type Speed = "standard" | "today";

interface Sent {
  amount: number;
  id: number;
  note: string;
  to: string;
}

const SPEEDS = [
  { description: "Lands Friday, Nov 27", label: "Standard", trailing: "Free", value: "standard" },
  {
    description: "Lands before 6:00 pm today",
    label: "Today",
    trailing: "$1.50",
    value: "today",
  },
] as const;

export const SendScreen = () => {
  const [query, setQuery] = useState("");
  const [to, setTo] = useState<string>(PEOPLE[1].name);
  const [typed, setTyped] = useState("18.5");
  const [step, setStep] = useState<Step>("amount");
  const [speed, setSpeed] = useState<Speed>("standard");
  const [undone, setUndone] = useState(false);
  const [sent, setSent] = useState<Sent[]>([]);
  const amount = Number(typed || "0");
  const fee = speed === "today" ? 1.5 : 0;
  const over = amount + fee > OPENING_BALANCE;
  const first = to.split(" ")[0] ?? to;
  const person = PEOPLE.find((item) => item.name === to) ?? PEOPLE[0];

  const people = PEOPLE.filter((item) =>
    `${item.name} ${item.handle}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const history = [
    ...sent
      .filter((row) => row.to === to)
      .map((row) => ({
        amount: row.amount,
        key: `sent-${String(row.id)}`,
        note: row.note,
        when: "Just now",
      })),
    ...person.history.map((row) => ({ ...row, key: `${row.note}-${row.when}` })),
  ];

  const restart = () => {
    setTyped("");
    setStep("amount");
    setUndone(false);
  };

  let reason = `Everyday has ${formatAmount(OPENING_BALANCE)}`;

  if (over) {
    reason = `That is more than the ${formatAmount(OPENING_BALANCE)} in Everyday`;
  } else if (amount === 0) {
    reason = "Tap in an amount to go on";
  }

  return (
    <div className="cl-app cl-send">
      <div className="cl-payees">
        <h4 className="cl-app__h">Send to</h4>
        <label className="cl-search">
          <Search aria-hidden size={16} strokeWidth={1.75} />
          <span className="cl-sr">Search people</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name or @handle"
            type="search"
            value={query}
          />
        </label>
        <List className="cl-flush" label="People">
          {people.map((item) => (
            <ListItem
              description={item.recent}
              key={item.name}
              leading={<Avatar name={item.name} />}
              onClick={() => {
                setTo(item.name);
                restart();
              }}
              selected={to === item.name}
              title={item.name}
            />
          ))}
        </List>
        {people.length === 0 ? (
          <p className="cl-app__lead">
            Nobody called {query} yet. Check the spelling, or search by their @handle.
          </p>
        ) : null}
        <section className="cl-app__section cl-between">
          <h4 className="cl-app__h">You and {first}</h4>
          {history.length > 0 ? (
            <ul aria-live="polite" className="cl-between__list">
              {history.map((row) => (
                <li key={row.key}>
                  <span className="cl-row__text">
                    <span className="cl-row__title">{row.note}</span>
                    <span className="cl-row__desc">{row.when}</span>
                  </span>
                  <span className={row.amount > 0 ? "cl-in" : undefined}>
                    {formatAmount(row.amount, { signed: true })}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="cl-app__lead">
              Nothing between you yet. The first payment shows here once it leaves.
            </p>
          )}
        </section>
      </div>
      <div className="cl-phone" data-step={step}>
        {step === "amount" ? (
          <>
            <div className="cl-phone__head">
              <Avatar name={to} size="sm" />
              <p>Send to {to}</p>
            </div>
            <Figure align="center" as="output" live value={amount} />
            <p className="cl-limit" data-over={over || undefined}>
              {reason}
            </p>
            <Keypad onValueChange={setTyped} value={typed} />
            <div className="cl-pay-row">
              <Button
                block
                disabled={amount === 0 || over}
                onClick={() => setStep("review")}
                size="lg"
              >
                Continue
              </Button>
            </div>
          </>
        ) : null}
        {step === "review" ? (
          <>
            <div className="cl-phone__head">
              <Button
                aria-label="Back to the amount"
                onClick={() => setStep("amount")}
                size="icon-sm"
                variant="ghost"
              >
                <ArrowLeft aria-hidden size={16} strokeWidth={1.75} />
              </Button>
              <p>Check before it goes</p>
            </div>
            <dl className="cl-review">
              <div>
                <dt>To</dt>
                <dd>{to}</dd>
              </div>
              <div>
                <dt>From</dt>
                <dd>Everyday</dd>
              </div>
              <div>
                <dt>Amount</dt>
                <dd>{formatAmount(amount)}</dd>
              </div>
            </dl>
            <RadioGroup label="How fast" onValueChange={setSpeed} options={SPEEDS} value={speed} />
            <div className="cl-pay-row">
              <Button
                block
                onClick={() => {
                  setSent((list) => [
                    {
                      amount: -amount,
                      id: list.length + 1,
                      note: speed === "today" ? "Sent, lands by 6:00 pm" : "Sent, lands Friday",
                      to,
                    },
                    ...list,
                  ]);
                  setStep("done");
                }}
                size="lg"
              >
                Send money
              </Button>
              <Amount available={OPENING_BALANCE} size="lg" value={-(amount + fee)} />
            </div>
          </>
        ) : null}
        {step === "done" ? (
          <div aria-live="polite" className="cl-done">
            <Avatar name={to} size="lg" />
            <p className="cl-done__title">
              {undone ? "Payment called back" : `${formatAmount(amount)} is on its way to ${first}`}
            </p>
            <p className="cl-done__text">
              {undone
                ? `It never left Everyday, and ${first} was not told.`
                : `${speed === "today" ? "Lands before 6:00 pm today" : "Lands Friday, Nov 27"}. You can call it back until 9:00 pm.`}
            </p>
            <div className="cl-done__actions">
              {undone ? null : (
                <Button
                  onClick={() => {
                    setUndone(true);
                    setSent((list) => list.slice(1));
                  }}
                  variant="outline"
                >
                  Undo
                </Button>
              )}
              <Button block onClick={restart}>
                Done
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
