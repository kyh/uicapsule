import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { cache } from "react";

const contentSourceDir = join(process.cwd(), "..", "..", "content");
const uiSourceDir = join(process.cwd(), "..", "..", "packages", "ui");

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
  previewCode: string;
  sourceCode: Record<string, string>; // File path -> source code
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
        const cc = await readContentComponent(slug);
        return {
          ...cc,
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

const readContentComponent = async (slug: string) => {
  const metadata = JSON.parse(
    await readFile(join(contentSourceDir, slug, "meta.json"), "utf-8").catch(
      () => "",
    ),
  ) as ContentComponent;

  const packageJson = JSON.parse(
    await readFile(join(contentSourceDir, slug, "package.json"), "utf-8").catch(
      () => "",
    ),
  ) as ContentComponent;

  let previewCode = await readFile(
    join(contentSourceDir, slug, "preview.tsx"),
    "utf-8",
  ).catch(() => "");

  let sourceCode = await readContentComponents(slug);

  // If the package.json has "@repo/ui" as a dependency, remove it.
  // Instead, we want to inline all the dependencies as source files under the ui directory in the sandpack setup
  if (packageJson.dependencies?.["@repo/ui"]) {
    // Handle package.json stuff
    delete packageJson.dependencies["@repo/ui"];
    const uiPackageJson = JSON.parse(
      await readFile(join(uiSourceDir, "package.json"), "utf-8").catch(
        () => "",
      ),
    ) as ContentComponent;
    packageJson.dependencies = {
      ...packageJson.dependencies,
      ...uiPackageJson.dependencies,
    };

    // Handle source code
    sourceCode = {
      ...Object.entries(sourceCode).reduce(
        (acc, [key, value]) => {
          acc[key] = value.replaceAll("@repo/ui", "./ui");
          return acc;
        },
        {} as Record<string, string>,
      ),
      ...(await readUIComponents()),
    };

    // Handle preview code
    previewCode = previewCode.replaceAll("@repo/ui", "./ui");
  }

  return {
    ...metadata,
    slug,
    dependencies: packageJson.dependencies ?? {},
    devDependencies: packageJson.devDependencies ?? {},
    sourceCode,
    previewCode,
  };
};

const readContentComponents = cache(async (slug: string) => {
  // Read all files in the component's directory except preview.tsx, package.json, and meta.json, and create a sourceCode map
  const files = await readdir(join(contentSourceDir, slug)).catch(() => []);
  const sourceCode: Record<string, string> = {};

  await Promise.all(
    files
      .filter(
        (file) => !["preview.tsx", "package.json", "meta.json"].includes(file),
      )
      .map(async (file) => {
        const filePath = join(contentSourceDir, slug, file);
        try {
          // Only include files, skip directories (using fs.promises.stat)
          const s = await stat(filePath);
          if (s.isFile()) {
            sourceCode[`/${file}`] = await readFile(filePath, "utf-8");
          }
        } catch {
          // Ignore errors for individual files
        }
      }),
  );

  return sourceCode;
});

const readUIComponents = cache(async () => {
  const files = await readdir(join(uiSourceDir, "src")).catch(() => []);
  const sourceCode: Record<string, string> = {};

  await Promise.all(
    files
      .filter((file) => file.endsWith(".tsx") || file.endsWith(".ts"))
      .map(async (file) => {
        const filePath = join(uiSourceDir, "src", file);
        try {
          const s = await stat(filePath);
          if (s.isFile()) {
            sourceCode[`/ui/${file}`] = await readFile(filePath, "utf-8");
          }
        } catch {
          // Ignore errors for individual files
        }
      }),
  );

  return sourceCode;
});

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
      { name: "Buttons and Links", slug: "buttons-and-links" },
      { name: "Inputs", slug: "inputs" }, // Text, Number, Slider, Pickers, Combobox, etc.
      { name: "Video & Audio", slug: "video-audio" },
    ],
  },
  {
    name: "View",
    slug: "view",
    subcategories: [
      { name: "Cards", slug: "cards" },
      { name: "Carousels", slug: "carousels" },
      { name: "Grids", slug: "grids" },
      { name: "Navigation", slug: "navigation" }, // Sidebar, Tabs, etc.
      { name: "Tables", slug: "tables" },
      { name: "Toolbars", slug: "toolbars" }, // Filter/Sort
      { name: "Trees", slug: "trees" },
      { name: "Effects", slug: "effects" },
    ],
  },
  {
    name: "Overlay",
    slug: "overlay",
    subcategories: [
      { name: "Dialog and Drawer", slug: "dialog-and-drawer" },
      {
        name: "Dropdown, Popovers, and Tooltips",
        slug: "dropdown-popovers-and-tooltips",
      },
      { name: "Toast", slug: "toast" },
    ],
  },
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
      ...Object.entries(contentComponent.sourceCode).map(
        ([filePath, sourceCode]) => ({
          type: "registry:ui",
          path: filePath,
          content: sourceCode,
          target: `components/ui/uicapsule/${slug}.tsx`,
        }),
      ),
    ],
  };

  return response;
});
