import { RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "../components/button";
import { Icon } from "../components/icon";
import { Meter } from "../components/meter";
import { Pending } from "../components/pending";
import { ToolCallRow, ToolCallStack } from "../components/runs";
import { ScrambleText, TypeText } from "../components/text-motion";
import { useReducedMotion } from "../lib/motion";
import { CURVES, MOTION_TOKENS } from "./tokens";
import { cssVars } from "../lib/css-vars";

const Track = ({ dur, curve, run }: { dur: string; curve: string; run: boolean }) => (
  <div className="hx-motion-track">
    <span
      className="hx-motion-dot"
      data-run={run}
      style={cssVars({ "--d": `var(${dur})`, "--e": `var(${curve})` })}
    />
  </div>
);

const useReplay = (replay: number) => {
  const [state, setState] = useState({ replay, run: false });

  if (state.replay !== replay) {
    setState({ replay, run: false });
  }

  useEffect(() => {
    let inner = 0;

    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        setState({ replay, run: true });
      });
    });

    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [replay]);

  return state.run;
};

const TokenRow = ({ token, replay }: { token: (typeof MOTION_TOKENS)[number]; replay: number }) => {
  const [own, setOwn] = useState(0);
  const run = useReplay(replay + own);

  return (
    <tr>
      <td data-label="Token" data-nowrap>
        {token.dur}
      </td>
      <td data-label="Value" data-nowrap>
        {token.ms}
      </td>
      <td data-dim data-label="Curve" data-nowrap>
        {token.curve.replace("--hx-ease-", "")}
      </td>
      <td data-dim data-label="Use for" data-sans data-wide>
        {token.use}
      </td>
      <td className="hx-track-cell" data-label="Demo">
        <Track curve={token.curve} dur={token.dur} run={run} />
      </td>
      <td data-label="Replay">
        <Button
          aria-label={`Replay ${token.dur}`}
          onClick={() => {
            setOwn((value) => value + 1);
          }}
          size="icon-sm"
          variant="ghost"
        >
          <Icon icon={RotateCcw} />
        </Button>
      </td>
    </tr>
  );
};

const Curve = ({ points }: { points: readonly number[] }) => {
  const [x1 = 0, y1 = 0, x2 = 1, y2 = 1] = points;
  const size = 72;

  return (
    <svg aria-hidden height={size} viewBox={`-2 -2 ${size + 4} ${size + 4}`} width={size}>
      <rect fill="none" height={size} stroke="var(--hx-rule)" width={size} x={0} y={0} />
      <path
        d={`M 0 ${size} C ${x1 * size} ${size - y1 * size} ${x2 * size} ${size - y2 * size} ${size} 0`}
        fill="none"
        stroke="var(--hx-ink-1)"
        strokeWidth={1.5}
      />
      <rect
        fill="var(--hx-lamp)"
        height={6}
        stroke="var(--hx-ink-1)"
        width={6}
        x={size - 3}
        y={-3}
      />
    </svg>
  );
};

