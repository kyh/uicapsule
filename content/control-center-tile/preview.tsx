"use client";

import { ControlCenterTile } from "./control-center-tile";

const Preview = () => {
  return (
    <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,#1a1c28_0%,#0d0e16_55%,#05060a_100%)] p-5">
      <ControlCenterTile />
    </main>
  );
};

export default Preview;
