import { cacheLife } from "next/cache";

import { resolveCover } from "../assets";
import { siteConfig } from "../site-config";
import {
  buildShadcnRegistryItem,
  readContentBySlug,
  readContentIndex,
  readSourceFiles,
} from "./content-fs";
import { readRepoSkill } from "./skills-fs";

export const getAllContent = async () => {
  "use cache";
  cacheLife("max");

  return await readContentIndex();
};

export const getLocalSlugs = async () => {
  const all = await getAllContent();

  return all.filter((c) => c.type === "local").map((c) => c.slug);
};

const NEW_FOR_DAYS = 30;

export const getGalleryCards = async () => {
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

export const getSearchEntries = async () => {
  "use cache";
  cacheLife("max");
  const all = await getAllContent();

  return all.map((component) => ({
    description: component.description,
    name: component.name,
    slug: component.slug,
    tags: component.tags,
  }));
};

export const getSourceFiles = async (slug: string) => {
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
      const { files, ...item } = await buildShadcnRegistryItem(component);

      return {
        ...item,
        files: files.map(({ type, path, target }) => ({ path, target, type })),
      };
    }),
  );

  return {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    homepage: siteConfig.url,
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

export const getRepoSkills = async (names: readonly string[]) => {
  "use cache";
  cacheLife("max");

  return await Promise.all(names.map(readRepoSkill));
};
