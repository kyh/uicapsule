import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { Play } from "lucide-react";

import { Button } from "../components/button";
import { Icon } from "../components/icon";
import { Status } from "../components/status";
import { cssVars } from "../lib/css";
import { useReducedMotion } from "../lib/hooks";
import { Foundation, Rules, Stage } from "./section";

const JOBS = [
  {
    curve: "--fj-ease",
    job: "Press",
    moves: "A button sinks to 97% while held",
    token: "--fj-dur-press",
  },
  {
    curve: "--fj-ease",
    job: "Hover",
    moves: "Fills and edges of rows, chips and buttons",
    token: "--fj-dur-fast",
  },
  {
    curve: "--fj-ease",
    job: "Overlay in",
    moves: "Menus, popovers and toasts arrive by opacity alone",
    token: "--fj-dur-base",
  },
  {
    curve: "--fj-ease",
    job: "Dialog",
    moves: "The sheet and the dimmed page arrive as one",
    token: "--fj-dur-slow",
  },
  {
    curve: "--fj-ease-arc",
    job: "Running",
    moves: "One full turn of the status arc",
    token: "--fj-dur-arc",
  },
  {
    curve: "--fj-ease",
    job: "Unknown length",
    moves: "One sweep of the bar that has no end yet",
    token: "--fj-dur-slide",
  },
] as const;

const TOKENS = [...new Set(JOBS.flatMap((job) => [job.token, job.curve]))];

const readable = (raw: string) => {
  const value = raw.trim();
  const seconds = /^(?<amount>[\d.]+)s$/u.exec(value)?.groups?.amount;

  if (seconds !== undefined) {
    return `${Math.round(Number(seconds) * 1000)}ms`;
  }

  return value.replaceAll(/(?<lead>^|[\s,(])\./gu, "$<lead>0.");
};

const useTokens = (ref: RefObject<HTMLElement | null>) => {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const node = ref.current;

    if (!node) {
      return;
    }

    const style = getComputedStyle(node);

    setValues(
      Object.fromEntries(TOKENS.map((token) => [token, readable(style.getPropertyValue(token))])),
    );
  }, [ref]);

  return values;
};

const FLIP = ["running", "fail"] as const;

export const MotionFoundation = () => {
  const [run, setRun] = useState(0);
  const [flip, setFlip] = useState(0);
  const [shown, setShown] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const tokens = useTokens(root);
  const reduced = useReducedMotion();
  const status = FLIP[flip % 2] ?? "running";

  return (
    <Foundation
      id="motion"
      lede="Fjord moves for a tenth to a fifth of a second, on one curve that starts quick and lands soft. A status word swaps without a fade, and only work still in progress is allowed to loop."
      title="Motion"
    >
      <div className="fj-vstack" data-gap="24" ref={root}>
        <Stage>
          <div className="fj-motion-head">
            <p className="fj-t-label">Every duration, read from the tokens</p>
            <Button
              onClick={() => {
                setRun((value) => value + 1);
              }}
              size="sm"
              variant="primary"
            >
              <Icon icon={Play} />
              Play all
            </Button>
          </div>
          <ul className="fj-motion-list">
            {JOBS.map((job) => (
              <li key={job.token}>
                <span className="fj-t-label">{job.job}</span>
                <span aria-hidden className="fj-motion-track">
                  <span
                    className="fj-motion-dot"
                    key={`${job.token}-${run.toString()}`}
                    style={cssVars({
                      "--fj-ms": `var(${job.token})`,
                      "--fj-curve": `var(${job.curve})`,
                    })}
                  />
                </span>
                <span className="fj-data fj-c-2">{tokens[job.token]}</span>
              </li>
            ))}
          </ul>
          {reduced ? (
            <p className="fj-t-body-sm fj-c-2">
              Your system asks for less motion, so each mark lands at once and the arc holds still.
            </p>
          ) : null}
        </Stage>

        <div className="fj-card">
          <div className="fj-scroll-x">
            <table className="fj-table">
              <caption className="fj-sr">Durations and curves by job</caption>
              <thead>
                <tr>
                  <th scope="col">Job</th>
                  <th scope="col">Duration</th>
                  <th scope="col">Curve</th>
                  <th scope="col">What moves</th>
                </tr>
              </thead>
              <tbody>
                {JOBS.map((job) => (
                  <tr key={job.token}>
                    <th scope="row">{job.job}</th>
                    <td className="fj-c-2">
                      <code className="fj-t-code-sm">{job.token}</code> {tokens[job.token]}
                    </td>
                    <td>
                      <code className="fj-t-code-sm fj-c-2">{tokens[job.curve]}</code>
                    </td>
                    <td className="fj-c-2 fj-t-body-sm">{job.moves}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="fj-three">
        <Stage>
          <p className="fj-t-label">A status swaps</p>
          <div className="fj-motion-demo">
            <Status status={status} />
          </div>
          <Button
            onClick={() => {
              setFlip((value) => value + 1);
            }}
            size="sm"
          >
            Flip the status
          </Button>
          <p className="fj-t-body-sm fj-c-2">
            Crossfading Running into Failed would leave both words on screen at half strength for a
            moment, so the new word replaces the old in one frame.
          </p>
        </Stage>
        <Stage>
          <p className="fj-t-label">An overlay arrives</p>
          <div className="fj-motion-demo">
            {shown ? (
              <div className="fj-overlay fj-motion-pop">
                <span className="fj-t-label">Rebase agent/pin-undici</span>
                <span className="fj-t-body-sm fj-c-2">14 commits behind main</span>
              </div>
            ) : (
              <span className="fj-t-body-sm fj-c-3">Nothing open</span>
            )}
          </div>
          <Button
            aria-pressed={shown}
            onClick={() => {
              setShown((value) => !value);
            }}
            size="sm"
          >
            {shown ? "Close it" : "Open it"}
          </Button>
          <p className="fj-t-body-sm fj-c-2">
            It fades in over --fj-dur-base and keeps its size, so the text is readable from the
            first frame.
          </p>
        </Stage>
        <Stage>
          <p className="fj-t-label">Work in progress turns</p>
          <div className="fj-motion-demo">
            <Status status="running">Signing 3 commits</Status>
          </div>
          <p className="fj-t-body-sm fj-c-2">
            The arc makes one turn per --fj-dur-arc. It stops while it is off screen, and it holds
            still when the system asks for less motion.
          </p>
        </Stage>
      </div>

      <Rules
        items={[
          {
            id: "hue-never-tweens",
            text: "A kind's color changes in one step. Halfway between teal and blue is a third kind that does not exist.",
          },
          {
            id: "open-with-a-cut",
            text: "A section that expands is at full height in the next frame. Growing it pushes every row below it down while you try to read them.",
          },
          {
            id: "move-only-what-changed",
            text: "Nothing breathes, glows or sweeps to look busy. If an element moves, its value or its state just changed.",
          },
        ]}
      />
    </Foundation>
  );
};
