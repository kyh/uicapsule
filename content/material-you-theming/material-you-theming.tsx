"use client";

import { useState } from "react";
import { Bluetooth, Flashlight, Moon, Music2, SkipForward, Wifi } from "lucide-react";
import { motion } from "motion/react";

type Wallpaper = {
  id: string;
  name: string;
  hue: number;
  hueB: number;
};

const WALLPAPERS: Wallpaper[] = [
  { id: "lagoon", name: "Lagoon", hue: 200, hueB: 160 },
  { id: "clay", name: "Clay", hue: 20, hueB: 350 },
  { id: "moss", name: "Moss", hue: 130, hueB: 80 },
  { id: "orchid", name: "Orchid", hue: 285, hueB: 320 },
];

// A tiny Material-You-style tonal palette derived from the wallpaper seed hue.
const paletteFor = (wallpaper: Wallpaper) => ({
  surface: `hsl(${wallpaper.hue} 22% 10%)`,
  surfaceHigh: `hsl(${wallpaper.hue} 20% 15%)`,
  primary: `hsl(${wallpaper.hue} 65% 78%)`,
  onPrimary: `hsl(${wallpaper.hue} 45% 14%)`,
  container: `hsl(${wallpaper.hue} 32% 26%)`,
  onContainer: `hsl(${wallpaper.hue} 55% 88%)`,
  accent: `hsl(${wallpaper.hueB} 50% 70%)`,
  outline: `hsl(${wallpaper.hue} 18% 32%)`,
  muted: `hsl(${wallpaper.hue} 16% 58%)`,
});

const wallpaperGradient = (wallpaper: Wallpaper) =>
  `linear-gradient(140deg, hsl(${wallpaper.hue} 60% 45%), hsl(${wallpaper.hueB} 55% 30%) 60%, hsl(${wallpaper.hue} 40% 16%))`;

const TRANSITION = "background-color 0.7s ease, color 0.7s ease, border-color 0.7s ease";

export const MaterialYouTheming = () => {
  const [active, setActive] = useState<Wallpaper>(
    WALLPAPERS[0] ?? { id: "", name: "", hue: 200, hueB: 160 },
  );
  const palette = paletteFor(active);

  return (
    <div
      className="relative flex h-[620px] w-[340px] flex-col overflow-hidden rounded-[44px] shadow-2xl shadow-black/60 ring-8 ring-black select-none"
      style={{ backgroundColor: palette.surface, transition: TRANSITION }}
    >
      {/* Wallpaper band */}
      <motion.div
        key={active.id}
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="absolute inset-x-0 top-0 h-44"
        style={{
          background: wallpaperGradient(active),
          maskImage: "linear-gradient(to bottom, black 30%, transparent)",
        }}
      />

      <div className="relative px-6 pt-10">
        <p
          className="text-[44px] leading-none font-medium tracking-tight"
          style={{ color: palette.onContainer, transition: TRANSITION }}
        >
          9:41
        </p>
        <p className="mt-1 text-[13px]" style={{ color: palette.muted, transition: TRANSITION }}>
          Mon, Jul 7 · Material You
        </p>
      </div>

      {/* Quick settings */}
      <div className="relative mt-6 grid grid-cols-2 gap-2.5 px-5">
        {[
          ["Internet", Wifi, true],
          ["Bluetooth", Bluetooth, true],
          ["Torch", Flashlight, false],
          ["Bedtime", Moon, false],
        ].map(([label, Icon, on]) => (
          <div
            key={String(label)}
            className="flex items-center gap-2.5 rounded-[24px] px-4 py-3.5"
            style={{
              backgroundColor: on ? palette.primary : palette.surfaceHigh,
              color: on ? palette.onPrimary : palette.muted,
              transition: TRANSITION,
            }}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate text-[12px] font-semibold">{String(label)}</span>
          </div>
        ))}
      </div>

      {/* Media card */}
      <div
        className="relative mx-5 mt-2.5 flex items-center gap-3 rounded-[26px] p-4"
        style={{ backgroundColor: palette.container, transition: TRANSITION }}
      >
        <div
          className="grid size-11 shrink-0 place-items-center rounded-2xl"
          style={{
            backgroundColor: palette.primary,
            color: palette.onPrimary,
            transition: TRANSITION,
          }}
        >
          <Music2 className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-[13px] font-semibold"
            style={{ color: palette.onContainer, transition: TRANSITION }}
          >
            Night Drive
          </p>
          <p className="text-[11px]" style={{ color: palette.muted, transition: TRANSITION }}>
            Solenne
          </p>
          <div
            className="mt-2 h-1 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: palette.outline, transition: TRANSITION }}
          >
            <div
              className="h-full w-2/5 rounded-full"
              style={{ backgroundColor: palette.accent, transition: TRANSITION }}
            />
          </div>
        </div>
        <SkipForward className="size-5 shrink-0" style={{ color: palette.muted }} />
      </div>

      {/* Wallpaper picker */}
      <div className="relative mt-auto pb-7">
        <p
          className="px-6 text-[11px] font-medium"
          style={{ color: palette.muted, transition: TRANSITION }}
        >
          Wallpaper & style
        </p>
        <div className="mt-2.5 flex justify-center gap-3 px-6">
          {WALLPAPERS.map((wallpaper) => (
            <motion.button
              type="button"
              key={wallpaper.id}
              aria-label={`Use ${wallpaper.name} wallpaper`}
              aria-pressed={wallpaper.id === active.id}
              onClick={() => setActive(wallpaper)}
              whileTap={{ scale: 0.92 }}
              animate={{ scale: wallpaper.id === active.id ? 1.06 : 1 }}
              className="relative h-24 w-[64px] overflow-hidden rounded-2xl ring-2"
              style={{
                background: wallpaperGradient(wallpaper),
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
          style={{ color: palette.muted, transition: TRANSITION }}
        >
          Pick a wallpaper — the whole system re-themes
        </p>
      </div>
    </div>
  );
};
