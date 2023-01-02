import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
  title: "Hidden visually",
  description:
    "Utility that provides the content to assistive technologies while hiding it from the screen.",
  componentImport: 'import { HiddenVisually } from "@uicapsule/components";',
  typeImport:
    'import type { HiddenVisuallyProps } from "@uicapsule/components";',
  storybookUrl:
    "https://@uicapsule/components.so/storybook/?path=/story/utilities-hiddenvisually",
  properties: {
    base: {
      children: {
        type: ControlType.slot,
      },
    },
  },
};

export default meta;
