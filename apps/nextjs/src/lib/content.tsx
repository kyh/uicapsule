import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, join, relative } from "node:path";
import { cache } from "react";

const contentSourceDir = join(process.cwd(), "..", "..", "content");
const uiSourceDir = join(process.cwd(), "..", "..", "packages", "ui");

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

const collectUiImportSpecifiers = (
  sourceCode: Record<string, string>,
  previewCode: string,
): Set<string> => {
  const specifiers = new Set<string>();

  const collect = (code: string | undefined) => {
    if (!code) return;
    for (const specifier of extractModuleSpecifiers(code)) {
      if (
        specifier === "@repo/ui" ||
        specifier.startsWith(UI_IMPORT_PREFIX)
      ) {
        specifiers.add(specifier);
      }
    }
  };

  Object.values(sourceCode).forEach(collect);
  collect(previewCode);

  return specifiers;
};

type UiSourceMap = {
  filesByPath: Map<string, { relativePath: string; code: string }>;
  lookup: Map<string, string>;
};

const createUiLookupKeys = (relativePath: string): string[] => {
  const normalizedPath = relativePath.replace(/\\/g, "/");
  const extension = extname(normalizedPath);
  const withoutExtension = extension
    ? normalizedPath.slice(0, -extension.length)
    : normalizedPath;

  const keys = new Set<string>([normalizedPath, withoutExtension]);

  if (withoutExtension === "index") {
    keys.add("");
  } else if (withoutExtension.endsWith("/index")) {
    keys.add(withoutExtension.slice(0, -"/index".length));
  }

  return [...keys];
};

const readUiSourceMap = cache(async (): Promise<UiSourceMap> => {
  const filesByPath = new Map<string, { relativePath: string; code: string }>();
  const lookup = new Map<string, string>();
  const uiSrcDir = join(uiSourceDir, "src");

  const walkDirectory = async (dir: string): Promise<void> => {
    const entries = await readdir(dir).catch(() => [] as string[]);

    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = join(dir, entry);
        const fileStat = await stat(fullPath).catch(() => null);

        if (!fileStat) {
          return;
        }

        if (fileStat.isDirectory()) {
          await walkDirectory(fullPath);
          return;
        }

        if (!fileStat.isFile()) {
          return;
        }

        const relativePath = relative(uiSrcDir, fullPath).replace(/\\/g, "/");
        const extension = extname(relativePath) as typeof UI_FILE_EXTENSIONS[number];

        if (!UI_FILE_EXTENSIONS.includes(extension)) {
          return;
        }

        const code = await readFile(fullPath, "utf-8");
        filesByPath.set(relativePath, { relativePath, code });

        for (const key of createUiLookupKeys(relativePath)) {
          lookup.set(key, relativePath);
        }
      }),
    );
  };

  await walkDirectory(uiSrcDir);

  return { filesByPath, lookup };
});

const getUiLookupKeyFromSpecifier = (specifier: string): string | null => {
  if (specifier === "@repo/ui") {
    return "";
  }

  if (specifier.startsWith(UI_IMPORT_PREFIX)) {
    return specifier.slice(UI_IMPORT_PREFIX.length);
  }

  return null;
};

