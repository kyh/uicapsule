import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { cache } from "react";

const contentSourceDir = join(process.cwd(), "..", "..", "content");

export type ContentComponent = {
  slug: string;
  name: string;
  description?: string;
  defaultSize?: "desktop" | "mobile";
  coverUrl?: string;
  coverType?: "image" | "video";
  category?: "marketing" | "application" | "mobile";
  tags?: string[];
  authors?: { name: string; url: string; avatarUrl: string }[];
  asSeenOn?: { name: string; url: string; avatarUrl: string }[];
  // Below are all props for the Sandpack component
  sourceCode: string;
  previewCode: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  previousSlug?: string;
  nextSlug?: string;
};

export const getContentComponents = cache(
  async (
    filterTags?: string[],
  ): Promise<Record<"string", ContentComponent>> => {
    const slugs = (await readdir(contentSourceDir)).filter(
      (slug) => !slug.startsWith("."),
    );

    const contentComponents = await Promise.all(
      slugs.map(async (slug, index) => {
        const metadata = JSON.parse(
          await readFile(
            join(contentSourceDir, slug, "meta.json"),
            "utf-8",
          ).catch(() => ""),
        ) as ContentComponent;

        const packageJson = JSON.parse(
          await readFile(
            join(contentSourceDir, slug, "package.json"),
            "utf-8",
          ).catch(() => ""),
        ) as ContentComponent;

        const sourceCode = await readFile(
          join(contentSourceDir, slug, "source.tsx"),
          "utf-8",
        ).catch(() => "");

        const previewCode = await readFile(
          join(contentSourceDir, slug, "preview.tsx"),
          "utf-8",
        ).catch(() => "");

        return {
          ...metadata,
          slug,
          dependencies: packageJson.dependencies ?? {},
          devDependencies: packageJson.devDependencies ?? {},
          sourceCode,
          previewCode,
          previousSlug: slugs[index - 1],
          nextSlug: slugs[index + 1],
        };
      }),
    );

    return contentComponents.reduce(
      (acc, component) => {
        if (
          filterTags &&
          filterTags.length > 0 &&
          !filterTags.some((tag) => component.tags?.includes(tag))
        ) {
          return acc; // Skip components that don't match the filter tags
        }
        acc[component.slug] = component;
        return acc;
      },
      {} as Record<string, ContentComponent>,
    );
  },
);

export const getContentComponent = cache(
  async (slug: string): Promise<ContentComponent> => {
    const content = await getContentComponents();
    return content[slug as keyof typeof content];
  },
);

export type ContentFilter = {
  name: string;
  slug: string;
  subcategories?: { name: string; slug: string }[];
};

export const contentApps: ContentFilter[] = [];

export const contentCategories: ContentFilter[] = [
  { name: "AI", slug: "ai" },
  { name: "Productivity", slug: "productivity" },
  { name: "Social", slug: "social" },
  { name: "Entertainment", slug: "entertainment" },
  { name: "Education", slug: "education" },
  { name: "Finance", slug: "finance" },
  { name: "Health & Fitness", slug: "health-fitness" },
  { name: "Design", slug: "design" },
  { name: "Business", slug: "business" },
  { name: "Games", slug: "games" },
  { name: "Utilities", slug: "utilities" },
];

export const contentStyles: ContentFilter[] = [
  { name: "Minimal", slug: "minimal" },
  { name: "Skeuomorphism", slug: "skeuomorphism" },
  { name: "Colorful", slug: "colorful" },
  { name: "Monochrome", slug: "monochrome" },
  { name: "Cyberpunk", slug: "cyberpunk" },
  { name: "Typographic", slug: "typographic" },
  { name: "Geometric", slug: "geometric" },
  { name: "Retro", slug: "retro" },
  { name: "Silly", slug: "silly" },
  { name: "Pixel Art", slug: "pixel-art" },
];

