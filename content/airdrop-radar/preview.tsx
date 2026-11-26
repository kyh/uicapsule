"use client";

import { AirdropRadar } from "./airdrop-radar";
import type { ClayTone } from "./phone-frame";

export const controls = {
  peopleCount: {
    default: 4,
    group: "Radar",
    label: "People",
    max: 4,
    min: 1,
    step: 1,
    type: "number",
  },
  ringCount: {
    default: 3,
    group: "Radar",
    label: "Rings",
    max: 6,
    min: 1,
    step: 1,
    type: "number",
  },
  pulseDuration: {
    default: 3.6,
    group: "Radar",
    label: "Pulse (s)",
    max: 8,
    min: 1.2,
    step: 0.1,
    type: "number",
  },
  ringColor: { default: "#38bdf8", group: "Radar", label: "Accent", type: "color" },
  photoCount: {
    default: 3,
    group: "Transfer",
    label: "Photos",
    max: 99,
    min: 1,
    step: 1,
    type: "number",
  },
  sendDuration: {
    default: 1.9,
    group: "Transfer",
    label: "Send (s)",
    max: 5,
    min: 0.4,
    step: 0.1,
    type: "number",
  },
  sentHold: {
    default: 2.2,
    group: "Transfer",
    label: "Sent hold (s)",
    max: 5,
    min: 0.5,
    step: 0.1,
    type: "number",
  },
  sendingColor: { default: "#0a84ff", group: "Transfer", label: "Progress color", type: "color" },
  sentColor: { default: "#30d158", group: "Transfer", label: "Sent color", type: "color" },
  title: {
    default: "AirDrop",
    group: "Copy",
    label: "Title",
    placeholder: "AirDrop",
    type: "text",
  },
  hint: {
    default: "Tap someone to send",
    group: "Copy",
    label: "Hint",
    placeholder: "Hint text",
    type: "text",
  },
  ownerInitials: {
    default: "KL",
    group: "Copy",
    label: "Your initials",
    placeholder: "KL",
    type: "text",
  },
  tone: {
    default: "slate",
    group: "Phone",
    label: "Phone",
    options: [
      { label: "Slate", value: "slate" },
      { label: "Graphite", value: "graphite" },
      { label: "Espresso", value: "espresso" },
      { label: "Moss", value: "moss" },
      { label: "Ochre", value: "ochre" },
      { label: "Plum", value: "plum" },
      { label: "Teal", value: "teal" },
      { label: "Terracotta", value: "terracotta" },
    ],
    type: "select",
  },
  screenColor: { default: "#08101d", group: "Phone", label: "Screen", type: "color" },
} as const;

interface PreviewProps {
  hint: string;
  ownerInitials: string;
  peopleCount: number;
  photoCount: number;
  pulseDuration: number;
  ringColor: string;
  ringCount: number;
  screenColor: string;
  sendDuration: number;
  sendingColor: string;
  sentColor: string;
  sentHold: number;
  title: string;
  tone: ClayTone;
}

const Preview = ({
  hint = controls.hint.default,
  ownerInitials = controls.ownerInitials.default,
  peopleCount = controls.peopleCount.default,
  photoCount = controls.photoCount.default,
  pulseDuration = controls.pulseDuration.default,
  ringColor = controls.ringColor.default,
  ringCount = controls.ringCount.default,
  screenColor = controls.screenColor.default,
  sendDuration = controls.sendDuration.default,
  sendingColor = controls.sendingColor.default,
  sentColor = controls.sentColor.default,
  sentHold = controls.sentHold.default,
  title = controls.title.default,
  tone = controls.tone.default,
}: Partial<PreviewProps>) => (
  <main className="flex h-dvh items-center justify-center overflow-hidden bg-[repeating-radial-gradient(circle_at_50%_50%,transparent_0_139px,rgb(103_232_249/0.045)_139px_140px),radial-gradient(circle_at_50%_50%,rgb(34_211_238/0.16)_0%,transparent_38%),radial-gradient(ellipse_at_50%_40%,#0f1c38_0%,#081226_55%,#030712_100%)] p-5">
    <AirdropRadar
      hint={hint}
      ownerInitials={ownerInitials}
      peopleCount={peopleCount}
      photoCount={photoCount}
      pulseDuration={pulseDuration}
      ringColor={ringColor}
      ringCount={ringCount}
      screenColor={screenColor}
      sendDuration={sendDuration}
      sendingColor={sendingColor}
      sentColor={sentColor}
      sentHold={sentHold}
      title={title}
      tone={tone}
    />
  </main>
);

export default Preview;