const createUiLookupCandidatesFromImportPath = (importPath: string): string[] => {
  const normalized = importPath.replace(/\\/g, "/").replace(/^\.\//, "");
  const extension = extname(normalized);
  const candidates = new Set<string>([normalized]);

  if (extension) {
    const withoutExtension = normalized.slice(0, -extension.length);
    candidates.add(withoutExtension);

    if (withoutExtension.endsWith("/index")) {
      candidates.add(withoutExtension.slice(0, -"/index".length));
    }
  } else {
    candidates.add(`${normalized}/index`);
    for (const ext of UI_FILE_EXTENSIONS) {
      candidates.add(`${normalized}${ext}`);
      candidates.add(`${normalized}/index${ext}`);
    }
  }

  if (normalized.endsWith("/index")) {
    candidates.add(normalized.slice(0, -"/index".length));
  }

  return [...candidates];
};

const resolveRelativeImportPath = (
  fromFile: string,
  specifier: string,
): string | null => {
  const resolved = join(dirname(fromFile), specifier).replace(/\\/g, "/");
  if (resolved.startsWith("../")) {
    return null;
  }

  return resolved.replace(/^\.\//, "");
};

const replaceUiModuleSpecifiers = (filePath: string, code: string): string => {
  const normalizedFilePath = filePath.replace(/\\/g, "/");
  const directory = dirname(normalizedFilePath);
  const relativePathToUi = relative(directory || ".", "/ui").replace(/\\/g, "/");

  const normalizedRelativePath =
    relativePathToUi === ""
      ? "."
      : relativePathToUi.startsWith(".")
        ? relativePathToUi
        : `./${relativePathToUi}`;

  return code.replaceAll("@repo/ui", normalizedRelativePath);
};

const readRequiredUiComponents = async (
  importSpecifiers: Set<string>,
): Promise<Record<string, string>> => {
  if (importSpecifiers.size === 0) {
    return {};
  }

  const { filesByPath, lookup } = await readUiSourceMap();

  const queue: string[] = [];
  const visitedPaths = new Set<string>();
  const sourceCode: Record<string, string> = {};

  for (const specifier of importSpecifiers) {
    const lookupKey = getUiLookupKeyFromSpecifier(specifier);
    if (lookupKey === null) {
      continue;
    }

    const relativePath = lookup.get(lookupKey);
    if (relativePath) {
      queue.push(relativePath);
    }
  }

  while (queue.length > 0) {
    const relativePath = queue.pop();
    if (!relativePath || visitedPaths.has(relativePath)) {
      continue;
    }

    visitedPaths.add(relativePath);

    const file = filesByPath.get(relativePath);
    if (!file) {
      continue;
    }

    const sandpackPath = `/ui/${relativePath}`;
    sourceCode[sandpackPath] = replaceUiModuleSpecifiers(
      sandpackPath,
      file.code,
    );

    for (const specifier of extractModuleSpecifiers(file.code)) {
      if (specifier === "@repo/ui" || specifier.startsWith(UI_IMPORT_PREFIX)) {
        const lookupKey = getUiLookupKeyFromSpecifier(specifier);
        if (lookupKey === null) {
          continue;
        }

        const dependencyPath = lookup.get(lookupKey);
        if (dependencyPath && !visitedPaths.has(dependencyPath)) {
          queue.push(dependencyPath);
        }
      } else if (specifier.startsWith(".")) {
        const resolved = resolveRelativeImportPath(relativePath, specifier);
        if (!resolved) {
          continue;
        }

        for (const candidate of createUiLookupCandidatesFromImportPath(resolved)) {
          const dependencyPath = lookup.get(candidate);
          if (dependencyPath && !visitedPaths.has(dependencyPath)) {
            queue.push(dependencyPath);
            break;
          }
        }
      }
    }
  }

  return sourceCode;
};

// Check if a file should be ignored based on gitignore patterns
const shouldIgnoreFile = (filePath: string, baseDir: string): boolean => {
  const relativePath = relative(baseDir, filePath);

  // Always ignore these specific files
  if (["preview.tsx", "package.json", "meta.json"].includes(relativePath)) {
    return true;
  }

  // Check against gitignore patterns
  return GITIGNORE_PATTERNS.some((pattern) => {
    if (pattern.includes("*")) {
      // Handle wildcard patterns
      const regex = new RegExp(pattern.replace(/\*/g, ".*"));
      return regex.test(relativePath);
    }
    return relativePath.includes(pattern);
  });
};

// Recursively read directory structure
const readDirectoryRecursively = async (
  dirPath: string,
  baseDir: string,
  sourceCode: Record<string, string>,
): Promise<void> => {
  try {
    const entries = await readdir(dirPath);

    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = join(dirPath, entry);
        const fileStat = await stat(fullPath);

        if (fileStat.isDirectory()) {
          // Recursively read subdirectories
          await readDirectoryRecursively(fullPath, baseDir, sourceCode);
        } else if (fileStat.isFile()) {
          // Check if file should be ignored
          if (!shouldIgnoreFile(fullPath, baseDir)) {
            const relativePath = relative(baseDir, fullPath);
            const fileContent = await readFile(fullPath, "utf-8");
            sourceCode[`/${relativePath}`] = fileContent;
          }
        }
      }),
    );
  } catch {
    // Ignore errors for individual directories
  }
};

export const readContentComponents = cache(async (slug: string) => {
  const componentDir = join(contentSourceDir, slug);
  const sourceCode: Record<string, string> = {};

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
    const uiImportSpecifiers = collectUiImportSpecifiers(
      sourceCode,
      previewCode,
    );

    const updatedSourceCode = Object.entries(sourceCode).reduce(
      (acc, [key, value]) => {
        acc[key] = replaceUiModuleSpecifiers(key, value);
        return acc;
      },
      {} as Record<string, string>,
    );

    const uiSourceCode = await readRequiredUiComponents(uiImportSpecifiers);

    sourceCode = {
      ...updatedSourceCode,
      ...uiSourceCode,
    };

    // Handle preview code
    // Preview code is at the root level, so UI is at ./ui
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
