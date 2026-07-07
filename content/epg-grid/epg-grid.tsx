"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

/**
 * EPG grid — the TV program guide focus model.
 *
 * The interesting part is vertical navigation: moving up/down doesn't go to
 * the cell with the same index, it goes to the program *airing at the same
 * time* (the "anchor minute"). Horizontal moves update the anchor; vertical
 * moves preserve it. The viewport auto-scrolls to keep focus in view.
 */

type Program = {
  id: string;
  title: string;
  /** minutes from grid start */
  start: number;
  /** minutes from grid start */
  end: number;
};

type Channel = {
  id: string;
  name: string;
  glyph: string;
  hue: number;
  programs: Program[];
};

const PX_PER_MIN = 7;
const GRID_MINUTES = 150;
const NOW_MINUTE = 38;
const ROW_HEIGHT = 52;
const VIEWPORT_WIDTH = 560;
const CONTENT_WIDTH = GRID_MINUTES * PX_PER_MIN;

const CHANNELS: Channel[] = [
  {
    id: "orbit",
    name: "Orbit",
    glyph: "◐",
    hue: 210,
    programs: [
      { id: "o1", title: "Deep Field", start: 0, end: 60 },
      { id: "o2", title: "The Launch Window", start: 60, end: 90 },
      { id: "o3", title: "Signals", start: 90, end: 150 },
    ],
  },
  {
    id: "pulse",
    name: "Pulse",
    glyph: "▲",
    hue: 350,
    programs: [
      { id: "p1", title: "Morning Static", start: 0, end: 30 },
      { id: "p2", title: "Heartline", start: 30, end: 105 },
      { id: "p3", title: "After Hours", start: 105, end: 150 },
    ],
  },
  {
    id: "atlas",
    name: "Atlas",
    glyph: "◆",
    hue: 150,
    programs: [
      { id: "a1", title: "Field Notes", start: 0, end: 45 },
      { id: "a2", title: "Ridgeline", start: 45, end: 75 },
      { id: "a3", title: "The Cartographers", start: 75, end: 120 },
      { id: "a4", title: "Night Maps", start: 120, end: 150 },
    ],
  },
  {
    id: "vault",
    name: "Vault",
    glyph: "●",
    hue: 45,
    programs: [
      { id: "v1", title: "Archive Hour", start: 0, end: 90 },
      { id: "v2", title: "Lost Reels", start: 90, end: 150 },
    ],
  },
];

const minuteToLabel = (minute: number) => {
  const total = 20 * 60 + minute; // grid starts at 8:00 PM
  const hour24 = Math.floor(total / 60) % 24;
  const min = total % 60;
  const hour12 = ((hour24 + 11) % 12) + 1;
  return `${String(hour12)}:${min.toString().padStart(2, "0")}`;
};

const TIME_MARKS = [0, 30, 60, 90, 120];

