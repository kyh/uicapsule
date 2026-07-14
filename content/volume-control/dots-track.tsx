"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { EraserIcon, ScanLineIcon } from "lucide-react";

import type { MotionValue } from "motion/react";

import { clampVolume } from "./volume-scale";

const COLS = 5;
const ROWS = 7;
const CELL_SIZE = COLS * ROWS;
const DOT = 13;
const DOT_GAP = 5;

/** The dots, as fixed positions rather than an anonymous array — so each one can
 * carry its own key and say where it lives out loud for a screen reader. */
const POSITIONS = Array.from({ length: CELL_SIZE }, (_, index) => ({
  index,
  row: Math.floor(index / COLS) + 1,
  column: (index % COLS) + 1,
}));

/** A 5×7 glyph for every digit — the machine's entire idea of what numbers look
 * like. It matches whatever you draw against these and picks a winner, no matter
 * how little your drawing deserves one. */
const GLYPHS: readonly (readonly string[])[] = [
  ["01110", "10001", "10011", "10101", "11001", "10001", "01110"], // 0
  ["00100", "01100", "00100", "00100", "00100", "00100", "01110"], // 1
  ["01110", "10001", "00001", "00010", "00100", "01000", "11111"], // 2
  ["11111", "00010", "00100", "00010", "00001", "10001", "01110"], // 3
  ["00010", "00110", "01010", "10010", "11111", "00010", "00010"], // 4
  ["11111", "10000", "11110", "00001", "00001", "10001", "01110"], // 5
  ["00110", "01000", "10000", "11110", "10001", "10001", "01110"], // 6
  ["11111", "00001", "00010", "00100", "01000", "01000", "01000"], // 7
  ["01110", "10001", "10001", "01110", "10001", "10001", "01110"], // 8
  ["01110", "10001", "10001", "01111", "00001", "00010", "01100"], // 9
];

const GLYPH_CELLS: readonly (readonly boolean[])[] = GLYPHS.map((rows) =>
  Array.from(rows.join(""), (bit) => bit === "1"),
);

const EMPTY_CELL = (): boolean[] => Array.from({ length: CELL_SIZE }, () => false);

/** How many lit dots it takes before the machine bothers looking at a cell. Under
 * this, the cell is blank and the digit is a zero. */
const INK_THRESHOLD = 3;

/**
 * Nearest glyph wins, full stop. There is no "I'm not sure" — every drawing is
 * read as *something*, and a lazy 7 becoming a 1 is the entire point of the
 * exercise. Ties go to the lower digit, purely so it's deterministic.
 */
const readCell = (cells: boolean[]): number => {
  const ink = cells.filter(Boolean).length;
  if (ink < INK_THRESHOLD) return 0;

  let best = 0;
  let bestScore = -1;
  GLYPH_CELLS.forEach((glyph, digit) => {
    let score = 0;
    for (let index = 0; index < CELL_SIZE; index += 1) {
      if (cells[index] === glyph[index]) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = digit;
    }
  });
  return best;
};

const SCAN_MS = 620;

type DotsTrackProps = {
  volume: MotionValue<number>;
};

/**
 * The machine reads dot-matrix. It does not read sliders, it does not read
 * numbers you type — it reads dots. So draw the volume you want, digit by digit,
 * and it will squint at your handwriting and commit to whatever it decides you
 * meant. Two cells, which is to say the loudest this thing goes is 99.
 */
