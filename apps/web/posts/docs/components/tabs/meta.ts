import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
  title: "Tabs",
  description: "Navigation between multiple pages or content sections.",
  componentImport: 'import { Tabs } from "@uicapsule/components";',
  typeImport: 'import type { TabsProps } from "@uicapsule/components";',
  storybookUrl: "https://uicapsule.com/storybook/?path=/story/components-tabs",
  properties: {
    base: {
      children: {
        type: ControlType.slot,
        control: { ignore: true },
      },
      variant: {
        type: ControlType.enum,
        options: ["borderless", "pills", "pills-elevated"],
      },
      itemWidth: {
        type: ControlType.enum,
        options: ["equal"],
        control: { ignore: true },
      },
      value: {
        type: ControlType.string,
        description: "Enables controlled component behavior",
        control: { ignore: true },
      },
      defaultValue: {
        type: ControlType.string,
        description: "Enables uncontrolled component behavior",
        control: { ignore: true },
      },
      name: {
        type: ControlType.string,
        description: "Name of the input when used in forms",
        control: { ignore: true },
      },
      onChange: {
        type: ControlType.function,
        args: [{ name: "args", type: "{ name, value }" }],
      },
    },
    list: {
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
    item: {
      children: {
        type: ControlType.slot,
        control: { mode: "text", defaultValue: "List view" },
      },
      icon: {
        type: ControlType.icon,
      },
      value: {
        type: ControlType.string,
        control: { ignore: true, defaultValue: "0" },
      },
    },
    panel: {
      children: {
        type: ControlType.slot,
        control: { ignore: true },
      },
      value: { type: ControlType.string, control: { ignore: true } },
    },
  },
};

export default meta;
