"use client";

import { useEffect, useMemo, useState } from "react";

import type { FormationMode, Work } from "./formation-poses";
import { Formation } from "./formation";

const rootUrl = "https://d24l2zb4cwkekfpl.public.blob.vercel-storage.com/formation";

const works: Work[] = [
  {
    image: `${rootUrl}/vista.jpg`,
    title: "Vantage",
  },
  {
    image: `${rootUrl}/mirror.jpg`,
    title: "Mirror",
  },
  {
    image: `${rootUrl}/cosmos.jpg`,
    title: "Cosmos",
  },
  {
    image: `${rootUrl}/current.jpg`,
    title: "Current",
  },
  {
    image: `${rootUrl}/portal.jpg`,
    title: "Threshold",
  },
  {
    image: `${rootUrl}/valley.jpg`,
    title: "Hollow",
  },
  {
    image: `${rootUrl}/ascent.jpg`,
    title: "Ascent",
  },
  {
    image: `${rootUrl}/array.jpg`,
    title: "Array",
  },
  {
    image: `${rootUrl}/giza.jpg`,
    title: "Meridian",
  },
  {
    image: `${rootUrl}/rift.jpg`,
    title: "Rift",
  },
  {
    image: `${rootUrl}/overlook.jpg`,
    title: "Overlook",
  },
  {
    image: `${rootUrl}/horizon.jpg`,
    title: "Event Horizon",
  },
  {
    image: `${rootUrl}/archipelago.jpg`,
    title: "Archipelago",
  },
  {
    image: `${rootUrl}/crest.jpg`,
    title: "Crest",
  },
  {
    image: `${rootUrl}/ridge.jpg`,
    title: "Ridge",
  },
  {
    image: `${rootUrl}/fathom.jpg`,
    title: "Fathom",
  },
];

const tour: FormationMode[] = ["flat", "tilt", "ring", "gallery"];

const noop = () => null;

export const controls = {
  formation: {
    default: "flat",
    group: "Tour",
    options: [
      { label: "Flat", value: "flat" },
      { label: "Tilt", value: "tilt" },
      { label: "Ring", value: "ring" },
      { label: "Gallery", value: "gallery" },
    ],
    type: "select",
  },
  autoCycle: { default: true, group: "Tour", label: "Auto cycle", type: "boolean" },
  cycleSeconds: {
    default: 4,
    group: "Tour",
    label: "Cycle every (s)",
    max: 10,
    min: 3,
    step: 0.5,
    type: "number",
  },
  count: { default: 16, group: "Cards", label: "Cards", max: 16, min: 8, step: 1, type: "number" },
  cardScale: {
    default: 1,
    group: "Cards",
    label: "Card size",
    max: 1.3,
    min: 0.7,
    step: 0.05,
    type: "number",
  },
  cornerRadius: {
    default: 12,
    group: "Cards",
    label: "Corner radius",
    max: 32,
    min: 0,
    step: 1,
    type: "number",
  },
  hoverZoom: {
    default: 0.26,
    group: "Motion",
    label: "Hover zoom",
    max: 0.6,
    min: 0,
    step: 0.02,
    type: "number",
  },
  parallax: {
    default: 5,
    group: "Motion",
    label: "Parallax lean",
    max: 15,
    min: 0,
    step: 0.5,
    type: "number",
  },
  morphDuration: {
    default: 680,
    group: "Motion",
    label: "Morph duration",
    max: 1600,
    min: 200,
    step: 20,
    type: "number",
  },
  morphStagger: {
    default: 220,
    group: "Motion",
    label: "Morph stagger",
    max: 600,
    min: 0,
    step: 10,
    type: "number",
  },
  perspective: {
    default: 1700,
    group: "Scene",
    label: "Perspective",
    max: 3000,
    min: 600,
    step: 50,
    type: "number",
  },
  backgroundTop: { default: "#121215", group: "Scene", label: "Backdrop top", type: "color" },
  backgroundBottom: { default: "#09090b", group: "Scene", label: "Backdrop bottom", type: "color" },
  showCounter: { default: true, group: "Scene", label: "Counter", type: "boolean" },
} as const;

interface PreviewProps {
  autoCycle: boolean;
  backgroundBottom: string;
  backgroundTop: string;
  cardScale: number;
  cornerRadius: number;
  count: number;
  cycleSeconds: number;
  formation: FormationMode;
  hoverZoom: number;
  morphDuration: number;
  morphStagger: number;
  parallax: number;
  perspective: number;
  showCounter: boolean;
}

const Preview = ({
  autoCycle = controls.autoCycle.default,
  backgroundBottom = controls.backgroundBottom.default,
  backgroundTop = controls.backgroundTop.default,
  cardScale = controls.cardScale.default,
  cornerRadius = controls.cornerRadius.default,
  count = controls.count.default,
  cycleSeconds = controls.cycleSeconds.default,
  formation = controls.formation.default,
  hoverZoom = controls.hoverZoom.default,
  morphDuration = controls.morphDuration.default,
  morphStagger = controls.morphStagger.default,
  parallax = controls.parallax.default,
  perspective = controls.perspective.default,
  showCounter = controls.showCounter.default,
}: Partial<PreviewProps>) => {
  const [cycle, setCycle] = useState({ origin: formation, step: 0 });
  const shown = useMemo(() => works.slice(0, count), [count]);

  useEffect(() => {
    if (!autoCycle || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return noop;
    }

    const id = window.setInterval(() => {
      setCycle((c) =>
        c.origin === formation
          ? { origin: formation, step: c.step + 1 }
          : { origin: formation, step: 1 },
      );
    }, cycleSeconds * 1000);

    return () => {
      window.clearInterval(id);
    };
  }, [autoCycle, cycleSeconds, formation]);

  const step = autoCycle && cycle.origin === formation ? cycle.step : 0;
  const mode = tour.at((tour.indexOf(formation) + step) % tour.length) ?? formation;

  return (
    <Formation
      works={shown}
      mode={mode}
      backgroundTop={backgroundTop}
      backgroundBottom={backgroundBottom}
      cardScale={cardScale}
      cornerRadius={cornerRadius}
      hoverZoom={hoverZoom}
      parallax={parallax}
      perspective={perspective}
      morphDuration={morphDuration}
      morphStagger={morphStagger}
      showCounter={showCounter}
    />
  );
};

export default Preview;
