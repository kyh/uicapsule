"use client";

import { SpinnerPixelGrid, spinnerVariants } from "./spinner-pixel-grid";

const Preview = () => {
  return (
    <div className="grid min-h-screen grid-cols-2 bg-black pb-32 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {spinnerVariants.map((variant) => (
        <div
          key={variant}
          className="flex flex-col items-center justify-center gap-4 border border-white/10 p-8"
        >
          <SpinnerPixelGrid variant={variant} size={10} gridSize={5} />
          <span className="text-xs text-gray-500">{variant}</span>
        </div>
      ))}
    </div>
  );
};

export default Preview;
