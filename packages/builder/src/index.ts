import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join, posix, relative } from "node:path";
import { fileURLToPath } from "node:url";
import chokidar from "chokidar";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const packageRoot = join(__dirname, "..");
const repoRoot = join(packageRoot, "..", "..");
const contentSourceDir = join(repoRoot, "content");
const uiSourceDir = join(repoRoot, "packages", "ui");
const uiSourceRoot = join(uiSourceDir, "src");

const GITIGNORE_PATTERNS = ["node_modules", "dist", ".DS_Store", ".turbo"];
const UI_IMPORT_PREFIX = "@repo/ui/";
const UI_FILE_EXTENSIONS = [".tsx", ".ts"] as const;

const STATIC_IMPORT_SPECIFIER_REGEX = /from\s+["'`]([^"'`]+)["'`]/g;
const BARE_IMPORT_SPECIFIER_REGEX = /import\s+["'`]([^"'`]+)["'`]/g;
const DYNAMIC_IMPORT_SPECIFIER_REGEX = /import\(\s*["'`]([^"'`]+)["'`]\s*\)/g;

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
  previewCode: string;
  sourceCode: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  previousSlug?: string;
  nextSlug?: string;
};

const extractModuleSpecifiers = (source: string): string[] => {
  const specifiers = new Set<string>();

  const addMatches = (regex: RegExp) => {
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(source)) !== null) {
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

const toSandpackPath = (relativePath: string) =>
  `/ui/${normalizeModulePath(relativePath)}`;

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

const isUiSourceFile = (fileName: string) =>
  UI_FILE_EXTENSIONS.includes(
    extname(fileName) as (typeof UI_FILE_EXTENSIONS)[number],
  );

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

        const pathWithoutExtension = relativePath.replace(/\.tsx?$/i, "");
        const specifier = `${UI_IMPORT_PREFIX}${pathWithoutExtension}`.replace(
          /\/$/,
          "",
        );
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
  const lookup = await readUiModules();
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

  const rewrittenSourceEntries = Object.entries(sourceCode).map(
    ([filePath, code]) => [filePath, rewriteCode(filePath, code)] as const,
  );

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

const readContentComponentSources = async (
  slug: string,
): Promise<SourceCodeMap> => {
  const componentDir = join(contentSourceDir, slug);
  const sourceCode: SourceCodeMap = {};

  await readDirectoryRecursively(componentDir, componentDir, sourceCode);

  return sourceCode;
};

const readContentComponent = async (
  slug: string,
): Promise<ContentComponent> => {
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

  let sourceCode = await readContentComponentSources(slug);

  if (packageJson.dependencies?.["@repo/ui"]) {
    const uiPackageJson =
      (await readJsonFile<{ dependencies?: Record<string, string> }>(
        join(uiSourceDir, "package.json"),
      )) ?? {};

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

const getAllContentComponents = async (): Promise<{
  slugs: string[];
  components: Record<string, ContentComponent>;
}> => {
  const slugs = (await readdir(contentSourceDir)).filter(
    (slug) => !slug.startsWith("."),
  );

  const contents = await Promise.all(
    slugs.map(async (slug, index) => {
      const component = await readContentComponent(slug);
      return {
        ...component,
        previousSlug: slugs[index - 1],
        nextSlug: slugs[index + 1],
      } satisfies ContentComponent;
    }),
  );

  const record: Record<string, ContentComponent> = {};
  contents.forEach((component) => {
    record[component.slug] = component;
  });

  return { slugs, components: record };
};

const serializeField = <T>(value: T | undefined): string | null => {
  if (value === undefined || value === null) {
    return null;
  }
  return JSON.stringify(value);
};

const getAllSlugs = async (): Promise<string[]> => {
  return (await readdir(contentSourceDir)).filter(
    (slug) => !slug.startsWith("."),
  );
};

const loadDbDependencies = async () => {
  const { db } = await import("@repo/db/drizzle-client");
  const { contentComponent } = await import("@repo/db/drizzle-schema");
  return { db, contentComponent };
};

const syncComponentToDb = async (component: ContentComponent) => {
  const { db, contentComponent } = await loadDbDependencies();

  await db
    .insert(contentComponent)
    .values({
      slug: component.slug,
      name: component.name,
      description: component.description ?? null,
      defaultSize: component.defaultSize ?? null,
      coverUrl: component.coverUrl ?? null,
      coverType: component.coverType ?? null,
      category: component.category ?? null,
      tags: serializeField(component.tags),
      authors: serializeField(component.authors),
      asSeenOn: serializeField(component.asSeenOn),
      previewCode: component.previewCode,
      sourceCode: JSON.stringify(component.sourceCode),
      dependencies: serializeField(component.dependencies),
      devDependencies: serializeField(component.devDependencies),
      previousSlug: component.previousSlug ?? null,
      nextSlug: component.nextSlug ?? null,
    })
    .onConflictDoUpdate({
      target: contentComponent.slug,
      set: {
        name: component.name,
        description: component.description ?? null,
        defaultSize: component.defaultSize ?? null,
        coverUrl: component.coverUrl ?? null,
        coverType: component.coverType ?? null,
        category: component.category ?? null,
        tags: serializeField(component.tags),
        authors: serializeField(component.authors),
        asSeenOn: serializeField(component.asSeenOn),
        previewCode: component.previewCode,
        sourceCode: JSON.stringify(component.sourceCode),
        dependencies: serializeField(component.dependencies),
        devDependencies: serializeField(component.devDependencies),
        previousSlug: component.previousSlug ?? null,
        nextSlug: component.nextSlug ?? null,
      },
    });
};

const generateTypeScriptExport = (
  slugs: string[],
  components: Record<string, ContentComponent>,
): string => {
  const lines: string[] = [];

  lines.push(
    "// This file is auto-generated by the builder. Do not edit manually.",
  );
  lines.push("");
  lines.push("export type ContentComponent = {");
  lines.push("  slug: string;");
  lines.push("  name: string;");
  lines.push("  description?: string;");
  lines.push('  defaultSize?: "full" | "md" | "sm";');
  lines.push("  coverUrl?: string;");
  lines.push('  coverType?: "image" | "video";');
  lines.push('  category?: "marketing" | "application" | "mobile";');
  lines.push("  tags?: string[];");
  lines.push("  authors?: { name: string; url: string; avatarUrl: string }[];");
  lines.push(
    "  asSeenOn?: { name: string; url: string; avatarUrl: string }[];",
  );
  lines.push("  previewCode: string;");
  lines.push("  sourceCode: Record<string, string>;");
  lines.push("  dependencies?: Record<string, string>;");
  lines.push("  devDependencies?: Record<string, string>;");
  lines.push("  previousSlug?: string;");
  lines.push("  nextSlug?: string;");
  lines.push("};");
  lines.push("");

  lines.push(
    "export const contentSlugs = " +
      JSON.stringify(slugs, null, 2) +
      " as const;",
  );
  lines.push("");

  lines.push(
    "export const contentComponents: Record<string, ContentComponent> = {",
  );

  for (const slug of slugs) {
    const component = components[slug];
    if (!component) continue;

    lines.push(`  "${slug}": ${JSON.stringify(component, null, 2)},`);
  }

  lines.push("};");
  lines.push("");

  lines.push(
    "export const getContentComponent = (slug: string): ContentComponent | undefined => {",
  );
  lines.push("  return contentComponents[slug];");
  lines.push("};");
  lines.push("");

  lines.push("export const getAllContentSlugs = (): readonly string[] => {");
  lines.push("  return contentSlugs;");
  lines.push("};");
  lines.push("");

  lines.push(
    "export const getAllContentComponents = (filterTags?: string[]): ContentComponent[] => {",
  );
  lines.push("  const allComponents = Object.values(contentComponents);");
  lines.push("");
  lines.push("  if (filterTags && filterTags.length > 0) {");
  lines.push("    // Filter components that have any of the filter tags");
  lines.push("    return allComponents.filter((component) => {");
  lines.push("      const componentTags = component.tags ?? [];");
  lines.push("      return filterTags.some((filterTag) =>");
  lines.push("        componentTags.includes(filterTag),");
  lines.push("      );");
  lines.push("    });");
  lines.push("  }");
  lines.push("");
  lines.push("  return allComponents;");
  lines.push("};");
  lines.push("");

  return lines.join("\n");
};

const exportToFile = async () => {
  const { slugs, components } = await getAllContentComponents();

  const apiContentDir = join(repoRoot, "packages", "api", "src", "content");
  await mkdir(apiContentDir, { recursive: true });

  const outputPath = join(apiContentDir, "content-data.ts");
  const code = generateTypeScriptExport(slugs, components);

  await writeFile(outputPath, code, "utf-8");

  console.log(
    `✅ Exported ${slugs.length} content component(s) to ${relative(repoRoot, outputPath)}`,
  );
};

const buildComponent = async (slug: string, slugs: string[]): Promise<void> => {
  const index = slugs.indexOf(slug);
  const component = await readContentComponent(slug);
  const componentWithNav: ContentComponent = {
    ...component,
    previousSlug: index > 0 ? slugs[index - 1] : undefined,
    nextSlug: index < slugs.length - 1 ? slugs[index + 1] : undefined,
  };

  await syncComponentToDb(componentWithNav);
  console.log(`\u2714\ufe0f Synced component: ${slug}`);
};

const build = async () => {
  const { components } = await getAllContentComponents();

  // Write each component to the database
  for (const component of Object.values(components)) {
    await syncComponentToDb(component);
  }

  console.log(
    `\u2714\ufe0f Synced ${Object.keys(components).length} content component(s) to database`,
  );
};

const getSlugFromPath = (filePath: string): string | null => {
  const relativePath = relative(contentSourceDir, filePath);
  if (relativePath.startsWith("..")) {
    return null;
  }

  const parts = relativePath.split(/[/\\]/);
  return parts[0] ?? null;
};

const getComponentsUsingUi = async (): Promise<string[]> => {
  const slugs = await getAllSlugs();
  const componentsUsingUi: string[] = [];

  await Promise.all(
    slugs.map(async (slug) => {
      const packageJson = await readJsonFile<{
        dependencies?: Record<string, string>;
      }>(join(contentSourceDir, slug, "package.json"));

      if (packageJson?.dependencies?.["@repo/ui"]) {
        componentsUsingUi.push(slug);
      }
    }),
  );

  return componentsUsingUi;
};

const watch = (mode: "db" | "export") => {
  const watcher = chokidar.watch([contentSourceDir, uiSourceRoot], {
    ignoreInitial: true,
    ignored: (path: string) => {
      return GITIGNORE_PATTERNS.some((pattern) => {
        const normalized = path.replace(/\\/g, "/");
        return (
          normalized.includes(`/${pattern}/`) ||
          normalized.endsWith(`/${pattern}`)
        );
      });
    },
  });

  let building = false;
  const pendingSlugs = new Set<string>();

  const runBuild = async (affectedSlugs: Set<string>) => {
    if (building) {
      affectedSlugs.forEach((slug) => pendingSlugs.add(slug));
      return;
    }

    building = true;

    try {
      const slugs = await getAllSlugs();

      if (mode === "db") {
        for (const slug of affectedSlugs) {
          await buildComponent(slug, slugs);
        }
      } else {
        await exportToFile();
      }
    } catch (error) {
      console.error("Failed to build content components", error);
    } finally {
      building = false;

      if (pendingSlugs.size > 0) {
        const toBuild = new Set(pendingSlugs);
        pendingSlugs.clear();
        void runBuild(toBuild);
      }
    }
  };

  watcher.on("all", (_event, path) => {
    const relativePath = relative(repoRoot, path);
    const action =
      mode === "export" ? "Exporting to file..." : "Syncing to database...";
    console.log(`⚠️ Change detected in ${relativePath}. ${action}`);

    void (async () => {
      // Check if it's a UI source file
      if (path.startsWith(uiSourceRoot)) {
        const affectedComponents = await getComponentsUsingUi();
        if (affectedComponents.length > 0) {
          console.log(
            `   Rebuilding ${affectedComponents.length} component(s) that use @repo/ui`,
          );
          void runBuild(new Set(affectedComponents));
        }
        return;
      }

      // Check if it's a content component file
      const slug = getSlugFromPath(path);
      if (slug) {
        void runBuild(new Set([slug]));
      }
    })();
  });

  // Initial build
  void (async () => {
    if (mode === "db") {
      await build();
    } else {
      await exportToFile();
    }
  })();

  const cleanup = () => {
    void watcher.close();
  };

  process.on("SIGINT", () => {
    cleanup();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    cleanup();
    process.exit(0);
  });
};

const args = process.argv.slice(2);
const hasWatch = args.includes("--watch");

// Parse --mode argument
const modeIndex = args.indexOf("--mode");
let mode: "db" | "export" = "export"; // default to export
if (modeIndex !== -1 && args[modeIndex + 1]) {
  const modeArg = args[modeIndex + 1];
  if (modeArg === "db" || modeArg === "export") {
    mode = modeArg;
  } else {
    console.error(`Invalid mode: ${modeArg}. Must be "db" or "export"`);
    process.exit(1);
  }
}

if (hasWatch) {
  // Watch mode with specified mode
  watch(mode);
} else if (mode === "export") {
  // Export to file (one-time)
  exportToFile().catch((error) => {
    console.error(error);
    process.exit(1);
  });
} else {
  // Sync to database (one-time)
  build().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
