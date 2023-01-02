import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
  title: "Modal",
  description:
    "Container appearing in front of the main content to provide critical information or an actionable piece of content.",
  componentImport: 'import { Modal } from "@uicapsule/components";',
  typeImport: 'import type { ModalProps } from "@uicapsule/components";',
  storybookUrl:
    "https://@uicapsule/components.so/storybook/?path=/story/components-modal",
  relatedComponents: [
    { name: "Backdrop", url: "/content/docs/utilities/backdrop" },
  ],
  properties: {
    base: {
      children: {
        type: ControlType.slot,
        control: { defaultValue: true },
      },
      active: {
        type: ControlType.boolean,
        control: { ignore: true },
      },
      position: {
        type: ControlType.enum,
        options: ["center", "bottom", "start", "end"],
        defaultValue: "center",
        responsive: true,
      },
      padding: {
        type: ControlType.number,
        responsive: true,
        description: "Custom modal padding, base unit token multiplier",
      },
      size: {
        type: ControlType.string,
        responsive: true,
        description: "Custom css size value",
      },
      onClose: {
        type: ControlType.function,
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
    title: {
      children: {
        type: ControlType.slot,
        control: { mode: "text", defaultValue: "Edit profile" },
      },
    },
    subtitle: {
      children: {
        type: ControlType.slot,
        control: {
          mode: "text",
          defaultValue: "Update your personal infomation and save it",
        },
      },
    },
  },
};

export default meta;
