import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
  title: "Dismissible",
  description:
    "Utility for displaying different types of content that can be removed from the screen.",
  componentImport: 'import { Dismissible } from "@uicapsule/components";',
  typeImport: 'import type { DismissibleProps } from "@uicapsule/components";',
  storybookUrl:
    "https://@uicapsule/components.so/storybook/?path=/story/utilities-dismissible",
  properties: {
    base: {
      children: {
        type: ControlType.slot,
        control: { defaultValue: true, height: 100 },
      },
      variant: {
        type: ControlType.enum,
        options: ["media"],
      },
      onClose: {
        type: ControlType.function,
      },
      closeAriaLabel: {
        type: ControlType.string,
        required: true,
        control: { ignore: true, defaultValue: "Close banner" },
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
