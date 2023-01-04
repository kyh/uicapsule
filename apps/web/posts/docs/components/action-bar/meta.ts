import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
  title: "Action bar",
  description:
    "Contextual information and actions related to a specific area on the page.",
  componentImport: 'import { ActionBar } from "@uicapsule/components";',
  typeImport: 'import type { ActionBarProps } from "@uicapsule/components";',
  relatedComponents: [{ name: "Card", url: "/content/docs/components/card" }],
  storybookUrl:
    "https://uicapsule.com/storybook/?path=/story/components-actionbar",
  properties: {
    base: {
      children: { type: ControlType.slot, control: { defaultValue: true } },
      position: {
        type: ControlType.enum,
        options: ["bottom", "top"],
        defaultValue: "bottom",
      },
      size: {
        type: ControlType.enum,
        options: ["medium", "large"],
        defaultValue: "medium",
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
