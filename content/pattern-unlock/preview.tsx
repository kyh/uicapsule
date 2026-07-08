"use client";

import { PatternUnlock } from "./pattern-unlock";

const Preview = () => {
  return (
    <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,#191b22_0%,#0d0e12_55%,#050608_100%)] p-5">
      <PatternUnlock />
    </main>
  );
};

export default Preview;
