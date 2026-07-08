"use client";

import { JiggleMode } from "./jiggle-mode";

const Preview = () => {
  return (
    <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,#1e2333_0%,#0d101c_55%,#05060c_100%)] p-5">
      <JiggleMode />
    </main>
  );
};

export default Preview;
