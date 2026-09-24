import type { ReactNode } from "react";

// Screen is 330×716 (iPhone 15 proportions); the clay shell adds a 16px lip on every side.
export const SCREEN_WIDTH = 330;
export const SCREEN_HEIGHT = 716;

const CLAY_SHADOW = [
  "0 60px 100px -40px rgb(0 0 0 / 0.8)",
  "0 26px 40px -24px rgb(0 0 0 / 0.6)",
  "inset 0 7px 7px rgb(255 255 255 / 0.85)",
  "inset 0 -14px 20px rgb(122 100 78 / 0.5)",
  "inset 12px 0 18px -12px rgb(255 255 255 / 0.55)",
  "inset -12px 0 18px -12px rgb(122 100 78 / 0.35)",
].join(", ");

const Nub = ({ className }: { className: string }) => (
  <span
    aria-hidden="true"
    className={`absolute w-[9px] rounded-full bg-[#ddd2c3] ${className}`}
    style={{
      boxShadow:
        "inset 2px 2px 2px rgb(255 255 255 / 0.8), inset -2px -2px 3px rgb(122 100 78 / 0.45), 0 2px 4px rgb(0 0 0 / 0.35)",
    }}
  />
);

interface PhoneFrameProps {
  children: ReactNode;
  /** Classes for the screen: background, text color, pointer handling. */
  className?: string;
  /** Hide the Dynamic Island when the screen draws its own status area. */
  island?: boolean;
}

export const PhoneFrame = ({ children, className, island = true }: PhoneFrameProps) => (
  <div
    className="relative shrink-0 rounded-[66px] bg-[linear-gradient(165deg,#f3ece2_0%,#e2d7c9_50%,#cdbfae_100%)] p-[16px]"
    style={{ boxShadow: CLAY_SHADOW }}
  >
    <Nub className="top-[132px] -left-[6px] h-[36px]" />
    <Nub className="top-[188px] -left-[6px] h-[62px]" />
    <Nub className="top-[262px] -left-[6px] h-[62px]" />
    <Nub className="top-[206px] -right-[6px] h-[92px]" />
    <div
      className={`relative isolate overflow-hidden rounded-[50px] select-none ${className ?? "bg-black"}`}
      style={{
        boxShadow:
          "0 0 0 2px rgb(122 100 78 / 0.35), 0 -2px 3px rgb(122 100 78 / 0.35), 0 3px 4px rgb(255 255 255 / 0.7)",
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
