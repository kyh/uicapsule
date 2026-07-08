"use client";

import type { ReactNode } from "react";
import {
  FastForward,
  Headphones,
  Info,
  Mic,
  Phone,
  PhoneOff,
  Plane,
  Play,
  Rewind,
  ScreenShare,
  Video,
} from "lucide-react";
import { motion } from "motion/react";

export type ExpandedWidgetView = "music" | "call" | "memo" | "recording" | "incoming" | "flight";

export type ExpandedWidgetOption = {
  view: ExpandedWidgetView;
  label: string;
};

export const expandedWidgetOptions: ExpandedWidgetOption[] = [
  { view: "music", label: "music" },
  { view: "call", label: "call" },
  { view: "memo", label: "memo" },
  { view: "recording", label: "record" },
  { view: "incoming", label: "incoming" },
  { view: "flight", label: "flight" },
];

// Tokens from the Figma widget pack (Dynamic island pack → variable defs):
// bg/black-solid, text/disabled, bg/overlay-alpha-secondary, red/500,
// text/error-primary, green/500, border/tertiary, pink/500, fuchsia/500.
const ISLAND_BG = "#0a0a0a";
const TEXT_MUTED = "#a3a3a3";
const DARK_BUTTON = "rgba(26,26,26,0.75)";
const RED = "#ef4444";
const RED_DEEP = "#dc2626";
const GREEN = "#16b364";
const RING = "#e5e5e5";
const PINK = "#ec4899";

// Label-1 (16/22, -0.18) and Label-3 (12/16, -0.12) from the pack's type ramp.
const TITLE_CLASS = "truncate text-[16px] leading-[22px] tracking-[-0.18px]";
const SUBTITLE_CLASS = "truncate text-xs leading-4 tracking-[-0.12px]";

type ExpandedWidgetProps = {
  view: ExpandedWidgetView;
};

export function ExpandedWidget({ view }: ExpandedWidgetProps) {
  switch (view) {
    case "music":
      return <MusicExpanded />;
    case "call":
      return <OngoingCallExpanded />;
    case "memo":
      return <VoiceMemoExpanded />;
    case "recording":
      return <ScreenRecordingExpanded />;
    case "incoming":
      return <IncomingCallExpanded />;
    case "flight":
      return <FlightExpanded />;
  }
}

function MusicExpanded() {
  return (
    <div
      className="flex w-[376px] max-w-[calc(100vw-40px)] flex-col gap-3 rounded-[32px] p-6 text-white"
      style={{ backgroundColor: ISLAND_BG }}
    >
      <div className="flex items-center gap-2">
        <AlbumArt />
        <div className="min-w-0 flex-1">
          <p className={TITLE_CLASS}>Selfless</p>
          <p className={SUBTITLE_CLASS} style={{ color: TEXT_MUTED }}>
            The New Abnormal
          </p>
        </div>
        <Equalizer />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs tracking-[-0.12px] tabular-nums" style={{ color: TEXT_MUTED }}>
          0:44
        </span>
        <div
          className="h-2 flex-1 overflow-hidden rounded-full"
          style={{ backgroundColor: DARK_BUTTON }}
        >
          <div className="h-full w-[34.5%] rounded-full" style={{ backgroundColor: PINK }} />
        </div>
        <span className="text-xs tracking-[-0.12px] tabular-nums" style={{ color: TEXT_MUTED }}>
          -3:00
        </span>
      </div>
      <div className="flex items-center justify-center gap-6">
        <Rewind aria-hidden="true" className="size-6" fill="currentColor" strokeWidth={0} />
        <Play aria-hidden="true" className="size-8" fill="currentColor" strokeWidth={0} />
        <FastForward aria-hidden="true" className="size-6" fill="currentColor" strokeWidth={0} />
      </div>
    </div>
  );
}

// Five-bar equalizer fading pink/500 → fuchsia/500 like the pack's glyph.
const EQ_BARS = [
  { id: "eq-0", color: "#db2777", height: 10, delay: 0 },
  { id: "eq-1", color: "#ec4899", height: 18, delay: 0.15 },
  { id: "eq-2", color: "#ec4899", height: 13, delay: 0.3 },
  { id: "eq-3", color: "#d946ef", height: 20, delay: 0.1 },
  { id: "eq-4", color: "#c026d3", height: 12, delay: 0.25 },
];

