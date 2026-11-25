import { Play } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "../components/button";
import { Pending } from "../components/pending";
import { Status } from "../components/status";
import { StatusStrip, StripCell } from "../components/status-strip";

interface SlopRule {
  id: string;
  rule: string;
  why: string;
  wrong: ReactNode;
  right: ReactNode;
}

export const RULES: SlopRule[] = [
  {
    id: "no-round-lights",
    right: <Status status="ok">Synced</Status>,
    rule: "State is a lit square with its word beside it.",
    why: "A round light on squared paper is the only soft shape on the sheet, and its colour has to carry the meaning on its own.",
    wrong: (
      <span className="hx-row hx-body-sm">
        <span className="hx-wrong-dot" />
        synced
      </span>
    ),
  },
  {
    id: "no-number-tiles",
    right: (
      <div className="hx-fill">
        <StatusStrip label="Example strip">
          <StripCell label="Spills" value="4" />
          <StripCell label="Queued" value="19" />
        </StatusStrip>
      </div>
    ),
    rule: "Figures that get compared share one ruled strip.",
    why: "Separate tiles give every figure the same volume, and the gutters between them read as extra edges.",
    wrong: (
      <span className="hx-row hx-gap-2">
        {["4", "19"].map((value) => (
          <span className="hx-wrong-tile" key={value}>
            <span className="hx-heading">{value}</span>
          </span>
        ))}
      </span>
    ),
  },
  {
    id: "no-nested-frames",
    right: (
      <span className="hx-frame hx-fill hx-grid">
        <span className="hx-code-sm hx-rule-row hx-pad-2">contacts</span>
        <span className="hx-code-sm hx-pad-2">accounts</span>
      </span>
    ),
    rule: "One outer edge per region; its parts get a rule, not a frame.",
    why: "Two outlines a few pixels apart blur into one thick, doubled edge.",
    wrong: (
      <span className="hx-frame hx-fill hx-grid hx-gap-1 hx-pad-1">
        <span className="hx-frame hx-code-sm hx-pad-2">contacts</span>
        <span className="hx-frame hx-code-sm hx-pad-2">accounts</span>
      </span>
    ),
  },
  {
    id: "no-spinner",
    right: (
      <span className="hx-row hx-body-sm">
        <Pending />
        Spilling to disk
      </span>
    ),
    rule: "Work in progress steps through four squares; nothing spins.",
    why: "A turning ring is round and never stops. The pending mark keeps time in the same squares as the rest of the sheet.",
    wrong: (
      <span className="hx-row hx-body-sm">
        <span className="hx-wrong-ring" />
        Spilling to disk
      </span>
    ),
  },
  {
    id: "no-amber-warning",
    right: <Status status="warn">Over budget</Status>,
    rule: "A caution is orange and says its word. Amber stays with the action.",
    why: "If the lamp also warns, nobody can tell press this from watch this.",
    wrong: <span className="hx-tag hx-wrong-amber">Over budget</span>,
  },
  {
    id: "no-lit-loss",
    right: (
      <span className="hx-row-wrap">
        <Button>Keep schema</Button>
        <Button variant="danger">Drop column</Button>
      </span>
    ),
    rule: "Something you cannot undo is red, never lit.",
    why: "The lamp invites a press. A loss should make a person slow down, not speed up.",
    wrong: (
      <span className="hx-row-wrap">
        <Button>Keep schema</Button>
        <Button variant="lamp">Drop column</Button>
      </span>
    ),
  },
  {
    id: "no-glow",
    right: (
      <span className="hx-frame hx-body-sm hx-pad-3 hx-panel">
        Budgets reset at 00:00 UTC on the 1st.
      </span>
    ),
    rule: "Nothing glows, blurs, floats or melts into a gradient.",
    why: "The lamp is the only light source on the sheet. A second glow competes with it.",
    wrong: (
      <span className="hx-wrong-gradient hx-body-sm hx-pad-3">
        Budgets reset at 00:00 UTC on the 1st.
      </span>
    ),
  },
  {
    id: "no-console-dressing",
    right: <span className="hx-title">Spend</span>,
    rule: "Borrow a console's density, not its look.",
    why: "Neon on black and a blinking prompt turn a working tool into a stage prop.",
    wrong: <span className="hx-wrong-console">$ spend --watch_</span>,
  },
  {
    id: "no-bare-percent",
    right: <span className="hx-code">13 / 24 partitions</span>,
    rule: "A share travels with its count.",
    why: "54% on its own hides how big the job is and whether it has moved since you last looked.",
    wrong: <span className="hx-figure">54%</span>,
  },
  {
    id: "no-floating-ago",
    right: <span className="hx-code-sm">Failed 06:20 UTC · 3h ago</span>,
    rule: "A relative time keeps the clock time beside it, in UTC.",
    why: "3h ago means nothing to someone reading the incident channel tomorrow.",
    wrong: <span className="hx-code-sm">Failed 3h ago</span>,
  },
  {
    id: "no-glyph-on-words",
    right: <Button variant="lamp">Apply mapping</Button>,
    rule: "A button that has words has no glyph.",
    why: "The capitals already name the action. A 16px icon beside them only adds grain.",
    wrong: (
      <Button variant="lamp">
        <Play aria-hidden size={16} />
        Apply mapping
      </Button>
    ),
  },
  {
    id: "no-resting-caret",
    right: <span className="hx-code">Mapped 3 columns.</span>,
    rule: "A caret shows only while characters are arriving.",
    why: "Left behind, it looks like an empty field asking to be typed into.",
    wrong: (
      <span className="hx-code">
        Mapped 3 columns.
        <span className="hx-caret" />
      </span>
    ),
  },
];

/** The habits Halogen refuses, each drawn wrong and then right. */
export const AntiSlop = () => (
  <div className="hx-slop">
    {RULES.map((item) => (
      <article aria-label={item.rule} key={item.id}>
        <div className="hx-slop-head">
          <span className="hx-code-sm hx-ink-3">{item.id}</span>
          <span className="hx-body-sm">{item.rule}</span>
          <span className="hx-caption hx-ink-3">{item.why}</span>
        </div>
        <div className="hx-dodont">
          <div>
            <span className="hx-status hx-label-sm hx-fail-text">
              <span className="hx-mark" data-status="fail" />
              Don&apos;t
            </span>
            <div aria-hidden className="hx-row hx-slop-demo">
              {item.wrong}
            </div>
          </div>
          <div>
            <span className="hx-status hx-label-sm hx-ok-text">
              <span className="hx-mark" data-status="ok" />
              Do
            </span>
            <div className="hx-row hx-slop-demo">{item.right}</div>
          </div>
        </div>
      </article>
    ))}
  </div>
);
