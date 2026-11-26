import { ArrowLeftRight, House, Receipt, MessageCircle, Wallet } from "lucide-react";
import { useState } from "react";

import { AccordionItem } from "../components/accordion";
import { TabBar } from "../components/tab-bar";
import type { TabBarItem } from "../components/tab-bar";
import { Tabs } from "../components/tabs";
import { formatAmount } from "../lib/format";
import { Specimen } from "../shell";

import "./specimens.css";

const TABS = [
  { label: "Spending", value: "spending" },
  { label: "Income", value: "income" },
  { label: "Bills", value: "bills" },
] as const;

const PANELS = {
  bills: "Five bills before Dec 4, $904.71 together. Three pay themselves.",
  income: "Two paychecks from Fennick Studio, $5,280.00 together, and $22.50 from Hana.",
  spending:
    "$1,204.18 out so far, mostly rent and groceries. Eating out is $38.20 lower than October.",
} as const;

const NAV = [
  { icon: House, label: "Home" },
  { icon: ArrowLeftRight, label: "Pay" },
  { icon: MessageCircle, label: "Ask" },
  { icon: Receipt, label: "Receipts" },
  { icon: Wallet, label: "Accounts" },
] as const satisfies readonly TabBarItem[];

const PLACES = new Map([
  ["Accounts", "Accounts: Everyday, Kyoto in April and Rainy day."],
  ["Ask", "Ask: a chat with Clementine about your money."],
  ["Home", "Home: the balance, bills before payday and recent activity."],
  ["Pay", "Pay: send, request and split with friends."],
  ["Receipts", "Receipts: 3 of 5 November receipts paired."],
]);

const FAQ = [
  {
    answer:
      "Only bills on the list you gave it, and only under the amount you set. Anything else waits for you to say yes.",
    title: "What can the assistant pay on its own?",
  },
  {
    answer: `Up to ${formatAmount(5000)} a day from a linked bank, and ${formatAmount(2500)} a day to other people.`,
    title: "How much can I move in a day?",
  },
  {
    answer:
      "Until 9:00 pm the day you send it. After that, the money has left and only the person can send it back.",
    title: "How long can I undo a payment?",
  },
] as const;

export const NavigationSpecimens = () => {
  const [tab, setTab] = useState<(typeof TABS)[number]["value"]>("spending");
  const [nav, setNav] = useState("Home");
  const [open, setOpen] = useState<string | null>(FAQ[0].title);

  return (
    <>
      <Specimen
        name="Tabs"
        note="An ink line slides under the chosen tab. Arrow keys move between them, Home and End jump to the ends."
      >
        <Tabs
          label="November"
          onValueChange={setTab}
          tabs={TABS.map((item) => ({
            ...item,
            panel: <p className="cl-pop-text">{PANELS[item.value]}</p>,
          }))}
          value={tab}
        />
      </Specimen>
      <Specimen
        name="Tab bar"
        note="The phone's main way around: five places at most, an icon over one short word, the current place in ink on a paper step. This page's own dock is one too."
      >
        <div className="cl-tabbar-demo">
          <p aria-live="polite" className="cl-note">
            {PLACES.get(nav)}
          </p>
          <TabBar current={nav} items={NAV} label="Main" onSelect={setNav} />
        </div>
      </Specimen>
      <Specimen
        name="Accordion"
        note="For answers people look up once. Only the height moves, on the base duration."
      >
        <div>
          {FAQ.map((item) => (
            <AccordionItem
              key={item.title}
              onOpenChange={(next) => {
                setOpen(next ? item.title : null);
              }}
              open={open === item.title}
              title={item.title}
            >
              <p>{item.answer}</p>
            </AccordionItem>
          ))}
        </div>
      </Specimen>
    </>
  );
};
