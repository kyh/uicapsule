import { readdir, readFile } from "node:fs/promises";
import { dirname, extname, join, posix, relative } from "node:path";
import { cache } from "react";

/**
 * Content Management System for UI Components
 *
 * This file handles the discovery, processing, and preparation of UI components
 * from the content directory for display in a sandbox environment (like Sandpack).
 * It automatically inlines dependencies from @repo/ui packages to create self-contained
 * component bundles that can run independently.
 */

// Maps file paths to their source code content
type SourceCodeMap = Record<string, string>;

// Represents a UI module with its metadata and code
type UiModule = {
  relativePath: string; // Path relative to UI source root
  sandpackPath: string; // Path for use in Sandpack environment
  code: string; // The actual source code
};

// Lookup tables for finding UI modules by different identifiers
type UiModuleLookup = {
  byPath: Map<string, UiModule>; // Find by file path
  bySpecifier: Map<string, UiModule>; // Find by import specifier
};

// Directory paths for content and UI packages
const contentSourceDir = join(process.cwd(), "..", "..", "content");
const uiSourceDir = join(process.cwd(), "..", "..", "packages", "ui");
const uiSourceRoot = join(uiSourceDir, "src");

// Patterns to ignore when reading files (similar to .gitignore)
const GITIGNORE_PATTERNS = ["node_modules", "dist", ".DS_Store"];

// Configuration for UI package imports and file types
const UI_IMPORT_PREFIX = "@repo/ui/";
const UI_FILE_EXTENSIONS = [".tsx", ".ts"] as const;