export const contentElements: ContentFilter[] = [
  {
    name: "Control",
    slug: "control",
    subcategories: [
      { name: "Accordion", slug: "accordion" },
      { name: "Breadcrumbs", slug: "breadcrumbs" },
      { name: "Button", slug: "button" },
      { name: "Checkbox", slug: "checkbox" },
      { name: "Color Picker", slug: "color-picker" },
      { name: "Combobox", slug: "combobox" },
      { name: "Date Picker", slug: "date-picker" },
      { name: "Editable Text", slug: "editable-text" },
      { name: "File Upload", slug: "file-upload" },
      { name: "Floating Action Button", slug: "floating-action-button" },
      { name: "Link", slug: "link" },
      { name: "Pagination", slug: "pagination" },
      { name: "Radio Button", slug: "radio-button" },
      { name: "Rating Control", slug: "rating-control" },
      { name: "Search Bar", slug: "search-bar" },
      { name: "Segmented Control", slug: "segmented-control" },
      { name: "Select", slug: "select" },
      { name: "Slider", slug: "slider" },
      { name: "Stepper", slug: "stepper" },
      { name: "Switch", slug: "switch" },
      { name: "Tab", slug: "tab" },
      { name: "Text Field", slug: "text-field" },
      { name: "Tile", slug: "tile" },
      { name: "Time Picker", slug: "time-picker" },
    ],
  },
  {
    name: "View",
    slug: "view",
    subcategories: [
      { name: "Badge", slug: "badge" },
      { name: "Banner", slug: "banner" },
      { name: "Card", slug: "card" },
      { name: "Carousel", slug: "carousel" },
      { name: "Chip", slug: "chip" },
      { name: "Divider", slug: "divider" },
      { name: "Gallery", slug: "gallery" },
      { name: "Grid List", slug: "grid-list" },
      { name: "Keyboard Key", slug: "keyboard-key" },
      { name: "Loading Indicator", slug: "loading-indicator" },
      { name: "Map Pin", slug: "map-pin" },
      { name: "Progress Indicator", slug: "progress-indicator" },
      { name: "Side Navigation", slug: "side-navigation" },
      { name: "Skeleton", slug: "skeleton" },
      { name: "Stacked List", slug: "stacked-list" },
      { name: "Status Dot", slug: "status-dot" },
      { name: "Table", slug: "table" },
      { name: "Table of Contents", slug: "table-of-contents" },
      { name: "Toolbar", slug: "toolbar" },
      { name: "Top Navigation Bar", slug: "top-navigation-bar" },
      { name: "Tree", slug: "tree" },
      { name: "Trial Bar", slug: "trial-bar" },
    ],
  },
  {
    name: "Overlay",
    slug: "overlay",
    subcategories: [
      { name: "Context Menu", slug: "context-menu" },
      { name: "Dialog", slug: "dialog" },
      { name: "Drawer", slug: "drawer" },
      { name: "Dropdown Menu", slug: "dropdown-menu" },
      { name: "Full-Screen Overlay", slug: "full-screen-overlay" },
      { name: "Navigation Menu", slug: "navigation-menu" },
      { name: "Popover", slug: "popover" },
      { name: "Toast", slug: "toast" },
      { name: "Tooltip", slug: "tooltip" },
    ],
  },
  // {
  //   name: "Imagery",
  //   slug: "imagery",
  //   subcategories: [
  //     { name: "Avatar", slug: "avatar" },
  //     { name: "Icon", slug: "icon" },
  //     { name: "Illustration", slug: "illustration" },
  //     { name: "Logo", slug: "logo" },
  //     { name: "Photo", slug: "photo" },
  //   ],
  // },
  {
    name: "Templates",
    slug: "templates",
    subcategories: [
      { name: "Landing Pages", slug: "landing-pages" },
      { name: "Dashboard Pages", slug: "dashboard-pages" },
    ],
  },
];

export const getContentComponentPackage = cache(async (slug: string) => {
  const contentComponent = await getContentComponent(slug);

  const uicapsuleDependencies = Object.keys(
    contentComponent.dependencies ?? {},
  ).filter((dep) => dep.startsWith("@repo") && dep !== "@repo/shadcn-ui");

  const dependencies = Object.keys(contentComponent.dependencies ?? {}).filter(
    (dep) => !["react", "react-dom", ...uicapsuleDependencies].includes(dep),
  );

  const devDependencies = Object.keys(
    contentComponent.devDependencies ?? {},
  ).filter(
    (dep) => !["@types/react", "@types/react-dom", "typescript"].includes(dep),
  );

  const response = {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    homepage: `https://uicapsule.com/ui/${slug}`,
    name: slug,
    type: "registry:ui",
    author: "Kaiyu Hsu <uicapsule@kyh.io>",
    dependencies,
    devDependencies,
    registryDependencies: [],
    files: [
      {
        type: "registry:ui",
        path: slug,
        content: contentComponent.sourceCode,
        target: `components/ui/uicapsule/${slug}.tsx`,
      },
    ],
  };

  return response;
});
