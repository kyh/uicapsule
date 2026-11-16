"use client";

import { useEffect } from "react";

import { clock } from "./sakuga-core";
import { SakugaVfx } from "./sakuga-vfx";

const Preview = () => {
  // The same handle the original exposes: lets a film stop the clock and step it a frame at a time.
  useEffect(() => {
    Reflect.set(globalThis, "SakugaFX", clock);
  }, []);
  return (
    <main className="min-h-dvh overflow-x-clip bg-white px-4 py-8 [color-scheme:light]">
      <div className="mx-auto flex justify-center">
        <SakugaVfx />
      </div>
    </main>
  );
};

export default Preview;
