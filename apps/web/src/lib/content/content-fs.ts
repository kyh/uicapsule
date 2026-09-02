import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { cache } from "react";
import { z } from "zod";

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

const linkedPersonSchema = z.object({ name: z.string(), url: z.string(), avatarUrl: z.string() });

const rawMetaSchema: z.ZodType<RawMeta> = z.object({
  type: z.enum(["local", "remote"]).optional(),
  name: z.string(),
  description: z.string().optional(),
  defaultSize: z.enum(["full", "md", "sm"]).optional(),
  coverUrl: z.string().optional(),
  coverType: z.enum(["image", "video"]).optional(),
  category: z.enum(["marketing", "application", "mobile"]).optional(),
  tags: z.array(z.string()).optional(),
  authors: z.array(linkedPersonSchema).optional(),
  asSeenOn: z.array(linkedPersonSchema).optional(),
  iframeUrl: z.string().optional(),
  sourceUrl: z.string().optional(),
});

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

const readJson = async <T>(path: string, schema: z.ZodType<T>): Promise<T | null> => {
  try {
    const parsed = schema.safeParse(JSON.parse(await readFile(path, "utf-8")));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};

const readSourceFiles = async (slug: string): Promise<{ path: string; code: string }[]> => {
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

const buildComponent = async (slug: string, meta: RawMeta): Promise<ContentComponent | null> => {
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
      const meta = await readJson(join(contentRoot, slug, "meta.json"), rawMetaSchema);
      if (!meta) return null;
      return buildComponent(slug, meta);
    }),
  );

  const components = built.filter((c): c is ContentComponent => c !== null);

  return components;
});

/**
 * Newest mtime across the content tree, used as the sitemap's `lastmod`.
 * Directory mtimes are enough: every deploy is a fresh checkout, so this
 * resolves to "when this content was published" rather than to the clock —
 * which keeps `sitemap.xml` byte-identical between two builds of one commit.
 */
export const readContentLastModified = cache(async (): Promise<Date> => {
  const entries = await readdir(contentRoot, { withFileTypes: true }).catch(() => []);
  const paths = [
    contentRoot,
    ...entries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
      .flatMap((entry) => [
        join(contentRoot, entry.name),
        join(contentRoot, entry.name, "meta.json"),
      ]),
  ];

  const times = await Promise.all(
    paths.map(async (path) => (await stat(path).catch(() => null))?.mtimeMs ?? 0),
  );

  return new Date(Math.max(0, ...times));
});

export const readContentBySlug = cache(async (slug: string): Promise<ContentComponent | null> => {
  const all = await readContentIndex();
  return all.find((component) => component.slug === slug) ?? null;
});

type ContentPackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const contentPackageJsonSchema: z.ZodType<ContentPackageJson> = z.object({
  dependencies: z.record(z.string(), z.string()).optional(),
  devDependencies: z.record(z.string(), z.string()).optional(),
});

const readContentPackageJson = cache(async (slug: string): Promise<ContentPackageJson> => {
  return (await readJson(join(contentRoot, slug, "package.json"), contentPackageJsonSchema)) ?? {};
});

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
