"use client";

import type { ItemSlot, Look } from "./lookbook-data";

const VIEW_W = 200;
const VIEW_H = 300;
const FULL_VIEW_BOX = `0 0 ${VIEW_W} ${VIEW_H}`;

const CROPS = {
  lower: "40 125 120 140",
  shoes: "45 240 110 55",
  top: "30 10 140 175",
} as const satisfies Record<ItemSlot, string>;

export interface LookFigureProps {
  look: Look;
  /** Omit for the whole figure; pass a slot to crop to that piece. */
  crop?: ItemSlot;
  /** "meet" fits the crop inside the box, "slice" fills it. */
  fit?: "meet" | "slice";
  className?: string;
}

export const LookFigure = ({ look, crop, fit = "meet", className }: LookFigureProps) => {
  const viewBox = crop === undefined ? FULL_VIEW_BOX : CROPS[crop];

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio={`xMidYMid ${fit}`}
      className={className}
      aria-hidden
      focusable="false"
    >
      <rect width={VIEW_W} height={VIEW_H} fill={look.accent} fillOpacity={0.08} />
      <image
        href={look.imageUrl}
        width={VIEW_W}
        height={VIEW_H}
        preserveAspectRatio="xMidYMid slice"
      />
    </svg>
  );
};