// Regular expressions to extract import statements from source code
const STATIC_IMPORT_SPECIFIER_REGEX = /from\s+["'`]([^"'`]+)["'`]/g; // import { x } from "module"
const BARE_IMPORT_SPECIFIER_REGEX = /import\s+["'`]([^"'`]+)["'`]/g; // import "module"
const DYNAMIC_IMPORT_SPECIFIER_REGEX = /import\(\s*["'`]([^"'`]+)["'`]\s*\)/g; // import("module")

/**
 * Extracts all module specifiers (import paths) from source code
 * Handles static imports, bare imports, and dynamic imports
 */
const extractModuleSpecifiers = (source: string): string[] => {
  const specifiers = new Set<string>();

  const addMatches = (regex: RegExp) => {
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(source)) !== null) {
      // TypeScript knows match[1] exists because the regex has a capture group
      const captured = match[1];
      if (captured && typeof captured === "string") {
        specifiers.add(captured);
      }
    }
  };

  addMatches(STATIC_IMPORT_SPECIFIER_REGEX);
  addMatches(BARE_IMPORT_SPECIFIER_REGEX);
  addMatches(DYNAMIC_IMPORT_SPECIFIER_REGEX);

  return [...specifiers];
};

/**
 * Normalizes module paths by converting backslashes to forward slashes
 * and removing leading "./" prefixes
 */
const normalizeModulePath = (modulePath: string): string =>
  modulePath.replace(/\\/g, "/").replace(/^\.\//, "");

/**
 * Creates possible file paths for a given module path
 * Handles both files with extensions and directories (which might have index files)
 */
const createUiCandidatePaths = (modulePath: string): string[] => {
  const normalized = normalizeModulePath(modulePath);
  const basePath = normalized === "" ? "index" : normalized;
  const candidates = new Set<string>();
  const extension = extname(basePath);

  if (extension) {
    // If it already has an extension, use it as-is
    candidates.add(basePath);
  } else {
    // If no extension, try adding .tsx and .ts extensions
    for (const ext of UI_FILE_EXTENSIONS) {
      candidates.add(`${basePath}${ext}`);
    }
    // Also try index files in the directory
    candidates.add(`${basePath}/index.tsx`);
    candidates.add(`${basePath}/index.ts`);
  }

  return [...candidates];
};

/**
 * Converts a relative path to a Sandpack-compatible path
 * All UI modules are placed under the /ui/ directory in Sandpack
 */
const toSandpackPath = (relativePath: string) =>
  `/ui/${normalizeModulePath(relativePath)}`;

/**
 * Creates a relative import specifier between two UI modules
 * Used when inlining dependencies to maintain proper relative imports
 */
const createRelativeUiSpecifier = (
  fromPath: string,
  toPath: string,
): string => {
  const fromDir = posix.dirname(
    normalizeModulePath(
      fromPath.startsWith("/") ? fromPath.slice(1) : fromPath,
    ),
  );
  const target = normalizeModulePath(
    toPath.startsWith("/") ? toPath.slice(1) : toPath,
  );
  const relativePath = posix.relative(fromDir === "" ? "." : fromDir, target);

  if (relativePath === "") {
    return "./";
  }

  return relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
};

/**
 * Safely reads and parses a JSON file, returning null if it doesn't exist or is invalid
 */
async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/**
 * Determines if a file should be ignored when reading content
 * Excludes preview files, package files, and gitignore patterns
 */
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

/**
 * Recursively reads all files in a directory and stores their content
 * Skips ignored files and directories
 */
const readDirectoryRecursively = async (
  directory: string,
  baseDir: string,
  sourceCode: SourceCodeMap,
) => {
  const entries = await readdir(directory, { withFileTypes: true }).catch(
    () => [],
  );

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

/**
 * Checks if a file is a UI source file based on its extension
 */
const isUiSourceFile = (fileName: string) =>
  UI_FILE_EXTENSIONS.includes(
    extname(fileName) as (typeof UI_FILE_EXTENSIONS)[number],
  );

/**
 * Reads all UI modules from the UI package and creates lookup tables
 * This allows fast lookup by both file path and import specifier
 */
const readUiModules = async (): Promise<UiModuleLookup> => {
  const byPath = new Map<string, UiModule>();
  const bySpecifier = new Map<string, UiModule>();

  const walk = async (directory: string) => {
    const entries = await readdir(directory, { withFileTypes: true }).catch(
      () => [],
    );

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

        const relativePath = normalizeModulePath(
          relative(uiSourceRoot, fullPath),
        );
        const code = await readFile(fullPath, "utf-8");
        const uiModule: UiModule = {
          relativePath,
          sandpackPath: toSandpackPath(relativePath),
          code,
        };

        byPath.set(relativePath, uiModule);

        // Create multiple specifier mappings for flexible imports
        const pathWithoutExtension = relativePath.replace(/\.tsx?$/i, "");
        const specifier = `${UI_IMPORT_PREFIX}${pathWithoutExtension}`.replace(
          /\/$/,
          "",
        );
        bySpecifier.set(specifier, uiModule);
        bySpecifier.set(`${UI_IMPORT_PREFIX}${relativePath}`, uiModule);

        // Special case for index files - allow importing from package root
        if (pathWithoutExtension === "index") {
          bySpecifier.set("@repo/ui", uiModule);
        }
      }),
    );
  };

  await walk(uiSourceRoot);

  return { byPath, bySpecifier };
};

// Cache the UI modules lookup to avoid re-reading files on every request
const uiModules = cache(readUiModules);

/**
 * Finds a UI module by its import specifier (e.g., "@repo/ui/button")
 * Handles both exact matches and path resolution
 */
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

/**
 * Finds a UI module by relative import (e.g., "./button" or "../utils")
 * Resolves the path relative to the importing module
 */
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

/**
 * Inlines UI dependencies by replacing @repo/ui imports with relative imports
 * and embedding the actual UI module code into the source code map
 * This creates self-contained component bundles for Sandpack
 */
const inlineUiDependencies = async (
  sourceCode: SourceCodeMap,
  previewCode: string,
): Promise<{ sourceCode: SourceCodeMap; previewCode: string }> => {
  const lookup = await uiModules();
  const embeddedUiSources = new Map<string, string>();
  const processed = new Set<string>();

  /**
   * Recursively processes a UI module and all its dependencies
   * Replaces imports with relative paths and embeds the code
   */
  const ensureUiModule = (uiModule: UiModule) => {
    if (processed.has(uiModule.relativePath)) {
      return;
    }

    processed.add(uiModule.relativePath);

    const replacements = new Map<string, string>();

    // Process all imports in this module
    for (const specifier of extractModuleSpecifiers(uiModule.code)) {
      if (specifier.startsWith(UI_IMPORT_PREFIX) || specifier === "@repo/ui") {
        // Handle @repo/ui imports
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
        // Handle relative imports within UI package
        const dependency = findUiModuleByRelativeImport(
          uiModule,
          specifier,
          lookup,
        );
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

    // Apply all import replacements to the code
    let updatedCode = uiModule.code;
    for (const [original, replacement] of replacements) {
      updatedCode = updatedCode.replaceAll(original, replacement);
    }

    embeddedUiSources.set(uiModule.sandpackPath, updatedCode);
  };

  /**
   * Rewrites imports in content files to point to inlined UI modules
   */
  const rewriteCode = (filePath: string, code: string): string => {
    const replacements = new Map<string, string>();

    for (const specifier of extractModuleSpecifiers(code)) {
      const dependency = findUiModuleBySpecifier(specifier, lookup);
      if (!dependency) {
        continue;
      }

      ensureUiModule(dependency);
      const replacement = createRelativeUiSpecifier(
        filePath,
        dependency.sandpackPath,
      );
      replacements.set(specifier, replacement);
    }

    let updatedCode = code;
    for (const [original, replacement] of replacements) {
      updatedCode = updatedCode.replaceAll(original, replacement);
    }

    return updatedCode;
  };

  // Rewrite all content files
  const rewrittenSourceEntries = Object.entries(sourceCode).map(
    ([filePath, code]) => [filePath, rewriteCode(filePath, code)] as const,
  );

  // Rewrite preview code
  const rewrittenPreview = rewriteCode("/preview.tsx", previewCode);

  // Combine rewritten content with inlined UI modules
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

/**
 * Reads all source files for a specific content component
 * Returns a map of file paths to their source code
 */
export const readContentComponents = cache(async (slug: string) => {
  const componentDir = join(contentSourceDir, slug);
  const sourceCode: SourceCodeMap = {};

  await readDirectoryRecursively(componentDir, componentDir, sourceCode);

  return sourceCode;
});

/**
 * Represents a content component with all its metadata and source code
 * Used for displaying components in the UI and generating Sandpack bundles
 */
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

/**
 * Gets all content components, optionally filtered by tags
 * Adds navigation metadata (previous/next slug) for each component
 */
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

/**
 * Reads a single content component with all its metadata and source code
 * Handles UI dependency inlining if the component uses @repo/ui
 */
const readContentComponent = async (slug: string) => {
  // Read component metadata
  const metadata =
    (await readJsonFile<ContentComponent>(
      join(contentSourceDir, slug, "meta.json"),
    )) ?? ({} as ContentComponent);

  // Read package.json for dependencies
  const packageJson =
    (await readJsonFile<{
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    }>(join(contentSourceDir, slug, "package.json"))) ?? {};

  // Read preview code
  let previewCode = await readFile(
    join(contentSourceDir, slug, "preview.tsx"),
    "utf-8",
  ).catch(() => "");

  // Read all source files
  let sourceCode = await readContentComponents(slug);

  // If component uses @repo/ui, inline the UI dependencies
  if (packageJson.dependencies?.["@repo/ui"]) {
    const uiPackageJson =
      (await readJsonFile<{
        dependencies?: Record<string, string>;
      }>(join(uiSourceDir, "package.json"))) ?? {};

    // Merge UI package dependencies into component dependencies
    const existingDependencies = packageJson.dependencies ?? {};
    delete existingDependencies["@repo/ui"];

    packageJson.dependencies = {
      ...existingDependencies,
      ...(uiPackageJson.dependencies ?? {}),
    };

    // Inline UI dependencies and rewrite imports
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

/**
 * Gets a single content component by slug
 */
export const getContentComponent = cache(
  async (slug: string): Promise<ContentComponent> => {
    const content = await getContentComponents();
    return content[slug as keyof typeof content];
  },
);

/**
 * Generates a package registry entry for a content component
 * Creates a shadcn/ui compatible registry format for component distribution
 */
export const getContentComponentPackage = cache(async (slug: string) => {
  const contentComponent = await getContentComponent(slug);

  // Filter out internal dependencies that shouldn't be in the registry
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