export const DotsTrack = ({ volume }: DotsTrackProps) => {
  const reduceMotion = useReducedMotion();
  const [tens, setTens] = useState<boolean[]>(EMPTY_CELL);
  const [ones, setOnes] = useState<boolean[]>(EMPTY_CELL);
  const [scanning, setScanning] = useState(false);
  const [verdict, setVerdict] = useState<number | null>(null);

  /** What we're painting for the length of this drag: on, or off. Set by whichever
   * dot you pressed first, so a drag never flickers dots on and off under itself. */
  const painting = useRef<boolean | null>(null);
  const scanTimer = useRef(0);

  useEffect(() => () => window.clearTimeout(scanTimer.current), []);

  const paint = (cell: "tens" | "ones", index: number, value: boolean) => {
    const setter = cell === "tens" ? setTens : setOnes;
    setter((current) => current.map((lit, position) => (position === index ? value : lit)));
    setVerdict(null);
  };

  const handleDotDown = (cell: "tens" | "ones", index: number, lit: boolean) => {
    painting.current = !lit;
    paint(cell, index, !lit);
  };

  const handleDotEnter = (cell: "tens" | "ones", index: number) => {
    if (painting.current === null) return;
    paint(cell, index, painting.current);
  };

  const clear = () => {
    setTens(EMPTY_CELL());
    setOnes(EMPTY_CELL());
    setVerdict(null);
  };

  const read = () => {
    const value = clampVolume(readCell(tens) * 10 + readCell(ones));

    if (reduceMotion) {
      setVerdict(value);
      volume.set(value);
      return;
    }

    // The scan is theatre, but it's the theatre that sells the misread: you watch
    // it look, and then you watch it be wrong with total confidence.
    setScanning(true);
    setVerdict(null);
    scanTimer.current = window.setTimeout(() => {
      setScanning(false);
      setVerdict(value);
      volume.set(value);
    }, SCAN_MS);
  };

  return (
    <div
      onPointerUp={() => {
        painting.current = null;
      }}
      onPointerLeave={() => {
        painting.current = null;
      }}
      className="flex items-center gap-5"
    >
      <div className="relative flex gap-3 rounded-2xl bg-neutral-950/80 p-3">
        <DotCell label="tens" cells={tens} onDown={handleDotDown} onEnter={handleDotEnter} />
        <DotCell label="ones" cells={ones} onDown={handleDotDown} onEnter={handleDotEnter} />

        <AnimatePresence>
          {scanning && (
            <motion.span
              key="scan"
              aria-hidden
              className="pointer-events-none absolute inset-y-2 w-10 rounded-full bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent blur-[2px]"
              initial={{ left: 0, opacity: 0 }}
              animate={{ left: "calc(100% - 40px)", opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: SCAN_MS / 1000, ease: "linear" }}
            />
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-1 flex-col items-start gap-3">
        <div aria-live="polite" className="min-h-[52px]">
          <p className="text-[11px] tracking-wide text-neutral-500 uppercase">Reads as</p>
          <p className="text-[30px] leading-tight font-semibold tabular-nums text-emerald-300">
            {scanning ? (
              <span className="text-neutral-600">scanning…</span>
            ) : verdict === null ? (
              <span className="text-neutral-700">—</span>
            ) : (
              verdict
            )}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={read}
            disabled={scanning}
            className="flex items-center gap-1.5 rounded-full border border-emerald-400/50 bg-emerald-400/10 px-3 py-1.5 text-[13px] text-neutral-100 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 disabled:opacity-50"
          >
            <ScanLineIcon className="size-3.5 text-emerald-300" />
            Read
          </button>
          <button
            type="button"
            onClick={clear}
            className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-[13px] text-neutral-300 outline-none hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <EraserIcon className="size-3.5 text-neutral-400" />
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

type DotCellProps = {
  label: "tens" | "ones";
  cells: boolean[];
  onDown: (cell: "tens" | "ones", index: number, lit: boolean) => void;
  onEnter: (cell: "tens" | "ones", index: number) => void;
};

const DotCell = ({ label, cells, onDown, onEnter }: DotCellProps) => (
  <div
    className="grid"
    style={{
      gridTemplateColumns: `repeat(${COLS}, ${DOT}px)`,
      gap: DOT_GAP,
      touchAction: "none",
    }}
  >
    {POSITIONS.map((dot) => {
      const lit = cells[dot.index] ?? false;
      return (
        <button
          key={`${label}-${dot.row}-${dot.column}`}
          type="button"
          aria-pressed={lit}
          aria-label={`${label} digit, row ${dot.row}, column ${dot.column}`}
          onPointerDown={() => onDown(label, dot.index, lit)}
          onPointerEnter={() => onEnter(label, dot.index)}
          style={{ width: DOT, height: DOT, margin: 0 }}
          className={`rounded-full outline-none transition-colors duration-75 focus-visible:ring-2 focus-visible:ring-white/70 ${
            lit
              ? "bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.65)]"
              : "bg-neutral-800 hover:bg-neutral-700"
          }`}
        />
      );
    })}
  </div>
);
