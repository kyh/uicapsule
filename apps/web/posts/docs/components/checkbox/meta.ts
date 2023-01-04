import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
  title: "Checkbox",
  description:
    "Form field used to select one or multiple values from the list.",
  componentImport:
    'import { Checkbox, CheckboxGroup } from "@uicapsule/components";',
  typeImport:
    'import type { CheckboxProps, CheckboxGroupProps } from "@uicapsule/components";',
  storybookUrl:
    "https://uicapsule.com/storybook/?path=/story/components-checkbox",
  relatedComponents: [
    { name: "Select", url: "/content/docs/components/select" },
    { name: "Switch", url: "/content/docs/components/switch" },
    { name: "Radio", url: "/content/docs/components/radio" },
  ],
  properties: {
    base: {
      children: {
        type: ControlType.slot,
        control: { mode: "text", defaultValue: "Keep me signed in" },
      },
      name: {
        type: ControlType.string,
        required: true,
        control: { ignore: true, defaultValue: "keepSigned" },
      },
      value: { type: ControlType.string, control: { ignore: true } },
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
      indeterminate: {
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
        control: { ignore: true, defaultValue: "keepSigned" },
      },
      value: {
        type: ControlType.array,
        control: { ignore: true },
        item: {
          type: ControlType.string,
        },
        description: "Enables controlled component behavior",
      },
      defaultValue: {
        type: ControlType.array,
        control: { ignore: true },
        item: {
          type: ControlType.string,
        },
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