function Equalizer() {
  return (
    <div aria-hidden className="flex h-[22px] items-center gap-[3px]">
      {EQ_BARS.map((bar) => (
        <motion.span
          key={bar.id}
          className="w-[3px] rounded-full"
          style={{ backgroundColor: bar.color, height: bar.height }}
          animate={{ scaleY: [1, 0.55, 0.85, 1] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut", delay: bar.delay }}
        />
      ))}
    </div>
  );
}

function OngoingCallExpanded() {
  return (
    <div
      className="flex w-[376px] max-w-[calc(100vw-40px)] flex-col gap-3 rounded-[32px] p-6 text-white"
      style={{ backgroundColor: ISLAND_BG }}
    >
      <div className="flex items-center gap-2">
        <Avatar />
        <div className="min-w-0 flex-1">
          <p className={TITLE_CLASS}>Mike Wheeler</p>
          <p className={SUBTITLE_CLASS} style={{ color: TEXT_MUTED }}>
            FaceTime Audio
          </p>
        </div>
        <Info aria-hidden="true" className="size-[22px]" strokeWidth={1.5} />
      </div>
      <div className="flex items-center justify-between">
        <RoundAction label="Audio route" tone="light">
          <Headphones aria-hidden="true" className="size-[22px]" strokeWidth={1.8} />
        </RoundAction>
        <RoundAction label="Mute microphone" tone="light">
          <Mic aria-hidden="true" className="size-[22px]" strokeWidth={1.8} />
        </RoundAction>
        <RoundAction label="Video" tone="dark">
          <Video aria-hidden="true" className="size-[22px]" strokeWidth={1.8} />
        </RoundAction>
        <RoundAction label="Share screen" tone="dark">
          <ScreenShare aria-hidden="true" className="size-[22px]" strokeWidth={1.8} />
        </RoundAction>
        <RoundAction label="End call" tone="danger">
          <PhoneOff aria-hidden="true" className="size-[22px]" strokeWidth={1.8} />
        </RoundAction>
      </div>
    </div>
  );
}

// Waveform heights straight from the mock; the last bar fades and hands off to
// a dot trail (red/50 at 40%) for the unrecorded remainder.
const MEMO_BARS = [25, 20, 16, 20, 25, 20, 14, 10, 16, 22, 27, 15, 19].map((height, index) => ({
  id: `memo-${index}`,
  height,
}));
const MEMO_DOTS = Array.from({ length: 11 }, (_, index) => `dot-${index}`);

function VoiceMemoExpanded() {
  return (
    <div
      className="flex w-[376px] max-w-[calc(100vw-40px)] items-center gap-3 rounded-full p-6 text-white"
      style={{ backgroundColor: ISLAND_BG }}
    >
      <div aria-hidden className="flex h-11 shrink-0 items-center gap-[2px]">
        {MEMO_BARS.map(({ id, height }, index) => (
          <motion.span
            key={id}
            className="w-[3px] shrink-0 rounded-[4px]"
            style={{ backgroundColor: RED, height }}
            animate={{ scaleY: [1, 0.6, 0.9, 1] }}
            transition={{
              duration: 0.9 + (index % 4) * 0.12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: (index % 5) * 0.09,
            }}
          />
        ))}
        <span
          className="h-3 w-[3px] shrink-0 rounded-[4px] opacity-40"
          style={{ backgroundColor: RED }}
        />
        {MEMO_DOTS.map((id) => (
          <span key={id} className="size-[3px] shrink-0 rounded-[4px] bg-[#fef2f2] opacity-40" />
        ))}
      </div>
      <span
        className="min-w-0 flex-1 text-right text-[17px] tabular-nums"
        style={{ color: RED_DEEP }}
      >
        05:00
      </span>
      <StopButton label="Stop recording" />
    </div>
  );
}

function ScreenRecordingExpanded() {
  return (
    <div
      className="flex w-[376px] max-w-[calc(100vw-40px)] items-center gap-3 rounded-full p-6 text-white"
      style={{ backgroundColor: ISLAND_BG }}
    >
      <span className={`flex-1 ${TITLE_CLASS}`}>Screen Recording</span>
      <div className="flex shrink-0 items-center gap-1">
        <motion.span
          aria-hidden
          className="size-2 rounded-full"
          style={{ backgroundColor: RED }}
          animate={{ opacity: [1, 0.25, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
        <span className="text-[17px] tabular-nums" style={{ color: RED_DEEP }}>
          05:00
        </span>
      </div>
      <StopButton label="Stop screen recording" />
    </div>
  );
}

function IncomingCallExpanded() {
  return (
    <div
      className="flex w-[376px] max-w-[calc(100vw-40px)] items-center gap-2 rounded-full p-6 text-white"
      style={{ backgroundColor: ISLAND_BG }}
    >
      <Avatar />
      <div className="min-w-0 flex-1">
        <p className={`${TITLE_CLASS} font-semibold`}>Mike Wheeler</p>
        <p className={SUBTITLE_CLASS} style={{ color: TEXT_MUTED }}>
          Mobile
        </p>
      </div>
      <button
        aria-label="Decline call"
        className="grid size-11 shrink-0 place-items-center rounded-full transition-transform hover:scale-105 active:scale-95"
        style={{ backgroundColor: RED_DEEP }}
        type="button"
      >
        <PhoneOff aria-hidden="true" className="size-[22px]" strokeWidth={1.8} />
      </button>
      <button
        aria-label="Accept call"
        className="grid size-11 shrink-0 place-items-center rounded-full transition-transform hover:scale-105 active:scale-95"
        style={{ backgroundColor: GREEN }}
        type="button"
      >
        <motion.span
          className="grid place-items-center"
          animate={{ rotate: [0, -14, 12, -9, 7, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }}
        >
          <Phone aria-hidden="true" className="size-[22px]" strokeWidth={1.8} />
        </motion.span>
      </button>
    </div>
  );
}

function FlightExpanded() {
  return (
    <div
      className="flex w-[376px] max-w-[calc(100vw-40px)] flex-col gap-4 rounded-[32px] p-6 text-white"
      style={{ backgroundColor: ISLAND_BG }}
    >
      <div className="flex items-center gap-2">
        <div
          className="grid size-12 shrink-0 place-items-center rounded-2xl"
          style={{ backgroundColor: DARK_BUTTON }}
        >
          <Plane aria-hidden="true" className="size-6 text-[#a78bfa]" fill="currentColor" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={TITLE_CLASS}>Departure</p>
          <p className={SUBTITLE_CLASS} style={{ color: TEXT_MUTED }}>
            On time
          </p>
        </div>
        <span className="text-[28px] leading-none font-light tabular-nums">TL104</span>
      </div>
      <div className="flex items-center gap-2">
        <Plane aria-hidden="true" className="size-5" style={{ color: GREEN }} fill="currentColor" />
        <div
          className="h-2 flex-1 overflow-hidden rounded-full"
          style={{ backgroundColor: DARK_BUTTON }}
        >
          <div className="h-full w-[72%] rounded-full" style={{ backgroundColor: GREEN }} />
        </div>
        <span className="text-xs tracking-[-0.12px]" style={{ color: TEXT_MUTED }}>
          LAX
        </span>
      </div>
      <button
        className="h-12 w-full rounded-full bg-white text-[15px] font-medium text-black transition-transform hover:scale-[1.02] active:scale-[0.98]"
        type="button"
      >
        Show Boarding Pass
      </button>
    </div>
  );
}

// Stop control shared by the recording widgets, straight from the pack:
// 44px circle with a 1px border/tertiary ring and a rounded red square inside.
function StopButton({ label }: { label: string }) {
  return (
    <button
      aria-label={label}
      className="grid size-11 shrink-0 place-items-center rounded-full border transition-transform hover:scale-105 active:scale-95"
      style={{ borderColor: RING }}
      type="button"
    >
      <span className="size-[18px] rounded-[4px]" style={{ backgroundColor: RED }} />
    </button>
  );
}

type RoundActionProps = {
  children: ReactNode;
  label: string;
  tone: "light" | "dark" | "danger";
};

function RoundAction({ children, label, tone }: RoundActionProps) {
  const style =
    tone === "light"
      ? { backgroundColor: "#ffffff", color: "#000000" }
      : tone === "danger"
        ? { backgroundColor: RED_DEEP, color: "#ffffff" }
        : { backgroundColor: DARK_BUTTON, color: "#ffffff" };

  return (
    <button
      aria-label={label}
      className="grid size-11 place-items-center rounded-full transition-transform hover:scale-105 active:scale-95"
      style={style}
      type="button"
    >
      {children}
    </button>
  );
}

function AlbumArt() {
  return (
    <div className="size-12 shrink-0 rounded-full bg-[conic-gradient(from_30deg,#38bdf8,#facc15,#f97316,#22c55e,#38bdf8)] p-1">
      <div className="size-full rounded-full bg-[radial-gradient(circle_at_35%_35%,#f8fafc_0_10%,#0f172a_11%_42%,#14b8a6_43%_64%,#111827_65%)]" />
    </div>
  );
}

function Avatar() {
  return (
    <div className="size-12 shrink-0 rounded-full bg-[radial-gradient(circle_at_42%_32%,#f4d4b8_0_16%,#2f241f_17%_38%,#f8fafc_39%_56%,#171717_57%)]" />
  );
}
