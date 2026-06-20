"use client";

import { useState } from "react";

import {
  SpinnerPixelGrid,
  spinnerShapes,
  spinnerVariants,
  type SpinnerShape,
} from "./spinner-pixel-grid";

const Preview = () => {
  const [glow, setGlow] = useState(true);
  const [shape, setShape] = useState<SpinnerShape>("square");

  return (
    <div className="min-h-screen bg-black text-yellow-300">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-4 border-b border-white/10 bg-black/80 p-4 backdrop-blur">
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={glow} onChange={(e) => setGlow(e.target.checked)} />
          Glow
        </label>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          Shape:
          {spinnerShapes.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={shape === s}
              onClick={() => setShape(s)}
              className={
                shape === s
                  ? "rounded bg-white/15 px-2 py-1 capitalize"
                  : "rounded px-2 py-1 capitalize text-gray-500 hover:text-gray-300"
              }
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 pb-32 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {spinnerVariants.map((variant) => (
          <div
            key={variant}
            className="flex flex-col items-center justify-center gap-4 border border-white/10 p-8"
          >
            <SpinnerPixelGrid
              variant={variant}
              shape={shape}
              glow={glow}
              size={10}
              gridSize={5}
              rainbow
            />
            <span className="text-xs text-gray-500">{variant}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Preview;
