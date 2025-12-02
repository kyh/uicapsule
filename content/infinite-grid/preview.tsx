import React from "react";
import { motion } from "motion/react";

import { GridItemConfig, InfiniteGrid } from "./infinite-grid";

const Cell = ({ gridIndex }: GridItemConfig) => (
  <motion.div
    className="absolute inset-1 flex items-center justify-center"
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{
      duration: 0.4,
      scale: { type: "spring", visualDuration: 0.4, bounce: 0.5 },
    }}
  >
    <img
      className="pointer-events-none size-20"
      src={`https://zmdrwswxugswzmcokvff.supabase.co/storage/v1/object/public/uicapsule/illustrations/blueprint/%20${(gridIndex % 100) + 1}.svg`}
    />
  </motion.div>
);

const Preview = () => {
  return (
    <div className="h-screen w-screen bg-blue-50">
      <InfiniteGrid gridSize={150} renderItem={Cell} />
    </div>
  );
};

export default Preview;
