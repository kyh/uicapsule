"use client";

import { useState } from "react";

import { LightDarkToggle } from "./light-dark-toggle";

export const controls = {
  initial: {
    default: "light",
    label: "Start as",
    options: [
      { label: "Light", value: "light" },
      { label: "Dark", value: "dark" },
    ],
    type: "select",
  },
  size: { default: 24, label: "Icon size", max: 72, min: 16, step: 2, type: "number" },
  rayCount: { default: 6, label: "Rays", max: 10, min: 4, step: 1, type: "number" },
  rayRadius: { default: 1.5, label: "Ray size", max: 2, min: 0.75, step: 0.25, type: "number" },
  rayStagger: {
    default: 0.05,
    label: "Ray stagger",
    max: 0.15,
    min: 0,
    step: 0.01,
    type: "number",
  },
  duration: { default: 500, label: "Spin duration", max: 1500, min: 150, step: 50, type: "number" },
  lightBackground: { default: "#d6d3d1", label: "Light backdrop", type: "color" },
  darkBackground: { default: "#1c1917", label: "Dark backdrop", type: "color" },
} as const;

interface PreviewProps {
  darkBackground: string;
  duration: number;
  initial: "light" | "dark";
  lightBackground: string;
  rayCount: number;
  rayRadius: number;
  rayStagger: number;
  size: number;
}

interface StageProps extends Omit<PreviewProps, "initial"> {
  startLight: boolean;
}

const Stage = ({
  darkBackground,
  duration,
  lightBackground,
  rayCount,
  rayRadius,
  rayStagger,
  size,
  startLight,
}: StageProps) => {
  const [isLight, setIsLight] = useState(startLight);

  return (
    <div
      className="main flex h-dvh items-center justify-center"
      style={{ backgroundColor: isLight ? lightBackground : darkBackground }}
    >
      <button
        type="button"
        aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
        className={`grid place-items-center bg-gradient-to-t shadow-lg ${isLight ? "from-[#f8fafc] to-[#f1f5f9] text-stone-950" : "from-[#020617] to-[#0F172A] text-stone-50"}`}
        style={{ borderRadius: size / 2, height: size * 2, width: size * 2 }}
        onClick={() => {
          setIsLight(!isLight);
        }}
      >
        <LightDarkToggle
          isLight={isLight}
          duration={duration}
          rayCount={rayCount}
          rayRadius={rayRadius}
          rayStagger={rayStagger}
          size={size}
        />
      </button>
    </div>
  );
};

const Preview = ({
  darkBackground = controls.darkBackground.default,
  duration = controls.duration.default,
  initial = controls.initial.default,
  lightBackground = controls.lightBackground.default,
  rayCount = controls.rayCount.default,
  rayRadius = controls.rayRadius.default,
  rayStagger = controls.rayStagger.default,
  size = controls.size.default,
}: Partial<PreviewProps>) => (
  <Stage
    key={initial}
    darkBackground={darkBackground}
    duration={duration}
    lightBackground={lightBackground}
    rayCount={rayCount}
    rayRadius={rayRadius}
    rayStagger={rayStagger}
    size={size}
    startLight={initial === "light"}
  />
);

export default Preview;
