import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Bell,
  Bus,
  Coffee,
  Hammer,
  Plus,
  ShoppingBasket,
  UserRound,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";

import { Avatar } from "../components/avatar";
import { BillSchedule } from "../components/bill-schedule";
import { Button } from "../components/button";
import { Chip } from "../components/chip";
import { Dialog } from "../components/dialog";
import { Input } from "../components/field";
import { Figure } from "../components/figure";
import { Insight } from "../components/insight";
import { Keypad } from "../components/keypad";
import { List, ListIcon, ListItem } from "../components/list";
import { Popover } from "../components/popover";
import type { TriggerProps } from "../components/popover";
import { Progress } from "../components/progress";
import { Segmented } from "../components/segmented";
import { Select } from "../components/select";
import { useToast } from "../components/toast";
import { BAKERY_WEEKS, BILLS, OPENING_BALANCE, OWNER, PEOPLE, TRANSACTIONS } from "../data/money";
import type { Transaction } from "../data/money";
import { formatAmount } from "../lib/format";
import { jumpTo } from "../lib/jump";

import "./app.css";

import "./home.css";

const KIND_ICON = {
  food: Coffee,
  home: Hammer,
  pay: Wallet,
  shop: ShoppingBasket,
  transfer: UserRound,
  transit: Bus,
} as const satisfies Record<Transaction["kind"], LucideIcon>;

const FILTERS = ["All", "Money in", "Money out"] as const;
const PRESETS = ["25", "50", "100"] as const;
const FRIENDS = PEOPLE.map((person) => ({ label: person.name, value: person.name }));

const NOTICES = [
  { text: "Cobalt Mobile takes $38.00 tomorrow from Everyday.", when: "2 hours ago" },
  { text: "Hana Sato sent you $22.50 for the cinema tickets.", when: "Monday" },
] as const;

const renderBell = (props: TriggerProps) => (
  <Button aria-label="Notifications, 2 new" size="icon" variant="ghost" {...props}>
    <Bell aria-hidden size={20} strokeWidth={1.75} />
  </Button>
);

const QuickAction = ({
  label,
  icon: Icon,
  glow = false,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  glow?: boolean;
  onClick: () => void;
}) => (
  <div className="cl-quick">
    <Button
      aria-label={label}
      onClick={onClick}
      size="icon-lg"
      variant={glow ? "primary" : "secondary"}
    >
      <Icon aria-hidden size={20} strokeWidth={1.75} />
    </Button>
    <span aria-hidden>{label}</span>
  </div>
);

