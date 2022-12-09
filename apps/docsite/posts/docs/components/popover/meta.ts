import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
  title: "Popover",
  description:
    "Container displaying rich content on top of other content triggered by an interactive element.",
  componentImport: 'import { Popover } from "@uicapsule/components";',
  typeImport: 'import type { PopoverProps } from "@uicapsule/components";',
  storybookUrl:
    "https://@uicapsule/components.so/storybook/?path=/story/components-popover",
  relatedComponents: [
    { name: "Dropdown Menu", url: "/content/docs/components/dropdown-menu" },
    { name: "Tooltip", url: "/content/docs/components/tooltip" },
    { name: "Select", url: "/content/docs/components/select" },
  ],
  properties: {
    base: {
      children: {
        type: ControlType.slot,
        control: { ignore: true },
      },
      position: {
        type: ControlType.enum,
        options: [
          "top",
          "top-start",
          "top-end",
          "bottom",
          "bottom-start",
          "bottom-end",
          "start",
          "end",
        ],
        defaultValue: "bottom",
      },
      forcePosition: {
        type: ControlType.boolean,
        description:
          "Keep position the same even if menu doesn't fit into the viewport",
      },
      active: {
        type: ControlType.boolean,
        control: { ignore: true },
        description: "Enables controlled component behavior",
      },
      defaultActive: {
        type: ControlType.boolean,
        control: { ignore: true },
        description: "Enables uncontrolled component behavior",
      },
      triggerType: {
        type: ControlType.enum,
        options: ["click", "hover"],
        defaultValue: "click",
      },
      padding: {
        type: ControlType.number,
        description: "Custom padding override, base unit token multiplier",
        defaultValue: 4,
      },
      width: {
        type: ControlType.string,
      },
      onOpen: {
        type: ControlType.function,
      },
      onClose: {
        type: ControlType.function,
      },
      trapFocusMode: {
        type: ControlType.enum,
        options: ["dialog", "action-menu", "content-menu"],
        defaultValue: "dialog",
        control: { ignore: true },
      },
      id: {
        type: ControlType.string,
        control: { ignore: true },
        description: "Custom popover id",
      },
    },
    trigger: {
      children: {
        type: ControlType.slot,
        required: true,
        control: { ignore: true },
        docs: { type: "(attributes) => React.ReactNode" },
      },
    },
    content: {
      children: {
        type: ControlType.slot,
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
