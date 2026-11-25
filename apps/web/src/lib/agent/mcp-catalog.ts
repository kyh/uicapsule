import { siteConfig } from "@/lib/site-config";

import { absoluteUrl } from "./markdown";

import type { ContentComponentSummary } from "@/lib/content/content-schema";

const installCommand = (slug: string) => `npx shadcn@latest add ${siteConfig.url}/r/${slug}.json`;

export type CatalogEntry = Pick<
  ContentComponentSummary,
  "addedAt" | "description" | "name" | "slug" | "tags"
> & { url: string } & (
    | { installable: true; install: string }
    | { installable: false; sourceUrl: string }
  );

export const catalogEntry = (component: ContentComponentSummary) => {
  const base = {
    addedAt: component.addedAt,
    description: component.description,
    name: component.name,
    slug: component.slug,
    tags: component.tags,
    url: absoluteUrl(`/ui/${component.slug}`),
  };

  return (
    component.type === "local"
      ? { ...base, install: installCommand(component.slug), installable: true }
      : { ...base, installable: false, sourceUrl: component.sourceUrl }
  ) satisfies CatalogEntry;
};

export interface CatalogQuery {
  query?: string;
  tags?: string[];
  limit: number;
}

const tokenScore = (component: ContentComponentSummary, token: string) => {
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
) => {
  const tokens = query.toLowerCase().split(/\s+/u).filter(Boolean);

  const tagged = components.filter((component) =>
    tags.every((tag) => component.tags.includes(tag)),
  );

  if (tokens.length === 0) {
    return tagged.slice(0, limit).map(catalogEntry);
  }

  return tagged
    .flatMap((component) => {
      const score = tokens.reduce((sum, token) => sum + tokenScore(component, token), 0);

      return score > 0 ? [{ component, score }] : [];
    })
    .toSorted((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ component }) => catalogEntry(component));
};

export const serverInstructions = [
  `${siteConfig.name} is ${siteConfig.description.charAt(0).toLowerCase()}${siteConfig.description.slice(1)}. This server does two things. Its skills help you build better UI in any project: motion, gestures, accessibility, typography, color, layout, copy and interface review; list them with skills/list and load the one that fits the task. Its tools serve ${siteConfig.name}'s components: interactive React components with unusual motion (hardware gestures, OS animations, physical mechanisms) that install into a project as starting points. It is not a general UI kit.`,
  "Use search_components to find a component by what it does or looks like, and open a result's url to watch it move before choosing; then get_component for its full source and dependencies.",
  "Installable components come with a shadcn command that writes the files into the project; prefer running it over copying source by hand. Without a components.json, write get_component's files at the same paths and install its dependencies.",
  "Components need React 19 and Tailwind CSS v4; if one renders unstyled, add an @source line for its folder to the stylesheet that imports Tailwind.",
  "Adapt a component's props, content and colours, not its timing, springs or gestures: the motion is what was curated.",
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
) =>
  registry
    ? {
        ...catalogEntry(component),
        dependencies: registry.dependencies,
        devDependencies: registry.devDependencies,
        files: registry.files.map(({ content, path, target }) => ({ content, path, target })),
      }
    : catalogEntry(component);
