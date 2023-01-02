import type { IconProps } from "@uicapsule/components";
import IconDocumentation from "icons/Documentation";
import IconColor from "icons/Colors";
import IconTypography from "icons/Typography";
import IconUnit from "icons/Margin";
import IconShadow from "icons/Shadow";
import IconViewport from "icons/MediaQuery";
import IconRadius from "icons/Radius";

type WithUrl = { url?: string; items?: never; onClick?: () => void };
type WithItems = { url?: never; items: MenuItem[]; onClick?: never };

export type MenuItem = (WithUrl | WithItems) & {
  title: string;
  keywords?: string[];
  normalizedItems?: never;
  soon?: boolean;
  icon?: IconProps["svg"];
  id?: never;
};

export type NormalizedMenuItem = {
  id: string;
  normalizedItems?: NormalizedMenuItem[];
  title?: never;
  url?: never;
  onClick?: never;
  items?: never;
  soon?: never;
};

export type LinkedMenuItem = Omit<MenuItem, "id"> & {
  id: string;
  previousId?: string;
  nextId?: string;
};

const menu: MenuItem[] = [
  {
    title: "Getting Started",
    items: [
      { url: "/content/docs/getting-started/overview", title: "Overview" },
      // {
      //   url: "/content/docs/getting-started/principles",
      //   title: "Our principles",
      // },
      // {
      //   title: "React setup",
      //   items: [
      //     {
      //       title: "Installation",
      //       url: "/content/docs/getting-started/react/installation",
      //     },
      //     {
      //       title: "Core concepts",
      //       url: "/content/docs/getting-started/react/core-concepts",
      //       keywords: [
      //         "responsive",
      //         "layout",
      //         "rtl",
      //         "server side",
      //         "ssr",
      //         "attributes",
      //         "classname",
      //         "customization",
      //       ],
      //     },
      //   ],
      // },
      // {
      //   title: "Figma setup",
      //   items: [
      //     {
      //       title: "Libraries",
      //       url: "/content/docs/getting-started/figma/libraries",
      //     },
      //   ],
      // },
      // {
      //   url: "/content/docs/getting-started/release-strategy",
      //   title: "Release strategy",
      //   keywords: ["major", "updates"],
      // },
      // {
      //   title: "Integrations",
      //   items: [
      //     {
      //       title: "Webpack",
      //       url: "/content/docs/getting-started/integrations/webpack",
      //     },
      //     {
      //       title: "Vite",
      //       url: "/content/docs/getting-started/integrations/vite",
      //     },
      //     {
      //     	title: "Parcel",
      //     	url: "/content/docs/getting-started/installation/parcel",
      //     },
      //     {
      //       title: "Next.js",
      //       url: "/content/docs/getting-started/integrations/next/next-13",
      //     },
      //     {
      //       title: "Remix",
      //       url: "/content/docs/getting-started/integrations/remix",
      //     },
      //     {
      //       title: "Gatsby",
      //       url: "/content/docs/getting-started/integrations/gatsby",
      //     },
      //     {
      //       title: "Create React App",
      //       url: "/content/docs/getting-started/integrations/cra",
      //     },
      //   ],
      // },
    ],
  },
  {
    title: "Design Tokens",
    items: [
      {
        url: "/content/docs/tokens/overview",
        title: "Overview",
        icon: IconDocumentation,
      },
      {
        url: "/content/docs/tokens/color",
        title: "Color",
        icon: IconColor,
      },
      {
        url: "/content/docs/tokens/typography",
        title: "Typography",
        icon: IconTypography,
      },
      {
        url: "/content/docs/tokens/unit",
        title: "Unit",
        icon: IconUnit,
      },
      {
        url: "/content/docs/tokens/radius",
        title: "Radius",
        icon: IconRadius,
      },
      {
        url: "/content/docs/tokens/shadow",
        title: "Shadow",
        icon: IconShadow,
      },
      {
        url: "/content/docs/tokens/viewport",
        title: "Viewport",
        icon: IconViewport,
      },
    ],
  },
  // {
  //   title: "Theming",
  //   items: [
  //     {
  //       url: "/content/docs/theming/creating-themes",
  //       title: "Creating themes",
  //       keywords: ["brand"],
  //     },
  //     {
  //       url: "/content/docs/theming/scoped-theming",
  //       title: "Scoped theming",
  //       keywords: ["brand"],
  //     },
  //   ],
  // },
  {
    title: "Components",
    items: [
      {
        url: "/content/docs/utilities/accordion",
        title: "Accordion",
        keywords: ["toggle", "expand", "collapse"],
      },
      {
        url: "/content/docs/components/alert",
        title: "Alert",
        keywords: ["banner", "notification"],
      },
      {
        url: "/content/docs/components/avatar",
        title: "Avatar",
        keywords: ["thumbnail", "flag", "photo"],
      },
      {
        url: "/content/docs/components/badge",
        title: "Badge",
        keywords: ["bubble", "notification"],
      },
      {
        url: "/content/docs/components/breadcrumbs",
        title: "Breadcrumbs",
        keywords: ["navigation"],
      },
      { url: "/content/docs/components/button", title: "Button" },
      {
        url: "/content/docs/components/card",
        title: "Card",
        keywords: ["box", "frame"],
      },
      {
        url: "/content/docs/components/carousel",
        title: "Carousel",
        keywords: ["slider"],
      },
      {
        url: "/content/docs/components/checkbox",
        title: "Checkbox",
        keywords: ["input", "form"],
      },
      {
        url: "/content/docs/components/divider",
        title: "Divider",
        keywords: ["separator"],
      },
      {
        url: "/content/docs/components/dropdown-menu",
        title: "Dropdown menu",
        keywords: ["listbox", "popover"],
      },
      {
        url: "/content/docs/components/link",
        title: "Link",
        keywords: ["navigation"],
      },
      {
        url: "/content/docs/components/loader",
        title: "Loader",
        keywords: ["spinner", "progress"],
      },
      {
        url: "/content/docs/components/menu-item",
        title: "Menu item",
        keywords: ["list", "button"],
      },
      {
        url: "/content/docs/components/modal",
        title: "Modal",
        keywords: ["dialog", "drawer", "menu"],
      },
      {
        url: "/content/docs/components/overlay",
        title: "Overlay",
        keywords: ["scrim"],
      },
      {
        url: "/content/docs/components/popover",
        title: "Popover",
        keywords: ["dropdown"],
      },
      { url: "/content/docs/components/progress", title: "Progress" },
      {
        url: "/content/docs/components/radio",
        title: "Radio",
        keywords: ["input", "form"],
      },
      {
        url: "/content/docs/components/select",
        title: "Select",
        keywords: ["input", "form"],
      },
      {
        url: "/content/docs/components/switch",
        title: "Switch",
        keywords: ["input", "form", "toggle"],
      },
      {
        url: "/content/docs/components/tabs",
        title: "Tabs",
        keywords: ["navigation", "input", "form", "segmented control"],
      },
      {
        url: "/content/docs/components/text-area",
        title: "Text Area",
        keywords: ["input", "form"],
      },
      {
        url: "/content/docs/components/text-field",
        title: "Text Field",
        keywords: ["input", "form"],
      },
      {
        url: "/content/docs/components/toast",
        title: "Toast",
        keywords: ["notification", "banner", "alert", "snackbar"],
      },
      {
        url: "/content/docs/components/tooltip",
        title: "Tooltip",
        keywords: ["popover"],
      },
    ],
  },
  {
    title: "Utilities",
    items: [
      {
        url: "/content/docs/components/action-bar",
        title: "Action Bar",
        keywords: ["panel", "bottom navigation"],
      },
      // {
      //   url: "/content/docs/utilities/uic",
      //   title: "UIC provider",
      //   keywords: ["rtl", "color mode", "theme", "theming"],
      // },
      {
        url: "/content/docs/utilities/actionable",
        title: "Actionable",
        keywords: ["trigger", "button", "link"],
      },
      {
        url: "/content/docs/utilities/aspect-ratio",
        title: "Aspect ratio",
        keywords: ["image", "photo", "picture"],
      },
      {
        url: "/content/docs/utilities/backdrop",
        title: "Backdrop",
        keywords: ["scrim", "overlay"],
      },
      {
        url: "/content/docs/utilities/container",
        title: "Container",
        keywords: ["wrapper", "layout"],
      },
      {
        url: "/content/docs/utilities/dismissible",
        title: "Dismissible",
        keywords: ["close", "remove"],
      },
      {
        url: "/content/docs/utilities/form-control",
        title: "Form control",
        keywords: ["input", "label", "error"],
      },
      {
        url: "/content/docs/utilities/hidden",
        title: "Hidden",
        keywords: ["hide", "visibility"],
      },
      {
        url: "/content/docs/utilities/hidden-visually",
        title: "Hidden visually",
        keywords: ["screen reader"],
      },
      { url: "/content/docs/utilities/icon", title: "Icon" },
      {
        url: "/content/docs/utilities/image",
        title: "Image",
        keywords: ["placeholder", "media", "picture", "photo"],
      },
      {
        url: "/content/docs/utilities/text",
        title: "Text",
        keywords: ["typography"],
      },
      {
        url: "/content/docs/utilities/theme-provider",
        title: "Theme provider",
        keywords: ["inverted", "dark mode", "theming", "theme", "color mode"],
      },
      {
        url: "/content/docs/utilities/view",
        title: "View",
        keywords: ["grid", "group", "flexbox", "stack", "frame", "box"],
      },
    ],
  },
  {
    title: "Hooks",
    items: [
      {
        url: "/content/docs/hooks/use-element-id",
        title: "useElementId",
        keywords: ["accessibility", "a11y", "unique"],
      },
      {
        url: "/content/docs/hooks/use-form-control",
        title: "useFormControl",
        keywords: ["input"],
      },
      {
        url: "/content/docs/hooks/use-rtl",
        title: "useRTL",
        keywords: ["arabic", "hebrew"],
      },
      { url: "/content/docs/hooks/use-scroll-lock", title: "useScrollLock" },
      {
        url: "/content/docs/hooks/use-theme",
        title: "useTheme",
        keywords: ["theme", "theming", "dark mode", "color mode"],
      },
      {
        url: "/content/docs/hooks/use-toggle",
        title: "useToggle",
        keywords: ["disclosure", "collapse"],
      },
    ],
  },
];

