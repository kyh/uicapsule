import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
  title: "Text area",
  description: "Form field to enter and edit multiline text.",
  componentImport: 'import { TextArea } from "@uicapsule/components";',
  typeImport: 'import type { TextAreaProps } from "@uicapsule/components";',
  storybookUrl:
    "https://@uicapsule/components.so/storybook/?path=/story/components-textarea",
  relatedComponents: [
    { name: "Text Field", url: "/content/docs/components/text-field" },
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
        control: { defaultValue: "What do you like about the product?" },
      },
      size: {
        type: ControlType.enum,
        options: ["medium", "large", "xlarge"],
        responsive: true,
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
