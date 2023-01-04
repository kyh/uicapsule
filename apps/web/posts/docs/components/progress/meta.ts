import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
  title: "Progress",
  description:
    "Bar displaying progress for a task that takes a long time or consists of several steps.",
  componentImport: 'import { Progress } from "@uicapsule/components";',
  typeImport: 'import type { ProgressProps } from "@uicapsule/components";',
  storybookUrl:
    "https://uicapsule.com/storybook/?path=/story/components-progress",
  relatedComponents: [
    { name: "Loader", url: "/content/docs/components/loader" },
  ],
  properties: {
    base: {
      value: {
        type: ControlType.number,
        description: "Displayed value",
        control: { defaultValue: 50 },
      },
      min: {
        type: ControlType.number,
        description: "Start value boundary",
        defaultValue: 0,
      },
      max: {
        type: ControlType.number,
        description: "End value bounary",
        defaultValue: 100,
      },
      size: {
        type: ControlType.enum,
        options: ["small", "medium"],
        defaultValue: "medium",
      },
      color: {
        type: ControlType.enum,
        options: ["primary", "critical", "positive", "white"],
        defaultValue: "primary",
      },
      duration: {
        type: ControlType.number,
        description: "Custom value transition duration",
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
