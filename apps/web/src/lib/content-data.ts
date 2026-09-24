import { cacheLife } from "next/cache";

import { resolveCover } from "./assets";
import {
  buildShadcnRegistryItem,
  readContentBySlug,
  readContentIndex,
  readSourceFiles,
} from "./content/content-fs";

import type { ContentComponentSummary, SourceFile } from "./content/content-schema";
import type { GalleryCard } from "./content/gallery";

// Content changes only on deploy; cache keys include the build ID.
export const getAllContent = async (): Promise<ContentComponentSummary[]> => {
  "use cache";
  cacheLife("max");
  return await readContentIndex();
};

// Slugs whose source ships in this repo; remote entries only link out.
export const getLocalSlugs = async (): Promise<string[]> => {
  const all = await getAllContent();
  return all.filter((c) => c.type === "local").map((c) => c.slug);
};

const NEW_FOR_DAYS = 30;

// "New" is judged at cache time, like everything else here: it refreshes on deploy.
export const getGalleryCards = async (): Promise<GalleryCard[]> => {
  "use cache";
  cacheLife("max");
  const newSince = new Date(Date.now() - NEW_FOR_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const all = await getAllContent();
  return all.map((component) => ({
    cover: resolveCover(component.cover),
    featured: Boolean(component.featured),
    isNew: component.addedAt >= newSince,
    name: component.name,
    slug: component.slug,
    tags: component.tags,
  }));
};

export interface SearchEntry {
  slug: string;
  name: string;
  description: string;
  tags: string[];
}

export const getSearchEntries = async (): Promise<SearchEntry[]> => {
  "use cache";
  cacheLife("max");
  const all = await getAllContent();
  return all.map((component) => ({
    description: component.description ?? "",
    name: component.name,
    slug: component.slug,
    tags: component.tags,
  }));
};

export const getSourceFiles = async (slug: string): Promise<SourceFile[] | null> => {
  "use cache";
  cacheLife("max");
  const component = await readContentBySlug(slug);
  if (!component || component.type !== "local") {
    return null;
  }
  return readSourceFiles(component);
};

export const getShadcnRegistry = async () => {
  "use cache";
  cacheLife("max");
  const all = await readContentIndex();
  const locals = all.filter((component) => component.type === "local");

  const items = await Promise.all(
    locals.map(async (component) => {
      const item = await buildShadcnRegistryItem(component);
      return {
        $schema: item.$schema,
        author: item.author,
        dependencies: item.dependencies,
        devDependencies: item.devDependencies,
        files: item.files.map(({ type, path, target }) => ({ path, target, type })),
        homepage: item.homepage,
        name: item.name,
        registryDependencies: item.registryDependencies,
        type: item.type,
      };
    }),
  );

  return {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    homepage: "https://uicapsule.com",
    items,
    name: "uicapsule",
  };
};

export const getShadcnRegistryItem = async (slug: string) => {
  "use cache";
  cacheLife("max");
  const component = await readContentBySlug(slug);
  if (!component || component.type !== "local") {
    return null;
  }
  return buildShadcnRegistryItem(component);
};
