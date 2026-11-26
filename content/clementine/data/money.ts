import type { Bill } from "../components/bill-schedule";

export const OWNER = { first: "Noor", name: "Noor Haddad" };

export const OPENING_BALANCE = 3182.47;

export const BILLS = [
  { amount: -38, due: new Date(2026, 10, 26), name: "Cobalt Mobile", pay: "autopay" },
  { amount: -725, due: new Date(2026, 10, 28), name: "Rent, Hollis Lane", pay: "manual" },
  { amount: -41.62, due: new Date(2026, 10, 30), name: "Riverside Water", pay: "manual" },
  { amount: -86.1, due: new Date(2026, 11, 1), name: "Hearth Energy", pay: "autopay" },
  { amount: -13.99, due: new Date(2026, 11, 4), name: "Loop Streaming", pay: "autopay" },
] as const satisfies readonly Bill[];

export type Flow = "in" | "out";

export interface Transaction {
  merchant: string;
  when: string;
  amount: number;
  kind: "food" | "transit" | "pay" | "shop" | "home" | "transfer";
}

export const TRANSACTIONS = [
  { amount: -6.75, kind: "food", merchant: "Bakehouse on Fifth", when: "Today, 8:12 am" },
  { amount: -2.9, kind: "transit", merchant: "Northline Transit", when: "Today, 7:58 am" },
  { amount: -64.38, kind: "shop", merchant: "Pinecone Grocers", when: "Yesterday" },
  { amount: 22.5, kind: "transfer", merchant: "Hana Sato", when: "Mon, Nov 23" },
  { amount: -18.4, kind: "home", merchant: "Ferro Hardware", when: "Sun, Nov 22" },
  { amount: 2640, kind: "pay", merchant: "Fennick Studio payroll", when: "Fri, Nov 13" },
] as const satisfies readonly Transaction[];

export const BAKERY_WEEKS = [8, 11, 7, 12, 14, 19, 22, 27] as const;
export const ENERGY_WEEKS = [31, 29, 33, 30, 24, 22, 21, 19] as const;
export const TRANSIT_WEEKS = [18, 21, 19, 24, 26, 25, 31, 34] as const;

export const PEOPLE = [
  {
    handle: "@amara.o",
    history: [
      { amount: -40, note: "Concert tickets", when: "Nov 14" },
      { amount: 15.5, note: "Taxi home", when: "Oct 30" },
    ],
    name: "Amara Okafor",
    recent: "You sent $40.00 on Nov 14",
  },
  {
    handle: "@teo",
    history: [
      { amount: 31, note: "Train to the cabin", when: "Oct 24" },
      { amount: -62, note: "Cabin deposit, half", when: "Oct 21" },
      { amount: -12, note: "Climbing day pass", when: "Oct 4" },
    ],
    name: "Teodor Varga",
    recent: "Asked you for $18.50 on Nov 9",
  },
  {
    handle: "@hanasato",
    history: [{ amount: 22.5, note: "Cinema tickets", when: "Monday" }],
    name: "Hana Sato",
    recent: "Sent you $22.50 on Monday",
  },
  { handle: "@lbrandt", history: [], name: "Lucas Brandt", recent: "No payments yet" },
] as const;

export const RECEIPTS = [
  { amount: -41.2, date: "Nov 2", merchant: "Marrow & Thyme", state: "matched" },
  {
    amount: -44.2,
    date: "Nov 6",
    merchant: "Ferro Hardware",
    note: "Paper shows $42.80",
    state: "review",
  },
  { amount: -129, date: "Nov 11", merchant: "Quill & Fold", state: "missing" },
  { amount: -16.4, date: "Nov 17", merchant: "Saltgrass Kitchen", state: "matched" },
  { amount: -58.75, date: "Nov 19", merchant: "Kiln Supply Co.", state: "missing" },
] as const;

export const PAYCHECK = { amount: 2640, from: "Fennick Studio", lands: "Friday, Nov 27" };

export const RENT = { amount: 725, leaves: "Leaves Saturday, Nov 28", name: "Rent, Hollis Lane" };

export const POTS = [
  {
    detail: "Water, energy, phone and streaming until Dec 11",
    id: "bills",
    name: "Bills",
    start: 180,
    tone: "quiet",
  },
  {
    detail: "$1,140.00 of $2,400.00 so far",
    id: "kyoto",
    name: "Kyoto in April",
    start: 300,
    tone: "accent",
  },
  { detail: "$6,420.15 so far", id: "rainy", name: "Rainy day", start: 150, tone: "line" },
] as const;

export const LAST_FORTNIGHT = 1046.2;
