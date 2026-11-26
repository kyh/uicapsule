import { useEffect, useState } from "react";

import { Button } from "../components/button";
import { Figure } from "../components/figure";
import { ALL_LIVE_TOKENS, TYPE_SCALE } from "../data/tokens";
import { useLiveTokens } from "../lib/live-tokens";
import { formatAmount } from "../lib/format";
import { Block } from "../shell";

import "./type.css";

const noop = () => null;

const STEPS: readonly number[] = [111.11, -17.8, 4.44, -1.09, 88.2];

const Jitter = () => {
  const [value, setValue] = useState(1811.04);
  const [runs, setRuns] = useState(0);

  useEffect(() => {
    if (runs === 0) {
      return noop;
    }

    const tick = window.setTimeout(() => {
      setValue((current) => current + (STEPS[runs % STEPS.length] ?? 0));
      setRuns((count) => count - 1);
    }, 110);

    return () => {
      window.clearTimeout(tick);
    };
  }, [runs]);

  return (
    <div className="cl-jitter">
      <div className="cl-jitter__rows">
        <p>
          <span className="cl-jitter__label">Proportional</span>
          <span className="cl-jitter__fig" style={{ fontVariantNumeric: "proportional-nums" }}>
            {formatAmount(value)}
          </span>
        </p>
        <p>
          <span className="cl-jitter__label">Tabular</span>
          <span className="cl-jitter__fig">{formatAmount(value)}</span>
        </p>
      </div>
      <Button
        onClick={() => {
          setRuns(20);
        }}
        pending={runs > 0}
        size="sm"
        variant="secondary"
      >
        Count up the balance
      </Button>
    </div>
  );
};

const TypeScale = () => {
  const tokens = useLiveTokens(ALL_LIVE_TOKENS);
  const read = (name: string) => tokens?.light.get(name) ?? "…";

  return (
    <ol className="cl-type">
      {TYPE_SCALE.map((step) => (
        <li className="cl-type__row" key={step.name}>
          <div className="cl-type__meta">
            <span className="cl-mono">{step.name}</span>
            <span>
              {read(step.name)} / {read(step.leading)} / {step.weight}
            </span>
            <span className="cl-type__job">{step.job}</span>
          </div>
          {"figure" in step ? (
            <Figure value={step.figure} />
          ) : (
            <p
              className="cl-type__sample"
              style={{
                fontSize: `var(${step.name})`,
                fontWeight: step.weight,
                letterSpacing: step.weight === 600 ? "var(--tracking-tight)" : undefined,
                lineHeight: `var(${step.leading})`,
              }}
            >
              {step.sample}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
};

export const TypeFoundation = () => (
  <>
    <Block
      id="typography"
      lead="The device's own sans, so the app feels native wherever it opens: San Francisco on Apple devices, Segoe on Windows, Roboto on Android. Seven sizes, each chosen by job. Display figures drop to 500 and lift their cents."
      title="Typography"
    >
      <TypeScale />
    </Block>
    <div className="cl-two">
      <Block lead="Three weights, three jobs. Bold 700 never appears." title="Weights">
        <ul className="cl-weights">
          <li style={{ fontWeight: 400 }}>
            <span>400</span>Sentences and descriptions
          </li>
          <li style={{ fontWeight: 500 }}>
            <span>500</span>Buttons, row titles and display figures
          </li>
          <li style={{ fontWeight: 600 }}>
            <span>600</span>Headings
          </li>
        </ul>
      </Block>
      <Block
        lead="Every digit is the same width, so a figure that is counting up stays put. Press the button and watch the top row shuffle while the bottom one holds."
        title="Figures"
      >
        <Jitter />
      </Block>
    </div>
  </>
);
