"use client";

import { ContextMenuPeek } from "./context-menu-peek";
import type { ClayTone } from "./phone-frame";

export const controls = {
  longPressMs: {
    default: 400,
    label: "Hold (ms)",
    max: 1200,
    min: 150,
    step: 10,
    type: "number",
  },
  lift: { default: 1.04, label: "Lift scale", max: 1.12, min: 1, step: 0.01, type: "number" },
  blur: { default: 14, label: "Backdrop blur", max: 24, min: 0, step: 1, type: "number" },
  dim: { default: 0.45, label: "Backdrop dim", max: 0.75, min: 0, step: 0.05, type: "number" },
  menuBounce: { default: 0.3, label: "Menu bounce", max: 0.6, min: 0, step: 0.05, type: "number" },
  menuDuration: {
    default: 0.42,
    label: "Menu duration (s)",
    max: 1,
    min: 0.15,
    step: 0.01,
    type: "number",
  },
  sentColor: { default: "#0a84ff", label: "Sent bubble", type: "color" },
  receivedColor: { default: "#26262a", label: "Received bubble", type: "color" },
  tone: {
    default: "graphite",
    label: "Phone tone",
    options: [
      { label: "Graphite", value: "graphite" },
      { label: "Slate", value: "slate" },
      { label: "Teal", value: "teal" },
      { label: "Moss", value: "moss" },
      { label: "Ochre", value: "ochre" },
      { label: "Terracotta", value: "terracotta" },
      { label: "Espresso", value: "espresso" },
      { label: "Plum", value: "plum" },
    ],
    type: "select",
  },
  contactName: {
    default: "Kai Lambert",
    label: "Contact",
    placeholder: "Contact name",
    type: "text",
  },
  hint: { default: "Hold a bubble", label: "Hint", placeholder: "Empty hides it", type: "text" },
} as const;

interface PreviewProps {
  blur: number;
  contactName: string;
  dim: number;
  hint: string;
  lift: number;
  longPressMs: number;
  menuBounce: number;
  menuDuration: number;
  receivedColor: string;
  sentColor: string;
  tone: ClayTone;
}

const Preview = ({
  blur = controls.blur.default,
  contactName = controls.contactName.default,
  dim = controls.dim.default,
  hint = controls.hint.default,
  lift = controls.lift.default,
  longPressMs = controls.longPressMs.default,
  menuBounce = controls.menuBounce.default,
  menuDuration = controls.menuDuration.default,
  receivedColor = controls.receivedColor.default,
  sentColor = controls.sentColor.default,
  tone = controls.tone.default,
}: Partial<PreviewProps>) => (
  <main className="flex h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_70%_55%_at_50%_0%,rgb(148_163_184/0.14)_0%,transparent_70%),linear-gradient(180deg,#232830_0%,#171b21_55%,#0f1115_100%)] p-5">
    <ContextMenuPeek
      blur={blur}
      contactName={contactName}
      dim={dim}
      hint={hint}
      lift={lift}
      longPressMs={longPressMs}
      menuBounce={menuBounce}
      menuDuration={menuDuration}
      receivedColor={receivedColor}
      sentColor={sentColor}
      tone={tone}
    />
  </main>
);

export default Preview;
