import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Bus,
  Check,
  ChevronRight,
  CircleAlert,
  Coffee,
  Copy,
  Delete,
  Lock,
  Pencil,
  PiggyBank,
  Plus,
  Receipt,
  Search,
  ShoppingBag,
  ShoppingBasket,
  TriangleAlert,
  Undo2,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Block } from "../shell";

import "./icons.css";

const SET = [
  ["Account", Wallet],
  ["Savings goal", PiggyBank],
  ["Receipt", Receipt],
  ["Send", ArrowUpRight],
  ["Request", ArrowDownLeft],
  ["Add", Plus],
  ["Done", Check],
  ["Close", X],
  ["Opens more", ChevronRight],
  ["Search", Search],
  ["Notices", Bell],
  ["Lock card", Lock],
  ["Edit", Pencil],
  ["Copy", Copy],
  ["Undo", Undo2],
  ["Upload", Upload],
  ["Delete a digit", Delete],
  ["Food and drink", Coffee],
  ["Transit", Bus],
  ["Shopping", ShoppingBag],
  ["Groceries", ShoppingBasket],
  ["Notice", CircleAlert],
  ["Check this", TriangleAlert],
] as const satisfies readonly (readonly [string, LucideIcon])[];

const SIZES = [
  { px: 12, use: "Beside a status word" },
  { px: 16, use: "Next to a button's words" },
  { px: 20, use: "Alone in an icon button, in a row mark" },
  { px: 24, use: "Above an empty state" },
  { px: 32, use: "The rare hero mark" },
] as const;

export const IconFoundation = () => (
  <Block
    id="iconography"
    lead="Lucide outlines at 1.75 stroke, 2 at the small sizes, always the color of the words next to them. An icon earns its place by naming a kind of thing or an action; it never decorates a heading."
    title="Iconography"
  >
    <ul className="cl-icon-sizes">
      {SIZES.map((size) => (
        <li key={size.px}>
          <span className="cl-icon-sizes__stage">
            <Wallet aria-hidden size={size.px} strokeWidth={size.px <= 16 ? 2 : 1.75} />
          </span>
          <span className="cl-mono">{size.px}</span>
          <span className="cl-note">{size.use}</span>
        </li>
      ))}
    </ul>
    <ul className="cl-icon-set">
      {SET.map(([name, Icon]) => (
        <li key={name}>
          <Icon aria-hidden size={20} strokeWidth={1.75} />
          <span>{name}</span>
        </li>
      ))}
    </ul>
  </Block>
);
