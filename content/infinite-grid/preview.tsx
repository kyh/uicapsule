"use client";

import { motion } from "motion/react";

import type { GridItemConfig } from "./infinite-grid";
import { InfiniteGrid } from "./infinite-grid";

export const controls = {
  background: { default: "#eff6ff", type: "color" },
  bounce: { default: 0.5, label: "Pop bounce", max: 0.9, min: 0, step: 0.05, type: "number" },
  cellSize: { default: 150, label: "Cell size", max: 300, min: 80, step: 10, type: "number" },
  entrance: {
    default: "pop",
    label: "Cell entrance",
    options: [
      { label: "Pop", value: "pop" },
      { label: "Fade", value: "fade" },
      { label: "None", value: "none" },
    ],
    type: "select",
  },
  iconScale: {
    default: 0.55,
    label: "Illustration size",
    max: 0.9,
    min: 0.2,
    step: 0.05,
    type: "number",
  },
  outlines: { default: false, label: "Cell outlines", type: "boolean" },
} as const;

type Entrance = "pop" | "fade" | "none";

interface CellProps extends GridItemConfig {
  bounce: number;
  entrance: Entrance;
  iconSize: number;
  outlines: boolean;
}

const entranceFrom = {
  fade: { opacity: 0, scale: 1 },
  none: { opacity: 1, scale: 1 },
  pop: { opacity: 0, scale: 0 },
} as const;

const Cell = ({ bounce, entrance, gridIndex, iconSize, outlines }: CellProps) => (
  <motion.div
    key={`${entrance}:${bounce}`}
    className={`absolute inset-1 flex items-center justify-center ${outlines ? "rounded-lg border border-blue-300/60" : ""}`}
    initial={entranceFrom[entrance]}
    animate={{ opacity: 1, scale: 1 }}
    transition={{
      duration: 0.4,
      scale: { bounce, type: "spring", visualDuration: 0.4 },
    }}
  >
    <img
      alt=""
      className="pointer-events-none"
      style={{ height: iconSize, width: iconSize }}
      src={`https://d24l2zb4cwkekfpl.public.blob.vercel-storage.com/illustrations/blueprint/%20${(gridIndex % 100) + 1}.svg`}
    />
  </motion.div>
);

interface PreviewProps {
  background: string;
  bounce: number;
  cellSize: number;
  entrance: Entrance;
  iconScale: number;
  outlines: boolean;
}

const Preview = ({
  background = controls.background.default,
  bounce = controls.bounce.default,
  cellSize = controls.cellSize.default,
  entrance = controls.entrance.default,
  iconScale = controls.iconScale.default,
  outlines = controls.outlines.default,
}: Partial<PreviewProps>) => (
  <div className="h-screen w-screen" style={{ backgroundColor: background }}>
    <InfiniteGrid
      gridSize={cellSize}
      renderItem={(item) => (
        <Cell
          {...item}
          bounce={bounce}
          entrance={entrance}
          iconSize={Math.round(cellSize * iconScale)}
          outlines={outlines}
        />
      )}
    />
  </div>
);

export default Preview;
