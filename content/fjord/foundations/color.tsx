import { useEffect, useRef, useState } from "react";

import { Badge, KINDS, KIND_WORD } from "../components/badge";
import { Status } from "../components/status";
import { contrastRatio, paint, toOklch } from "../lib/contrast";
import { useTheme } from "../lib/theme";
import { Foundation, Rules, Stage } from "./section";

const noop = () => null;

interface TokenRow {
  token: string;
  use: string;
  on?: readonly string[];
  floor?: number;
}

const GROUNDS = ["--fj-surface-page", "--fj-surface-canvas"] as const;

const TEXT_ROWS: TokenRow[] = [
  { floor: 4.5, on: GROUNDS, token: "--fj-text-1", use: "Titles, values, anything read first" },
  { floor: 4.5, on: GROUNDS, token: "--fj-text-2", use: "Sentences that explain, row meta" },
  { floor: 4.5, on: GROUNDS, token: "--fj-text-3", use: "Column heads, units, clocks" },
  { on: GROUNDS, token: "--fj-text-disabled", use: "A control you cannot use yet" },
  { floor: 4.5, on: GROUNDS, token: "--fj-warn-text", use: "Degraded, retried, behind" },
  { floor: 4.5, on: GROUNDS, token: "--fj-fail-text", use: "Failed, and burn actions" },
  { floor: 4.5, on: GROUNDS, token: "--fj-glacier", use: "The focus ring, nothing else" },
  {
    floor: 3,
    on: GROUNDS,
    token: "--fj-line-control",
    use: "Edge of an unticked box or empty track",
  },
];

const KIND_ROWS: TokenRow[] = KINDS.map((kind) => ({
  floor: 7,
  on: [`--fj-${kind}-tint`],
  token: `--fj-${kind}-label`,
  use: `The word ${KIND_WORD[kind]} on its own tint`,
}));

const LINE_ROWS: TokenRow[] = KINDS.map((kind) => ({
  floor: 3,
  on: GROUNDS,
  token: `--fj-${kind}-line`,
  use: `${KIND_WORD[kind]} strokes and the bar still growing`,
}));

const INKS = [
  { token: "--fj-text-1", use: "First read" },
  { token: "--fj-text-2", use: "Explains" },
  { token: "--fj-text-3", use: "Labels" },
  { token: "--fj-text-disabled", use: "Not yet" },
] as const;

interface Measured {
  value: string;
  ratios: number[];
}

