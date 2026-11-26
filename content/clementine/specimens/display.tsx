import { Bell, CreditCard, Landmark, PiggyBank } from "lucide-react";
import { useState } from "react";

import { Amount } from "../components/amount";
import { Avatar } from "../components/avatar";
import { Badge } from "../components/badge";
import { Balance } from "../components/balance";
import { BillSchedule } from "../components/bill-schedule";
import { Figure } from "../components/figure";
import { List, ListIcon, ListItem } from "../components/list";
import { PayRing } from "../components/pay-ring";
import { Progress } from "../components/progress";
import { Slider } from "../components/slider";
import { Status } from "../components/status";
import type { StatusKind } from "../components/status";
import { Switch } from "../components/switch";
import { Table } from "../components/table";
import { useToast } from "../components/toast";
import { BILLS, PEOPLE } from "../data/money";
import { formatAmount } from "../lib/format";
import { Specimen } from "../shell";

import "./specimens.css";

interface StatementRow {
  amount: number;
  date: string;
  merchant: string;
  status: StatusKind;
}

const STATEMENT: readonly StatementRow[] = [
  { amount: -725, date: "Nov 1", merchant: "Rent, Hollis Lane", status: "paid" },
  { amount: -86.1, date: "Nov 3", merchant: "Hearth Energy", status: "paid" },
  { amount: -129, date: "Nov 11", merchant: "Quill & Fold", status: "refunded" },
  { amount: -38, date: "Nov 26", merchant: "Cobalt Mobile", status: "scheduled" },
  { amount: -212, date: "Today", merchant: "Velo Parts Co.", status: "pending" },
];

const STATEMENT_COLUMNS = [
  { header: "Payee", key: "payee", render: (row: StatementRow) => row.merchant },
  { header: "Date", key: "date", label: "Date", render: (row: StatementRow) => row.date },
  {
    header: "Status",
    key: "status",
    label: "Status",
    render: (row: StatementRow) => <Status status={row.status} />,
  },
  {
    header: "Amount",
    key: "amount",
    label: "Amount",
    numeric: true,
    render: (row: StatementRow) => formatAmount(row.amount),
  },
];

