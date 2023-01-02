import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
  title: "Text field",
  description: "Form field to enter and edit single-line text.",
  componentImport: 'import { TextField } from "@uicapsule/components";',
  typeImport: 'import type { TextFieldProps } from "@uicapsule/components";',
  storybookUrl:
    "https://@uicapsule/components.so/storybook/?path=/story/components-textfield",
  relatedComponents: [
    { name: "Text Area", url: "/content/docs/components/text-area" },
  ],
  properties: {
    base: {
      name: {
        type: ControlType.string,
        required: true,
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
      },
      placeholder: {
        type: ControlType.string,
        control: { defaultValue: "hello@@uicapsule/components.so" },
      },
      size: {
        type: ControlType.enum,
        options: ["medium", "large", "xlarge"],
        responsive: true,
      },
      startIcon: {
        type: ControlType.icon,
      },
      startSlot: {
        type: ControlType.slot,
        control: { height: 24 },
      },
      endSlot: {
        type: ControlType.slot,
        control: { height: 24 },
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
