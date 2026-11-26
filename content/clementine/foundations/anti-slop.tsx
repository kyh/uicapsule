import { Check, PiggyBank, X } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

import { Button } from "../components/button";
import { Figure } from "../components/figure";
import { Status } from "../components/status";
import { Block } from "../shell";

import "./anti-slop.css";

const Pair = ({
  rule,
  why,
  wrong,
  right,
}: {
  rule: string;
  why: string;
  wrong: ReactNode;
  right: ReactNode;
}) => (
  <li className="cl-slop">
    <div className="cl-slop__text">
      <h4 className="cl-h4">{rule}</h4>
      <p className="cl-note">{why}</p>
    </div>
    <div className="cl-slop__pair">
      <div className="cl-slop__side" data-kind="wrong">
        <span className="cl-slop__verdict">
          <X aria-hidden size={14} strokeWidth={2.5} />
          Don&apos;t
        </span>
        <div className="cl-slop__stage">{wrong}</div>
      </div>
      <div className="cl-slop__side" data-kind="right">
        <span className="cl-slop__verdict">
          <Check aria-hidden size={14} strokeWidth={2.5} />
          Do
        </span>
        <div className="cl-slop__stage">{right}</div>
      </div>
    </div>
  </li>
);

const PendingDemo = () => {
  const [busy, setBusy] = useState(false);

  return (
    <Button
      onClick={() => {
        setBusy(true);
        window.setTimeout(() => {
          setBusy(false);
        }, 1400);
      }}
      pending={busy}
      size="sm"
    >
      Send money
    </Button>
  );
};

export const AntiSlopFoundation = () => (
  <Block
    id="anti-slop"
    lead="Shortcuts that make a money app look machine-made, each set beside the Clementine way. Both halves are live components from this page, not pictures."
    title="Anti-slop"
  >
    <ul className="cl-slops">
      <Pair
        right={<p className="cl-slop-h">Bills</p>}
        rule="Headings stand alone"
        why="A tiny tag stacked over a heading says the same thing twice, the second time quieter."
        wrong={
          <div>
            <p className="cl-slop-eyebrow">SECTION 02</p>
            <p className="cl-slop-h">Bills</p>
          </div>
        }
      />
      <Pair
        right={
          <div>
            <Figure size="large" value={3182.47} />
            <p className="cl-slop-sent">That is after rent. Payday is Friday.</p>
          </div>
        }
        rule="Lead with the one number"
        why="Three boxed totals all ask to be read first. One figure and a plain sentence tell Noor where she stands."
        wrong={
          <div className="cl-slop-stats">
            <span>
              Bills<b>$905</b>
            </span>
            <span>
              Food<b>$318</b>
            </span>
            <span>
              Fun<b>$142</b>
            </span>
          </div>
        }
      />
      <Pair
        right={
          <div className="cl-slop-row">
            <Button size="sm">Pay rent</Button>
            <Button size="sm" variant="outline">
              Snooze
            </Button>
          </div>
        }
        rule="One zest ring per view"
        why="The ring means this is next. Put it on two buttons and neither one means it."
        wrong={
          <div className="cl-slop-row">
            <Button size="sm">Pay rent</Button>
            <Button size="sm">Snooze</Button>
          </div>
        }
      />
      <Pair
        right={<span className="cl-slop-chip">Pay now</span>}
        rule="Dark ink on the orange"
        why="White letters on clementine sit near 2.3:1 and blur at arm's length. Ink sits near 8:1."
        wrong={<span className="cl-slop-chip cl-slop-chip--white">Pay now</span>}
      />
      <Pair
        right={
          <div className="cl-slop-list">
            <span data-chosen>Dining</span>
            <span>Groceries</span>
          </div>
        }
        rule="Choose with a wash"
        why="An orange stripe down one edge looks like a warning with no message. A pale wash only says chosen."
        wrong={
          <div className="cl-slop-list">
            <span data-rail>Dining</span>
            <span>Groceries</span>
          </div>
        }
      />
      <Pair
        right={<p className="cl-slop-h">Rainy day</p>}
        rule="Icons belong to rows"
        why="An icon parked in a tinted square beside a heading is ornament. Round marks live in list rows, where they name the kind of payment."
        wrong={
          <p className="cl-slop-h cl-slop-tiled">
            <span aria-hidden>
              <PiggyBank size={16} strokeWidth={1.75} />
            </span>
            Rainy day
          </p>
        }
      />
      <Pair
        right={<p className="cl-slop-sent">You can send up to $2,500.00 a day to other people.</p>}
        rule="Limits at reading size"
        why="A limit printed in tiny gray type feels hidden. Any sentence with a number in it is 14px in fg or fg-2."
        wrong={<p className="cl-slop-tiny">You can send up to $2,500.00 a day to other people.</p>}
      />
      <Pair
        right={
          <p className="cl-slop-sent">
            Your plan moves $1,405.00 on Friday at 6:00 am. You can change it until Thursday night.
          </p>
        }
        rule="Say what happens, and when"
        why="Words like smarter and stress-free promise a mood. Someone planning a paycheck wants the amount and the hour."
        wrong={
          <p className="cl-slop-sent">Smarter money, zero stress. Your plan is ready to go!</p>
        }
      />
      <Pair
        right={<PendingDemo />}
        rule="Spin in place, keep the words"
        why="When a label turns into Processing the button jumps width and a screen reader hears a new name. The spinner sits over the same words."
        wrong={
          <span className="cl-btn" data-size="sm" data-variant="primary">
            <span className="cl-btn__body">Processing...</span>
          </span>
        }
      />
      <Pair
        right={<Status label="With the bank" status="pending" />}
        rule="Plain case for status"
        why="Capitals read as an alarm. A dot and an everyday word say the same thing calmly."
        wrong={<span className="cl-slop-caps">PROCESSING</span>}
      />
      <Pair
        right={<Figure size="large" value={3182.47} />}
        rule="Cents lifted, not cut"
        why="Rounding a balance to $3.2k hides money someone may need. Clementine keeps the cents and lifts them, so the dollars still read first."
        wrong={<p className="cl-slop-fig">$3.2k</p>}
      />
    </ul>
  </Block>
);
