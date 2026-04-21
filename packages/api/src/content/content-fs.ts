import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { cache } from "react";

import type {
  ContentComponent,
  ContentComponentBase,
  LocalContentComponent,
  RemoteContentComponent,
} from "./content-schema";

const contentRoot = resolve(process.cwd(), "..", "..", "content");

type RawMeta = Omit<ContentComponentBase, "slug" | "type"> & {
  type?: "local" | "remote";
  iframeUrl?: string;
  sourceUrl?: string;
};

const IGNORED_SOURCE_SEGMENTS = new Set(["node_modules", "dist", ".turbo", ".cache"]);
const SOURCE_FILE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".css",
  ".json",
  ".md",
]);
const IGNORED_SOURCE_FILES = new Set(["meta.json", "package-lock.json", "pnpm-lock.yaml"]);

const readJson = async <T>(path: string): Promise<T | null> => {
  try {
    return JSON.parse(await readFile(path, "utf-8")) as T;
  } catch {
    return null;
  }
};

const readSourceFiles = async (
  slug: string,
): Promise<{ path: string; code: string }[]> => {
  const root = join(contentRoot, slug);
  const files: { path: string; code: string }[] = [];

  const walk = async (dir: string) => {
    const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
    await Promise.all(
      entries.map(async (entry) => {
        if (IGNORED_SOURCE_SEGMENTS.has(entry.name)) return;
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(full);
          return;
        }
        if (!entry.isFile()) return;
        if (IGNORED_SOURCE_FILES.has(entry.name)) return;
        const ext = entry.name.slice(entry.name.lastIndexOf("."));
        if (!SOURCE_FILE_EXTENSIONS.has(ext)) return;
        const code = await readFile(full, "utf-8");
        files.push({ path: `/${relative(root, full).replaceAll("\\", "/")}`, code });
      }),
    );
  };

  await walk(root);
  files.sort((a, b) => a.path.localeCompare(b.path));
  return files;
};

const buildComponent = async (
  slug: string,
  meta: RawMeta,
): Promise<ContentComponent | null> => {
  const base: ContentComponentBase = {
    slug,
    type: meta.type === "remote" ? "remote" : "local",
    name: meta.name,
    description: meta.description,
    defaultSize: meta.defaultSize,
    coverUrl: meta.coverUrl,
    coverType: meta.coverType,
    category: meta.category,
    tags: meta.tags,
    authors: meta.authors,
    asSeenOn: meta.asSeenOn,
  };

  if (meta.type === "remote") {
    if (!meta.iframeUrl || !meta.sourceUrl) return null;
    return {
      ...base,
      type: "remote",
      iframeUrl: meta.iframeUrl,
      sourceUrl: meta.sourceUrl,
    } satisfies RemoteContentComponent;
  }

  const sourceFiles = await readSourceFiles(slug);
  if (!sourceFiles.some((f) => f.path === "/preview.tsx")) return null;

  return {
    ...base,
    type: "local",
    sourceFiles,
  } satisfies LocalContentComponent;
};

export const readContentIndex = cache(async (): Promise<ContentComponent[]> => {
  const entries = await readdir(contentRoot, { withFileTypes: true }).catch(() => []);
  const slugs = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort();

  const built = await Promise.all(
    slugs.map(async (slug) => {
      const meta = await readJson<RawMeta>(join(contentRoot, slug, "meta.json"));
      if (!meta) return null;
      return buildComponent(slug, meta);
    }),
  );

  const components = built.filter((c): c is ContentComponent => c !== null);

  return components.map((component, index) => ({
    ...component,
    previousSlug: index > 0 ? components[index - 1]?.slug : undefined,
    nextSlug: index < components.length - 1 ? components[index + 1]?.slug : undefined,
  }));
});

export const readContentBySlug = cache(
  async (slug: string): Promise<ContentComponent | null> => {
    const all = await readContentIndex();
    return all.find((component) => component.slug === slug) ?? null;
  },
);

type ContentPackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const readContentPackageJson = cache(
  async (slug: string): Promise<ContentPackageJson> => {
    return (await readJson<ContentPackageJson>(join(contentRoot, slug, "package.json"))) ?? {};
  },
);

export const buildShadcnRegistryItem = async (component: LocalContentComponent) => {
  const pkg = await readContentPackageJson(component.slug);
  const dependencyKeys = Object.keys(pkg.dependencies ?? {});
  const devDependencyKeys = Object.keys(pkg.devDependencies ?? {});

  const repoScoped = dependencyKeys.filter((dep) => dep.startsWith("@repo"));
  const dependencies = dependencyKeys.filter(
    (dep) => !["react", "react-dom", ...repoScoped].includes(dep),
  );
  const devDependencies = devDependencyKeys.filter(
    (dep) => !["@types/react", "@types/react-dom", "typescript"].includes(dep),
  );

  return {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    homepage: `https://uicapsule.com/ui/${component.slug}`,
    name: component.slug,
    type: "registry:block" as const,
    author: "Kaiyu Hsu <uicapsule@kyh.io>",
    dependencies,
    devDependencies,
    registryDependencies: [],
    files: component.sourceFiles.map(({ path, code }) => ({
      type: "registry:file" as const,
      path,
      content: code,
      target: `uicapsule/${component.slug}${path}`,
    })),
  };
};