export const HomeScreen = () => {
  const toast = useToast();
  const [balance, setBalance] = useState(OPENING_BALANCE);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [topUp, setTopUp] = useState(false);
  const [typed, setTyped] = useState("");
  const [notices, setNotices] = useState(false);
  const [asking, setAsking] = useState(false);
  const [from, setFrom] = useState<string>(PEOPLE[2].name);
  const [ask, setAsk] = useState("12.00");
  const [capped, setCapped] = useState(false);
  const amount = Number(typed || "0");
  const askAmount = Number(ask || "0");

  const rows = TRANSACTIONS.filter((row) => {
    if (filter === "Money in") {
      return row.amount > 0;
    }

    if (filter === "Money out") {
      return row.amount < 0;
    }

    return true;
  });

  const add = () => {
    setBalance((value) => value + amount);
    setTopUp(false);
    setTyped("");
    toast.show({
      action: {
        label: "Undo",
        onClick: () => {
          setBalance((value) => value - amount);
          toast.show({ title: `Took back ${formatAmount(amount)}` });
        },
      },
      description: "From Harbor Credit Union ··4471",
      title: `Added ${formatAmount(amount)} to Everyday`,
    });
  };

  const request = () => {
    setAsking(false);
    toast.show({
      action: {
        label: "Undo",
        onClick: () => toast.show({ title: `Cancelled the request to ${from}` }),
      },
      description: "They get a link to pay from any bank",
      title: `Asked ${from} for ${formatAmount(askAmount)}`,
    });
  };

  return (
    <div className="cl-app">
      <header className="cl-app__bar">
        <p className="cl-app__hello">Good evening, {OWNER.first}</p>
        <div className="cl-app__bar-end">
          <Popover
            align="end"
            onOpenChange={setNotices}
            open={notices}
            title="Notifications"
            trigger={renderBell}
          >
            <ul className="cl-notices">
              {NOTICES.map((notice) => (
                <li key={notice.text}>
                  <p>{notice.text}</p>
                  <span>{notice.when}</span>
                </li>
              ))}
            </ul>
          </Popover>
          <Avatar name={OWNER.name} size="sm" />
        </div>
      </header>
      <div className="cl-home">
        <div className="cl-home__main">
          <div className="cl-home__figure">
            <p className="cl-home__account">Everyday, available</p>
            <Figure live value={balance} />
            <p className="cl-home__sentence">
              November so far: $1,204.18 out of a $2,250.00 plan. Payday is Friday.
            </p>
          </div>
          <div className="cl-quicks">
            <QuickAction glow icon={Plus} label="Add money" onClick={() => setTopUp(true)} />
            <QuickAction
              icon={ArrowUpRight}
              label="Send"
              onClick={() => jumpTo("screen-send", "input[type=search]")}
            />
            <QuickAction icon={ArrowDownLeft} label="Request" onClick={() => setAsking(true)} />
            <QuickAction
              icon={ArrowLeftRight}
              label="Move"
              onClick={() => jumpTo("screen-payday", ".cl-stepper button:not(:disabled)")}
            />
          </div>
          <Progress
            detail="$1,140.00 of $2,400.00"
            label="Kyoto in April"
            max={2400}
            value={1140}
          />
          <section className="cl-app__section">
            <h4 className="cl-app__h">Before payday</h4>
            <BillSchedule available={balance} bills={BILLS} />
          </section>
        </div>
        <div className="cl-home__side">
          <section className="cl-app__section">
            <div className="cl-app__h-row">
              <h4 className="cl-app__h">Activity</h4>
              <Segmented label="Show" onValueChange={setFilter} options={FILTERS} value={filter} />
            </div>
            <List className="cl-flush" label="Recent activity">
              {rows.map((row) => (
                <ListItem
                  description={row.when}
                  key={row.merchant}
                  leading={
                    <ListIcon
                      icon={KIND_ICON[row.kind]}
                      tone={row.amount > 0 ? "success" : "neutral"}
                    />
                  }
                  title={row.merchant}
                  trailing={
                    <span className={row.amount > 0 ? "cl-in" : undefined}>
                      {formatAmount(row.amount, { signed: true })}
                    </span>
                  }
                />
              ))}
            </List>
          </section>
          <section className="cl-app__section">
            <h4 className="cl-app__h">Worth a look</h4>
            <Insight
              action={capped ? undefined : "Cap it at $60.00 a month"}
              basis="visits since Nov 1, five in October"
              figure="11"
              onAction={() => {
                setCapped(true);
                toast.show({
                  action: { label: "Undo", onClick: () => setCapped(false) },
                  title: "Bakery cap set at $60.00 a month",
                });
              }}
              points={BAKERY_WEEKS}
              status={capped ? "Capped at $60.00 a month. We will tell you at $45.00." : undefined}
              title="Bakehouse on Fifth, again"
            />
          </section>
        </div>
      </div>
      <Dialog
        description="Lands in Everyday straight away, from Harbor Credit Union ··4471."
        footer={
          <Button block disabled={amount === 0 || amount > 5000} onClick={add} size="lg">
            Add to Everyday
          </Button>
        }
        kind="sheet"
        onOpenChange={setTopUp}
        open={topUp}
        title="Add money"
      >
        <Figure align="center" as="output" live value={amount} />
        <p className="cl-limit" data-over={amount > 5000 || undefined}>
          {amount > 5000 ? "Over the $5,000.00 you can add in a day" : "Up to $5,000.00 a day"}
        </p>
        <div className="cl-presets">
          {PRESETS.map((preset) => (
            <Chip
              key={preset}
              onSelectedChange={() => setTyped(preset)}
              selected={typed === preset}
            >
              {formatAmount(Number(preset), { compact: true })}
            </Chip>
          ))}
        </div>
        <Keypad onValueChange={setTyped} value={typed} />
      </Dialog>
      <Dialog
        description="They get a link and can pay from any bank. Nothing moves until they do."
        footer={
          <>
            <Button onClick={() => setAsking(false)} variant="ghost">
              Cancel
            </Button>
            <Button disabled={askAmount <= 0} onClick={request}>
              Send request
            </Button>
          </>
        }
        onOpenChange={setAsking}
        open={asking}
        title="Request money"
      >
        <Select label="From" onValueChange={setFrom} options={FRIENDS} value={from} />
        <Input
          inputMode="decimal"
          label="Amount"
          onChange={(event) => setAsk(event.target.value.replaceAll(/[^0-9.]/gu, ""))}
          prefix="$"
          value={ask}
        />
      </Dialog>
    </div>
  );
};
