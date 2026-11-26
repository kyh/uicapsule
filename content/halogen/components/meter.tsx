import type { CSSProperties } from "react";

interface MeterProps {
  label: string;
  value: number;
  max: number;
  reading: string;
  warnAt?: number;
  failAt?: number;
}

const toneFor = (share: number, warnAt?: number, failAt?: number) => {
  if (failAt !== undefined && share >= failAt) {
    return "fail" as const;
  }

  if (warnAt !== undefined && share >= warnAt) {
    return "warn" as const;
  }

  return "lamp" as const;
};

const TONE_WORD = { fail: "Over limit", lamp: "", warn: "Near limit" } as const;

/** A labelled rail with a threshold tick; crossing `warnAt` or `failAt` adds a word and recolours the fill. */
export const Meter = ({ label, value, max, reading, warnAt, failAt }: MeterProps) => {
  const share = value / max;
  const tone = toneFor(share, warnAt, failAt);
  const word = TONE_WORD[tone];

  return (
    <div className="hx-meter">
      <meter
        aria-label={label}
        aria-valuetext={`${reading}${word ? `, ${word}` : ""}`}
        className="hx-sr"
        max={max}
        min={0}
        value={value}
      >
        {reading}
      </meter>
      <div className="hx-meter-head">
        <span aria-hidden className="hx-label-sm hx-ink-3">
          {label}
        </span>
        {word ? (
          <span className={`hx-label-sm hx-status hx-${tone}-text`}>
            <span className="hx-mark" data-status={tone} />
            {word}
          </span>
        ) : null}
        <span className="hx-code hx-end">{reading}</span>
      </div>
      <div aria-hidden className="hx-meter-track">
        <div
          className="hx-meter-fill"
          data-tone={tone === "lamp" ? undefined : tone}
          style={{ "--value": `${Math.min(100, share * 100)}%` } as CSSProperties}
        />
        {warnAt === undefined ? null : (
          <span className="hx-meter-tick" style={{ "--at": `${warnAt * 100}%` } as CSSProperties} />
        )}
      </div>
    </div>
  );
};

interface ProgressProps {
  label: string;
  done: number;
  total: number;
  cells?: number;
  live?: boolean;
  reading?: string;
}

/** Countable progress as a row of cells, the current one lit. */
export const Progress = ({ label, done, total, cells = 24, live, reading }: ProgressProps) => {
  const filled = Math.floor((done / total) * cells);
  const slots = Array.from({ length: cells }, (_, index) => `cell-${index}`);

  return (
    <div className="hx-meter">
      <progress aria-label={label} className="hx-sr" max={total} value={done}>
        {reading ?? `${done} / ${total}`}
      </progress>
      <div className="hx-meter-head">
        <span className="hx-label-sm hx-ink-3">{label}</span>
        <span className="hx-code hx-end">{reading ?? `${done} / ${total}`}</span>
      </div>
      <div aria-hidden className="hx-progress" style={{ "--cells": cells } as CSSProperties}>
        {slots.map((key, index) => (
          <span
            data-live={live === true && index === filled && done < total ? true : undefined}
            data-on={index < filled ? true : undefined}
            key={key}
          />
        ))}
      </div>
    </div>
  );
};
