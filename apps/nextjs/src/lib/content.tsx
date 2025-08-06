import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { cache } from "react";

import Page from "@/app/(app)/page";

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
  dependencies: Record<string, string>;
  previousSlug?: string;
  nextSlug?: string;
};

export const getContentComponents = cache(
  async (): Promise<Record<"string", ContentComponent>> => {
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
          dependencies: packageJson.dependencies,
          sourceCode,
          previewCode,
          previousSlug: slugs[index - 1],
          nextSlug: slugs[index + 1],
        };
      }),
    );

    return contentComponents.reduce(
      (acc, component) => {
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

const contentCategories = [
  {
    name: "Headings",
    slug: "headings",
    subcategories: [
      { name: "Page Headings", slug: "page-headings" },
      { name: "Card Headings", slug: "card-headings" },
      { name: "Section Headings", slug: "section-headings" },
    ],
  },
  {
    name: "Data Display",
    slug: "data-display",
    subcategories: [
      { name: "Description Lists", slug: "description-lists" },
      { name: "Stats", slug: "stats" },
      { name: "Calendars", slug: "calendars" },
      { name: "Lists", slug: "lists" },
      { name: "Stacked Lists", slug: "stacked-lists" },
      { name: "Tables", slug: "tables" },
      { name: "Grid Lists", slug: "grid-lists" },
      { name: "Feeds", slug: "feeds" },
    ],
  },
  {
    name: "Forms",
    slug: "forms",
    subcategories: [
      { name: "Form Layouts", slug: "form-layouts" },
      { name: "Input Groups", slug: "input-groups" },
      { name: "Select Menus", slug: "select-menus" },
      { name: "Sign-in and Registration", slug: "sign-in-and-registration" },
      { name: "Textareas", slug: "textareas" },
      { name: "Radio Groups", slug: "radio-groups" },
      { name: "Checkboxes", slug: "checkboxes" },
      { name: "Toggles", slug: "toggles" },
      { name: "Comboboxes", slug: "comboboxes" },
    ],
  },
  {
    name: "Feedback",
    slug: "feedback",
    subcategories: [
      { name: "Alerts", slug: "alerts" },
      { name: "Empty States", slug: "empty-states" },
    ],
  },
  {
    name: "Navigation",
    slug: "navigation",
    subcategories: [
      { name: "Navbars", slug: "navbars" },
      { name: "Pagination", slug: "pagination" },
      { name: "Tabs", slug: "tabs" },
      { name: "Vertical Navigation", slug: "vertical-navigation" },
      { name: "Sidebar Navigation", slug: "sidebar-navigation" },
      { name: "Breadcrumbs", slug: "breadcrumbs" },
      { name: "Progress Bars", slug: "progress-bars" },
      { name: "Command Palettes", slug: "command-palettes" },
    ],
  },
  {
    name: "Overlays",
    slug: "overlays",
    subcategories: [
      { name: "Modal Dialogs", slug: "modal-dialogs" },
      { name: "Drawers", slug: "drawers" },
      { name: "Notifications", slug: "notifications" },
    ],
  },
  {
    name: "Elements",
    slug: "elements",
    subcategories: [
      { name: "Avatars", slug: "avatars" },
      { name: "Badges", slug: "badges" },
      { name: "Dropdowns", slug: "dropdowns" },
      { name: "Buttons", slug: "buttons" },
      { name: "Button Groups", slug: "button-groups" },
    ],
  },
  {
    name: "Page Examples",
    slug: "page-examples",
    subcategories: [
      { name: "Landing Pages", slug: "landing-pages" },
      { name: "Dashboard Pages", slug: "dashboard-pages" },
    ],
  },
];

export const getContentCategories = cache(async (): Promise<string[]> => {
  const content = await getContentComponents();
  return [
    ...new Set(
      Object.values(content)
        .map((c) => c.tags ?? [])
        .flat(),
    ),
  ];
});
