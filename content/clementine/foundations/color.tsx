import { Check, X } from "lucide-react";
import { useState } from "react";

import { Balance } from "../components/balance";
import { Button } from "../components/button";
import { Progress } from "../components/progress";
import { Switch } from "../components/switch";
import { Table } from "../components/table";
import type { TableColumn } from "../components/table";
import { ALL_LIVE_TOKENS, COLOR_GROUPS, CONTRAST_PAIRS } from "../data/tokens";
import { contrastRatio } from "../lib/contrast";
import { useLiveTokens } from "../lib/live-tokens";
import type { Theme, TokenValues } from "../lib/live-tokens";
import { Block } from "../shell";

import "./color.css";

type Pair = (typeof CONTRAST_PAIRS)[number];

const value = (tokens: TokenValues | null, theme: Theme, name: string) =>
  tokens?.[theme].get(name) ?? "";

const ratioOf = (tokens: TokenValues | null, theme: Theme, pair: Pair) =>
  contrastRatio(value(tokens, theme, pair.fg), value(tokens, theme, pair.bg));

const Ratio = ({ ratio, needs }: { ratio: number; needs: number }) => {
  if (Number.isNaN(ratio)) {
    return <span className="cl-ratio">Reading…</span>;
  }

  return (
    <span className="cl-ratio" data-fail={ratio < needs || undefined}>
      {ratio.toFixed(1)}:1
      <span className="cl-sr">{ratio < needs ? ", fails" : ", passes"}</span>
    </span>
  );
};

const Swatches = ({ tokens }: { tokens: TokenValues | null }) => (
  <div className="cl-swatch-groups">
    {COLOR_GROUPS.map((group) => (
      <div className="cl-swatch-group" key={group.name}>
        <div className="cl-swatch-group__head">
          <h4 className="cl-h4">{group.name}</h4>
          <p className="cl-note">{group.note}</p>
        </div>
        <ul className="cl-swatches">
          {group.tokens.map((token) => (
            <li className="cl-swatch" key={token.token}>
              <span
                aria-hidden
                className="cl-swatch__chip"
                style={{ background: `var(${token.token})` }}
              />
              <span className="cl-swatch__name">{token.token.slice(2)}</span>
              <span className="cl-swatch__hex">
                <span>Light {value(tokens, "light", token.token) || "…"}</span>
                <span>Dark {value(tokens, "dark", token.token) || "…"}</span>
              </span>
              <span className="cl-swatch__role">{token.role}</span>
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>
);

const contrastColumns = (tokens: TokenValues | null) =>
  [
    {
      header: "Text on background",
      key: "pair",
      render: (pair) => (
        <span className="cl-pair-cell">
          <span
            aria-hidden
            className="cl-pair__chip"
            style={{ background: `var(${pair.bg})`, color: `var(${pair.fg})` }}
          >
            Aa
          </span>
          <span className="cl-mono">
            {pair.fg.slice(2)} on {pair.bg.slice(2)}
          </span>
        </span>
      ),
    },
    {
      header: "Light",
      key: "light",
      label: "Light",
      numeric: true,
      render: (pair) => <Ratio needs={pair.needs} ratio={ratioOf(tokens, "light", pair)} />,
    },
    {
      header: "Dark",
      key: "dark",
      label: "Dark",
      numeric: true,
      render: (pair) => <Ratio needs={pair.needs} ratio={ratioOf(tokens, "dark", pair)} />,
    },
    {
      header: "Needs",
      key: "needs",
      label: "Needs",
      render: (pair) => ("wrong" in pair ? "Never as text" : `${String(pair.needs)}:1`),
    },
  ] satisfies TableColumn<Pair>[];

const shown = (ratio: number) => (Number.isNaN(ratio) ? "…" : `${ratio.toFixed(1)}:1`);

const AccentRule = ({ tokens, theme }: { tokens: TokenValues | null; theme: Theme }) => {
  const [on, setOn] = useState(true);
  const [topped, setTopped] = useState(412.06);
  const orange = contrastRatio(value(tokens, theme, "--accent"), value(tokens, theme, "--page"));
  const line = contrastRatio(value(tokens, theme, "--accent-line"), value(tokens, theme, "--page"));

  return (
    <div className="cl-accent-rule">
      <ul className="cl-accent-rule__yes">
        <li>
          <Button size="sm">Pay now</Button>
          <span>The action with the zest ring</span>
        </li>
        <li>
          <Balance onClick={() => setTopped((current) => current + 20)} value={topped} />
          <span>The balance chip, which tops up by $20.00 here</span>
        </li>
        <li>
          <Switch checked={on} hideLabel label="Round-ups" onCheckedChange={setOn} />
          <span>A switch that is on</span>
        </li>
        <li className="cl-accent-rule__bar">
          <Progress label="Goal" max={10} value={6} />
          <span>A goal that is filling</span>
        </li>
        <li>
          <span className="cl-wash-row">Dining</span>
          <span>A chosen row, as a wash</span>
        </li>
      </ul>
      <ul className="cl-accent-rule__no">
        <li>
          <X aria-hidden size={16} strokeWidth={2.25} />
          Never a page, panel, banner or section fill
        </li>
        <li>
          <X aria-hidden size={16} strokeWidth={2.25} />
          Never text or icons on the page: {shown(orange)} in this theme
        </li>
        <li>
          <X aria-hidden size={16} strokeWidth={2.25} />
          Never under white letters; words on orange are ink
        </li>
        <li>
          <Check aria-hidden size={16} strokeWidth={2.25} />
          Lines, rings and icons that need the hue use accent-line, {shown(line)}
        </li>
      </ul>
    </div>
  );
};

export const ColorFoundation = ({ theme }: { theme: Theme }) => {
  const tokens = useLiveTokens(ALL_LIVE_TOKENS);

  return (
    <>
      <Block
        id="color"
        lead="Components ask for a role, never a hex. The values below are read from tokens.css as the page loads, for both themes."
        title="Color"
      >
        <Swatches tokens={tokens} />
      </Block>
      <Block
        lead="The orange is rationed. These are the only places it may appear; everything else is ink on warm paper."
        title="Where the orange goes"
      >
        <AccentRule theme={theme} tokens={tokens} />
      </Block>
      <Block
        lead="Worked out from the live token values, including the label on both ends of each glow. Sentences need 4.5:1; control edges, glyphs and focus rings need 3:1."
        title="Contrast"
      >
        <Table
          caption="Contrast of text tokens on their backgrounds, in light and dark"
          columns={contrastColumns(tokens)}
          rowKey={(pair) => `${pair.fg}-${pair.bg}`}
          rowTone={(pair) => ("wrong" in pair ? "danger" : undefined)}
          rows={CONTRAST_PAIRS}
        />
      </Block>
    </>
  );
};
