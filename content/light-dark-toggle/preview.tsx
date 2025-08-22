import React, { useState } from "react";

import { LightDarkToggle } from "./source";

const Preview = () => {
  const [isLight, setIsLight] = useState(true);

  return (
    <div
      className={`main flex h-dvh items-center justify-center ${isLight ? "bg-stone-300" : "bg-stone-900"}`}
    >
      <button
        className={`grid size-12 place-items-center rounded-xl bg-gradient-to-t shadow-lg ${isLight ? "from-[#f8fafc] to-[#f1f5f9] text-stone-950" : "from-[#020617] to-[#0F172A] text-stone-50"}`}
        onClick={() => setIsLight(!isLight)}
      >
        <LightDarkToggle isLight={isLight} />
      </button>
    </div>
  );
};

export default Preview;
