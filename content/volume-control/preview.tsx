"use client";

import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";

import type { VolumeVariant } from "./volume-control";

import { VolumeControl } from "./volume-control";

const VARIANTS: { value: VolumeVariant; label: string }[] = [
  { value: "tilt", label: "Tilt" },
  { value: "cannon", label: "Cannon" },
  { value: "curling", label: "Curling" },
  { value: "dots", label: "Dots" },
  { value: "plus-minus", label: "+/− game" },
];

const isVariant = (value: string): value is VolumeVariant =>
  VARIANTS.some((variant) => variant.value === value);

const Preview = () => {
  const [variant, setVariant] = useState<VolumeVariant>("tilt");

  return (
    <div className="relative h-screen w-full bg-neutral-950">
      {/* Bottom-left, out of the way: the HUD hangs off the top-right corner. */}
      <span className="absolute bottom-4 left-4 z-10 flex items-center rounded-full border border-white/10 bg-neutral-900">
        <select
          aria-label="Variation"
          value={variant}
          onChange={(event) => {
            if (isVariant(event.target.value)) setVariant(event.target.value);
          }}
          className="appearance-none bg-transparent py-1.5 pr-7 pl-3 text-xs text-neutral-400 outline-none"
        >
          {VARIANTS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-2.5 size-3.5 text-neutral-500" />
      </span>

      <VolumeControl variant={variant} />
    </div>
  );
};

export default Preview;
