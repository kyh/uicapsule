"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

import { Button } from "../components/button";
import { Panel, Shell } from "../components/card";
import { Progress } from "../components/progress";
import { useLater } from "../lib/hooks";

const JOBS = [
  {
    curve: "--ease-out",
    job: "Glass press",
    moves: "Sinks to 0.99 as the core deepens, rising again over 200ms",
    time: "--dur-glass-press 50ms",
  },
  {
    curve: "--ease-out",
    job: "Flat press",
    moves: "A secondary or ghost control gives to 0.97",
    time: "--dur-press 120ms",
  },
  {
    curve: "--ease-out",
    job: "State",
    moves: "Hover washes, a field's line darkening, a tick drawing in",
    time: "--dur-state 160ms",
  },
  {
    curve: "--ease-out",
    job: "Overlay in",
    moves: "Emerges 4px from what opened it; dialogs scale up from 0.97",
    time: "--dur-overlay 200ms",
  },
  {
    curve: "--ease-in",
    job: "Overlay out",
    moves: "Retreats along its entry path, a little faster",
    time: "--dur-state 160ms",
  },
  {
    curve: "--ease-out",
    job: "Slide",
    moves: "Thumbs and tab marks travel to whatever was picked",
    time: "--dur-slide 200ms",
  },
  {
    curve: "linear",
    job: "Pending",
    moves: "The arc on a busy control turns",
    time: "--dur-spin 800ms",
  },
  {
    curve: "linear",
    job: "Indeterminate",
    moves: "A third of the bar travels along the track",
    time: "--dur-sweep 1400ms",
  },
] as const;

const Cell = ({
  title,
  meta,
  onReplay,
  children,
}: {
  title: string;
  meta: string;
  onReplay?: () => void;
  children: ReactNode;
}) => (
  <div className="v-motion-cell">
    <div className="v-motion-track">{children}</div>
    <div className="v-between v-items-end">
      <div className="v-motion-meta">
        <span className="v-label">{title}</span>
        <span className="v-caption v-t2">{meta}</span>
      </div>
      {onReplay ? (
        <Button
          aria-label={`Replay ${title.toLowerCase()}`}
          onClick={onReplay}
          size="icon-sm"
          variant="ghost"
        >
          <RotateCcw aria-hidden />
        </Button>
      ) : null}
    </div>
  </div>
);

const Curve = ({ name, d, ease }: { name: string; d: string; ease: "in" | "out" }) => {
  const [run, setRun] = useState(0);

  return (
    <Cell
      meta={`${name}, over --dur-demo`}
      onReplay={() => {
        setRun((count) => count + 1);
      }}
      title={ease === "out" ? "Ease out" : "Ease in"}
    >
      <svg aria-hidden className="v-curve v-curve-box" viewBox="-2 -2 104 64">
        <path className="v-curve-base" d="M0 60 L100 0" />
        <path d={d} />
      </svg>
      <span className="v-rail">
        <span className="v-run" data-ease={ease} key={run}>
          <span className="v-runner" />
        </span>
      </span>
    </Cell>
  );
};

/** Live, replayable demos of every duration and curve. */
export const MotionFoundation = () => {
  const [held, setHeld] = useState<"glass" | "flat" | null>(null);
  const [state, setState] = useState(false);
  const [overlay, setOverlay] = useState(true);
  const [dialog, setDialog] = useState(true);
  const [slide, setSlide] = useState(false);
  const [pending, setPending] = useState(false);
  const later = useLater();

  const press = (kind: "glass" | "flat") => {
    setHeld(kind);
    later(
      () => {
        setHeld(null);
      },
      kind === "glass" ? 260 : 320,
    );
  };

  const replay = (set: (value: boolean) => void) => {
    set(false);
    later(() => {
      set(true);
    }, 260);
  };

  return (
    <>
      <div className="v-motion-grid">
        <Cell
          meta="50ms down, 200ms up"
          onReplay={() => {
            press("glass");
          }}
          title="Glass press"
        >
          <Button held={held === "glass"}>Grade again</Button>
        </Cell>
        <Cell
          meta="120ms to 0.97"
          onReplay={() => {
            press("flat");
          }}
          title="Flat press"
        >
          <Button held={held === "flat"} variant="secondary">
            Edit prompt
          </Button>
        </Cell>
        <Cell
          meta="160ms, a colour change"
          onReplay={() => {
            setState((value) => !value);
          }}
          title="State"
        >
          <span className="v-field v-motion-field" data-on={state ? "" : undefined}>
            <span className="v-caption v-t2">{state ? "Focused" : "At rest"}</span>
          </span>
        </Cell>
        <Cell
          meta="200ms in, 4px from the trigger"
          onReplay={() => {
            replay(setOverlay);
          }}
          title="Overlay"
        >
          <span className="v-anchor v-motion-anchor">
            <Button size="sm" variant="secondary">
              More
            </Button>
            <span className="v-pop v-overlay v-motion-pop" data-open={overlay ? "" : undefined}>
              <span className="v-caption">Rename</span>
            </span>
          </span>
        </Cell>
        <Cell
          meta="200ms, settles from 0.97"
          onReplay={() => {
            replay(setDialog);
          }}
          title="Dialog"
        >
          <Shell className="v-motion-dialog" data-open={dialog ? "" : undefined}>
            <Panel padded>
              <span className="v-caption">Turn the router off?</span>
            </Panel>
          </Shell>
        </Cell>
        <Cell
          meta="200ms, the thumb moves"
          onReplay={() => {
            setSlide((value) => !value);
          }}
          title="Slide"
        >
          <span className="v-slide-demo v-motion-w" data-on={slide ? "" : undefined}>
            <span />
          </span>
        </Cell>
        <Cell
          meta="800ms a turn, linear"
          onReplay={() => {
            setPending(true);
            later(() => {
              setPending(false);
            }, 2400);
          }}
          title="Pending"
        >
          <Button pending={pending} pendingLabel="Grading" size="sm">
            Grade again
          </Button>
        </Cell>
        <Cell meta="1400ms a pass, linear, until it ends" title="Indeterminate">
          <div className="v-motion-w">
            <Progress label="Embedding tickets" />
          </div>
        </Cell>
        <Curve d="M0 60 C20 12 20 0 100 0" ease="out" name="--ease-out" />
        <Curve d="M0 60 C40 60 100 0 100 0" ease="in" name="--ease-in" />
      </div>
      <div className="v-scroll-x">
        <table className="v-spec-table">
          <thead>
            <tr>
              <th scope="col">Job and what moves</th>
              <th scope="col">Time</th>
              <th scope="col">Curve</th>
            </tr>
          </thead>
          <tbody>
            {JOBS.map((row) => (
              <tr key={row.job}>
                <td>
                  <span className="v-block">{row.job}</span>
                  <span className="v-block v-caption v-t2">{row.moves}</span>
                </td>
                <td className="v-nowrap v-code-sm">{row.time}</td>
                <td className="v-nowrap v-code-sm">{row.curve}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="v-body-sm v-t2 v-measure">
        Every move decelerates into place and stops there: no spring, no bounce, no overshoot. Only
        the busy arc and the indeterminate sweep repeat, and only while the work lasts. With reduced
        motion every duration and press scale drops to nothing and the arc holds still.
      </p>
    </>
  );
};
