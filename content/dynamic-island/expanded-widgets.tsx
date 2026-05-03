"use client";

import type { ReactNode } from "react";
import {
  AudioLines,
  CircleStop,
  FastForward,
  Headphones,
  Info,
  Mic,
  Phone,
  PhoneOff,
  Plane,
  Play,
  Radio,
  Rewind,
  ScreenShare,
  Square,
  Video,
} from "lucide-react";

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

const memoBars = [
  { id: "memo-0", height: 8 },
  { id: "memo-1", height: 15 },
  { id: "memo-2", height: 22 },
  { id: "memo-3", height: 11 },
  { id: "memo-4", height: 19 },
  { id: "memo-5", height: 24 },
  { id: "memo-6", height: 13 },
  { id: "memo-7", height: 18 },
  { id: "memo-8", height: 26 },
  { id: "memo-9", height: 10 },
  { id: "memo-10", height: 17 },
  { id: "memo-11", height: 21 },
  { id: "memo-12", height: 12 },
  { id: "memo-13", height: 25 },
  { id: "memo-14", height: 16 },
  { id: "memo-15", height: 9 },
  { id: "memo-16", height: 20 },
  { id: "memo-17", height: 14 },
];

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
    <div className="flex w-[375px] max-w-[calc(100vw-40px)] flex-col gap-3 rounded-[32px] bg-[#0a0a0a] p-6 text-white">
      <div className="flex items-center gap-2">
        <AlbumArt />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base leading-[22px] font-normal">Selfless</p>
          <p className="truncate text-xs leading-4 font-normal text-[#a3a3a3]">The New Abnormal</p>
        </div>
        <AudioLines aria-hidden="true" className="size-[22px] text-[#ec4899]" strokeWidth={1.8} />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs leading-4 text-[#a3a3a3]">0:44</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[rgba(26,26,26,0.75)]">
          <div className="h-full w-[48%] rounded-full bg-[#ec4899]" />
        </div>
        <span className="text-right text-xs leading-4 text-[#a3a3a3]">-3:00</span>
      </div>
      <div className="flex items-center justify-center gap-6">
        <Rewind aria-hidden="true" className="size-6" fill="currentColor" strokeWidth={1.8} />
        <Play aria-hidden="true" className="size-8" fill="currentColor" strokeWidth={1.8} />
        <FastForward aria-hidden="true" className="size-6" fill="currentColor" strokeWidth={1.8} />
      </div>
    </div>
  );
}

