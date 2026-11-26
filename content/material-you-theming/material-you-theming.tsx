"use client";

import { useState } from "react";
import {
  Bluetooth,
  Flashlight,
  MapPin,
  MessageCircle,
  Moon,
  Music2,
  Plane,
  SkipForward,
  Wifi,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";

import { PhoneFrame } from "./phone-frame";
import type { ClayTone } from "./phone-frame";

export interface Wallpaper {
  id: string;
  name: string;
  hue: number;
  hueB: number;
}

export const WALLPAPERS: Wallpaper[] = [
  { hue: 200, hueB: 160, id: "lagoon", name: "Lagoon" },
  { hue: 20, hueB: 350, id: "clay", name: "Clay" },
  { hue: 130, hueB: 80, id: "moss", name: "Moss" },
  { hue: 285, hueB: 320, id: "orchid", name: "Orchid" },
];

const tone = (hue: number, saturation: number, lightness: number, chroma: number) =>
  `hsl(${hue} ${Math.min(100, saturation * chroma)}% ${lightness}%)`;

const paletteFor = (wallpaper: Wallpaper, chroma: number) => ({
  accent: tone(wallpaper.hueB, 50, 70, chroma),
  container: tone(wallpaper.hue, 32, 26, chroma),
  muted: tone(wallpaper.hue, 16, 58, chroma),
  onContainer: tone(wallpaper.hue, 55, 88, chroma),
  onPrimary: tone(wallpaper.hue, 45, 14, chroma),
  outline: tone(wallpaper.hue, 18, 32, chroma),
  primary: tone(wallpaper.hue, 65, 78, chroma),
  surface: tone(wallpaper.hue, 22, 10, chroma),
  surfaceHigh: tone(wallpaper.hue, 20, 15, chroma),
});

const wallpaperGradient = (wallpaper: Wallpaper, chroma: number) =>
  `linear-gradient(140deg, ${tone(wallpaper.hue, 60, 45, chroma)}, ${tone(wallpaper.hueB, 55, 30, chroma)} 60%, ${tone(wallpaper.hue, 40, 16, chroma)})`;

interface QuickTile {
  icon: LucideIcon;
  label: string;
  on: boolean;
}

const QUICK_TILES: QuickTile[] = [
  { icon: Wifi, label: "Internet", on: true },
  { icon: Bluetooth, label: "Bluetooth", on: true },
  { icon: Flashlight, label: "Torch", on: false },
  { icon: Moon, label: "Bedtime", on: false },
  { icon: MapPin, label: "Location", on: true },
  { icon: Plane, label: "Airplane", on: false },
];

const FALLBACK_WALLPAPER: Wallpaper = { hue: 200, hueB: 160, id: "", name: "" };

interface MaterialYouThemingProps {
  /** Multiplier on every tone's saturation; 1 is the stock palette. */
  chroma?: number;
  date?: string;
  /** Seconds the re-theme crossfade takes. */
  duration?: number;
  hint?: string;
  messageFrom?: string;
  messageText?: string;
  time?: string;
  tone?: ClayTone;
  trackArtist?: string;
  trackTitle?: string;
  /** Seed hues offered in the picker; the first starts active. */
  wallpapers?: Wallpaper[];
}

export const MaterialYouTheming = ({
  chroma = 1,
  date = "Mon, Jul 7 · Material You",
  duration = 0.7,
  hint = "Pick a wallpaper — the whole system re-themes",
  messageFrom = "Mia",
  messageText = "That new wallpaper looks great on you",
  time = "9:41",
  tone: frameTone = "moss",
  trackArtist = "Solenne",
  trackTitle = "Night Drive",
  wallpapers = WALLPAPERS,
}: MaterialYouThemingProps) => {
  const [activeId, setActiveId] = useState(wallpapers[0]?.id ?? "");

  const active =
    wallpapers.find((wallpaper) => wallpaper.id === activeId) ??
    wallpapers[0] ??
    FALLBACK_WALLPAPER;

  const palette = paletteFor(active, chroma);
  const themeTransition = `background-color ${duration}s ease, color ${duration}s ease, border-color ${duration}s ease`;

  return (
    <PhoneFrame tone={frameTone}>
      <div
        className="absolute inset-0 flex flex-col"
        style={{ backgroundColor: palette.surface, transition: themeTransition }}
      >
        <motion.div
          key={active.id}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
          transition={{ duration }}
          className="absolute inset-x-0 top-0 h-56"
          style={{
            background: wallpaperGradient(active, chroma),
            maskImage: "linear-gradient(to bottom, black 30%, transparent)",
          }}
        />

        <div className="relative px-6 pt-[60px]">
          <p
            className="text-[56px] leading-none font-medium tracking-tight"
            style={{ color: palette.onContainer, transition: themeTransition }}
          >
            {time}
          </p>
          <p
            className="mt-1 text-[13px]"
            style={{ color: palette.muted, transition: themeTransition }}
          >
            {date}
          </p>
        </div>
        <div className="relative mt-6 grid grid-cols-2 gap-2.5 px-5">
          {QUICK_TILES.map(({ icon: Icon, label, on }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 rounded-[24px] px-4 py-3.5"
              style={{
                backgroundColor: on ? palette.primary : palette.surfaceHigh,
                color: on ? palette.onPrimary : palette.muted,
                transition: themeTransition,
              }}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate text-[12px] font-semibold">{label}</span>
            </div>
          ))}
        </div>
        <div
          className="relative mx-5 mt-2.5 flex items-center gap-3 rounded-[26px] p-4"
          style={{ backgroundColor: palette.container, transition: themeTransition }}
        >
          <div
            className="grid size-11 shrink-0 place-items-center rounded-2xl"
            style={{
              backgroundColor: palette.primary,
              color: palette.onPrimary,
              transition: themeTransition,
            }}
          >
            <Music2 className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-[13px] font-semibold"
              style={{ color: palette.onContainer, transition: themeTransition }}
            >
              {trackTitle}
            </p>
            <p
              className="text-[11px]"
              style={{ color: palette.muted, transition: themeTransition }}
            >
              {trackArtist}
            </p>
            <div
              className="mt-2 h-1 w-full overflow-hidden rounded-full"
              style={{ backgroundColor: palette.outline, transition: themeTransition }}
            >
              <div
                className="h-full w-2/5 rounded-full"
                style={{ backgroundColor: palette.accent, transition: themeTransition }}
              />
            </div>
          </div>
          <SkipForward className="size-5 shrink-0" style={{ color: palette.muted }} />
        </div>
        <div
          className="relative mx-5 mt-2.5 flex items-center gap-3 rounded-[26px] px-4 py-3.5"
          style={{ backgroundColor: palette.surfaceHigh, transition: themeTransition }}
        >
          <div
            className="grid size-9 shrink-0 place-items-center rounded-full"
            style={{
              backgroundColor: palette.container,
              color: palette.primary,
              transition: themeTransition,
            }}
          >
            <MessageCircle className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-[12px] font-semibold"
              style={{ color: palette.onContainer, transition: themeTransition }}
            >
              {messageFrom}
            </p>
            <p
              className="truncate text-[11px]"
              style={{ color: palette.muted, transition: themeTransition }}
            >
              {messageText}
            </p>
          </div>
          <span
            className="text-[10px]"
            style={{ color: palette.muted, transition: themeTransition }}
          >
            now
          </span>
        </div>
        <div className="relative mt-auto pb-8">
          <p
            className="px-6 text-[11px] font-medium"
            style={{ color: palette.muted, transition: themeTransition }}
          >
            Wallpaper & style
          </p>
          <div className="mt-2.5 flex justify-center gap-3 px-5">
            {wallpapers.map((wallpaper) => (
              <motion.button
                type="button"
                key={wallpaper.id}
                aria-label={`Use ${wallpaper.name} wallpaper`}
                aria-pressed={wallpaper.id === active.id}
                onClick={() => {
                  setActiveId(wallpaper.id);
                }}
                whileTap={{ scale: 0.92 }}
                animate={{ scale: wallpaper.id === active.id ? 1.06 : 1 }}
                className="relative h-[116px] w-[62px] overflow-hidden rounded-2xl ring-2"
                style={{
                  background: wallpaperGradient(wallpaper, chroma),
                  borderColor: "transparent",
                  ...(wallpaper.id === active.id
                    ? { boxShadow: `0 0 0 2px ${palette.surface}, 0 0 0 4px ${palette.primary}` }
                    : { boxShadow: "none" }),
                }}
              >
                <span className="absolute inset-x-0 bottom-1 text-center text-[9px] font-medium text-white/85">
                  {wallpaper.name}
                </span>
              </motion.button>
            ))}
          </div>
          <p
            className="mt-3 text-center text-[11px]"
            style={{ color: palette.muted, transition: themeTransition }}
          >
            {hint}
          </p>
        </div>
      </div>
    </PhoneFrame>
  );
};