const getItemId = (item: MenuItem) => {
  if (!item.url) return;
  return item.url.replace("/content", "");
};

const matchKeywords = (keywords: string[], filter?: string) => {
  if (!filter) return true;

  return !!keywords.filter((keyword) =>
    keyword.toLowerCase().includes(filter.toLowerCase())
  ).length;
};

export const normalizeMenu = (options: { filter?: string } = {}) => {
  const { filter } = options;
  const data: Record<string, LinkedMenuItem> = {};
  let cachedId: string;

  const normalize = (
    item: MenuItem,
    extraKeywords: string[] = []
  ): null | NormalizedMenuItem => {
    if (item.url) {
      const isMatching =
        matchKeywords(
          [...(item.keywords || []), ...extraKeywords, item.title],
          filter
        ) ||
        (item.soon && filter && "soon".includes(filter?.toLowerCase()));

      if (!isMatching) return null;

      const id = getItemId(item);

      if (!id) return null;
      if (cachedId) data[cachedId].nextId = id;

      data[id] = { ...item, id, previousId: cachedId };
      cachedId = id;

      return { id };
    }

    if (item.items) {
      const id = item.title;
      const children = item.items.reduce<NormalizedMenuItem[]>((acc, item) => {
        const normalizedItem = normalize(item, [...extraKeywords, item.title]);

        if (!normalizedItem) return acc;
        return [...acc, normalizedItem];
      }, []);

      if (!children.length) return null;

      data[id] = { ...item, id };
      return { id, normalizedItems: children };
    }

    throw new Error("Invalid menu item format");
  };

  return {
    data,
    list: menu
      .map((section) => normalize(section))
      .filter(Boolean) as NormalizedMenuItem[],
  };
};

const normalizedMenu = normalizeMenu();

export const getMenuItemData = (item: MenuItem | NormalizedMenuItem) => {
  const { data } = normalizedMenu;
  return (item.id ? data[item.id] : item) as MenuItem;
};

export const menuData = normalizedMenu.data;
export default normalizedMenu.list;
