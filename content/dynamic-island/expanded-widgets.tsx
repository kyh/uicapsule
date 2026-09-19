"use client";

import type { CSSProperties, ReactElement, ReactNode } from "react";
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

export interface ExpandedWidgetOption {
  view: ExpandedWidgetView;
  label: string;
}

export const expandedWidgetOptions: ExpandedWidgetOption[] = [
  { label: "music", view: "music" },
  { label: "call", view: "call" },
  { label: "memo", view: "memo" },
  { label: "record", view: "recording" },
  { label: "incoming", view: "incoming" },
  { label: "flight", view: "flight" },
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

// Every expanded widget sits on the same 376px card; only the corner radius and
// the internal flow (`layout`) differ between them.
const WIDGET_SHELL_CLASS = "flex w-[376px] max-w-[calc(100vw-40px)] p-6 text-white";

const WidgetShell = ({ children, layout }: { children: ReactNode; layout: string }) => (
  <div className={`${WIDGET_SHELL_CLASS} ${layout}`} style={{ backgroundColor: ISLAND_BG }}>
    {children}
  </div>
);

// Stop control shared by the recording widgets, straight from the pack:
// 44px circle with a 1px border/tertiary ring and a rounded red square inside.
const StopButton = ({ label }: { label: string }) => (
  <button
    aria-label={label}
    className="grid size-11 shrink-0 place-items-center rounded-full border transition-transform hover:scale-105 active:scale-95"
    style={{ borderColor: RING }}
    type="button"
  >
    <span className="size-[18px] rounded-[4px]" style={{ backgroundColor: RED }} />
  </button>
);

interface RoundActionProps {
  children: ReactNode;
  label: string;
  tone: "light" | "dark" | "danger";
}

const ROUND_ACTION_STYLES: Record<RoundActionProps["tone"], CSSProperties> = {
  danger: { backgroundColor: RED_DEEP, color: "#ffffff" },
  dark: { backgroundColor: DARK_BUTTON, color: "#ffffff" },
  light: { backgroundColor: "#ffffff", color: "#000000" },
};

const RoundAction = ({ children, label, tone }: RoundActionProps) => (
  <button
    aria-label={label}
    className="grid size-11 place-items-center rounded-full transition-transform hover:scale-105 active:scale-95"
    style={ROUND_ACTION_STYLES[tone]}
    type="button"
  >
    {children}
  </button>
);

const AlbumArt = () => (
  <div className="size-12 shrink-0 rounded-full bg-[conic-gradient(from_30deg,#38bdf8,#facc15,#f97316,#22c55e,#38bdf8)] p-1">
    <div className="size-full rounded-full bg-[radial-gradient(circle_at_35%_35%,#f8fafc_0_10%,#0f172a_11%_42%,#14b8a6_43%_64%,#111827_65%)]" />
  </div>
);

const Avatar = () => (
  <div className="size-12 shrink-0 rounded-full bg-[radial-gradient(circle_at_42%_32%,#f4d4b8_0_16%,#2f241f_17%_38%,#f8fafc_39%_56%,#171717_57%)]" />
);

// Five-bar equalizer fading pink/500 → fuchsia/500 like the pack's glyph.
const EQ_BARS = [
  { color: "#db2777", delay: 0, height: 10, id: "eq-0" },
  { color: "#ec4899", delay: 0.15, height: 18, id: "eq-1" },
  { color: "#ec4899", delay: 0.3, height: 13, id: "eq-2" },
  { color: "#d946ef", delay: 0.1, height: 20, id: "eq-3" },
  { color: "#c026d3", delay: 0.25, height: 12, id: "eq-4" },
];

const Equalizer = () => (
  <div aria-hidden className="flex h-[22px] items-center gap-[3px]">
    {EQ_BARS.map((bar) => (
      <motion.span
        key={bar.id}
        className="w-[3px] rounded-full"
        style={{ backgroundColor: bar.color, height: bar.height }}
        animate={{ scaleY: [1, 0.55, 0.85, 1] }}
        transition={{ delay: bar.delay, duration: 1.1, ease: "easeInOut", repeat: Infinity }}
      />
    ))}
  </div>
);

const MusicExpanded = () => (
  <WidgetShell layout="flex-col gap-3 rounded-[32px]">
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
  </WidgetShell>
);

const OngoingCallExpanded = () => (
  <WidgetShell layout="flex-col gap-3 rounded-[32px]">
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
  </WidgetShell>
);

// Waveform heights straight from the mock; the last bar fades and hands off to
// a dot trail (red/50 at 40%) for the unrecorded remainder.
const MEMO_BARS = [25, 20, 16, 20, 25, 20, 14, 10, 16, 22, 27, 15, 19].map((height, index) => ({
  height,
  id: `memo-${index}`,
}));
const MEMO_DOTS = Array.from({ length: 11 }, (_, index) => `dot-${index}`);

const VoiceMemoExpanded = () => (
  <WidgetShell layout="items-center gap-3 rounded-full">
    <div aria-hidden className="flex h-11 shrink-0 items-center gap-[2px]">
      {MEMO_BARS.map(({ id, height }, index) => (
        <motion.span
          key={id}
          className="w-[3px] shrink-0 rounded-[4px]"
          style={{ backgroundColor: RED, height }}
          animate={{ scaleY: [1, 0.6, 0.9, 1] }}
          transition={{
            delay: (index % 5) * 0.09,
            duration: 0.9 + (index % 4) * 0.12,
            ease: "easeInOut",
            repeat: Infinity,
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
  </WidgetShell>
);

const ScreenRecordingExpanded = () => (
  <WidgetShell layout="items-center gap-3 rounded-full">
    <span className={`flex-1 ${TITLE_CLASS}`}>Screen Recording</span>
    <div className="flex shrink-0 items-center gap-1">
      <motion.span
        aria-hidden
        className="size-2 rounded-full"
        style={{ backgroundColor: RED }}
        animate={{ opacity: [1, 0.25, 1] }}
        transition={{ duration: 1.6, ease: "easeInOut", repeat: Infinity }}
      />
      <span className="text-[17px] tabular-nums" style={{ color: RED_DEEP }}>
        05:00
      </span>
    </div>
    <StopButton label="Stop screen recording" />
  </WidgetShell>
);

const IncomingCallExpanded = () => (
  <WidgetShell layout="items-center gap-2 rounded-full">
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
        transition={{ duration: 0.9, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.4 }}
      >
        <Phone aria-hidden="true" className="size-[22px]" strokeWidth={1.8} />
      </motion.span>
    </button>
  </WidgetShell>
);

const FlightExpanded = () => (
  <WidgetShell layout="flex-col gap-4 rounded-[32px]">
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
  </WidgetShell>
);

const EXPANDED_WIDGETS: Record<ExpandedWidgetView, () => ReactElement> = {
  call: OngoingCallExpanded,
  flight: FlightExpanded,
  incoming: IncomingCallExpanded,
  memo: VoiceMemoExpanded,
  music: MusicExpanded,
  recording: ScreenRecordingExpanded,
};

interface ExpandedWidgetProps {
  view: ExpandedWidgetView;
}

export const ExpandedWidget = ({ view }: ExpandedWidgetProps) => {
  const Widget = EXPANDED_WIDGETS[view];
  return <Widget />;
};
