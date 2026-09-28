import { siteConfig } from "@/lib/site-config";

import { absoluteUrl } from "./markdown";

import type { ContentComponentSummary } from "@/lib/content/content-schema";

export const installCommand = (slug: string): string =>
  `npx shadcn@latest add ${siteConfig.url}/r/${slug}.json`;

export type CatalogEntry = Pick<
  ContentComponentSummary,
  "addedAt" | "description" | "name" | "slug" | "tags"
> & { url: string } & (
    | { installable: true; install: string }
    | { installable: false; sourceUrl: string }
  );

export const catalogEntry = (component: ContentComponentSummary): CatalogEntry => {
  const base = {
    addedAt: component.addedAt,
    description: component.description,
    name: component.name,
    slug: component.slug,
    tags: component.tags,
    url: absoluteUrl(`/ui/${component.slug}`),
  };
  return component.type === "local"
    ? { ...base, install: installCommand(component.slug), installable: true }
    : { ...base, installable: false, sourceUrl: component.sourceUrl };
};

export interface CatalogQuery {
  query?: string;
  tags?: string[];
  limit: number;
}

// Name hits outrank tag hits outrank description hits, so "slider" surfaces the
// sliders before components that merely mention one.
const tokenScore = (component: ContentComponentSummary, token: string): number => {
  if (component.name.toLowerCase().includes(token) || component.slug.includes(token)) {
    return 3;
  }
  if (component.tags.includes(token)) {
    return 2;
  }
  return component.description.toLowerCase().includes(token) ? 1 : 0;
};

/**
 * Tokens are OR'd and summed rather than AND'd: an agent's query is a
 * description of intent ("rotary dial knob"), and one missing synonym should
 * rank a component lower, not drop it. Ties keep catalog order, newest first.
 */
export const searchCatalog = (
  components: ContentComponentSummary[],
  { query = "", tags = [], limit }: CatalogQuery,
): CatalogEntry[] => {
  const tokens = query.toLowerCase().split(/\s+/u).filter(Boolean);
  const tagged = components.filter((component) =>
    tags.every((tag) => component.tags.includes(tag)),
  );

  if (tokens.length === 0) {
    return tagged.slice(0, limit).map(catalogEntry);
  }

  return tagged
    .map((component) => ({
      component,
      score: tokens.reduce((sum, token) => sum + tokenScore(component, token), 0),
    }))
    .filter(({ score }) => score > 0)
    .toSorted((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ component }) => catalogEntry(component));
};

export const serverInstructions = [
  `${siteConfig.name} is a gallery of interactive React components with unusual motion — hardware gestures, OS animations, physical mechanisms — not a general UI kit.`,
  "Use search_components to find one by what it does or looks like, then get_component for its full source and dependencies.",
  "Installable components come with a shadcn command that writes the files into the project; prefer running it over copying source by hand.",
].join(" ");

export interface RegistryFiles {
  dependencies: string[];
  devDependencies: string[];
  files: { content: string; path: string; target: string }[];
}

export type ComponentDetail = CatalogEntry & Partial<RegistryFiles>;

export const componentDetail = (
  component: ContentComponentSummary,
  registry: RegistryFiles | null,
): ComponentDetail =>
  registry
    ? {
        ...catalogEntry(component),
        dependencies: registry.dependencies,
        devDependencies: registry.devDependencies,
        files: registry.files.map(({ content, path, target }) => ({ content, path, target })),
      }
    : catalogEntry(component);
