"use client";

import { AsciiRenderer, DEFAULT_CHARACTERS } from "./ascii-renderer";
import type { AsciiModel } from "./ascii-renderer";

export const controls = {
  model: {
    default: "torusKnot",
    options: [
      { label: "Torus knot", value: "torusKnot" },
      { label: "Torus", value: "torus" },
      { label: "Cube", value: "box" },
      { label: "Icosahedron", value: "icosahedron" },
    ],
    type: "select",
  },
  characters: {
    default: DEFAULT_CHARACTERS,
    label: "Characters",
    placeholder: "Light to dark glyphs",
    type: "text",
  },
  resolution: { default: 0.15, label: "Density", max: 0.25, min: 0.06, step: 0.01, type: "number" },
  rotationSpeed: { default: 0.5, label: "Spin speed", max: 2, min: 0, step: 0.05, type: "number" },
  scale: { default: 1.25, label: "Size", max: 1.6, min: 0.5, step: 0.05, type: "number" },
  color: { default: "#ffffff", label: "Text", type: "color" },
  background: { default: "#000000", label: "Background", type: "color" },
} as const;

interface PreviewProps {
  background: string;
  characters: string;
  color: string;
  model: AsciiModel;
  resolution: number;
  rotationSpeed: number;
  scale: number;
}

const Preview = ({
  background = controls.background.default,
  characters = controls.characters.default,
  color = controls.color.default,
  model = controls.model.default,
  resolution = controls.resolution.default,
  rotationSpeed = controls.rotationSpeed.default,
  scale = controls.scale.default,
}: Partial<PreviewProps>) => (
  <div className="h-dvh w-full">
    <AsciiRenderer
      background={background}
      characters={characters}
      color={color}
      model={model}
      resolution={resolution}
      rotationSpeed={rotationSpeed}
      scale={scale}
    />
  </div>
);

export default Preview;
