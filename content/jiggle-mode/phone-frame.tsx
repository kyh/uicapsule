import type { ReactNode } from "react";

// Screen is 330×716 (iPhone 15 proportions); the clay shell adds a 16px lip on every side.
export const SCREEN_WIDTH = 330;
export const SCREEN_HEIGHT = 716;

interface Clay {
  base: string;
  deep: string;
  light: string;
  /** RGB triplet for inner shading, tinted so each tone reads as one material. */
  rim: string;
}

// Dark matte clay: `light` is the lit top face, `base` the body, `deep` the shaded underside.
const TONES = {
  espresso: { base: "#3a2b24", deep: "#1f1612", light: "#5a4436", rim: "32 20 14" },
  graphite: { base: "#303036", deep: "#18181c", light: "#4a4a52", rim: "10 10 14" },
  moss: { base: "#2f3a2c", deep: "#171d15", light: "#4a5a44", rim: "12 18 10" },
  ochre: { base: "#4a3c20", deep: "#261e0e", light: "#6e5a30", rim: "30 22 6" },
  plum: { base: "#3c2a3a", deep: "#1e141d", light: "#5c4058", rim: "26 12 24" },
  slate: { base: "#2a3448", deep: "#141a26", light: "#435270", rim: "10 16 30" },
  teal: { base: "#233a3a", deep: "#101d1d", light: "#38585a", rim: "6 22 22" },
  terracotta: { base: "#4a2c22", deep: "#26150f", light: "#6c4232", rim: "34 14 8" },
} satisfies Record<string, Clay>;

export type ClayTone = keyof typeof TONES;

const shellShadow = (rim: string) =>
  [
    "0 60px 100px -40px rgb(0 0 0 / 0.85)",
    "0 26px 40px -24px rgb(0 0 0 / 0.7)",
    "inset 0 6px 6px rgb(255 255 255 / 0.16)",
    `inset 0 -14px 22px rgb(${rim} / 0.75)`,
    "inset 12px 0 18px -12px rgb(255 255 255 / 0.1)",
    `inset -12px 0 18px -12px rgb(${rim} / 0.6)`,
  ].join(", ");

const Nub = ({ className, clay }: { className: string; clay: Clay }) => (
  <span
    aria-hidden="true"
    className={`absolute w-[9px] rounded-full ${className}`}
    style={{
      background: clay.base,
      boxShadow: `inset 2px 2px 2px rgb(255 255 255 / 0.14), inset -2px -2px 3px rgb(${clay.rim} / 0.7), 0 2px 4px rgb(0 0 0 / 0.5)`,
    }}
  />
);

interface PhoneFrameProps {
  children: ReactNode;
  /** Classes for the screen: background, text color, pointer handling. */
  className?: string;
  /** Hide the Dynamic Island when the screen draws its own status area. */
  island?: boolean;
  tone?: ClayTone;
}

export const PhoneFrame = ({
  children,
  className,
  island = true,
  tone = "graphite",
}: PhoneFrameProps) => {
  const clay = TONES[tone];
  return (
    <div
      className="relative shrink-0 rounded-[66px] p-[16px]"
      style={{
        background: `linear-gradient(165deg, ${clay.light} 0%, ${clay.base} 48%, ${clay.deep} 100%)`,
        boxShadow: shellShadow(clay.rim),
      }}
    >
      <Nub clay={clay} className="top-[132px] -left-[6px] h-[36px]" />
      <Nub clay={clay} className="top-[188px] -left-[6px] h-[62px]" />
      <Nub clay={clay} className="top-[262px] -left-[6px] h-[62px]" />
      <Nub clay={clay} className="top-[206px] -right-[6px] h-[92px]" />
      <div
        className={`relative isolate overflow-hidden rounded-[50px] select-none ${className ?? "bg-black"}`}
        style={{
          boxShadow: `0 0 0 2px rgb(${clay.rim} / 0.9), 0 -2px 3px rgb(${clay.rim} / 0.8), 0 3px 4px rgb(255 255 255 / 0.12)`,
          height: SCREEN_HEIGHT,
          width: SCREEN_WIDTH,
        }}
      >
        {children}
        {island && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-[11px] left-1/2 z-50 h-[30px] w-[98px] -translate-x-1/2 rounded-full bg-black"
          />
        )}
      </div>
    </div>
  );
};
