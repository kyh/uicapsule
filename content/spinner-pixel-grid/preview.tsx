import React from "react";

import { SpinnerPixelGrid, spinnerVariants } from "./spinner-pixel-grid";

const sizes = [6, 10, 14];

const Preview = () => {
  return (
    <div className="grid min-h-screen grid-cols-3 bg-black pb-32">
      {spinnerVariants.map((variant) =>
        sizes.map((size) => (
          <div
            key={`${variant}-${size}`}
            className="flex flex-col items-center justify-center gap-3 border border-white/10 p-6"
          >
            <SpinnerPixelGrid variant={variant} size={size} gridSize={5} />
            <span className="text-xs text-gray-500">
              {variant} ({size}px)
            </span>
          </div>
        )),
      )}
    </div>
  );
};

export default Preview;
