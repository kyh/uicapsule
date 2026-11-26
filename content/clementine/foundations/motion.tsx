import { Play } from "lucide-react";
import { useRef, useState, useSyncExternalStore } from "react";

import { AccordionItem } from "../components/accordion";
import { Button } from "../components/button";
import { Spinner } from "../components/spinner";
import { Table } from "../components/table";
import type { TableColumn } from "../components/table";
import { ALL_LIVE_TOKENS, CURVES, DURATIONS } from "../data/tokens";
import { useLiveTokens } from "../lib/live-tokens";
import { Block } from "../shell";

import "./motion.css";

const QUERY = "(prefers-reduced-motion: reduce)";

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(QUERY);

  query.addEventListener("change", onChange);

  return () => {
    query.removeEventListener("change", onChange);
  };
};

const useReducedMotion = () =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );

const Lane = ({
  ms,
  easing,
  label,
  reduced,
}: {
  ms: number;
  easing: string;
  label: string;
  reduced: boolean;
}) => {
  const dot = useRef<HTMLSpanElement>(null);
  const [right, setRight] = useState(false);

  const play = () => {
    const node = dot.current;

    if (!node) {
      return;
    }

    const span = (node.parentElement?.clientWidth ?? 20) - 20;
    const at = (end: boolean) => `translateX(${String(end ? span : 0)}px)`;
    node.animate([{ transform: at(right) }, { transform: at(!right) }], {
      duration: reduced ? 0 : ms,
      easing,
      fill: "forwards",
    });
    setRight(!right);
  };

  return (
    <div className="cl-lane">
      <Button aria-label={`Play ${label}`} onClick={play} size="icon-sm" variant="secondary">
        <Play aria-hidden size={14} strokeWidth={2} />
      </Button>
      <span aria-hidden className="cl-lane__track">
        <span className="cl-lane__dot" ref={dot} />
      </span>
    </div>
  );
};

const parseCurve = (css: string) => {
  const numbers = css.match(/-?[0-9.]+/gu)?.map(Number) ?? [];

  return numbers.length === 4 ? numbers : [0.25, 0.1, 0.25, 1];
};

const CurvePlot = ({ points }: { points: readonly number[] }) => {
  const [x1 = 0, y1 = 0, x2 = 1, y2 = 1] = points;
  const s = 96;

  return (
    <svg aria-hidden className="cl-curve" viewBox={`-6 -6 ${s + 12} ${s + 12}`}>
      <rect className="cl-curve__box" height={s} width={s} x={0} y={0} />
      <line className="cl-curve__handle" x1={0} x2={x1 * s} y1={s} y2={s - y1 * s} />
      <line className="cl-curve__handle" x1={s} x2={x2 * s} y1={0} y2={s - y2 * s} />
      <path
        className="cl-curve__path"
        d={`M0 ${s} C ${x1 * s} ${s - y1 * s}, ${x2 * s} ${s - y2 * s}, ${s} 0`}
      />
    </svg>
  );
};

const JobDemos = () => {
  const [card, setCard] = useState(false);
  const [panel, setPanel] = useState(false);

  return (
    <div className="cl-jobs">
      <div className="cl-job">
        <h4 className="cl-h4">Press</h4>
        <p className="cl-note">
          The color shifts at once and the button squeezes to 0.97 while held.
        </p>
        <Button>Hold me down</Button>
      </div>
      <div className="cl-job">
        <h4 className="cl-h4">Arrive and leave</h4>
        <p className="cl-note">
          Grows in from 0.96 on ease-out; leaves on ease-in, a step quicker.
        </p>
        <div className="cl-job__row">
          <Button
            onClick={() => {
              setCard(!card);
            }}
            variant="secondary"
          >
            {card ? "Hide" : "Show"} the note
          </Button>
          <span className="cl-enter" data-open={card || undefined}>
            $35.00 set aside for Kyoto
          </span>
        </div>
      </div>
      <div className="cl-job">
        <h4 className="cl-h4">Open a panel</h4>
        <p className="cl-note">Height is allowed to move here and nowhere else.</p>
        <AccordionItem onOpenChange={setPanel} open={panel} title="Why is water higher this month?">
          <p>
            Riverside Water added $2.40 to its standing charge on November 1. You used the same
            amount of water as October.
          </p>
        </AccordionItem>
      </div>
      <div className="cl-job">
        <h4 className="cl-h4">Waiting</h4>
        <p className="cl-note">Nothing loops except the spinner, one turn per second.</p>
        <span className="cl-job__spin">
          <Spinner label="Loading" />
          Asking Harbor Credit Union
        </span>
      </div>
    </div>
  );
};

type Duration = (typeof DURATIONS)[number];

export const MotionFoundation = () => {
  const reduced = useReducedMotion();
  const tokens = useLiveTokens(ALL_LIVE_TOKENS);
  const read = (name: string) => tokens?.light.get(name) ?? "";

  const toMs = (name: string) => {
    const raw = read(name).trim();
    const ms = raw.endsWith("ms") ? Number(raw.slice(0, -2)) : Number(raw.slice(0, -1)) * 1000;

    return raw === "" || Number.isNaN(ms) ? null : ms;
  };

  const easeOut = read("--ease-out") || "ease-out";

  const columns = [
    {
      header: "Token",
      key: "token",
      render: (row: Duration) => <span className="cl-mono">{row.token}</span>,
    },
    {
      header: "Time",
      key: "time",
      label: "Time",
      numeric: true,
      render: (row: Duration) => {
        const ms = toMs(row.token);

        return ms === null ? "…" : `${String(Math.round(ms))}ms`;
      },
    },
    { header: "Used for", key: "use", label: "Used for", render: (row: Duration) => row.use },
    {
      header: <span className="cl-sr">Replay</span>,
      key: "lane",
      render: (row: Duration) => (
        <Lane easing={easeOut} label={row.token} ms={toMs(row.token) ?? 0} reduced={reduced} />
      ),
    },
  ] satisfies TableColumn<Duration>[];

  return (
    <>
      <Block
        id="motion"
        lead={
          reduced
            ? "Your device asks for less motion, so every duration reads 0ms here and nothing slides. Only the spinner still turns."
            : "Short, and only when something changed. Press play on a row to watch its duration."
        }
        title="Motion"
      >
        <Table
          caption="Durations, what each is for, and a replay"
          columns={columns}
          rowKey={(row) => row.token}
          rows={DURATIONS}
        />
      </Block>
      <Block lead="Two curves. Nothing bounces, springs or overshoots." title="Curves">
        <ul className="cl-curves">
          {CURVES.map((curve) => {
            const css = read(curve.token);

            return (
              <li key={curve.token}>
                <CurvePlot points={parseCurve(css)} />
                <div className="cl-curves__text">
                  <span className="cl-mono">{curve.token}</span>
                  <span className="cl-mono cl-curves__css">
                    {css ? css.replaceAll(/(?<!\d)\./gu, "0.") : "…"}
                  </span>
                  <p className="cl-note">{curve.use}</p>
                  <Lane
                    easing={css || "ease"}
                    label={`${curve.token} over 600ms`}
                    ms={600}
                    reduced={reduced}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </Block>
      <Block
        lead="Each job gets one duration and one curve, and keeps them everywhere."
        title="By job"
      >
        <JobDemos />
      </Block>
    </>
  );
};
