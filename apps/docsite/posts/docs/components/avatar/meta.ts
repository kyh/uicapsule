import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
  title: "Avatar",
  description:
    "Thumbnail of a user photo, organization, or a visual representation of other types of content.",
  componentImport: 'import { Avatar } from "@uicapsule/components";',
  typeImport: 'import type { AvatarProps } from "@uicapsule/components";',
  relatedComponents: [{ name: "Image", url: "/content/docs/utilities/image" }],
  storybookUrl:
    "https://@uicapsule/components.so/storybook/?path=/story/components-avatar",
  properties: {
    base: {
      src: {
        type: ControlType.string,
        description: "Image src attribute",
        control: { defaultValue: "/img/examples/avatar-2.png" },
      },
      initials: {
        type: ControlType.string,
        description: "Fallback initials when image is not available",
      },
      size: {
        type: ControlType.number,
        defaultValue: 12,
        responsive: true,
        description: "Base unit token multiplier",
      },
      color: {
        type: ControlType.enum,
        options: [
          "neutral",
          "neutral-faded",
          "primary",
          "primary-faded",
          "positive",
          "positive-faded",
          "critical",
          "critical-faded",
        ],
        defaultValue: "neutral-faded",
        description: "Background color, automatically adjusts text color",
      },
      squared: {
        type: ControlType.boolean,
        description: "Shape of the avatar",
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
