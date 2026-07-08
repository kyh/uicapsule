"use client";

import { OverscrollStretch } from "./overscroll-stretch";

const Preview = () => {
  return (
    <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,#1a1c22_0%,#0d0e12_55%,#050608_100%)] p-5">
      <OverscrollStretch />
    </main>
  );
};

export default Preview;
