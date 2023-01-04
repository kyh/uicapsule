import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
  title: "Loader",
  description:
    "Animated element that communicates progress without telling how long the process will take",
  componentImport: 'import { Loader } from "@uicapsule/components";',
  typeImport: 'import type { LoaderProps } from "@uicapsule/components";',
  storybookUrl:
    "https://uicapsule.com/storybook/?path=/story/components-loader",
  properties: {
    base: {
      size: {
        type: ControlType.enum,
        options: ["small", "medium"],
        responsive: true,
        defaultValue: "small",
        control: { defaultValue: "medium" },
      },
      color: {
        type: ControlType.enum,
        options: ["inherit"],
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
