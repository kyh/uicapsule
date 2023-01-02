import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
  title: "Card",
  description:
    "Container to group information about subjects and their related actions",
  componentImport: 'import { Card } from "@uicapsule/components";',
  typeImport: 'import type { CardProps } from "@uicapsule/components";',
  relatedComponents: [{ name: "View", url: "/content/docs/utilities/view" }],
  storybookUrl:
    "https://@uicapsule/components.so/storybook/?path=/story/components-card",
  properties: {
    base: {
      children: { type: ControlType.slot, control: { defaultValue: true } },
      padding: {
        type: ControlType.number,
        defaultValue: 4,
        description: "Custom padding value, base unit token multiplier",
        responsive: true,
      },
      bleed: {
        type: ControlType.number,
        description:
          "Horizontal negative margin value, base unit token multiplier",
        responsive: true,
      },
      href: { type: ControlType.string },
      selected: { type: ControlType.boolean },
      onClick: {
        type: ControlType.function,
        args: [{ name: "event", type: "React.Event" }],
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
