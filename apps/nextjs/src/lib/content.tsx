import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { cache } from "react";

const contentSourceDir = join(process.cwd(), "..", "..", "content");
const uiSourceDir = join(process.cwd(), "..", "..", "packages", "ui");

const GITIGNORE_PATTERNS = ["node_modules", "dist", ".DS_Store"];

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
    sourceCode = {
      ...Object.entries(sourceCode).reduce(
        (acc, [key, value]) => {
          // Calculate relative path from source file to UI directory
          // Key format: /path/to/file.tsx
          // UI directory is at /ui/
          const pathDepth = key.split("/").length - 2; // -2 because key starts with / and we don't count the filename
          const relativePath =
            pathDepth === 0 ? "./ui" : "../".repeat(pathDepth) + "ui";
          acc[key] = value.replaceAll("@repo/ui", relativePath);
          return acc;
        },
        {} as Record<string, string>,
      ),
      ...(await readUIComponents()),
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
