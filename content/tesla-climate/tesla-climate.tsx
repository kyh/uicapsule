"use client";

import { useState } from "react";
import NumberFlow from "@number-flow/react";
import { ChevronLeft, ChevronRight, Fan, Power } from "lucide-react";

import { VentScene } from "./vent-scene";

const MIN_TEMP = 60;
const MAX_TEMP = 80;

const tempLabel = (tempF: number) => {
  if (tempF <= MIN_TEMP) return "LO";
  if (tempF >= MAX_TEMP) return "HI";
  return String(tempF);
};

export const TeslaClimate = () => {
  const [powerOn, setPowerOn] = useState(true);
  const [acOn, setAcOn] = useState(true);
  const [tempF, setTempF] = useState(68);
  const [fanSpeed, setFanSpeed] = useState(4);

  const adjustTemp = (delta: number) => {
    setTempF((previous) => Math.min(MAX_TEMP, Math.max(MIN_TEMP, previous + delta)));
  };

  const adjustFan = (delta: number) => {
    setFanSpeed((previous) => Math.min(10, Math.max(1, previous + delta)));
  };

  const label = tempLabel(tempF);

  return (
    <div className="w-[min(620px,94vw)] overflow-hidden rounded-[24px] shadow-2xl shadow-black/50 ring-1 ring-black/15 select-none">
      <div className="relative h-[380px]">
        <VentScene tempF={tempF} fanSpeed={fanSpeed} powerOn={powerOn} acOn={acOn} />

        <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-2 px-4">
          <button
            type="button"
            aria-pressed={powerOn}
            aria-label={powerOn ? "Turn climate off" : "Turn climate on"}
            onClick={() => setPowerOn((previous) => !previous)}
            className={`grid h-10 w-11 place-items-center rounded-lg shadow-sm ring-1 transition-colors ${
              powerOn
                ? "bg-[#3d63f5] text-white ring-[#3d63f5]"
                : "bg-white/70 text-[#5b6472] ring-black/5 hover:bg-white/90"
            }`}
          >
            <Power className="size-4" />
          </button>

          <button
            type="button"
            aria-pressed={acOn}
            onClick={() => setAcOn((previous) => !previous)}
            className={`h-10 rounded-lg px-3.5 text-[13px] font-medium shadow-sm ring-1 transition-colors disabled:opacity-60 ${
              acOn && powerOn
                ? "bg-[#96a3f4]/50 text-[#2c3ea8] ring-[#8291ea]/40"
                : "bg-white/70 text-[#5b6472] ring-black/5 hover:bg-white/90"
            }`}
            disabled={!powerOn}
          >
            A/C
          </button>

          <div className="flex h-10 items-center rounded-lg bg-white/70 shadow-sm ring-1 ring-black/5">
            <button
              type="button"
              aria-label="Decrease temperature"
              onClick={() => adjustTemp(-1)}
              className="grid h-full w-8 place-items-center text-[#8a92a0] transition-colors hover:text-[#3c4452] disabled:opacity-50"
              disabled={!powerOn}
            >
              <ChevronLeft className="size-4" />
            </button>
            <div className="w-8 text-center text-[15px] font-semibold text-[#3c4452] tabular-nums">
              {label === "LO" || label === "HI" ? (
                <span>{label}</span>
              ) : (
                <NumberFlow value={tempF} />
              )}
            </div>
            <button
              type="button"
              aria-label="Increase temperature"
              onClick={() => adjustTemp(1)}
              className="grid h-full w-8 place-items-center text-[#8a92a0] transition-colors hover:text-[#3c4452] disabled:opacity-50"
              disabled={!powerOn}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="flex h-10 items-center rounded-lg bg-white/70 shadow-sm ring-1 ring-black/5">
            <button
              type="button"
              aria-label="Decrease fan speed"
              onClick={() => adjustFan(-1)}
              className="grid h-full w-8 place-items-center text-[#8a92a0] transition-colors hover:text-[#3c4452] disabled:opacity-50"
              disabled={!powerOn}
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="flex items-center gap-1.5 px-1 text-[13px] font-medium text-[#5b6472]">
              <Fan
                className="size-4"
                style={
                  powerOn
                    ? { animation: `spin ${(4.4 - fanSpeed * 0.36).toFixed(2)}s linear infinite` }
                    : undefined
                }
              />
              <span className="w-4 text-center tabular-nums">
                <NumberFlow value={fanSpeed} />
              </span>
            </span>
            <button
              type="button"
              aria-label="Increase fan speed"
              onClick={() => adjustFan(1)}
              className="grid h-full w-8 place-items-center text-[#8a92a0] transition-colors hover:text-[#3c4452] disabled:opacity-50"
              disabled={!powerOn}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        {!powerOn && (
          <p className="pointer-events-none absolute inset-x-0 top-[46%] text-center text-xs tracking-widest text-[#8a93a1] uppercase">
            Climate off
          </p>
        )}
      </div>
    </div>
  );
};
