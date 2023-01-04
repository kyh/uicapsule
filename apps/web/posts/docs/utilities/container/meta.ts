import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
  title: "Container",
  description:
    "Responsive layout utility to control width of the main content area.",
  componentImport: 'import { Container } from "@uicapsule/components";',
  typeImport: 'import type { ContainerProps } from "@uicapsule/components";',
  storybookUrl:
    "https://uicapsule.com/storybook/?path=/story/utilities-container",
  properties: {
    base: {
      width: {
        type: ControlType.string,
        responsive: true,
        description: "Width of the content",
      },
      padding: {
        type: ControlType.number,
        responsive: true,
        description: "Horizontal padding, base unit multiplier",
      },
      children: {
        type: ControlType.slot,
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
