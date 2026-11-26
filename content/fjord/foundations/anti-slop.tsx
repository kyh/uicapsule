import type { ReactNode } from "react";

import { Badge, CodeTag } from "../components/badge";
import { Button } from "../components/button";
import { Status } from "../components/status";
import { Foundation } from "./section";

interface Pair {
  id: string;
  rule: string;
  avoid: ReactNode;
  instead: ReactNode;
}

const PAIRS: Pair[] = [
  {
    avoid: (
      <span className="fj-bad-sparkle">
        <span aria-hidden>✦</span> AI suggestion
      </span>
    ),
    id: "name-the-agent",
    instead: (
      <span className="fj-hstack" data-gap="8">
        <Badge kind="agent">patchwright</Badge>
        <span>suggests a fix</span>
      </span>
    ),
    rule: "Say which agent did it. A sparkle tells a reviewer nothing about whose work to check or whose model to blame.",
  },
  {
    avoid: <span className="fj-bad-emoji">✅ Checks passed 🚀</span>,
    id: "status-without-emoji",
    instead: <Status status="ok">Checks passed</Status>,
    rule: "An emoji renders differently on every platform and is read out by name. A status word looks and sounds the same everywhere.",
  },
  {
    avoid: <span className="fj-bad-gradient">Merge #2817</span>,
    id: "primary-is-flat-ink",
    instead: (
      <Button size="sm" variant="primary">
        Merge #2817
      </Button>
    ),
    rule: "The primary is flat ink with a bevel at the top. A gradient makes it a banner, and a second gradient makes two.",
  },
  {
    avoid: <span className="fj-input fj-bad-glow">agent/coupon-race</span>,
    id: "focus-without-glow",
    instead: <span className="fj-input fj-demo-focus">agent/coupon-race</span>,
    rule: "A field with the cursor takes the ink edge and a 3px glacier halo. A wide colored glow bleeds into the field next to it.",
  },
  {
    avoid: (
      <Button disabled size="sm">
        Sign and swap
      </Button>
    ),
    id: "disabled-says-why",
    instead: (
      <span className="fj-hstack" data-gap="8" data-wrap="">
        <Button disabled size="sm">
          Sign and swap
        </Button>
        <span className="fj-t-body-sm fj-c-2">Tick the box first</span>
      </span>
    ),
    rule: "Next to every greyed button goes the one thing that turns it on. Otherwise people click it again and again.",
  },
  {
    avoid: (
      <span className="fj-bad-confirm">
        <span>Archive agent/labels-sync?</span>
        <span className="fj-bad-confirm-keys">
          <span>Cancel</span>
          <span>OK</span>
        </span>
      </span>
    ),
    id: "undo-over-confirm",
    instead: (
      <span className="fj-hstack" data-gap="12" data-wrap="">
        <span>agent/labels-sync archived</span>
        <Button size="xs" variant="ghost">
          Undo
        </Button>
      </span>
    ),
    rule: "An action you can take back runs at once and offers Undo. A question for every archive teaches people to press OK unread.",
  },
  {
    avoid: (
      <span className="fj-bad-numbers">
        <span>7.06s</span>
        <span>41.8s</span>
        <span>1m 12s</span>
      </span>
    ),
    id: "numbers-right-aligned",
    instead: (
      <span className="fj-good-numbers fj-data">
        <span>7.06s</span>
        <span>41.8s</span>
        <span>1m 12s</span>
      </span>
    ),
    rule: "A column of durations aligns on the right edge with tabular digits, so the longest run is the widest line.",
  },
  {
    avoid: (
      <span className="fj-bad-zebra">
        <span>agent/pin-undici</span>
        <span>agent/split-checkout</span>
        <span>agent/labels-sync</span>
      </span>
    ),
    id: "rules-not-stripes",
    instead: (
      <span className="fj-good-rules">
        <span>agent/pin-undici</span>
        <span>agent/split-checkout</span>
        <span>agent/labels-sync</span>
      </span>
    ),
    rule: "Rows part with a hairline. A grey stripe on every other row looks like a selection, and the hover wash gets lost in it.",
  },
  {
    avoid: (
      <span className="fj-bad-ellipsis">
        <span>agent/orderline-qty-rena…</span>
        <span>agent/orderline-qty-rena…</span>
      </span>
    ),
    id: "cut-ids-in-the-middle",
    instead: (
      <span className="fj-vstack" data-gap="4">
        <CodeTag>agent/orderline…rename-db</CodeTag>
        <CodeTag>agent/orderline…rename-ui</CodeTag>
      </span>
    ),
    rule: "Two branches often differ only at the end. Cut a long id in the middle and keep the tail that tells them apart.",
  },
  {
    avoid: <span className="fj-bad-cheer">Success! Everything updated 🎉</span>,
    id: "say-what-changed",
    instead: <span>patchwright now runs on tern-4</span>,
    rule: "A confirmation names the thing and its new state. Cheering tells a person nothing they can check.",
  },
  {
    avoid: (
      <span className="fj-bad-blocker">
        <span className="fj-bad-blocker-spin" />
      </span>
    ),
    id: "work-in-its-row",
    instead: (
      <span className="fj-good-rules">
        <span className="fj-hstack">
          lint <Status plain status="ok" />
        </span>
        <span className="fj-hstack">
          unit <Status plain status="running" />
        </span>
      </span>
    ),
    rule: "Running work shows in the row that runs it. A spinner over the whole card hides the rows that are already done.",
  },
  {
    avoid: <span className="fj-bad-caps">Force push</span>,
    id: "buttons-in-sentence-case",
    instead: (
      <Button size="sm" variant="destructive">
        Force-push release/2.8
      </Button>
    ),
    rule: "A button is a short sentence that names its object. Capitals make a dangerous button look like every safe one.",
  },
];

export const AntiSlopFoundation = () => (
  <Foundation
    id="anti-slop"
    lede="Twelve shortcuts that make an agent console look generated, each beside the Fjord way. Both columns are live markup, so the difference shows on the page and not only in the rule."
    title="Anti-slop"
  >
    <div className="fj-card fj-slop">
      <div aria-hidden className="fj-slop-head">
        <span>Rule</span>
        <span>Avoid</span>
        <span>Instead</span>
      </div>
      <ol className="fj-slop-list">
        {PAIRS.map((pair) => (
          <li className="fj-slop-row" key={pair.id}>
            <div className="fj-slop-rule">
              <code className="fj-t-code-sm">{pair.id}</code>
              <p className="fj-t-body-sm fj-c-2">{pair.rule}</p>
            </div>
            <div className="fj-slop-cell" data-side="avoid">
              <span className="fj-slop-tag">Avoid</span>
              {pair.avoid}
            </div>
            <div className="fj-slop-cell" data-side="instead">
              <span className="fj-slop-tag">Instead</span>
              {pair.instead}
            </div>
          </li>
        ))}
      </ol>
    </div>
  </Foundation>
);
