import { cacheLife } from "next/cache";

import { buildShadcnRegistryItem, readContentBySlug, readContentIndex } from "./content/content-fs";
import { isLocalContentComponent } from "./content/content-schema";

import type {
  ContentComponent,
  ContentComponentSummary,
  SourceFile,
} from "./content/content-schema";

// Content ships with the deployment and only changes on redeploy. `use cache`
// keys include the build ID, so "max" can never serve a previous deploy's
// content — it just avoids re-reading the content tree on every request.

const toSummary = (component: ContentComponent): ContentComponentSummary => {
  if (component.type === "remote") return component;
  const { sourceFiles: _sourceFiles, ...summary } = component;
  return summary;
};

export const getFeedList = async (): Promise<ContentComponentSummary[]> => {
  "use cache";
  cacheLife("max");
  const all = await readContentIndex();
  return all.map(toSummary);
};

export const getContentList = async (filterTags: string[]): Promise<ContentComponentSummary[]> => {
  "use cache";
  cacheLife("max");
  const all = await getFeedList();

  if (filterTags.length === 0) return all;

  const normalizedFilters = filterTags.map((tag) => tag.trim().toLowerCase()).filter(Boolean);
  return all.filter((component) => {
    const tags = component.tags ?? [];
    return normalizedFilters.some((filter) => tags.includes(filter));
  });
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
  const all = await getFeedList();
  return all.map((component) => ({
    slug: component.slug,
    name: component.name,
    description: component.description ?? "",
    tags: component.tags ?? [],
  }));
};

export const getSourceFiles = async (slug: string): Promise<SourceFile[] | null> => {
  "use cache";
  cacheLife("max");
  const component = await readContentBySlug(slug);
  if (!component || !isLocalContentComponent(component)) return null;
  return component.sourceFiles;
};

export const getShadcnRegistry = async () => {
  "use cache";
  cacheLife("max");
  const locals = (await readContentIndex()).filter(isLocalContentComponent);

  const items = await Promise.all(
    locals.map(async (component) => {
      const item = await buildShadcnRegistryItem(component);
      return {
        ...item,
        files: item.files.map(({ content: _content, ...rest }) => rest),
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
  if (!component || !isLocalContentComponent(component)) return null;
  return buildShadcnRegistryItem(component);
};
