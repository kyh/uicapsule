import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { cache } from "react";
import { z } from "zod";

import { contentMetaSchema, contentPackageSchema } from "./content-schema";

import type {
  ContentComponentSummary,
  LocalContentComponentSummary,
  SourceFile,
} from "./content-schema";

const contentRoot = resolve(process.cwd(), "..", "..", "content");

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

export const readSourceFiles = async (
  component: LocalContentComponentSummary,
): Promise<SourceFile[]> => {
  const root = join(contentRoot, component.slug);
  const files: SourceFile[] = [];

  const walk = async (dir: string) => {
    const entries = await readdir(dir, { withFileTypes: true });
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
  return files.toSorted((a, b) => a.path.localeCompare(b.path));
};

export const readContentIndex = cache(async (): Promise<ContentComponentSummary[]> => {
  const entries = await readdir(contentRoot, { withFileTypes: true });
  const slugs = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .toSorted();

  const components = await Promise.all(
    slugs.map(async (slug): Promise<ContentComponentSummary | null> => {
      const meta = await readJson(join(contentRoot, slug, "meta.json"), contentMetaSchema);
      if (!meta) return null;
      if (meta.type === "local") {
        const preview = await stat(join(contentRoot, slug, "preview.tsx")).catch(() => null);
        if (!preview?.isFile()) return null;
      }
      return Object.assign(meta, { slug });
    }),
  );

  return components
    .filter((component) => component !== null)
    .toSorted((a, b) => b.addedAt.localeCompare(a.addedAt) || a.slug.localeCompare(b.slug));
});

export const readContentBySlug = async (slug: string): Promise<ContentComponentSummary | null> => {
  const all = await readContentIndex();
  return all.find((component) => component.slug === slug) ?? null;
};

export const buildShadcnRegistryItem = async (component: LocalContentComponentSummary) => {
  const [pkg, sourceFiles] = await Promise.all([
    readJson(join(contentRoot, component.slug, "package.json"), contentPackageSchema),
    readSourceFiles(component),
  ]);
  const dependencies = [
    ...new Set([
      ...Object.keys(pkg?.dependencies ?? {}),
      ...Object.keys(pkg?.peerDependencies ?? {}),
    ]),
  ].filter((dependency) => dependency !== "react" && dependency !== "react-dom");
  const devDependencies = Object.keys(pkg?.devDependencies ?? {}).filter(
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
    files: sourceFiles.map(({ path, code }) => ({
      type: "registry:file" as const,
      path,
      content: code,
      target: `uicapsule/${component.slug}${path}`,
    })),
  };
};
