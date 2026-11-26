"use client";

import type { CSSProperties } from "react";

import { MaterialYouTheming, WALLPAPERS } from "./material-you-theming";
import type { ClayTone } from "./phone-frame";

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E\")";

const backdrop: CSSProperties = {
  background: [
    GRAIN,
    "radial-gradient(ellipse 55% 60% at 30% 18%, rgb(118 128 70 / 0.34), transparent 70%)",
    "radial-gradient(ellipse 50% 55% at 50% 58%, rgb(74 90 52 / 0.3), transparent 75%)",
    "linear-gradient(170deg, #232a17 0%, #161b0f 50%, #0a0d07 100%)",
  ].join(", "),
};

export const controls = {
  hueShift: {
    default: 0,
    group: "Theme",
    label: "Hue shift",
    max: 359,
    min: 0,
    step: 1,
    type: "number",
  },
  chroma: {
    default: 1,
    group: "Theme",
    label: "Chroma",
    max: 1.5,
    min: 0.3,
    step: 0.05,
    type: "number",
  },
  duration: {
    default: 0.7,
    group: "Theme",
    label: "Re-theme time",
    max: 2,
    min: 0.1,
    step: 0.05,
    type: "number",
  },
  tone: {
    default: "moss",
    group: "Theme",
    label: "Phone",
    options: [
      { label: "Moss", value: "moss" },
      { label: "Graphite", value: "graphite" },
      { label: "Espresso", value: "espresso" },
      { label: "Ochre", value: "ochre" },
      { label: "Plum", value: "plum" },
      { label: "Slate", value: "slate" },
      { label: "Teal", value: "teal" },
      { label: "Terracotta", value: "terracotta" },
    ],
    type: "select",
  },
  trackTitle: { default: "Night Drive", group: "Widgets", label: "Track", type: "text" },
  trackArtist: { default: "Solenne", group: "Widgets", label: "Artist", type: "text" },
  messageFrom: { default: "Mia", group: "Widgets", label: "Sender", type: "text" },
  messageText: {
    default: "That new wallpaper looks great on you",
    group: "Widgets",
    label: "Message",
    type: "text",
  },
  time: { default: "9:41", group: "Copy", label: "Clock", placeholder: "9:41", type: "text" },
  date: { default: "Mon, Jul 7 · Material You", group: "Copy", label: "Date", type: "text" },
  hint: {
    default: "Pick a wallpaper — the whole system re-themes",
    group: "Copy",
    label: "Caption",
    type: "text",
  },
} as const;

interface PreviewProps {
  chroma: number;
  date: string;
  duration: number;
  hint: string;
  hueShift: number;
  messageFrom: string;
  messageText: string;
  time: string;
  tone: ClayTone;
  trackArtist: string;
  trackTitle: string;
}

const Preview = ({
  chroma = controls.chroma.default,
  date = controls.date.default,
  duration = controls.duration.default,
  hint = controls.hint.default,
  hueShift = controls.hueShift.default,
  messageFrom = controls.messageFrom.default,
  messageText = controls.messageText.default,
  time = controls.time.default,
  tone = controls.tone.default,
  trackArtist = controls.trackArtist.default,
  trackTitle = controls.trackTitle.default,
}: Partial<PreviewProps>) => (
  <main className="flex h-dvh items-center justify-center overflow-hidden p-5" style={backdrop}>
    <MaterialYouTheming
      chroma={chroma}
      date={date}
      duration={duration}
      hint={hint}
      messageFrom={messageFrom}
      messageText={messageText}
      time={time}
      tone={tone}
      trackArtist={trackArtist}
      trackTitle={trackTitle}
      wallpapers={WALLPAPERS.map((wallpaper) => ({
        ...wallpaper,
        hue: (wallpaper.hue + hueShift) % 360,
        hueB: (wallpaper.hueB + hueShift) % 360,
      }))}
    />
  </main>
);

export default Preview;
