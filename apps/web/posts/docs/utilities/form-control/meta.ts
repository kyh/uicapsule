import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
  title: "Form control",
  description:
    "Utility to easily re-use form field styles and accessibility features.",
  componentImport:
    'import { FormControl, useFormControl } from "@uicapsule/components";',
  typeImport: 'import type { FormControlProps } from "@uicapsule/components";',
  storybookUrl:
    "https://uicapsule.com/storybook/?path=/story/utilities-formcontrol",
  properties: {
    base: {
      children: {
        type: ControlType.slot,
        control: { ignore: true },
      },
      size: {
        type: ControlType.enum,
        options: ["medium", "large"],
        defaultValue: "medium",
        description: "Size of the text labels",
      },
      hasError: {
        type: ControlType.boolean,
      },
      hasSuccess: {
        type: ControlType.boolean,
      },
      required: {
        type: ControlType.boolean,
      },
      group: {
        type: ControlType.boolean,
        description: "Is for control used for multiple inputs?",
      },
      id: {
        type: ControlType.string,
        description: "Custom input id",
      },
    },
    label: {
      children: {
        type: ControlType.slot,
      },
    },
    helper: {
      children: {
        type: ControlType.slot,
      },
    },
    error: {
      children: {
        type: ControlType.slot,
      },
    },
    success: {
      children: {
        type: ControlType.slot,
      },
    },
  },
};

export default meta;
