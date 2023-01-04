import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
  title: "Dropdown menu",
  description: "List of contextual actions that users can trigger.",
  componentImport: 'import { DropdownMenu } from "@uicapsule/components";',
  typeImport: 'import type { DropdownMenuProps } from "@uicapsule/components";',
  storybookUrl:
    "https://uicapsule.com/storybook/?path=/story/components-dropdownmenu",
  relatedComponents: [
    { name: "Popover", url: "/content/docs/components/popover" },
    { name: "Select", url: "/content/docs/components/select" },
    { name: "Tooltip", url: "/content/docs/components/tooltip" },
  ],
  properties: {
    base: {
      children: { type: ControlType.slot, control: { ignore: true } },
      position: {
        type: ControlType.enum,
        defaultValue: "bottom-start",
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
      },
      forcePosition: {
        type: ControlType.boolean,
        description:
          "Keep position the same even if menu doesn't fit into the viewport",
      },
      active: {
        type: ControlType.boolean,
        control: { ignore: true },
      },
      defaultActive: {
        type: ControlType.boolean,
      },
      onOpen: {
        type: ControlType.function,
      },
      onClose: {
        type: ControlType.function,
      },
      width: {
        type: ControlType.string,
      },
    },
    item: {
      children: {
        type: ControlType.slot,
        control: { mode: "text", defaultValue: "Cut" },
      },
      endSlot: {
        type: ControlType.slot,
        control: { mode: "text", defaultValue: "⌘X" },
      },
      startSlot: {
        type: ControlType.slot,
        control: { mode: "text" },
        description: "Ignored when icon property is used",
      },
      startIcon: {
        type: ControlType.icon,
      },
      selected: {
        type: ControlType.boolean,
      },
      disabled: {
        type: ControlType.boolean,
      },
      href: {
        type: ControlType.string,
      },
      type: {
        type: ControlType.enum,
        options: ["button", "submit", "reset"],
        defaultValue: "button",
        control: { ignore: true },
      },
      onClick: {
        type: ControlType.function,
      },
      attributes: {
        type: ControlType.object,
        description: "Custom HTML attributes for the root element",
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
    },
    section: {
      children: {
        type: ControlType.slot,
        control: { ignore: true },
      },
    },
  },
};

export default meta;