export const DisplaySpecimens = () => {
  const toast = useToast();
  const [available, setAvailable] = useState(140);
  const [saved, setSaved] = useState(1140);
  const [notify, setNotify] = useState(true);
  const [balance, setBalance] = useState(3182.47);
  const [low, setLow] = useState(18.4);
  const [defaultBank, setDefaultBank] = useState(false);
  const [cardLocked, setCardLocked] = useState(true);
  const [goal, setGoal] = useState(300);

  const topUp = (amount: number, apply: (change: number) => void) => {
    apply(amount);
    toast.show({
      action: { label: "Undo", onClick: () => apply(-amount) },
      title: `Added ${formatAmount(amount)} to Everyday`,
    });
  };

  return (
    <>
      <Specimen
        name="Figure"
        note="The display amount. Dollars at full size, cents lifted to half size beside them, so the number reads first and the cents stay honest."
      >
        <div className="cl-spec-col">
          <Figure value={3182.47} />
          <Figure size="large" value={-212} />
        </div>
      </Specimen>
      <Specimen
        name="Amount"
        note="A sum in a pill. Tell it what is available and it picks a tone: ochre when under a fifth would be left, red when it would not clear."
      >
        <div className="cl-spec-col">
          <div className="cl-spec-row">
            <Amount available={available} value={-86.1} />
            <Amount available={available} value={-118.4} />
            <Amount available={available} value={-212} />
            <Amount signed tone="accent" value={22.5} />
            <Amount approximate compact value={40} />
          </div>
          <Slider
            format={(value) => formatAmount(value)}
            label="Available in Everyday"
            max={300}
            min={0}
            onValueChange={setAvailable}
            step={5}
            value={available}
          />
        </div>
      </Specimen>
      <Specimen
        name="Balance"
        note="The only chip with the zest ring. Pressing it tops up Everyday; when money runs low it turns flat ochre and adds the word left."
      >
        <div className="cl-spec-col">
          <div className="cl-balance-demo">
            <span>Hi, Noor</span>
            <Balance
              onClick={() => topUp(50, (change) => setBalance((value) => value + change))}
              value={balance}
            />
          </div>
          <div className="cl-balance-demo">
            <span>Hi, Noor</span>
            <Balance
              low={low < 100}
              onClick={() => topUp(50, (change) => setLow((value) => value + change))}
              value={low}
            />
          </div>
        </div>
      </Specimen>
      <Specimen
        name="Pay ring"
        note="A paycheck cut into one segment per pot, butted with a hairline gap. Only the goal is orange; what stays free to spend is hatched, and its total sits in the middle."
      >
        <div className="cl-spec-col">
          <PayRing
            centerLabel="left to spend"
            centerValue={2640 - 725 - 180 - goal}
            parts={[
              { amount: 725, name: "Rent", tone: "ink" },
              { amount: 180, name: "Bills", tone: "quiet" },
              { amount: goal, name: "Kyoto", tone: "accent" },
              { amount: 2640 - 725 - 180 - goal, name: "Spending", tone: "open" },
            ]}
            total={2640}
          />
          <Slider
            format={(value) => formatAmount(value)}
            label="Into Kyoto in April"
            max={900}
            min={0}
            onValueChange={setGoal}
            step={25}
            value={goal}
          />
        </div>
      </Specimen>
      <Specimen
        name="Bill schedule"
        note="The bills between now and payday, soonest first, each saying who pays it. One the balance cannot reach says so in red."
      >
        <BillSchedule available={800} bills={BILLS} />
      </Specimen>
      <Specimen
        name="List"
        note="Grouped rows for settings, a flat feed for activity. Each row does one thing when pressed, and the row says what changed."
      >
        <List label="Accounts and alerts" variant="grouped">
          <ListItem
            description={
              defaultBank ? "··4471, used first for Add money" : "··4471, Harbor Credit Union"
            }
            leading={<ListIcon icon={Landmark} />}
            onClick={() => setDefaultBank(!defaultBank)}
            selected={defaultBank}
            title="Linked bank"
            trailing={defaultBank ? <Badge tone="accent">Default</Badge> : null}
          />
          <ListItem
            description={cardLocked ? "Locked. Press to unlock" : "Working. Press to lock"}
            leading={<ListIcon icon={CreditCard} />}
            onClick={() => setCardLocked(!cardLocked)}
            title="Card ··2208"
            trailing={
              cardLocked ? <Badge tone="warn">Locked</Badge> : <Badge tone="success">On</Badge>
            }
          />
          <ListItem
            description="$1,140.00 of $2,400.00"
            leading={<ListIcon icon={PiggyBank} tone="accent" />}
            title="Kyoto in April"
            trailing={formatAmount(1140)}
          />
          <ListItem
            description="The evening before a bill leaves"
            leading={<ListIcon icon={Bell} />}
            title="Bill reminders"
            trailing={
              <Switch
                checked={notify}
                hideLabel
                label="Bill reminders"
                onCheckedChange={setNotify}
              />
            }
          />
        </List>
      </Specimen>
      <Specimen
        name="Table"
        note="For a long history on a wide screen. Figures sit right-aligned and tabular. Below 600px each row stacks into label and value, so nothing scrolls sideways."
        wide
      >
        <Table
          caption="November statement"
          columns={STATEMENT_COLUMNS}
          rowKey={(row) => row.merchant}
          rows={STATEMENT}
        />
      </Specimen>
      <Specimen
        name="Progress"
        note="A goal fills with orange. A finished one turns green and says done in words."
      >
        <div className="cl-spec-col">
          <Progress
            detail={`${formatAmount(saved)} of $2,400.00`}
            label="Kyoto in April"
            max={2400}
            value={saved}
          />
          <Progress
            detail="Done, $500.00 of $500.00"
            label="Winter coat"
            max={500}
            tone="success"
            value={500}
          />
          <div className="cl-spec-row">
            <button
              className="cl-link"
              onClick={() => setSaved((value) => Math.min(2400, value + 120))}
              type="button"
            >
              Add $120.00
            </button>
            <button className="cl-link" onClick={() => setSaved(1140)} type="button">
              Start over
            </button>
          </div>
        </div>
      </Specimen>
      <Specimen
        name="Badge, status and avatar"
        note="A badge states a fixed fact. A status is a dot plus a word for something in motion. An avatar is two initials on warm paper."
      >
        <div className="cl-spec-col">
          <div className="cl-spec-row">
            <Badge>Joint</Badge>
            <Badge tone="accent">Default</Badge>
            <Badge tone="success">Paired</Badge>
            <Badge tone="warn">Locked</Badge>
            <Badge tone="danger">Short</Badge>
            <Badge tone="outline">New</Badge>
          </div>
          <div className="cl-spec-row">
            <Status status="paid" />
            <Status status="scheduled" />
            <Status status="pending" />
            <Status status="failed" />
          </div>
          <div className="cl-spec-row">
            {PEOPLE.map((person) => (
              <Avatar key={person.name} name={person.name} />
            ))}
            <span className="cl-note">Amara, Teodor, Hana and Lucas</span>
          </div>
        </div>
      </Specimen>
    </>
  );
};
