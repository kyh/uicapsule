"use client";

import { Dashboard } from "./dashboard";
import { Sidebar } from "./sidebar";

export const controls = {
  defaultWidth: {
    default: 240,
    group: "Layout",
    label: "Width",
    max: 400,
    min: 160,
    step: 4,
    type: "number",
  },
  minWidth: {
    default: 100,
    group: "Layout",
    label: "Min drag width",
    max: 240,
    min: 100,
    step: 4,
    type: "number",
  },
  maxWidth: {
    default: 300,
    group: "Layout",
    label: "Max drag width",
    max: 480,
    min: 240,
    step: 4,
    type: "number",
  },
  workspaceName: {
    default: "Dataembed",
    group: "Content",
    label: "Workspace",
    placeholder: "Name",
    type: "text",
  },
  activeItem: {
    default: "companies",
    group: "Content",
    label: "Active item",
    options: [
      { label: "Notifications", value: "notifications" },
      { label: "Tasks", value: "tasks" },
      { label: "Emails", value: "emails" },
      { label: "Reports", value: "reports" },
      { label: "Workflows", value: "workflows" },
      { label: "Onboarding pipeline", value: "onboarding-pipeline" },
      { label: "Companies", value: "companies" },
      { label: "People", value: "people" },
      { label: "Deals", value: "deals" },
      { label: "Strategic accounts", value: "strategic-accounts" },
    ],
    type: "select",
  },
  background: { default: "#FBFBFB", group: "Color", label: "Background", type: "color" },
  foreground: { default: "#232529", group: "Color", label: "Text", type: "color" },
  searchBackground: { default: "#FFFFFF", group: "Color", label: "Search field", type: "color" },
  activeBackground: {
    default: "#F4F5F6",
    group: "Color",
    label: "Active highlight",
    type: "color",
  },
  accentColor: { default: "#266DF0", group: "Color", label: "Handle", type: "color" },
} as const;

interface PreviewProps {
  accentColor: string;
  activeBackground: string;
  activeItem: (typeof controls.activeItem.options)[number]["value"];
  background: string;
  defaultWidth: number;
  foreground: string;
  maxWidth: number;
  minWidth: number;
  searchBackground: string;
  workspaceName: string;
}

const Preview = ({
  accentColor = controls.accentColor.default,
  activeBackground = controls.activeBackground.default,
  activeItem = controls.activeItem.default,
  background = controls.background.default,
  defaultWidth = controls.defaultWidth.default,
  foreground = controls.foreground.default,
  maxWidth = controls.maxWidth.default,
  minWidth = controls.minWidth.default,
  searchBackground = controls.searchBackground.default,
  workspaceName = controls.workspaceName.default,
}: Partial<PreviewProps>) => (
  <div
    className="relative grid h-full w-full overflow-hidden bg-white"
    style={{ gridTemplateColumns: "auto 1fr" }}
  >
    <Sidebar
      accentColor={accentColor}
      activeBackground={activeBackground}
      activeItem={activeItem}
      background={background}
      defaultWidth={defaultWidth}
      foreground={foreground}
      maxWidth={maxWidth}
      minWidth={minWidth}
      searchBackground={searchBackground}
      workspaceName={workspaceName}
    />
    <Dashboard />
  </div>
);

export default Preview;
