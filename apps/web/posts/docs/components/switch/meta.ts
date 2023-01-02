import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
  title: "Switch",
  description: "Toggle for immediately changing the state of a single item.",
  componentImport: 'import { Switch } from "@uicapsule/components";',
  typeImport: 'import type { SwitchProps } from "@uicapsule/components";',
  storybookUrl:
    "https://@uicapsule/components.so/storybook/?path=/story/components-switch",
  relatedComponents: [
    { name: "Checkbox", url: "/content/docs/components/checkbox" },
    { name: "Radio", url: "/content/docs/components/radio" },
    { name: "Select", url: "/content/docs/components/select" },
  ],
  properties: {
    base: {
      name: {
        type: ControlType.string,
        required: true,
        control: { ignore: true, defaultValue: "wifi" },
      },
      onChange: {
        type: ControlType.function,
        args: [{ name: "args", type: "{ event, name, value }" }],
      },
      checked: {
        type: ControlType.boolean,
        description: "Enables controlled component behavior",
        control: { ignore: true },
      },
      defaultChecked: {
        type: ControlType.boolean,
        description: "Enables uncontrolled component behavior",
      },
      disabled: {
        type: ControlType.boolean,
      },
      id: {
        type: ControlType.string,
        control: { ignore: true },
        description: "Custom id override",
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
      inputAttributes: {
        type: ControlType.object,
        description: "Custom HTML attributes for the input element",
        control: { ignore: true },
      },
    },
  },
};

export default meta;