function OngoingCallExpanded() {
  return (
    <div className="flex w-[375px] max-w-[calc(100vw-40px)] flex-col gap-3 rounded-[32px] bg-[#0a0a0a] p-6 text-white">
      <div className="flex items-center gap-2">
        <Avatar />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base leading-[22px] font-normal">Mike Wheeler</p>
          <p className="truncate text-xs leading-4 font-normal text-[#a3a3a3]">FaceTime Audio</p>
        </div>
        <Info aria-hidden="true" className="size-[22px]" strokeWidth={1.8} />
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

function VoiceMemoExpanded() {
  return (
    <div className="flex w-[290px] max-w-[calc(100vw-40px)] items-center gap-3 rounded-[32px] bg-[#0a0a0a] px-5 py-4 text-white">
      <div className="grid size-10 place-items-center rounded-full bg-[#1a1a1a] text-[#ef4444]">
        <Mic aria-hidden="true" className="size-[22px]" strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {memoBars.map((bar) => (
            <span
              className="w-1 rounded-full bg-[#ef4444]"
              key={bar.id}
              style={{ height: `${bar.height}px` }}
            />
          ))}
        </div>
      </div>
      <span className="text-xs text-[#ef4444]">00:09</span>
      <button
        aria-label="Stop recording"
        className="grid size-8 place-items-center rounded-full border border-[#ef4444]"
        type="button"
      >
        <CircleStop aria-hidden="true" className="size-4 text-[#ef4444]" strokeWidth={1.8} />
      </button>
    </div>
  );
}

function ScreenRecordingExpanded() {
  return (
    <div className="flex w-[292px] max-w-[calc(100vw-40px)] items-center gap-3 rounded-[32px] bg-[#0a0a0a] px-5 py-4 text-white">
      <div className="grid size-9 place-items-center rounded-full bg-[rgba(26,26,26,0.75)] text-[#ef4444]">
        <Radio aria-hidden="true" className="size-5" strokeWidth={1.8} />
      </div>
      <span className="flex-1 text-sm">Screen Recording</span>
      <span className="text-xs text-[#ef4444]">00:23</span>
      <button
        aria-label="Stop screen recording"
        className="grid size-8 place-items-center rounded-full border border-[#ef4444]"
        type="button"
      >
        <Square
          aria-hidden="true"
          className="size-3 text-[#ef4444]"
          fill="currentColor"
          strokeWidth={1.8}
        />
      </button>
    </div>
  );
}

function IncomingCallExpanded() {
  return (
    <div className="flex w-[300px] max-w-[calc(100vw-40px)] items-center gap-3 rounded-[32px] bg-[#0a0a0a] px-4 py-3 text-white">
      <Avatar />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm leading-5">Mike Wheeler</p>
        <p className="truncate text-xs text-[#a3a3a3]">mobile</p>
      </div>
      <button
        aria-label="Decline call"
        className="grid size-10 place-items-center rounded-full bg-[#dc2626]"
        type="button"
      >
        <PhoneOff aria-hidden="true" className="size-[22px]" strokeWidth={1.8} />
      </button>
      <button
        aria-label="Accept call"
        className="grid size-10 place-items-center rounded-full bg-[#16a34a]"
        type="button"
      >
        <Phone aria-hidden="true" className="size-[22px]" strokeWidth={1.8} />
      </button>
    </div>
  );
}

function FlightExpanded() {
  return (
    <div className="flex w-[315px] max-w-[calc(100vw-40px)] flex-col gap-3 rounded-[32px] bg-[#0a0a0a] p-4 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm leading-5">Departure</p>
          <p className="text-xs text-[#a3a3a3]">On time</p>
        </div>
        <span className="text-xs text-[#a3a3a3]">TL104</span>
      </div>
      <div className="flex items-center gap-2">
        <Plane aria-hidden="true" className="size-5 text-[#22c55e]" fill="currentColor" />
        <div className="h-2 flex-1 rounded-full bg-[rgba(26,26,26,0.75)]">
          <div className="h-full w-[72%] rounded-full bg-[#22c55e]" />
        </div>
        <span className="text-xs text-[#a3a3a3]">LAX</span>
      </div>
      <div className="flex gap-2">
        <button className="h-8 flex-1 rounded-full bg-[#6d5dfc] text-xs font-medium" type="button">
          View
        </button>
        <button
          className="h-8 flex-1 rounded-full bg-white text-xs font-medium text-black"
          type="button"
        >
          Route
        </button>
      </div>
    </div>
  );
}

type RoundActionProps = {
  children: ReactNode;
  label: string;
  tone: "light" | "dark" | "danger";
};

function RoundAction({ children, label, tone }: RoundActionProps) {
  const className =
    tone === "light"
      ? "bg-white text-black"
      : tone === "danger"
        ? "bg-[#dc2626] text-white"
        : "bg-[rgba(26,26,26,0.75)] text-white";

  return (
    <button
      aria-label={label}
      className={`grid size-11 place-items-center rounded-full ${className}`}
      type="button"
    >
      {children}
    </button>
  );
}

function AlbumArt() {
  return (
    <div className="size-12 rounded-full bg-[conic-gradient(from_30deg,#38bdf8,#facc15,#f97316,#22c55e,#38bdf8)] p-1">
      <div className="size-full rounded-full bg-[radial-gradient(circle_at_35%_35%,#f8fafc_0_10%,#0f172a_11%_42%,#14b8a6_43%_64%,#111827_65%)]" />
    </div>
  );
}

function Avatar() {
  return (
    <div className="size-12 rounded-full bg-[radial-gradient(circle_at_42%_32%,#f4d4b8_0_16%,#2f241f_17%_38%,#f8fafc_39%_56%,#171717_57%)]" />
  );
}
