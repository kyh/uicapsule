"use client";

import { useEffect, useState } from "react";

import DynamicIsland, { DYNAMIC_ISLAND_VIEWS } from "./dynamic-island";
import type { DynamicIslandView } from "./dynamic-island";

export const controls = {
  view: {
    default: "tour",
    label: "Activity",
    options: [
      { label: "Auto tour", value: "tour" },
      { label: "Idle", value: "idle" },
      { label: "Ring / Silent", value: "ring" },
      { label: "Timer", value: "timer" },
      { label: "Music", value: "music" },
      { label: "Call", value: "call" },
      { label: "Voice memo", value: "memo" },
      { label: "Screen recording", value: "recording" },
      { label: "Incoming call", value: "incoming" },
      { label: "Flight", value: "flight" },
    ],
    type: "select",
  },
  tourInterval: {
    default: 2.5,
    label: "Tour step (s)",
    max: 6,
    min: 1.5,
    step: 0.5,
    type: "number",
  },
  springiness: { default: 1, label: "Bounce", max: 1.8, min: 0, step: 0.05, type: "number" },
  duration: {
    default: 0.8,
    label: "Spring duration",
    max: 1.6,
    min: 0.3,
    step: 0.05,
    type: "number",
  },
  songTitle: { default: "Selfless", label: "Song", placeholder: "Track title", type: "text" },
  songArtist: {
    default: "The New Abnormal",
    label: "Artist",
    placeholder: "Artist or album",
    type: "text",
  },
  callerName: {
    default: "Mike Wheeler",
    label: "Caller",
    placeholder: "Contact name",
    type: "text",
  },
  glow: { default: "#334155", label: "Backdrop glow", type: "color" },
} as const;

interface PreviewProps {
  callerName: string;
  duration: number;
  glow: string;
  songArtist: string;
  songTitle: string;
  springiness: number;
  tourInterval: number;
  view: "tour" | DynamicIslandView;
}

const noop = () => null;

const useTourView = (enabled: boolean, intervalSeconds: number) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!enabled) {
      return noop;
    }

    const id = setInterval(() => {
      setIndex((current) => (current + 1) % DYNAMIC_ISLAND_VIEWS.length);
    }, intervalSeconds * 1000);

    return () => {
      clearInterval(id);
    };
  }, [enabled, intervalSeconds]);

  return DYNAMIC_ISLAND_VIEWS[index] ?? "idle";
};

const Preview = ({
  callerName = controls.callerName.default,
  duration = controls.duration.default,
  glow = controls.glow.default,
  songArtist = controls.songArtist.default,
  songTitle = controls.songTitle.default,
  springiness = controls.springiness.default,
  tourInterval = controls.tourInterval.default,
  view = controls.view.default,
}: Partial<PreviewProps>) => {
  const tourView = useTourView(view === "tour", tourInterval);

  return (
    <main
      className="flex h-dvh items-center justify-center overflow-hidden p-5"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 30%, ${glow} 0%, #0f172a 42%, #020617 100%)`,
      }}
    >
      <div className="w-full max-w-[760px]">
        <DynamicIsland
          callerName={callerName}
          duration={duration}
          songArtist={songArtist}
          songTitle={songTitle}
          springiness={springiness}
          view={view === "tour" ? tourView : view}
        />
      </div>
    </main>
  );
};

export default Preview;
