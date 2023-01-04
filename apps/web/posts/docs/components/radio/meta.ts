import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
  title: "Radio",
  description:
    "Radio is a form element used for selecting one option from a list.",
  componentImport: 'import { Radio, RadioGroup } from "@uicapsule/components";',
  typeImport:
    'import type { RadioProps, RadioGroupProps } from "@uicapsule/components";',
  storybookUrl: "https://uicapsule.com/storybook/?path=/story/components-radio",
  relatedComponents: [
    { name: "Checkbox", url: "/content/docs/components/checkbox" },
    { name: "Switch", url: "/content/docs/components/switch" },
    { name: "Select", url: "/content/docs/components/select" },
  ],
  properties: {
    base: {
      children: {
        type: ControlType.slot,
        control: { mode: "text", defaultValue: "Ice cream" },
      },
      name: {
        type: ControlType.string,
        required: true,
        control: { ignore: true },
      },
      value: {
        type: ControlType.string,
        control: { ignore: true, defaultValue: "ice-cream" },
      },
      checked: {
        type: ControlType.boolean,
        description: "Enables controlled component behavior",
        docs: {
          type: "boolean | null",
        },
        control: {
          ignore: true,
        },
      },
      defaultChecked: {
        type: ControlType.boolean,
        description: "Enables uncontrolled component behavior",
      },
      disabled: {
        type: ControlType.boolean,
      },
      hasError: {
        type: ControlType.boolean,
      },
      onChange: {
        type: ControlType.function,
        args: [{ name: "args", type: "{ event, name, value }" }],
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
    group: {
      children: {
        type: ControlType.slot,
        control: { ignore: true },
      },
      name: {
        type: ControlType.string,
        required: true,
        control: { ignore: true, defaultValue: "food" },
      },
      value: {
        type: ControlType.string,
        control: { ignore: true },
        description: "Enables controlled component behavior",
      },
      defaultValue: {
        type: ControlType.string,
        control: { ignore: true, defaultValue: "ice-cream" },
        description: "Enables uncontrolled component behavior",
      },
      onChange: {
        type: ControlType.function,
        args: [{ name: "args", type: "{ event, name, value }" }],
        control: { ignore: true },
      },
      disabled: {
        type: ControlType.boolean,
        description: "Disable all checkboxes in the group",
        control: { ignore: true },
      },
      hasError: {
        type: ControlType.boolean,
        description: "Use error state for all checkboxes in the group",
        control: { ignore: true },
      },
    },
  },
};

export default meta;
