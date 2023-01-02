import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
  title: "Icon",
  description: "Wrapper for SVG assets to control their appearance.",
  componentImport: 'import { Icon } from "@uicapsule/components";',
  typeImport: 'import type { IconProps } from "@uicapsule/components";',
  storybookUrl:
    "https://@uicapsule/components.so/storybook/?path=/story/utilities-icon",
  properties: {
    base: {
      svg: {
        type: ControlType.icon,
        control: { defaultValue: "IconZap" },
        required: true,
        description: "Definition of the SVG component",
      },
      size: {
        type: ControlType.number,
        responsive: true,
        description: "Base unit multiplier",
        control: {
          defaultValue: 8,
        },
      },
      color: {
        type: ControlType.enum,
        options: ["neutral-faded", "primary", "positive", "critical"],
      },
      autoWidth: {
        type: ControlType.boolean,
        description:
          "Make icon boundaries based on the icon width instead of square",
        control: {
          ignore: true,
        },
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
