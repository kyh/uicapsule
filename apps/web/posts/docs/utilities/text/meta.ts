import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
  title: "Text",
  description:
    "Utility to apply typography styles responsively based on the viewport size.",
  componentImport: 'import { Text } from "@uicapsule/components";',
  typeImport: 'import type { TextProps } from "@uicapsule/components";',
  storybookUrl: "https://uicapsule.com/storybook/?path=/story/utilities-text",
  properties: {
    base: {
      children: {
        type: ControlType.slot,
        control: { mode: "text", defaultValue: "Design system" },
      },
      variant: {
        type: ControlType.enum,
        options: [
          "display-1",
          "display-2",
          "display-3",
          "title-1",
          "title-2",
          "title-3",
          "featured-1",
          "featured-2",
          "featured-3",
          "body-strong-1",
          "body-strong-2",
          "body-medium-1",
          "body-medium-2",
          "body-1",
          "body-2",
          "caption-1",
          "caption-2",
        ],
        control: { defaultValue: "display-3" },
      },
      color: {
        type: ControlType.enum,
        options: [
          "neutral-faded",
          "primary",
          "positive",
          "critical",
          "disabled",
        ],
      },
      align: {
        type: ControlType.enum,
        options: ["start", "center", "end"],
        responsive: true,
      },
      maxLines: {
        type: ControlType.number,
        description: "Truncates all lines exceeding the number",
      },
      decoration: {
        type: ControlType.enum,
        options: ["line-through"],
      },
      as: {
        type: ControlType.string,
        control: { ignore: true },
        description: "Custom tag name for the root element",
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
