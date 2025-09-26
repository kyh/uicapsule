import { readdir, readFile } from "node:fs/promises";
import { dirname, extname, join, posix, relative } from "node:path";
import { cache } from "react";

type SourceCodeMap = Record<string, string>;

type UiModule = {
  relativePath: string;
  sandpackPath: string;
  code: string;
};

type UiModuleLookup = {
  byPath: Map<string, UiModule>;
  bySpecifier: Map<string, UiModule>;
};

const contentSourceDir = join(process.cwd(), "..", "..", "content");
const uiSourceDir = join(process.cwd(), "..", "..", "packages", "ui");
const uiSourceRoot = join(uiSourceDir, "src");

const GITIGNORE_PATTERNS = ["node_modules", "dist", ".DS_Store"];

const UI_IMPORT_PREFIX = "@repo/ui/";
const UI_FILE_EXTENSIONS = [".tsx", ".ts"] as const;

const STATIC_IMPORT_SPECIFIER_REGEX = /from\s+["'`]([^"'`]+)["'`]/g;
const BARE_IMPORT_SPECIFIER_REGEX = /import\s+["'`]([^"'`]+)["'`]/g;
const DYNAMIC_IMPORT_SPECIFIER_REGEX = /import\(\s*["'`]([^"'`]+)["'`]\s*\)/g;

const extractModuleSpecifiers = (source: string): string[] => {
  const specifiers = new Set<string>();

  const addMatches = (regex: RegExp) => {
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(source)) !== null) {
      specifiers.add(match[1]);
    }
  };

  addMatches(STATIC_IMPORT_SPECIFIER_REGEX);
  addMatches(BARE_IMPORT_SPECIFIER_REGEX);
  addMatches(DYNAMIC_IMPORT_SPECIFIER_REGEX);

  return [...specifiers];
};

const normalizeModulePath = (modulePath: string): string =>
  modulePath.replace(/\\/g, "/").replace(/^\.\//, "");

const createUiCandidatePaths = (modulePath: string): string[] => {
  const normalized = normalizeModulePath(modulePath);
  const basePath = normalized === "" ? "index" : normalized;
  const candidates = new Set<string>();
  const extension = extname(basePath);

  if (extension) {
    candidates.add(basePath);
  } else {
    for (const ext of UI_FILE_EXTENSIONS) {
      candidates.add(`${basePath}${ext}`);
    }
    candidates.add(`${basePath}/index.tsx`);
    candidates.add(`${basePath}/index.ts`);
  }

  return [...candidates];
};

const toSandpackPath = (relativePath: string) => `/ui/${normalizeModulePath(relativePath)}`;

const createRelativeUiSpecifier = (fromPath: string, toPath: string): string => {
  const fromDir = posix.dirname(normalizeModulePath(fromPath.startsWith("/") ? fromPath.slice(1) : fromPath));
  const target = normalizeModulePath(toPath.startsWith("/") ? toPath.slice(1) : toPath);
  const relativePath = posix.relative(fromDir === "" ? "." : fromDir, target);

  if (relativePath === "") {
    return "./";
  }

  return relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
};

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

const shouldIgnoreFile = (relativePath: string): boolean => {
  if (["preview.tsx", "package.json", "meta.json"].includes(relativePath)) {
    return true;
  }

  return GITIGNORE_PATTERNS.some((pattern) => {
    if (pattern.includes("*")) {
      const regex = new RegExp(pattern.replace(/\*/g, ".*"));
      return regex.test(relativePath);
    }

    return relativePath.includes(pattern);
  });
};

const readDirectoryRecursively = async (
  directory: string,
  baseDir: string,
  sourceCode: SourceCodeMap,
) => {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);

  await Promise.all(
    entries.map(async (entry) => {
      const fullPath = join(directory, entry.name);

      if (entry.isDirectory()) {
        await readDirectoryRecursively(fullPath, baseDir, sourceCode);
        return;
      }

      if (!entry.isFile()) {
        return;
      }

      const relativePath = normalizeModulePath(relative(baseDir, fullPath));
      if (shouldIgnoreFile(relativePath)) {
        return;
      }

      const content = await readFile(fullPath, "utf-8");
      sourceCode[`/${relativePath}`] = content;
    }),
  );
};

const isUiSourceFile = (fileName: string) =>
  UI_FILE_EXTENSIONS.includes(extname(fileName) as (typeof UI_FILE_EXTENSIONS)[number]);

const readUiModules = async (): Promise<UiModuleLookup> => {
  const byPath = new Map<string, UiModule>();
  const bySpecifier = new Map<string, UiModule>();

  const walk = async (directory: string) => {
    const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);

    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = join(directory, entry.name);

        if (entry.isDirectory()) {
          await walk(fullPath);
          return;
        }

        if (!entry.isFile() || !isUiSourceFile(entry.name)) {
          return;
        }

        const relativePath = normalizeModulePath(relative(uiSourceRoot, fullPath));
        const code = await readFile(fullPath, "utf-8");
        const uiModule: UiModule = {
          relativePath,
          sandpackPath: toSandpackPath(relativePath),
          code,
        };

        byPath.set(relativePath, uiModule);

        const pathWithoutExtension = relativePath.replace(/\.tsx?$/i, "");
        const specifier = `${UI_IMPORT_PREFIX}${pathWithoutExtension}`.replace(/\/$/, "");
        bySpecifier.set(specifier, uiModule);
        bySpecifier.set(`${UI_IMPORT_PREFIX}${relativePath}`, uiModule);

        if (pathWithoutExtension === "index") {
          bySpecifier.set("@repo/ui", uiModule);
        }
      }),
    );
  };

  await walk(uiSourceRoot);

  return { byPath, bySpecifier };
};

const uiModules = cache(readUiModules);

const findUiModuleBySpecifier = (
  specifier: string,
  lookup: UiModuleLookup,
): UiModule | null => {
  if (specifier === "@repo/ui") {
    return lookup.bySpecifier.get("@repo/ui") ?? null;
  }

  if (!specifier.startsWith(UI_IMPORT_PREFIX)) {
    return null;
  }

  const modulePath = specifier.slice(UI_IMPORT_PREFIX.length);
  for (const candidate of createUiCandidatePaths(modulePath)) {
    const uiModule = lookup.byPath.get(candidate);
    if (uiModule) {
      return uiModule;
    }
  }

  return null;
};

const findUiModuleByRelativeImport = (
  fromModule: UiModule,
  specifier: string,
  lookup: UiModuleLookup,
): UiModule | null => {
  const resolvedPath = normalizeModulePath(
    join(dirname(fromModule.relativePath), specifier),
  );

  for (const candidate of createUiCandidatePaths(resolvedPath)) {
    const uiModule = lookup.byPath.get(candidate);
    if (uiModule) {
      return uiModule;
    }
  }

  return null;
};

const inlineUiDependencies = async (
  sourceCode: SourceCodeMap,
  previewCode: string,
): Promise<{ sourceCode: SourceCodeMap; previewCode: string }> => {
  const lookup = await uiModules();
  const embeddedUiSources = new Map<string, string>();
  const processed = new Set<string>();

  const ensureUiModule = (uiModule: UiModule) => {
    if (processed.has(uiModule.relativePath)) {
      return;
    }

    processed.add(uiModule.relativePath);

    const replacements = new Map<string, string>();

    for (const specifier of extractModuleSpecifiers(uiModule.code)) {
      if (specifier.startsWith(UI_IMPORT_PREFIX) || specifier === "@repo/ui") {
        const dependency = findUiModuleBySpecifier(specifier, lookup);
        if (!dependency) {
          continue;
        }

        ensureUiModule(dependency);
        const replacement = createRelativeUiSpecifier(
          uiModule.sandpackPath,
          dependency.sandpackPath,
        );
        replacements.set(specifier, replacement);
      } else if (specifier.startsWith(".")) {
        const dependency = findUiModuleByRelativeImport(uiModule, specifier, lookup);
        if (!dependency) {
          continue;
        }

        ensureUiModule(dependency);
        const replacement = createRelativeUiSpecifier(
          uiModule.sandpackPath,
          dependency.sandpackPath,
        );
        replacements.set(specifier, replacement);
      }
    }

    let updatedCode = uiModule.code;
    for (const [original, replacement] of replacements) {
      updatedCode = updatedCode.replaceAll(original, replacement);
    }

    embeddedUiSources.set(uiModule.sandpackPath, updatedCode);
  };

  const rewriteCode = (filePath: string, code: string): string => {
    const replacements = new Map<string, string>();

    for (const specifier of extractModuleSpecifiers(code)) {
      const dependency = findUiModuleBySpecifier(specifier, lookup);
      if (!dependency) {
        continue;
      }

      ensureUiModule(dependency);
      const replacement = createRelativeUiSpecifier(filePath, dependency.sandpackPath);
      replacements.set(specifier, replacement);
    }

    let updatedCode = code;
    for (const [original, replacement] of replacements) {
      updatedCode = updatedCode.replaceAll(original, replacement);
    }

    return updatedCode;
  };

  const rewrittenSourceEntries = Object.entries(sourceCode).map(([filePath, code]) => [
    filePath,
    rewriteCode(filePath, code),
  ] as const);

  const rewrittenPreview = rewriteCode("/preview.tsx", previewCode);

  const updatedSourceCode: SourceCodeMap = {
    ...Object.fromEntries(rewrittenSourceEntries),
  };

  for (const [path, code] of embeddedUiSources.entries()) {
    updatedSourceCode[path] = code;
  }

  return {
    sourceCode: updatedSourceCode,
    previewCode: rewrittenPreview,
  };
};

export const readContentComponents = cache(async (slug: string) => {
  const componentDir = join(contentSourceDir, slug);
  const sourceCode: SourceCodeMap = {};

  await readDirectoryRecursively(componentDir, componentDir, sourceCode);

  return sourceCode;
});

export type ContentComponent = {
  slug: string;
  name: string;
  description?: string;
  defaultSize?: "full" | "md" | "sm";
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
  const metadata =
    (await readJsonFile<ContentComponent>(
      join(contentSourceDir, slug, "meta.json"),
    )) ?? ({} as ContentComponent);

  const packageJson =
    (await readJsonFile<{
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    }>(join(contentSourceDir, slug, "package.json"))) ?? {};

  let previewCode = await readFile(
    join(contentSourceDir, slug, "preview.tsx"),
    "utf-8",
  ).catch(() => "");

  let sourceCode = await readContentComponents(slug);

  if (packageJson.dependencies?.["@repo/ui"]) {
    const uiPackageJson =
      (await readJsonFile<{
        dependencies?: Record<string, string>;
      }>(join(uiSourceDir, "package.json"))) ?? {};

    const existingDependencies = packageJson.dependencies ?? {};
    delete existingDependencies["@repo/ui"];

    packageJson.dependencies = {
      ...existingDependencies,
      ...(uiPackageJson.dependencies ?? {}),
    };

    const inlineResult = await inlineUiDependencies(sourceCode, previewCode);
    sourceCode = inlineResult.sourceCode;
    previewCode = inlineResult.previewCode;
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
