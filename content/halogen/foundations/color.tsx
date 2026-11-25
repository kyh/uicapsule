import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import { Button } from "../components/button";
import { Checkbox } from "../components/choice";
import { Status } from "../components/status";
import { Tag } from "../components/tag";
import { contrast, ratio } from "../lib/contrast";
import { COLOR_GROUPS } from "./tokens";
import type { ColorToken } from "./tokens";

const Swatch = ({ hex }: { hex: string }) => (
  <span className="hx-row">
    <span className="hx-swatch" style={{ "--sw": hex } as CSSProperties} />
    <span className="hx-code-sm">{hex}</span>
  </span>
);

const Ratio = ({ token }: { token: ColorToken }) => {
  const { against } = token;

  if (!against) {
    return <span className="hx-code-sm hx-ink-3">-</span>;
  }

  const light = contrast(token.light, against.light);
  const dark = contrast(token.dark, against.dark);
  const pass = light >= against.min && dark >= against.min;

  return (
    <span className="hx-stack hx-gap-half">
      <span className="hx-code-sm">
        {ratio(token.light, against.light)} · {ratio(token.dark, against.dark)}
      </span>
      <span className={`hx-micro ${pass ? "hx-ok-text" : "hx-fail-text"}`}>
        {pass ? "Passes" : "Fails"} {against.min}:1 on {against.name}
      </span>
    </span>
  );
};

/** The colour token table, with WCAG ratios computed from the same values the CSS ships. */
export const ColorTable = () => (
  <div className="hx-frame">
    <div className="hx-table-wrap">
      <table className="hx-table hx-ftable">
        <thead>
          <tr>
            <th scope="col">Token</th>
            <th scope="col">Use for</th>
            <th scope="col">Light</th>
            <th scope="col">Dark</th>
            <th scope="col">Contrast</th>
          </tr>
        </thead>
        {COLOR_GROUPS.map((group) => (
          <tbody key={group.name}>
            <tr>
              <th className="hx-label-sm hx-group-row" colSpan={5} scope="colgroup">
                {group.name}
              </th>
            </tr>
            {group.tokens.map((token) => (
              <tr key={token.token}>
                <td data-label="Token" data-nowrap>
                  {token.token}
                </td>
                <td data-label="Use for" data-sans data-wide>
                  {token.use}
                </td>
                <td data-label="Light" data-nowrap>
                  <Swatch hex={token.light} />
                </td>
                <td data-label="Dark" data-nowrap>
                  <Swatch hex={token.dark} />
                </td>
                <td data-label="Contrast" data-nowrap>
                  <Ratio token={token} />
                </td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  </div>
);

const LampCheck = () => {
  const [on, setOn] = useState(true);

  return <Checkbox checked={on} label="Quarantine bad rows" onCheckedChange={setOn} />;
};

const Rule = ({
  ok,
  title,
  children,
  note,
}: {
  ok: boolean;
  title: string;
  children: ReactNode;
  note: string;
}) => (
  <div>
    <span className={`hx-status hx-label-sm ${ok ? "hx-ok-text" : "hx-fail-text"}`}>
      <span className="hx-mark" data-status={ok ? "ok" : "fail"} />
      {ok ? "Lamp may go" : "Lamp never goes"}
    </span>
    <div className="hx-row-wrap hx-slop-demo">{children}</div>
    <span className="hx-code">{title}</span>
    <p className="hx-caption hx-ink-2">{note}</p>
  </div>
);

/** Where amber may and may not go, drawn with the real components. */
export const LampRules = () => (
  <div className="hx-frame">
    <div className="hx-head">
      <span className="hx-head-title hx-code">--hx-lamp</span>
      <span className="hx-head-meta hx-code-sm">one lit action per view</span>
    </div>
    <div className="hx-dodont hx-lamp-grid">
      <Rule
        note="One per frame, dialog or foot row: the filament a person follows to the next step."
        ok
        title="The lit button"
      >
        <Button>Hold drift</Button>
        <Button variant="lamp">Apply mapping</Button>
      </Rule>
      <Rule
        note="Where you are sits on a pale amber wash with ink on top. It marks a place, not an action."
        ok
        title="The wash"
      >
        <span className="hx-code hx-wash-chip">drift_4ac1 · crm.contacts</span>
      </Rule>
      <Rule
        note="A control that is on is filled amber under an ink tick. The tick says on; the fill only agrees."
        ok
        title="A ticked box"
      >
        <LampCheck />
      </Rule>
      <Rule
        note={`On paper, amber letters reach ${ratio("#ffbe2e", "#fdfcf9")}. Words that must read in amber use --hx-lamp-text, ${ratio("#7a5000", "#fdfcf9")}.`}
        ok={false}
        title="Amber letters"
      >
        <span className="hx-label-sm hx-wrong-lamp-text">Spilling</span>
        <span className="hx-label-sm hx-lamp-text">Spilling</span>
      </Rule>
      <Rule
        note="Caution is orange and names itself. Amber is already busy meaning press here."
        ok={false}
        title="A caution"
      >
        <Tag tone="wash">Over budget</Tag>
        <Status status="warn">Over budget</Status>
      </Rule>
      <Rule
        note="Two lit buttons side by side and the eye cannot settle. Everything else is plain or ghost."
        ok={false}
        title="A second lamp"
      >
        <Button variant="lamp">Hold</Button>
        <Button variant="lamp">Apply</Button>
      </Rule>
    </div>
  </div>
);
