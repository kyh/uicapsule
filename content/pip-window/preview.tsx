"use client";

import { PipWindow } from "./pip-window";

const Preview = () => {
  return (
    <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,#1a1c24_0%,#0d0e13_55%,#050609_100%)] p-5">
      <PipWindow />
    </main>
  );
};

export default Preview;
