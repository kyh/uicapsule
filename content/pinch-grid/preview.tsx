"use client";

import { PinchGrid } from "./pinch-grid";

const Preview = () => {
  return (
    <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,#1d1f26_0%,#0f1015_55%,#06070a_100%)] p-5">
      <PinchGrid />
    </main>
  );
};

export default Preview;
