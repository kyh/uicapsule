"use client";

import { motion } from "motion/react";

import type { GridItemConfig } from "./infinite-grid";
import { InfiniteGrid } from "./infinite-grid";

const Cell = ({ gridIndex }: GridItemConfig) => (
  <motion.div
    className="absolute inset-1 flex items-center justify-center"
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{
      duration: 0.4,
      scale: { bounce: 0.5, type: "spring", visualDuration: 0.4 },
    }}
  >
    <img
      alt=""
      className="pointer-events-none size-20"
      src={`https://pub-327ea719340342d3a3d5c5aa7f979e3a.r2.dev/illustrations/blueprint/%20${(gridIndex % 100) + 1}.svg`}
    />
  </motion.div>
);

const Preview = () => (
  <div className="h-screen w-screen bg-blue-50">
    <InfiniteGrid gridSize={150} renderItem={Cell} />
  </div>
);

export default Preview;
