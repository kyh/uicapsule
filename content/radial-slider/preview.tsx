import React, { useState } from "react";
import NumberFlow from "@number-flow/react";

import { RadialSlider } from "./radial-slider";

const Preview = () => {
  const [value, setValue] = useState(0);

  return (
    <main className="flex h-dvh items-center justify-center bg-zinc-900 p-5">
      <div className="relative h-36 w-96 overflow-hidden rounded-3xl bg-black p-4 shadow-2xl">
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-30 h-[20%] bg-gradient-to-b from-transparent to-black" />
        <div className="mb-6 flex items-center justify-center text-white">
          <NumberFlow value={value} className="text-xl" />
        </div>
        <div className="pointer-events-none absolute left-1/2 z-20 h-full w-1 -translate-x-1/2 -translate-y-3 rounded-full bg-white" />
        <RadialSlider value={value} onChange={setValue} />
      </div>
    </main>
  );
};

export default Preview;
