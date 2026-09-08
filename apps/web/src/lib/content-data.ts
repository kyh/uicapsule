import { cacheLife } from "next/cache";

import { isUnlisted, unlistedTags } from "./content/content-categories";
import {
  buildShadcnRegistryItem,
  readContentBySlug,
  readContentIndex,
  readSourceFiles,
} from "./content/content-fs";

import type { ContentComponentSummary, SourceFile } from "./content/content-schema";

// Content changes only on deploy; cache keys include the build ID.
export const getAllContent = async (): Promise<ContentComponentSummary[]> => {
  "use cache";
  cacheLife("max");
  return await readContentIndex();
};

// Deep-linked unlisted entries lead the otherwise listed feed.
export const getFeedList = async (initialSlug?: string): Promise<ContentComponentSummary[]> => {
  "use cache";
  cacheLife("max");
  const all = await getAllContent();
  const listed = all.filter((component) => !isUnlisted(component.tags));

  const unlistedInitial = all.find(
    (component) => component.slug === initialSlug && isUnlisted(component.tags),
  );
  return unlistedInitial ? [unlistedInitial, ...listed] : listed;
};

export type GalleryEntry = ContentComponentSummary & { isNew: boolean };

const NEW_FOR_DAYS = 30;

// "New" is judged at cache time, like everything else here: it refreshes on deploy.
const markNew = (components: ContentComponentSummary[]): GalleryEntry[] => {
  const newSince = new Date(Date.now() - NEW_FOR_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  return components.map((component) => ({ ...component, isNew: component.addedAt >= newSince }));
};

export const getContentList = async (filterTags: string[]): Promise<GalleryEntry[]> => {
  "use cache";
  cacheLife("max");
  const all = await getAllContent();

  const normalizedFilters = filterTags.map((tag) => tag.trim().toLowerCase()).filter(Boolean);
  if (normalizedFilters.length === 0) {
    return markNew(all.filter((component) => !isUnlisted(component.tags)));
  }

  // OR filters reveal unlisted content only when its unlisted tag is requested.
  const revealsUnlisted = normalizedFilters.some((filter) => unlistedTags.has(filter));

  return markNew(
    all.filter((component) => {
      const tags = component.tags ?? [];
      if (!revealsUnlisted && isUnlisted(tags)) {
        return false;
      }
      return normalizedFilters.some((filter) => tags.includes(filter));
    }),
  );
};

export interface SearchEntry {
  slug: string;
  name: string;
  description: string;
  tags: string[];
  unlisted: boolean;
}

export const getSearchEntries = async (): Promise<SearchEntry[]> => {
  "use cache";
  cacheLife("max");
  const all = await getAllContent();
  return all.map((component) => ({
    description: component.description ?? "",
    name: component.name,
    slug: component.slug,
    tags: component.tags ?? [],
    unlisted: isUnlisted(component.tags),
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
