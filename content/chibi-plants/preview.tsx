"use client";

import { useState } from "react";

import type { ChibiVariant } from "./chibi-plants";
import { CHIBI_VARIANTS, ChibiPlants, VARIANTS } from "./chibi-plants";

const POT_SWATCHES = ["#d98b71", "#ead9c8", "#7f9bd1", "#4a4e59"];

const Slider = ({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) => (
  <label className="flex items-center gap-2">
    <span className="w-12 text-[11px] tracking-wide text-white/45">{label}</span>
    <input
      type="range"
      min={min}
      max={max}
      step={0.01}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-white/15 accent-white/80"
    />
  </label>
);

const Preview = () => {
  const [variant, setVariant] = useState<ChibiVariant>("pip");
  const [eyeScale, setEyeScale] = useState(1);
  const [wobble, setWobble] = useState(1);
  const [gaze, setGaze] = useState(1);
  const [potColor, setPotColor] = useState<string | undefined>(undefined);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#0b0a0e]">
      <ChibiPlants
        variant={variant}
        eyeScale={eyeScale}
        wobble={wobble}
        gaze={gaze}
        potColor={potColor}
        className="absolute inset-0"
      />

      <p className="pointer-events-none absolute top-6 left-1/2 -translate-x-1/2 text-xs tracking-wide text-white/30">
        move your cursor — they&apos;re watching
      </p>

      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 backdrop-blur-md">
        <div className="flex gap-2">
          {CHIBI_VARIANTS.map((v) => (
            <button
              key={v}
              type="button"
              data-variant={v}
              onClick={() => setVariant(v)}
              className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                variant === v
                  ? "bg-white/90 text-neutral-900"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              <span
                className="size-2.5 rounded-full"
                style={{ background: VARIANTS[v].palette.body }}
              />
              {VARIANTS[v].label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-5">
          <Slider label="eyes" value={eyeScale} min={0.5} max={1.6} onChange={setEyeScale} />
          <Slider label="wobble" value={wobble} min={0} max={2} onChange={setWobble} />
          <Slider label="gaze" value={gaze} min={0} max={1.5} onChange={setGaze} />
          <div className="flex items-center gap-1.5">
            {POT_SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`pot ${c}`}
                onClick={() => setPotColor((cur) => (cur === c ? undefined : c))}
                className={`size-4 rounded-full transition-transform ${
                  potColor === c ? "scale-125 ring-2 ring-white/70" : "hover:scale-110"
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Preview;
