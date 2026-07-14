import { cacheLife } from "next/cache";

import { isUnlisted, unlistedTags } from "./content/content-categories";
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

/** Every component, unlisted ones included. Routing and packaging surfaces use
 * this — an unlisted component is hidden, not absent. */
export const getAllContent = async (): Promise<ContentComponentSummary[]> => {
  "use cache";
  cacheLife("max");
  const all = await readContentIndex();
  return all.map(toSummary);
};

/**
 * The scroll feed for `/ui/<slug>`. Unlisted components aren't part of it, but
 * deep-linking one splices it in at the front so the URL still resolves and
 * scrolling carries on into the listed content.
 */
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

export const getContentList = async (filterTags: string[]): Promise<ContentComponentSummary[]> => {
  "use cache";
  cacheLife("max");
  const all = await getAllContent();

  const normalizedFilters = filterTags.map((tag) => tag.trim().toLowerCase()).filter(Boolean);
  if (normalizedFilters.length === 0) {
    return all.filter((component) => !isUnlisted(component.tags));
  }

  // Filters are OR'd, so an unlisted component would otherwise leak in through
  // any tag it happens to share with listed content. It surfaces only when an
  // unlisted tag is one of the things actually being asked for.
  const revealsUnlisted = normalizedFilters.some((filter) => unlistedTags.has(filter));

  return all.filter((component) => {
    const tags = component.tags ?? [];
    if (!revealsUnlisted && isUnlisted(tags)) return false;
    return normalizedFilters.some((filter) => tags.includes(filter));
  });
};

export type SearchEntry = {
  slug: string;
  name: string;
  description: string;
  tags: string[];
  unlisted: boolean;
};

export const getSearchEntries = async (): Promise<SearchEntry[]> => {
  "use cache";
  cacheLife("max");
  const all = await getAllContent();
  return all.map((component) => ({
    slug: component.slug,
    name: component.name,
    description: component.description ?? "",
    tags: component.tags ?? [],
    unlisted: isUnlisted(component.tags),
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
