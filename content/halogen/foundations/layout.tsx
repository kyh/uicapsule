import { Button } from "../components/button";
import { StatusMark } from "../components/status";
import { Avatar, Tag } from "../components/tag";
import { cssVars } from "../lib/css-vars";
import { DENSITIES, useSettings } from "./settings";
import type { DensityScale } from "./settings";

const STEPS = [48, 40, 32, 24, 20, 16, 12, 8, 4, 2].toReversed();

const SIZES = [
  { name: "--hx-control-sm", use: "Compact buttons, icons in a head row" },
  { name: "--hx-control", use: "Buttons, fields, tabs" },
  { name: "--hx-control-lg", use: "The one large control a page may have" },
  { name: "--hx-row-sm", use: "Menu items, table heads" },
  { name: "--hx-row", use: "Table rows, tool-call steps" },
  { name: "--hx-head", use: "The head row of a frame" },
] as const;

/** The Space lead, with the heights the current density sets. */
export const spaceLead = (scale: DensityScale) =>
  `Padding, margins and gaps move in 4px steps, with a 2px half-step for marks. Controls stand ${scale["--hx-control"]}px tall, rows ${scale["--hx-row"]}px, and every region keeps a ${scale["--hx-inset"]}px inset.`;

const stepName = (step: number) => (step === 2 ? "--hx-half" : `--hx-${step / 4}`);

/** The 4px scale with its one half-step, and the heights the current density measures. */
export const Space = () => {
  const { density } = useSettings();
  const scale = DENSITIES[density];

  return (
    <div className="hx-split hx-frame" style={cssVars({ "--cols": 2 })}>
      <div className="hx-body-pad hx-gap-2">
        <span className="hx-label-sm hx-ink-3">Steps</span>
        {STEPS.map((step) => (
          <div className="hx-row hx-gap-3" key={step}>
            <span className="hx-code-sm hx-ink-3 hx-space-px">{step}px</span>
            <span className="hx-space-bar" style={cssVars({ "--w": `${step * 4}px` })} />
            <span className="hx-code-sm hx-ink-3 hx-end">{stepName(step)}</span>
          </div>
        ))}
      </div>
      <div className="hx-body-pad hx-gap-2">
        <span className="hx-label-sm hx-ink-3">Heights</span>
        {SIZES.map((size) => (
          <div className="hx-row hx-gap-3" key={size.name}>
            <span className="hx-space-box" style={cssVars({ "--h": `${scale[size.name]}px` })} />
            <span className="hx-stack hx-gap-0">
              <span className="hx-code-sm">
                {size.name} · {scale[size.name]}px
              </span>
              <span className="hx-caption hx-ink-3">{size.use}</span>
            </span>
          </div>
        ))}
        <p className="hx-caption hx-ink-2">
          Padding, margins and gaps move in 4px steps. The 2px half-step lives only inside marks and
          tags, and the -1px overlaps that let two rules share a line are not spacing at all.
        </p>
      </div>
    </div>
  );
};

export const ROLES = [
  { name: "Control", node: <Button size="sm">Rerun</Button> },
  {
    name: "Field",
    node: (
      <span className="hx-input hx-radius-field" data-size="sm">
        <span className="hx-ink-3">us-east-1</span>
      </span>
    ),
  },
  { name: "Tag", node: <Tag>Staging</Tag> },
  { name: "Region", node: <span className="hx-frame hx-radius-box" /> },
  { name: "Overlay", node: <span className="hx-frame hx-radius-box hx-panel" /> },
  { name: "Avatar", node: <Avatar name="Tomas Weber" size="lg" /> },
  {
    name: "Radio",
    node: (
      <span className="hx-check-box hx-radius-radio">
        <span className="hx-radio-dot" />
      </span>
    ),
  },
  { name: "Status mark", node: <StatusMark status="ok" /> },
];

/** Radius by role: every role, every corner, 0. */
export const Radius = () => (
  <div className="hx-tiles" style={cssVars({ "--tiles": 4 })}>
    {ROLES.map((role) => (
      <div key={role.name}>
        <div className="hx-row hx-slop-demo">{role.node}</div>
        <span className="hx-row">
          <span className="hx-label-sm hx-ink-2">{role.name}</span>
          <span className="hx-code-sm hx-end">0px</span>
        </span>
      </div>
    ))}
  </div>
);

/** The line roles, the focus ring and the one texture. */
export const Borders = () => (
  <div className="hx-tiles" style={cssVars({ "--tiles": 4 })}>
    <div>
      <div className="hx-grid">
        {["09:41", "09:36", "09:30"].map((time) => (
          <span className="hx-code-sm hx-rule-faint hx-border-row" key={time}>
            {time} crm.contacts
          </span>
        ))}
      </div>
      <span className="hx-code-sm">--hx-rule-faint</span>
      <span className="hx-caption hx-ink-3">Separates rows that belong to one region.</span>
    </div>
    <div>
      <span className="hx-frame hx-border-cols">
        <span />
        <span />
      </span>
      <span className="hx-code-sm">--hx-rule</span>
      <span className="hx-caption hx-ink-3">
        Draws the region&apos;s outline once, then splits its columns.
      </span>
    </div>
    <div>
      <div className="hx-row hx-border-stage">
        <Button className="hx-focus-demo">Focused</Button>
      </div>
      <span className="hx-code-sm">--hx-focus · 2px</span>
      <span className="hx-caption hx-ink-3">
        The keyboard ring, and the single exception to the hairline. Press Tab to find it.
      </span>
    </div>
    <div>
      <div className="hx-row hx-border-stage hx-border-gutter">
        <span className="hx-frame" />
        <span className="hx-dots" />
        <span className="hx-frame" />
      </div>
      <span className="hx-code-sm">--hx-dot · 4px pitch</span>
      <span className="hx-caption hx-ink-3">
        A faint texture for blank space between regions. Text never sits on it.
      </span>
    </div>
  </div>
);

export const LEVELS = [
  { name: "Page", note: "--hx-page", z: "0" },
  { name: "Frame", note: "--hx-rule outline, flat on the sheet", z: "0" },
  { name: "Overlay", note: "--hx-panel with one rule, at --hx-z-overlay", z: "50" },
  { name: "Dialog", note: "the overlay above --hx-scrim, at --hx-z-overlay", z: "50" },
];

/** The four levels. Nothing casts a shadow; an overlay is set apart by fill, edge and the scrim. */
export const Elevation = () => (
  <div className="hx-tiles" style={cssVars({ "--tiles": 4 })}>
    {LEVELS.map((level, index) => (
      <div key={level.name}>
        <div className="hx-level" data-level={index}>
          {index >= 1 ? <span className="hx-frame hx-level-card" /> : null}
        </div>
        <span className="hx-row">
          <span className="hx-label-sm">{level.name}</span>
          <span className="hx-code-sm hx-ink-3 hx-end">z {level.z}</span>
        </span>
        <span className="hx-caption hx-ink-3">{level.note}. No shadow.</span>
      </div>
    ))}
  </div>
);
