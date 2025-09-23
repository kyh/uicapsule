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

const createRelativeUiSpecifier = (
  fromPath: string,
  toPath: string,
): string => {
  const normalizedFrom = fromPath.replace(/\\/g, "/");
  const normalizedTo = toPath.replace(/\\/g, "/");
  const fromDir = dirname(normalizedFrom);
  const relativePath = relative(fromDir, normalizedTo).replace(
    /\\/g,
    "/",
  );

  if (relativePath === "") {
    return "./";
  }

  return relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
};

const normalizeModulePath = (modulePath: string): string =>
  modulePath.replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\//, "");

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

  return [...candidates].map((candidate) => candidate.replace(/\\/g, "/"));
};

const createUiInliner = () => {
  const uiSourceRoot = join(uiSourceDir, "src");
  const processedFiles = new Map<string, Promise<void>>();
  const uiSourceCode = new Map<string, string>();
  const specifierResolutionCache = new Map<string, string | null>();
  const modulePathResolutionCache = new Map<string, string | null>();

  const resolveModulePath = async (modulePath: string): Promise<string | null> => {
    const normalizedPath = normalizeModulePath(modulePath);
    if (modulePathResolutionCache.has(normalizedPath)) {
      return modulePathResolutionCache.get(normalizedPath) ?? null;
    }

    for (const candidate of createUiCandidatePaths(normalizedPath)) {
      try {
        const candidatePath = join(uiSourceRoot, candidate);
        const stats = await stat(candidatePath);
        if (stats.isFile()) {
          modulePathResolutionCache.set(normalizedPath, candidate);
          return candidate;
        }
      } catch {
        // ignore
      }
    }

    modulePathResolutionCache.set(normalizedPath, null);
    return null;
  };

  const resolveUiSpecifier = async (specifier: string): Promise<string | null> => {
    if (specifier === "@repo/ui") {
      return "ui";
    }

    if (!specifier.startsWith(UI_IMPORT_PREFIX)) {
      return null;
    }

    if (specifierResolutionCache.has(specifier)) {
      return specifierResolutionCache.get(specifier) ?? null;
    }

    const modulePath = specifier.slice(UI_IMPORT_PREFIX.length);
    const resolved = await resolveModulePath(modulePath);
    specifierResolutionCache.set(specifier, resolved);
    return resolved;
  };

  const ensureUiFile = async (relativePath: string | null): Promise<void> => {
    if (!relativePath) {
      return;
    }

    if (relativePath === "ui") {
      return;
    }

    const normalizedPath = normalizeModulePath(relativePath);

    if (processedFiles.has(normalizedPath)) {
      await processedFiles.get(normalizedPath);
      return;
    }

    const promise = (async () => {
      const absolutePath = join(uiSourceRoot, normalizedPath);
      const code = await readFile(absolutePath, "utf-8");

      const specifierReplacements = new Map<string, string>();

      for (const specifier of extractModuleSpecifiers(code)) {
        if (specifier === "@repo/ui" || specifier.startsWith(UI_IMPORT_PREFIX)) {
          const resolved = await resolveUiSpecifier(specifier);
          await ensureUiFile(resolved);
          if (resolved && resolved !== "ui") {
            const replacement = createRelativeUiSpecifier(
              `/ui/${normalizedPath}`,
              `/ui/${normalizeModulePath(resolved)}`,
            );
            specifierReplacements.set(specifier, replacement);
          } else if (resolved === "ui") {
            const replacement = createRelativeUiSpecifier(
              `/ui/${normalizedPath}`,
              "/ui",
            );
            specifierReplacements.set(specifier, replacement);
          }
        } else if (specifier.startsWith(".")) {
          const dependencyPath = await resolveModulePath(
            join(dirname(normalizedPath), specifier),
          );
          await ensureUiFile(dependencyPath);
        }
      }

      let updatedCode = code;
      for (const [original, replacement] of specifierReplacements) {
        updatedCode = updatedCode.replaceAll(original, replacement);
      }

      uiSourceCode.set(`/ui/${normalizedPath}`, updatedCode);
    })();

    processedFiles.set(normalizedPath, promise);
    await promise;
  };

  const replaceUiSpecifiers = async (
    sandpackPath: string,
    code: string,
  ): Promise<string> => {
    const replacements = new Map<string, string>();

    for (const specifier of extractModuleSpecifiers(code)) {
      if (specifier === "@repo/ui" || specifier.startsWith(UI_IMPORT_PREFIX)) {
        const resolved = await resolveUiSpecifier(specifier);
        await ensureUiFile(resolved);

        if (resolved && resolved !== "ui") {
          const replacement = createRelativeUiSpecifier(
            sandpackPath,
            `/ui/${normalizeModulePath(resolved)}`,
          );
          replacements.set(specifier, replacement);
        } else if (resolved === "ui") {
          const replacement = createRelativeUiSpecifier(sandpackPath, "/ui");
          replacements.set(specifier, replacement);
        }
      }
    }

    let updatedCode = code;
    for (const [original, replacement] of replacements) {
      updatedCode = updatedCode.replaceAll(original, replacement);
    }

    return updatedCode;
  };

  const getUiSourceCode = (): Record<string, string> => {
    return Object.fromEntries(uiSourceCode.entries());
  };

  return {
    ensureUiFile,
    replaceUiSpecifiers,
    getUiSourceCode,
  };
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

    const uiInliner = createUiInliner();

    const updatedSourceEntries = await Promise.all(
      Object.entries(sourceCode).map(async ([filePath, fileCode]) => {
        const updatedCode = await uiInliner.replaceUiSpecifiers(
          filePath,
          fileCode,
        );
        return [filePath, updatedCode] as const;
      }),
    );

    sourceCode = Object.fromEntries(updatedSourceEntries);

    previewCode = await uiInliner.replaceUiSpecifiers(
      "/preview.tsx",
      previewCode,
    );

    sourceCode = {
      ...sourceCode,
      ...uiInliner.getUiSourceCode(),
    };
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
