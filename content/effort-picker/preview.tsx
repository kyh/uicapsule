"use client";

import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";

import type { EffortVariant } from "./effort-picker";

import { EffortPicker } from "./effort-picker";

const VARIANTS: { value: EffortVariant; label: string }[] = [
  { value: "slingshot", label: "Slingshot" },
  { value: "karaoke", label: "Karaoke" },
];

const isVariant = (value: string): value is EffortVariant =>
  VARIANTS.some((variant) => variant.value === value);

const Preview = () => {
  const [variant, setVariant] = useState<EffortVariant>("slingshot");

  return (
    <div className="relative h-screen w-full bg-neutral-950">
      <span className="absolute top-4 left-4 z-10 flex items-center rounded-full border border-white/10 bg-neutral-900">
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

      <EffortPicker variant={variant} />
    </div>
  );
};

export default Preview;
