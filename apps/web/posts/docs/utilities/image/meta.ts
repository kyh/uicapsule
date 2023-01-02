import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
  title: "Image",
  description: "Utility for displaying images and controlling their behavior.",
  componentImport: 'import { Image } from "@uicapsule/components";',
  typeImport: 'import type { ImageProps } from "@uicapsule/components";',
  storybookUrl:
    "https://@uicapsule/components.so/storybook/?path=/story/utilities-image",
  relatedComponents: [
    { name: "Aspect Ratio", url: "/content/docs/utilities/aspect-ratio" },
    { name: "Avatar", url: "/content/docs/components/avatar" },
  ],
  properties: {
    base: {
      src: {
        type: ControlType.string,
        control: { defaultValue: "/img/examples/image-retina.webp" },
        description: "Image URL",
      },
      alt: {
        type: ControlType.string,
        control: { defaultValue: "Canyon rock" },
      },
      fallback: {
        type: ControlType.slot,
        docs: { type: "string | boolean | React.ReactNode" },
        description: "Applied only for images that have their size defined",
      },
      displayMode: {
        type: ControlType.enum,
        options: ["cover", "contain"],
        defaultValue: "cover",
      },
      borderRadius: {
        type: ControlType.enum,
        options: ["small", "medium", "large"],
        control: { defaultValue: "medium" },
      },
      width: {
        type: ControlType.string,
        responsive: true,
        control: { defaultValue: "300px" },
      },
      height: {
        type: ControlType.string,
        responsive: true,
        control: { defaultValue: "100%" },
      },
      onLoad: {
        type: ControlType.function,
        args: [{ name: "event", type: "React.Event" }],
      },
      onError: {
        type: ControlType.function,
        args: [{ name: "event", type: "React.Event" }],
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
      imageAttributes: {
        type: ControlType.object,
        description: "Custom HTML attributes for the image element",
        control: { ignore: true },
      },
    },
  },
};

export default meta;
