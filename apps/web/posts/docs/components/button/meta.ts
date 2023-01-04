import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
  title: "Button",
  description: "Interactive element used for single-step actions.",
  componentImport: 'import { Button } from "@uicapsule/components";',
  typeImport: 'import type { ButtonProps } from "@uicapsule/components";',
  relatedComponents: [
    { name: "Link", url: "/content/docs/components/link" },
    { name: "Menu Item", url: "/content/docs/components/menu-item" },
    { name: "Actionable", url: "/content/docs/utilities/actionable" },
  ],
  storybookUrl:
    "https://uicapsule.com/storybook/?path=/story/components-button",
  properties: {
    base: {
      children: {
        type: ControlType.slot,
        control: { defaultValue: "Instant delivery", mode: "text" },
      },
      startIcon: {
        type: ControlType.icon,
        description: "SVG component definition",
        control: { defaultValue: "IconZap" },
      },
      endIcon: {
        type: ControlType.icon,
        description: "SVG component definition",
      },
      color: {
        type: ControlType.enum,
        defaultValue: "neutral",
        control: { defaultValue: "primary" },
        options: [
          "neutral",
          "primary",
          "critical",
          "positive",
          "black",
          "white",
          "inherit",
        ],
      },
      variant: { type: ControlType.enum, options: ["outline", "ghost"] },
      size: {
        type: ControlType.enum,
        options: ["small", "medium", "large", "xlarge"],
        responsive: true,
      },
      fullWidth: { type: ControlType.boolean, responsive: true },
      rounded: { type: ControlType.boolean },
      loading: { type: ControlType.boolean },
      disabled: { type: ControlType.boolean },
      elevated: { type: ControlType.boolean },
      highlighted: { type: ControlType.boolean },
      href: { type: ControlType.string },
      onClick: {
        type: ControlType.function,
        args: [{ name: "event", type: "React.Event" }],
      },
      type: {
        type: ControlType.enum,
        options: ["button", "submit", "reset"],
        defaultValue: "button",
      },
      className: {
        type: ControlType.string,
        docs: { type: "string | string[]" },
        description: "Custom classNames for the root element",
      },
      attributes: {
        type: ControlType.object,
        description: "Custom HTML attributes for the root element",
      },
    },
    aligner: {
      children: { type: ControlType.slot, control: { ignore: true } },
      position: {
        type: ControlType.array,
        description: "Sides of the button to apply negative margin",
        item: {
          type: ControlType.enum,
          options: ["top", "bottom", "start", "end"],
        },
        control: { ignore: true },
      },
      className: {
        type: ControlType.string,
        docs: { type: "string | string[]" },
        description: "Custom classNames for the root element",
      },
      attributes: {
        type: ControlType.object,
        description: "Custom HTML attributes for the root element",
      },
    },
  },
};

export default meta;
