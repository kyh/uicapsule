import { Button } from "../components/button";
import { Panel, Shell } from "../components/card";
import { Kbd } from "../components/kbd";
import { Badge } from "../components/badge";
import { Minor } from "../chrome";

const STEPS = [
  { px: 2, use: "a glyph nudged onto the baseline" },
  { px: 4, use: "glyph to word inside a tag" },
  { px: 6, use: "glyph to word inside a button" },
  { px: 8, use: "button to button in a footer" },
  { px: 12, use: "a panel's inner margin" },
  { px: 16, use: "between related blocks" },
  { px: 20, use: "a dialog's inner margin" },
  { px: 24, use: "between unrelated blocks" },
  { px: 32, use: "between parts of a screen" },
  { px: 40, use: "above the page title" },
] as const;

const LINES = [
  {
    name: "line-faint",
    sample: "The rim of a card, the hairline separating rows",
    token: "--line-faint",
    value: "ink at 6%",
  },
  {
    name: "line",
    sample: "The ring that lifts menus and dialogs off the page",
    token: "--line",
    value: "ink at 10%",
  },
  {
    name: "line-control",
    sample: "An input nobody is typing in",
    token: "--line-control",
    value: "ink at 15%",
  },
  {
    name: "line-focus",
    sample: "An input with the caret in it",
    token: "--line-focus",
    value: "ink at 32%",
  },
  {
    name: "line-strong",
    sample: "An unticked box or an off switch",
    token: "--line-strong",
    value: "ink at 45%",
  },
] as const;

/** A 4px grid, 26, 32 and 36px controls, 36px rows. */
export const SpaceFoundation = () => (
  <>
    <div className="v-stage v-stack-sm v-pad-20">
      {STEPS.map((step) => (
        <div className="v-space-row" key={step.px}>
          <span className="v-caption v-t1 v-data">{step.px}px</span>
          <span
            className="v-space-bar"
            style={{ width: `calc(${step.px}px * var(--space-scale))` }}
          />
          <span className="v-caption v-t2">{step.use}</span>
        </div>
      ))}
    </div>
    <Minor>Controls and rows</Minor>
    <div className="v-stage v-cluster v-items-end v-gap-20 v-pad-20">
      {(["sm", "md", "lg"] as const).map((size) => (
        <div className="v-stack-sm v-text-center" key={size}>
          <Button size={size} variant="secondary">
            Grade again
          </Button>
          <span className="v-caption v-t2 v-data">{{ lg: 36, md: 32, sm: 26 }[size]}px</span>
        </div>
      ))}
      <div className="v-stack-sm v-row-sample">
        <div className="v-panel">
          <div className="v-row">
            <span className="v-body-sm">A row is 36px</span>
            <span className="v-row-end v-caption v-t2">12px in</span>
          </div>
        </div>
        <span className="v-caption v-t2">--row</span>
      </div>
    </div>
  </>
);

/** The six corner radii, each shown on the object it belongs to. */
export const RadiusFoundation = () => (
  <div className="v-stage">
    <div className="v-radius-grid">
      <div className="v-radius-cell">
        <div className="v-radius-demo">
          <Button size="sm">Post to #design</Button>
        </div>
        <p className="v-caption">
          pill <span className="v-t2">· anything one line tall</span>
        </p>
      </div>
      <div className="v-radius-cell">
        <div className="v-radius-demo">
          <Shell className="v-radius-shell">
            <Panel className="v-radius-panel" />
          </Shell>
        </div>
        <p className="v-caption">
          14 and 11 <span className="v-t2">· shell, panel 3px in</span>
        </p>
      </div>
      <div className="v-radius-cell">
        <div className="v-radius-demo">
          <div className="v-overlay v-radius-menu">
            <span className="v-menu-item" data-active="">
              Rename
            </span>
            <span className="v-menu-item">Archive</span>
          </div>
        </div>
        <p className="v-caption">
          10 and 6 <span className="v-t2">· overlay, a row inside it</span>
        </p>
      </div>
      <div className="v-radius-cell">
        <div className="v-radius-demo v-cluster v-center">
          <Badge>v12</Badge>
          <Kbd>⌘K</Kbd>
        </div>
        <p className="v-caption">
          6 <span className="v-t2">· tags, keys</span>
        </p>
      </div>
      <div className="v-radius-cell">
        <div className="v-radius-demo">
          <div aria-hidden className="v-strip v-radius-strip">
            {["ok", "ok", "fail", "ok", "ok", "ok", "ok", "ok"].map((status, index) => (
              <span data-status={status} key={index} />
            ))}
          </div>
        </div>
        <p className="v-caption">
          2 <span className="v-t2">· strip marks, swatches</span>
        </p>
      </div>
    </div>
  </div>
);

/** One hairline weight; only focus is 2px. */
export const BordersFoundation = () => (
  <div className="v-stage v-pad-20">
    <div className="v-stack v-gap-16">
      {LINES.map((line) => (
        <div className="v-space-row v-line-row" key={line.name}>
          <span className="v-caption v-t1">{line.name}</span>
          <span className="v-stack-sm v-gap-4">
            <span className="v-line-sample" style={{ borderColor: `var(${line.token})` }} />
            <span className="v-caption v-t2">{line.sample}</span>
          </span>
          <span className="v-caption v-t2 v-text-end">{line.value}</span>
        </div>
      ))}
      <div aria-hidden className="v-cluster v-gap-20" inert>
        <span className="v-field v-field-demo">
          <span className="v-caption v-t3">Idle input</span>
        </span>
        <span className="v-field v-field-demo" data-demo="focus">
          <span className="v-caption v-t1">Focused: darker, not black</span>
        </span>
        <Button className="v-focus-demo" variant="secondary">
          2px ink focus ring
        </Button>
      </div>
    </div>
  </div>
);
