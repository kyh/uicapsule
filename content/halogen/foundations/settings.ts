import { createContext, use } from "react";

type CSSVar = `--hx-${string}`;

export const THEMES = ["light", "dark"] as const;

export type Theme = (typeof THEMES)[number];

interface LampSpec {
  label: string;
  lamp: string;
  text: string;
  edge: string;
  hover: string;
  edgeHover: string;
  halo: string;
  wash: string;
  washStrong: string;
  darkSlab: string;
  darkHover: string;
  rgb: string;
}

const INK = "#1a1814";

const lampVars = (spec: LampSpec) => ({
  dark: {
    "--hx-lamp": spec.lamp,
    "--hx-lamp-edge": spec.lamp,
    "--hx-lamp-text": spec.lamp,
    "--hx-slab": spec.darkSlab,
    "--hx-slab-edge": spec.lamp,
    "--hx-slab-edge-hover": spec.hover,
    "--hx-slab-glow": `rgb(${spec.rgb} / 0.2)`,
    "--hx-slab-glow-hover": `rgb(${spec.rgb} / 0.34)`,
    "--hx-slab-halo": `rgb(${spec.rgb} / 0.12)`,
    "--hx-slab-hover": spec.darkHover,
    "--hx-slab-ink": spec.lamp,
    "--hx-wash": spec.darkSlab,
    "--hx-wash-strong": spec.darkHover,
  },
  label: spec.label,
  light: {
    "--hx-lamp": spec.lamp,
    "--hx-lamp-edge": spec.edge,
    "--hx-lamp-text": spec.text,
    "--hx-slab": spec.lamp,
    "--hx-slab-edge": spec.edge,
    "--hx-slab-edge-hover": spec.edgeHover,
    "--hx-slab-halo": spec.halo,
    "--hx-slab-hover": spec.hover,
    "--hx-slab-ink": INK,
    "--hx-wash": spec.wash,
    "--hx-wash-strong": spec.washStrong,
  },
});

/**
 * The filaments Halogen can burn. Amber is the shipped one and matches tokens.css; the others
 * keep amber's lightness ramp at their own hue, so every ratio in the colour table still passes.
 */
export const LAMPS = {
  amber: lampVars({
    darkHover: "#4b3608",
    darkSlab: "#3b2a06",
    edge: "#d99a0f",
    edgeHover: "#ecb02e",
    halo: "#fff5d9",
    hover: "#ffcb5c",
    label: "Amber",
    lamp: "#ffbe2e",
    rgb: "255 190 46",
    text: "#7a5000",
    wash: "#fff0c2",
    washStrong: "#ffe594",
  }),
  xenon: lampVars({
    darkHover: "#2a3c4f",
    darkSlab: "#202f3e",
    edge: "#7aace0",
    edgeHover: "#8dc0f6",
    halo: "#eaf7ff",
    hover: "#a9d8ff",
    label: "Xenon",
    lamp: "#8ec5ff",
    rgb: "142 197 255",
    text: "#3f5c7b",
    wash: "#def3ff",
    washStrong: "#c7ebff",
  }),
  blacklight: lampVars({
    darkHover: "#3e3452",
    darkSlab: "#302841",
    edge: "#b296e9",
    edgeHover: "#c6aaff",
    halo: "#f8f1ff",
    hover: "#ddc3ff",
    label: "Blacklight",
    lamp: "#c2a3ff",
    rgb: "194 163 255",
    text: "#604f81",
    wash: "#f4eaff",
    washStrong: "#eedbff",
  }),
} satisfies Record<string, { label: string } & Record<Theme, Record<CSSVar, string>>>;

export type Lamp = keyof typeof LAMPS;

export const LAMP_NAMES = ["amber", "xenon", "blacklight"] as const satisfies readonly Lamp[];

/** The measured heights each density sets. Default matches tokens.css; all stay on the 4px grid. */
export const DENSITIES = {
  compact: {
    "--hx-control": 28,
    "--hx-control-lg": 32,
    "--hx-control-sm": 24,
    "--hx-head": 32,
    "--hx-inset": 8,
    "--hx-row": 32,
    "--hx-row-sm": 28,
  },
  default: {
    "--hx-control": 32,
    "--hx-control-lg": 36,
    "--hx-control-sm": 28,
    "--hx-head": 40,
    "--hx-inset": 12,
    "--hx-row": 40,
    "--hx-row-sm": 32,
  },
  comfortable: {
    "--hx-control": 36,
    "--hx-control-lg": 40,
    "--hx-control-sm": 32,
    "--hx-head": 48,
    "--hx-inset": 16,
    "--hx-row": 48,
    "--hx-row-sm": 36,
  },
} as const;

export type Density = keyof typeof DENSITIES;

export type DensityScale = (typeof DENSITIES)[Density];

export const DENSITY_NAMES = [
  "compact",
  "default",
  "comfortable",
] as const satisfies readonly Density[];

/** The CSS custom properties a theme, lamp and density write onto the `.ds-halogen` root. */
export const settingVars = (theme: Theme, lamp: Lamp, density: Density) => {
  const heights = Object.fromEntries(
    Object.entries(DENSITIES[density]).map(([name, px]) => [name, `${px}px`]),
  );

  return { ...LAMPS[lamp][theme], ...heights };
};

interface Settings {
  density: Density;
  lamp: Lamp;
}

/** Carries the showcase's lamp and density down to the foundations that print their values. */
export const SettingsContext = createContext<Settings>({ density: "default", lamp: "amber" });

/** The lamp and density the showcase is rendering. */
export const useSettings = () => use(SettingsContext);
