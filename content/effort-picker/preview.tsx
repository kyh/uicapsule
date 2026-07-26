"use client";

import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";

import type { EffortTheme, EffortVariant } from "./effort-picker";

import { EffortPicker } from "./effort-picker";

const VARIANTS: { value: EffortVariant; label: string }[] = [
  { value: "slingshot", label: "Slingshot" },
  { value: "karaoke", label: "Karaoke" },
  { value: "curls", label: "Curls" },
];

const THEMES: { value: EffortTheme; label: string }[] = [
  { value: "chatgpt", label: "ChatGPT" },
  { value: "claude", label: "Claude" },
];

const isVariant = (value: string): value is EffortVariant =>
  VARIANTS.some((variant) => variant.value === value);

const isTheme = (value: string): value is EffortTheme =>
  THEMES.some((theme) => theme.value === value);

type PickerProps<T extends string> = {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: string) => void;
};

const Picker = <T extends string>({ label, value, options, onChange }: PickerProps<T>) => (
  <span className="relative flex items-center rounded-full border border-white/10 bg-neutral-900">
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="appearance-none bg-transparent py-1.5 pr-7 pl-3 text-xs text-neutral-400 outline-none"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    <ChevronDownIcon className="pointer-events-none absolute right-2.5 size-3.5 text-neutral-500" />
  </span>
);

const Preview = () => {
  const [variant, setVariant] = useState<EffortVariant>("slingshot");
  const [theme, setTheme] = useState<EffortTheme>("chatgpt");

  return (
    <div className="relative h-screen w-full bg-neutral-950">
      <span className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <Picker
          label="Variation"
          value={variant}
          options={VARIANTS}
          onChange={(value) => {
            if (isVariant(value)) setVariant(value);
          }}
        />
        <Picker
          label="Theme"
          value={theme}
          options={THEMES}
          onChange={(value) => {
            if (isTheme(value)) setTheme(value);
          }}
        />
      </span>

      <EffortPicker variant={variant} theme={theme} />
    </div>
  );
};

export default Preview;
