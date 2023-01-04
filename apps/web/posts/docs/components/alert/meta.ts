import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
  title: "Alert",
  description:
    "Prominent message related to the whole page or its specific area.",
  componentImport: 'import { Alert } from "@uicapsule/components";',
  typeImport: 'import type { AlertProps } from "@uicapsule/components";',
  relatedComponents: [
    { name: "Card", url: "/content/docs/components/card" },
    { name: "View", url: "/content/docs/utilities/view" },
  ],
  storybookUrl: "https://uicapsule.com/storybook/?path=/story/components-alert",
  properties: {
    base: {
      title: {
        type: ControlType.slot,
        control: { mode: "text", defaultValue: "New version is available" },
      },
      icon: {
        type: ControlType.icon,
        description: "SVG component definition",
        control: { defaultValue: "IconZap" },
      },
      children: {
        type: ControlType.slot,
        control: {
          defaultValue:
            "Find out which new features are available in the upcoming UIC release",
          mode: "text",
        },
      },
      actionsSlot: {
        type: ControlType.slot,
        description: "Adds a gap between the components",
        control: { defaultValue: true, ignore: true },
      },
      color: {
        type: ControlType.enum,
        options: ["neutral", "primary", "positive", "critical"],
        defaultValue: "neutral",
        control: { defaultValue: "primary" },
      },
      inline: {
        type: ControlType.boolean,
        description: "Switch to horizontal layout direction",
      },
      bleed: {
        type: ControlType.number,
        responsive: true,
        description:
          "Horizontal negative margin value, base unit token multiplier",
      },
      className: {
        type: ControlType.string,
        description: "Custom classNames for the root element",
        docs: { type: "(string | undefined | null | false)[]" },
      },
      attributes: {
        type: ControlType.object,
        description: "Custom HTML attributes for the root element",
      },
    },
  },
};

export default meta;
