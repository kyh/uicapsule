import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
  title: "Badge",
  description:
    "Compact element that represents the status of an object or user input.",
  componentImport: 'import { Badge } from "@uicapsule/components";',
  typeImport: 'import type { BadgeProps } from "@uicapsule/components";',
  storybookUrl:
    "https://@uicapsule/components.so/storybook/?path=/story/components-badge",
  properties: {
    base: {
      children: {
        type: ControlType.slot,
        control: { mode: "text", defaultValue: "23" },
      },
      color: {
        type: ControlType.enum,
        options: ["positive", "critical", "primary"],
        control: { defaultValue: "critical" },
      },
      variant: { type: ControlType.enum, options: ["faded", "outline"] },
      size: { type: ControlType.enum, options: ["small"] },
      rounded: { type: ControlType.boolean },
      hidden: { type: ControlType.boolean, control: { ignore: true } },
      className: {
        type: ControlType.string,
        docs: { type: "string | string[]" },
        description: "Custom classNames for the root element",
      },
      attributes: {
        type: ControlType.string,
        description: "Custom HTML attributes for the root element",
      },
    },
    container: {
      children: {
        type: ControlType.slot,
        control: { defaultValue: true, ignore: true },
      },
      position: {
        type: ControlType.enum,
        options: ["top-end", "bottom-end"],
        defaultValue: "top-end",
      },
      overlap: {
        type: ControlType.boolean,
        description: "Should it be positioned within the child bounding box?",
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
