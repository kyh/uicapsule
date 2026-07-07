"use client";

import { ScreenshotCapture } from "./screenshot-capture";

const Preview = () => {
  return (
    <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,#1b1d26_0%,#0d0e14_55%,#050609_100%)] p-5">
      <ScreenshotCapture />
    </main>
  );
};

export default Preview;
