import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
  title: "Backdrop",
  description:
    "Faded-out layer used to emphasize a specific element on the page.",
  componentImport: 'import { Backdrop } from "@uicapsule/components";',
  typeImport: 'import type { BackdropProps } from "@uicapsule/components";',
  storybookUrl:
    "https://@uicapsule/components.so/storybook/?path=/story/utilities-backdrop",
  relatedComponents: [{ name: "Modal", url: "/content/docs/components/modal" }],
  properties: {
    base: {
      active: {
        type: ControlType.boolean,
        control: { ignore: true },
      },
      transparent: {
        type: ControlType.boolean,
      },
      onClose: {
        type: ControlType.function,
      },
      children: {
        type: ControlType.slot,
        docs: { type: "React.ReactNode | ({ active }): React.ReactNode" },
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
