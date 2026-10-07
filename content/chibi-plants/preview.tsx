"use client";

import { useState } from "react";

import type { ChibiVariant } from "./chibi-plants";
import { CHIBI_VARIANTS, ChibiPlants, VARIANTS } from "./chibi-plants";

const Preview = () => {
  const [variant, setVariant] = useState<ChibiVariant>("pip");

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#0b0a0e]">
      <ChibiPlants variant={variant} className="absolute inset-0" />

      <fieldset className="absolute bottom-4 left-4 m-0 flex min-w-0 flex-col items-center border-0 p-0">
        <legend className="sr-only">Plant</legend>
        {CHIBI_VARIANTS.map((v) => (
          <button
            key={v}
            type="button"
            data-variant={v}
            aria-label={VARIANTS[v].label}
            aria-pressed={variant === v}
            title={VARIANTS[v].label}
            onClick={() => setVariant(v)}
            className="group grid size-9 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <span
              className={`size-4 rounded-full transition-[scale,opacity,box-shadow] duration-200 ease-out motion-reduce:transition-none ${
                variant === v
                  ? "ring-2 ring-white/85 ring-offset-2 ring-offset-[#0b0a0e]"
                  : "opacity-55 group-hover:scale-110 group-hover:opacity-100"
              }`}
              style={{ background: VARIANTS[v].palette.body }}
            />
          </button>
        ))}
      </fieldset>
    </main>
  );
};

export default Preview;