/** All seven durations and four curves, replayable. Under reduced motion the tokens are zero and each demo jumps to its end. */
export const Motion = () => {
  const reduced = useReducedMotion();
  const [replay, setReplay] = useState(0);
  const [meter, setMeter] = useState(13);
  const [step, setStep] = useState(1);

  return (
    <div className="hx-stack-4">
      <div className="hx-frame">
        <div className="hx-head">
          <span className="hx-head-title hx-code">Durations</span>
          <span className="hx-head-meta hx-code-sm">
            {reduced ? "Motion off: all 0ms" : "7 tokens"}
          </span>
          <div className="hx-head-actions">
            <Button
              onClick={() => {
                setReplay((value) => value + 1);
              }}
              size="sm"
              variant="ghost"
            >
              Replay all
            </Button>
          </div>
        </div>
        <div className="hx-table-wrap">
          <table className="hx-table hx-ftable">
            <thead>
              <tr>
                <th scope="col">Token</th>
                <th scope="col">Value</th>
                <th scope="col">Curve</th>
                <th scope="col">Use for</th>
                <th scope="col">Demo</th>
                <th scope="col">
                  <span className="hx-sr">Replay</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {MOTION_TOKENS.map((token) => (
                <TokenRow key={token.dur} replay={replay} token={token} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="hx-tiles" style={cssVars({ "--tiles": 4 })}>
        {CURVES.map((curve) => (
          <div key={curve.name}>
            <Curve points={curve.points} />
            <span className="hx-code-sm">{curve.name}</span>
            <span className="hx-code-sm hx-ink-3">cubic-bezier({curve.points.join(", ")})</span>
            <span className="hx-caption hx-ink-2">{curve.use}</span>
          </div>
        ))}
      </div>

      <div className="hx-tiles" style={cssVars({ "--tiles": 3 })}>
        <div>
          <span className="hx-label-sm hx-ink-3">Type · 20ms a character</span>
          <span className="hx-heading-sm hx-motion-stage">
            <TypeText replay={replay} text="Mapping applied: 3 columns, 41,806 rows replayed." />
          </span>
          <span className="hx-caption hx-ink-2">
            Runs once as a message lands, and the caret leaves with the last letter.
          </span>
        </div>
        <div>
          <span className="hx-label-sm hx-ink-3">Scramble · 420ms</span>
          <span className="hx-code hx-motion-stage">
            <ScrambleText replay={replay} text="drift_4ac1 · crm.contacts_v7" />
          </span>
          <span className="hx-caption hx-ink-2">
            For an identifier that just changed. A number someone is reading never scrambles.
          </span>
        </div>
        <div>
          <span className="hx-label-sm hx-ink-3">Pending · 800ms, 4 steps</span>
          <span className="hx-row hx-motion-stage">
            <Pending />
            <span className="hx-code-sm hx-ink-2">Replaying 41,806 rows</span>
          </span>
          <span className="hx-caption hx-ink-2">
            Halogen&apos;s single repeating motion. With reduced motion it holds on one square.
          </span>
        </div>
        <div>
          <span className="hx-label-sm hx-ink-3">Wipe · 240ms linear</span>
          <div className="hx-motion-stage" key={`${replay}-${meter}`}>
            <Meter label="Slots busy" max={24} reading={`${meter} / 24`} value={meter} />
          </div>
          <Button
            onClick={() => {
              setMeter(meter > 19 ? 9 : meter + 5);
            }}
            size="sm"
          >
            Change value
          </Button>
        </div>
        <div>
          <span className="hx-label-sm hx-ink-3">Draw · 320ms a hop</span>
          <ToolCallStack label="Draw demo" key={`${replay}-${step}`}>
            <ToolCallRow label="Diff schema" seconds={2} state="done" />
            {step >= 1 ? (
              <ToolCallRow
                label="Map columns"
                seconds={step > 1 ? 9 : undefined}
                state={step > 1 ? "done" : "running"}
                tab={step > 1 ? undefined : "Mapping"}
              />
            ) : null}
            {step >= 2 ? <ToolCallRow label="Replay rows" state="running" tab="Replaying" /> : null}
          </ToolCallStack>
          <Button
            onClick={() => {
              setStep(step >= 2 ? 1 : step + 1);
            }}
            size="sm"
          >
            {step >= 2 ? "Reset" : "Next step"}
          </Button>
        </div>
        <div>
          <span className="hx-label-sm hx-ink-3">Lamp · 260ms, then a 1px halo</span>
          <span className="hx-row hx-motion-stage">
            <Button variant="lamp">Point at me</Button>
          </span>
          <span className="hx-caption hx-ink-2">
            The filament warms from the bottom edge and a hairline halo appears. Press it and the
            light drops back. Its size never changes.
          </span>
        </div>
      </div>
    </div>
  );
};