export const EpgGrid = () => {
  const [focus, setFocus] = useState({ row: 0, col: 0 });
  // The minute vertical navigation anchors to. Horizontal moves rewrite it.
  const anchorRef = useRef(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const focusedProgram = CHANNELS[focus.row]?.programs[focus.col];

  const moveHorizontal = (delta: number) => {
    setFocus((current) => {
      const row = CHANNELS[current.row];
      if (!row) return current;
      const col = current.col + delta;
      const program = row.programs[col];
      if (!program) return current;
      anchorRef.current = Math.max(program.start, 0);
      return { row: current.row, col };
    });
  };

  const moveVertical = (delta: number) => {
    setFocus((current) => {
      const rowIndex = current.row + delta;
      const row = CHANNELS[rowIndex];
      if (!row) return current;
      const anchor = anchorRef.current;
      const col = row.programs.findIndex(
        (program) => program.start <= anchor && anchor < program.end,
      );
      return { row: rowIndex, col: col === -1 ? row.programs.length - 1 : col };
    });
  };

  // Keep the focused program in view, biased 40px from the left edge.
  const scrollX = useMemo(() => {
    if (!focusedProgram) return 0;
    const target = focusedProgram.start * PX_PER_MIN - 40;
    return Math.max(0, Math.min(target, CONTENT_WIDTH - VIEWPORT_WIDTH));
  }, [focusedProgram]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="grid"
      aria-label="Program guide"
      className="w-[640px] overflow-hidden rounded-3xl bg-[#0b0d12] shadow-2xl shadow-black/60 ring-1 ring-white/10 outline-none select-none focus-visible:ring-white/25"
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") moveHorizontal(1);
        else if (event.key === "ArrowLeft") moveHorizontal(-1);
        else if (event.key === "ArrowDown") moveVertical(1);
        else if (event.key === "ArrowUp") moveVertical(-1);
        else return;
        event.preventDefault();
      }}
    >
      {/* Detail strip — updates as focus moves */}
      <div className="flex h-[74px] items-center justify-between px-6">
        <AnimatePresence mode="wait">
          {focusedProgram && (
            <motion.div
              key={focusedProgram.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
            >
              <p className="text-[16px] font-semibold text-white">{focusedProgram.title}</p>
              <p className="mt-0.5 text-[11px] text-white/45">
                {CHANNELS[focus.row]?.name} · {minuteToLabel(focusedProgram.start)} –{" "}
                {minuteToLabel(focusedProgram.end)} PM
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="text-[11px] text-white/30">Arrow keys to browse</p>
      </div>

      <div className="flex border-t border-white/[0.06]">
        {/* Channel rail — pinned while the grid scrolls */}
        <div className="z-10 w-[64px] shrink-0 border-r border-white/[0.06] bg-[#0b0d12]">
          <div className="h-[28px]" />
          {CHANNELS.map((channel) => (
            <div
              key={channel.id}
              className="flex h-[52px] flex-col items-center justify-center gap-0.5"
            >
              <span
                className="text-[13px]"
                style={{ color: `oklch(0.75 0.14 ${String(channel.hue)})` }}
              >
                {channel.glyph}
              </span>
              <span className="text-[9px] font-medium tracking-wide text-white/40 uppercase">
                {channel.name}
              </span>
            </div>
          ))}
        </div>

        {/* Scrolling timeline */}
        <div className="relative overflow-hidden" style={{ width: VIEWPORT_WIDTH }}>
          <motion.div
            animate={{ x: -scrollX }}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
            className="relative"
            style={{ width: CONTENT_WIDTH }}
          >
            {/* Time ruler */}
            <div className="relative h-[28px]">
              {TIME_MARKS.map((mark) => (
                <span
                  key={mark}
                  className="absolute top-1/2 -translate-y-1/2 text-[10px] font-medium text-white/35 tabular-nums"
                  style={{ left: mark * PX_PER_MIN + 8 }}
                >
                  {minuteToLabel(mark)}
                </span>
              ))}
            </div>

            {/* Half-hour gridlines */}
            {TIME_MARKS.map((mark) => (
              <div
                key={mark}
                aria-hidden
                className="absolute top-[28px] bottom-0 w-px bg-white/[0.05]"
                style={{ left: mark * PX_PER_MIN }}
              />
            ))}

            {/* Program rows */}
            {CHANNELS.map((channel, rowIndex) => (
              <div key={channel.id} className="relative" style={{ height: ROW_HEIGHT }}>
                {channel.programs.map((program, colIndex) => {
                  const isFocused = focus.row === rowIndex && focus.col === colIndex;
                  const isPast = program.end <= NOW_MINUTE;
                  const width = (program.end - program.start) * PX_PER_MIN;
                  return (
                    <motion.button
                      key={program.id}
                      type="button"
                      onClick={() => {
                        anchorRef.current = Math.max(program.start, 0);
                        setFocus({ row: rowIndex, col: colIndex });
                        containerRef.current?.focus();
                      }}
                      animate={{
                        scale: isFocused ? 1.03 : 1,
                        backgroundColor: isFocused
                          ? "rgba(255,255,255,0.14)"
                          : "rgba(255,255,255,0.045)",
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className={`absolute top-1 bottom-1 overflow-hidden rounded-lg px-3 text-left ${
                        isFocused ? "z-10 ring-1 ring-white/60" : ""
                      } ${isPast && !isFocused ? "opacity-45" : ""}`}
                      style={{
                        left: program.start * PX_PER_MIN + 2,
                        width: width - 4,
                      }}
                    >
                      <span
                        className={`block truncate text-[12px] font-medium ${
                          isFocused ? "text-white" : "text-white/70"
                        }`}
                      >
                        {program.title}
                      </span>
                      <span className="block text-[10px] text-white/35 tabular-nums">
                        {minuteToLabel(program.start)}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            ))}

            {/* Now line */}
            <div
              aria-hidden
              className="pointer-events-none absolute top-[28px] bottom-0 z-20 w-px bg-red-400/80"
              style={{ left: NOW_MINUTE * PX_PER_MIN }}
            >
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-1 -left-[3px] size-[7px] rounded-full bg-red-400"
              />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="h-4" />
    </div>
  );
};
