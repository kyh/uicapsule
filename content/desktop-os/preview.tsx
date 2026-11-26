"use client";

import { DesktopOS } from "./desktop-os";

export const controls = {
  boot: { default: true, group: "Boot", label: "Boot animation", type: "boolean" },
  bootSpeed: {
    default: 1,
    group: "Boot",
    label: "Boot speed",
    max: 2,
    min: 0.5,
    step: 0.05,
    type: "number",
  },
  openOnBoot: {
    default: "none",
    group: "Boot",
    label: "Open on boot",
    options: [
      { label: "Nothing", value: "none" },
      { label: "Files", value: "files" },
      { label: "Preview", value: "preview" },
      { label: "Photos", value: "photos" },
      { label: "Notes", value: "notes" },
      { label: "Terminal", value: "terminal" },
    ],
    type: "select",
  },
  iconSize: {
    default: 78,
    group: "Icons",
    label: "Icon size",
    max: 92,
    min: 56,
    step: 1,
    type: "number",
  },
  dockIconSize: {
    default: 56,
    group: "Icons",
    label: "Dock size",
    max: 72,
    min: 40,
    step: 1,
    type: "number",
  },
  dockMagnification: {
    default: 40,
    group: "Icons",
    label: "Magnification",
    max: 64,
    min: 0,
    step: 1,
    type: "number",
  },
  dockReach: {
    default: 140,
    group: "Icons",
    label: "Magnify reach",
    max: 280,
    min: 60,
    step: 5,
    type: "number",
  },
  accent: { default: "#3b82f6", group: "Style", label: "Selection", type: "color" },
  glowLeft: { default: "#2b3d74", group: "Style", label: "Glow left", type: "color" },
  glowRight: { default: "#4a2a63", group: "Style", label: "Glow right", type: "color" },
  rays: { default: true, group: "Style", label: "Light rays", type: "boolean" },
  vignette: {
    default: 0.35,
    group: "Style",
    label: "Vignette",
    max: 0.8,
    min: 0,
    step: 0.05,
    type: "number",
  },
  appName: {
    default: "Finder",
    group: "Menu bar",
    label: "App name",
    placeholder: "Finder",
    type: "text",
  },
  weekday: { default: "Wed", group: "Menu bar", label: "Day", placeholder: "Wed", type: "text" },
  time: { default: "14:08", group: "Menu bar", label: "Time", placeholder: "14:08", type: "text" },
} as const;

type BootApp = (typeof controls.openOnBoot.options)[number]["value"];

interface PreviewProps {
  accent: string;
  appName: string;
  boot: boolean;
  bootSpeed: number;
  dockIconSize: number;
  dockMagnification: number;
  dockReach: number;
  glowLeft: string;
  glowRight: string;
  iconSize: number;
  openOnBoot: BootApp;
  rays: boolean;
  time: string;
  vignette: number;
  weekday: string;
}

const Preview = ({
  accent = controls.accent.default,
  appName = controls.appName.default,
  boot = controls.boot.default,
  bootSpeed = controls.bootSpeed.default,
  dockIconSize = controls.dockIconSize.default,
  dockMagnification = controls.dockMagnification.default,
  dockReach = controls.dockReach.default,
  glowLeft = controls.glowLeft.default,
  glowRight = controls.glowRight.default,
  iconSize = controls.iconSize.default,
  openOnBoot = controls.openOnBoot.default,
  rays = controls.rays.default,
  time = controls.time.default,
  vignette = controls.vignette.default,
  weekday = controls.weekday.default,
}: Partial<PreviewProps>) => (
  <div className="relative h-screen w-full overflow-hidden bg-[#1a1612]">
    <DesktopOS
      key={`${String(boot)}:${String(bootSpeed)}:${openOnBoot}`}
      accent={accent}
      appName={appName}
      boot={boot}
      bootSpeed={bootSpeed}
      dockIconSize={dockIconSize}
      dockMagnification={dockMagnification}
      dockReach={dockReach}
      glowLeft={glowLeft}
      glowRight={glowRight}
      iconSize={iconSize}
      openOnBoot={openOnBoot === "none" ? undefined : openOnBoot}
      rays={rays}
      time={time}
      vignette={vignette}
      weekday={weekday}
    />
  </div>
);

export default Preview;