const useMeasured = (rows: TokenRow[]) => {
  const ref = useRef<HTMLTableElement>(null);
  const [measured, setMeasured] = useState<Map<string, Measured>>(() => new Map());

  useEffect(() => {
    const node = ref.current;

    if (!node) {
      return noop;
    }

    const frame = window.requestAnimationFrame(() => {
      const style = getComputedStyle(node);
      const read = (name: string) => style.getPropertyValue(name).trim();
      const next = new Map<string, Measured>();

      for (const row of rows) {
        const value = read(row.token);

        const ratios = (row.on ?? []).map((ground) => {
          const groundValue = read(ground);
          const back = paint(groundValue);
          const front = paint(value, groundValue);

          return back && front ? contrastRatio(front, back) : 0;
        });

        next.set(row.token, { ratios, value: toOklch(value) });
      }

      setMeasured(next);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [rows]);

  return { measured, ref };
};

const Ratio = ({ value, floor }: { value: number | undefined; floor: number | undefined }) => {
  if (value === undefined || value === 0) {
    return <span className="fj-c-3">Measuring</span>;
  }

  const passes = floor === undefined || value >= floor;

  return (
    <span className={passes ? "fj-data" : "fj-data fj-c-fail"}>
      {value.toFixed(1)}:1
      {floor === undefined ? null : (
        <span className="fj-sr">{passes ? ", passes" : ", under the floor"}</span>
      )}
    </span>
  );
};

const TokenTable = ({
  rows,
  caption,
  grounds,
}: {
  rows: TokenRow[];
  caption: string;
  grounds: string[];
}) => {
  const { measured, ref } = useMeasured(rows);

  return (
    <div className="fj-card">
      <div className="fj-scroll-x">
        <table className="fj-table fj-token-table" ref={ref}>
          <caption className="fj-sr">{caption}</caption>
          <thead>
            <tr>
              <th scope="col">Token</th>
              <th className="fj-token-use" scope="col">
                Use for
              </th>
              {grounds.map((ground) => (
                <th data-num="" key={ground} scope="col">
                  {ground}
                </th>
              ))}
              <th data-num="" scope="col">
                Floor
              </th>
              <th scope="col">Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const entry = measured.get(row.token);

              return (
                <tr key={row.token}>
                  <th className="fj-token-cell" scope="row">
                    <span
                      aria-hidden
                      className="fj-chip-swatch"
                      style={{ background: `var(${row.token})` }}
                    />
                    <code className="fj-t-code-sm">{row.token}</code>
                  </th>
                  <td className="fj-c-2 fj-t-body-sm fj-token-use">{row.use}</td>
                  {grounds.map((ground, index) => (
                    <td data-num="" key={ground}>
                      {row.on && row.on.length > index ? (
                        <Ratio floor={row.floor} value={entry?.ratios[index]} />
                      ) : null}
                    </td>
                  ))}
                  <td className="fj-c-3" data-num="">
                    {row.floor === undefined ? "None" : `${row.floor}:1`}
                  </td>
                  <td>
                    <code className="fj-t-code-sm fj-c-2">{entry?.value ?? ""}</code>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const ColorFoundation = () => {
  const theme = useTheme();

  return (
    <Foundation
      id="color"
      lede="Ink is the blue-black of deep water, paper is almost white, and around every piece of paper lies fog. Four cold hues tell kinds of thing apart, amber and red wait for trouble, and one glacier blue shows where the keyboard is. Each ratio below is measured from the theme you are looking at."
      title="Color"
    >
      <figure className="fj-strata">
        <figcaption className="fj-sr">Fog holds paper, and paper holds the well</figcaption>
        <div className="fj-stratum" data-layer="fog">
          <code className="fj-t-code-sm">surface-canvas</code>
          <span className="fj-t-body-sm fj-c-2">Fog, the ground of every screen</span>
          <div className="fj-stratum" data-layer="paper">
            <code className="fj-t-code-sm">surface-page</code>
            <span className="fj-t-body-sm fj-c-2">Paper, wherever work happens</span>
            <div className="fj-stratum" data-layer="well">
              <code className="fj-t-code-sm">surface-well</code>
              <span className="fj-t-body-sm fj-c-2">The well, for output and secrets</span>
            </div>
          </div>
        </div>
      </figure>

      <div className="fj-palette">
        <div className="fj-palette-group">
          <p className="fj-t-label">Kinds</p>
          <ul className="fj-swatches">
            {KINDS.map((kind) => (
              <li data-kind={kind} key={kind}>
                <span aria-hidden className="fj-swatch" data-fill="mark" />
                <Badge kind={kind} />
                <code className="fj-t-code-sm fj-c-3">{kind}-*</code>
              </li>
            ))}
          </ul>
        </div>
        <div className="fj-palette-group">
          <p className="fj-t-label">Trouble</p>
          <ul className="fj-swatches">
            <li data-trouble="warn">
              <span aria-hidden className="fj-swatch" data-fill="mark" />
              <Status status="warn">Behind</Status>
              <code className="fj-t-code-sm fj-c-3">warn-*</code>
            </li>
            <li data-trouble="fail">
              <span aria-hidden className="fj-swatch" data-fill="mark" />
              <Status status="fail" />
              <code className="fj-t-code-sm fj-c-3">fail-*</code>
            </li>
          </ul>
        </div>
        <div className="fj-palette-group">
          <p className="fj-t-label">Glacier</p>
          <ul className="fj-swatches">
            <li>
              <span aria-hidden className="fj-swatch" style={{ background: "var(--fj-glacier)" }} />
              <span className="fj-t-label-sm">Focus</span>
              <code className="fj-t-code-sm fj-c-3">glacier</code>
            </li>
          </ul>
        </div>
        <div className="fj-palette-group" data-wide="">
          <p className="fj-t-label">Ink</p>
          <ul className="fj-ramp">
            {INKS.map((ink) => (
              <li key={ink.token} style={{ background: `var(${ink.token})` }}>
                <span>{ink.use}</span>
                <code>{ink.token.replace("--fj-", "")}</code>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="fj-vstack" data-gap="12">
        <h4 className="fj-t-subheading">Text, focus and edges</h4>
        <TokenTable
          caption="Text tokens with measured contrast"
          grounds={["on paper", "on fog"]}
          key={theme}
          rows={TEXT_ROWS}
        />
      </div>

      <div className="fj-vstack" data-gap="12">
        <h4 className="fj-t-subheading">Kind words</h4>
        <TokenTable
          caption="Kind label contrast on its tint"
          grounds={["on tint"]}
          key={theme}
          rows={KIND_ROWS}
        />
      </div>
      <div className="fj-vstack" data-gap="12">
        <h4 className="fj-t-subheading">Kind strokes</h4>
        <TokenTable
          caption="Kind line contrast on paper and fog"
          grounds={["on paper", "on fog"]}
          key={theme}
          rows={LINE_ROWS}
        />
      </div>

      <div className="fj-vstack" data-gap="12">
        <h4 className="fj-t-subheading">The four places a hue may sit</h4>
        <Stage>
          <div className="fj-hue-rules">
            <div className="fj-hue-rule">
              <span className="fj-hstack" data-gap="8">
                storefront <Badge kind="repo" />
              </span>
              <p className="fj-t-body-sm fj-c-2">Inside a Badge, after the thing it names</p>
            </div>
            <div className="fj-hue-rule" data-kind="run">
              <svg
                aria-hidden
                className="fj-hue-line"
                preserveAspectRatio="none"
                viewBox="0 0 80 20"
              >
                <polyline points="0,14 14,15 28,9 42,11 56,5 70,7 80,4" />
              </svg>
              <p className="fj-t-body-sm fj-c-2">On a series stroke, at the line step</p>
            </div>
            <div className="fj-hue-rule" data-kind="agent">
              <span aria-hidden className="fj-hue-bar" />
              <p className="fj-t-body-sm fj-c-2">On a trace bar, so a step shows what it touched</p>
            </div>
            <div className="fj-hue-rule">
              <span className="fj-avatar" data-type="agent">
                p
              </span>
              <p className="fj-t-body-sm fj-c-2">Behind an agent’s initial, never a person’s</p>
            </div>
          </div>
        </Stage>
        <Rules
          items={[
            {
              id: "hue-names-a-kind",
              text: "A hue only ever says what kind of thing something is, and a Badge spells that kind out, so the meaning survives grayscale, forced colors and a screen reader.",
            },
            {
              id: "warm-is-reserved",
              text: "Amber and red are kept for warn and fail, and for the text and edge of an action that destroys something. Kinds, series and tags stay cold, so the first warm thing on a screen is the thing to look at.",
            },
            {
              id: "glacier-is-focus",
              text: "Glacier blue shows where the keyboard is and is spent on nothing else. A glacier link would make the focus ring harder to find.",
            },
            {
              id: "one-ink-button",
              text: "A view gets one ink button, for the step it exists for. Every other control is paper with an edge, or bare text.",
            },
            {
              id: "selection-is-a-cold-wash",
              text: "A picked row is tinted with the cold wash from edge to edge. It takes no kind hue and grows no stripe.",
            },
          ]}
        />
      </div>
    </Foundation>
  );
};
