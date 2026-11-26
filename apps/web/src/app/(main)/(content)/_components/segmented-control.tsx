"use client";

import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";

import { TRAVEL_EASE } from "./control-row";

interface SegmentedControlProps {
  labelId: string;
  options: readonly { readonly label: string; readonly value: string }[];
  value: string;
  onChange: (value: string) => void;
}

/**
 * Options side by side in equal segments, a pill sliding to the chosen one. A radio group, so
 * Tab lands on the chosen segment and the arrow keys choose. Base UI sets the group's tab stop
 * once, from the radio checked at mount, so a value changed from outside (Reset) remounts the
 * radios to move it; the pill stays mounted and still slides.
 */
export const SegmentedControl = ({ labelId, options, value, onChange }: SegmentedControlProps) => {
  const [chosen, setChosen] = useState(value);
  const [generation, setGeneration] = useState(0);

  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  if (value !== chosen) {
    setChosen(value);
    setGeneration((current) => current + 1);
  }

  return (
    <div className="relative shrink-0">
      <span
        aria-hidden
        className={`bg-foreground/10 absolute inset-y-0.5 left-0.5 rounded-sm transition-transform duration-200 ${TRAVEL_EASE}`}
        style={{
          transform: `translateX(${index * 100}%)`,
          width: `calc((100% - 4px) / ${options.length})`,
        }}
      />
      <RadioGroup
        key={generation}
        aria-labelledby={labelId}
        value={value}
        className="auto-cols-fr grid-flow-col p-0.5"
        onValueChange={(next) => {
          setChosen(next);
          onChange(next);
        }}
      >
        {options.map((option) => (
          <RadioGroupItem
            key={option.value}
            value={option.value}
            render={(props) => (
              <span
                {...props}
                className="text-foreground/70 hover:text-foreground focus-visible:ring-ring/50 data-checked:text-foreground relative flex h-7 cursor-pointer items-center justify-center rounded-sm px-2 text-[13px] font-medium whitespace-nowrap transition-colors duration-150 outline-none select-none focus-visible:ring-2"
              >
                {option.label}
              </span>
            )}
          />
        ))}
      </RadioGroup>
    </div>
  );
};
