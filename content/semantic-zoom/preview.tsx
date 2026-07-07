"use client";

import { SemanticZoom } from "./semantic-zoom";

const Preview = () => {
  return (
    <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,#171921_0%,#0b0d13_55%,#040508_100%)] p-5">
      <SemanticZoom />
    </main>
  );
};

export default Preview;
