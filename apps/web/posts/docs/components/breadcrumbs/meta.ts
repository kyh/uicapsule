import { DocsMeta, ControlType } from "types/meta";

const meta: DocsMeta = {
  title: "Breadcrumbs",
  description:
    "Top-level product navigation that helps user understand the location of the current page and navigate back to its parents.",
  componentImport: 'import { Breadcrumbs } from "@uicapsule/components";',
  typeImport: 'import type { BreadcrumbsProps } from "@uicapsule/components";',
  relatedComponents: [
    { name: "Link", url: "/content/docs/components/link" },
    { name: "Tabs", url: "/content/docs/components/tabs" },
  ],
  storybookUrl:
    "https://uicapsule.com/storybook/?path=/story/components-breadcrumbs",
  properties: {
    base: {
      children: { type: ControlType.slot, control: { ignore: true } },
      separator: { type: ControlType.slot, control: { mode: "text" } },
      color: {
        type: ControlType.enum,
        options: ["neutral", "primary"],
        defaultValue: "neutral",
      },
      defaultVisibleItems: {
        type: ControlType.number,
        control: { defaultValue: 2 },
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
    item: {
      children: {
        type: ControlType.slot,
        control: { defaultValue: "Catalog", mode: "text" },
      },
      icon: { type: ControlType.icon },
      href: { type: ControlType.string },
      onClick: {
        type: ControlType.function,
        args: [{ name: "event", type: "React.Event" }],
      },
      disabled: { type: ControlType.boolean },
    },
  },
};

export default meta;
