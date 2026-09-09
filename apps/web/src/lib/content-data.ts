import { cacheLife } from "next/cache";

import { elementSlugs, styleSlugs } from "./content/content-categories";
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
  return readContentIndex();
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

export type GalleryView = "recent" | "recommended";

export type GalleryFilter = {
  view: GalleryView;
  element?: string;
  styles: string[];
};

const matchesFilter = (component: ContentComponentSummary, filter: GalleryFilter) => {
  const { tags } = component;
  if (filter.view === "recommended" && !component.featured) return false;
  if (filter.element && !tags.includes(filter.element)) return false;
  if (filter.styles.length > 0 && !filter.styles.some((style) => tags.includes(style))) {
    return false;
  }
  return true;
};

const visibleContent = (all: ContentComponentSummary[], filter: GalleryFilter) =>
  all.filter((component) => matchesFilter(component, filter));

export const getContentList = async (filter: GalleryFilter): Promise<GalleryEntry[]> => {
  "use cache";
  cacheLife("max");
  return markNew(visibleContent(await getAllContent(), filter));
};

export type FilterCounts = {
  elements: Record<string, number>;
  styles: Record<string, number>;
};

// Each axis is counted against the other axes' selection so no option leads to an empty gallery.
export const getFilterCounts = async (filter: GalleryFilter): Promise<FilterCounts> => {
  "use cache";
  cacheLife("max");
  const all = await getAllContent();
  const countBy = (
    slugs: ReadonlySet<string>,
    withSlug: (slug: string) => Partial<GalleryFilter>,
  ) =>
    Object.fromEntries(
      [...slugs].map((slug) => [
        slug,
        visibleContent(all, { ...filter, ...withSlug(slug) }).length,
      ]),
    );

  return {
    elements: countBy(elementSlugs, (slug) => ({ element: slug })),
    styles: countBy(styleSlugs, (slug) => ({ styles: [slug] })),
  };
};

export type SearchEntry = {
  slug: string;
  name: string;
  description: string;
  tags: string[];
};

export const getSearchEntries = async (): Promise<SearchEntry[]> => {
  "use cache";
  cacheLife("max");
  const all = await getAllContent();
  return all.map((component) => ({
    slug: component.slug,
    name: component.name,
    description: component.description ?? "",
    tags: component.tags,
  }));
};

export const getSourceFiles = async (slug: string): Promise<SourceFile[] | null> => {
  "use cache";
  cacheLife("max");
  const component = await readContentBySlug(slug);
  if (!component || component.type !== "local") return null;
  return readSourceFiles(component);
};

export const getShadcnRegistry = async () => {
  "use cache";
  cacheLife("max");
  const locals = (await readContentIndex()).filter((component) => component.type === "local");

  const items = await Promise.all(
    locals.map(async (component) => {
      const item = await buildShadcnRegistryItem(component);
      return {
        $schema: item.$schema,
        homepage: item.homepage,
        name: item.name,
        type: item.type,
        author: item.author,
        dependencies: item.dependencies,
        devDependencies: item.devDependencies,
        registryDependencies: item.registryDependencies,
        files: item.files.map(({ type, path, target }) => ({ type, path, target })),
      };
    }),
  );

  return {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: "uicapsule",
    homepage: "https://uicapsule.com",
    items,
  };
};

export const getShadcnRegistryItem = async (slug: string) => {
  "use cache";
  cacheLife("max");
  const component = await readContentBySlug(slug);
  if (!component || component.type !== "local") return null;
  return buildShadcnRegistryItem(component);
};
