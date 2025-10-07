import { cache } from "react";

import type { ContentComponent } from "./content-components";
import { contentComponents, contentComponentSlugs } from "./content-components";

const loadContentComponents = cache(async () => contentComponents);

export type { ContentComponent };

export const getContentComponents = cache(
  async (filterTags?: string[]): Promise<Record<string, ContentComponent>> => {
    const all = await loadContentComponents();
    const filtered: Record<string, ContentComponent> = {};

    for (const slug of contentComponentSlugs) {
      const component = all[slug as keyof typeof all];
      if (!component) {
        continue;
      }

      if (
        filterTags &&
        filterTags.length > 0 &&
        !filterTags.some((tag) => component.tags?.includes(tag))
      ) {
        continue;
      }

      filtered[component.slug] = component;
    }

    return filtered;
  },
);

export const getContentComponent = cache(
  async (slug: string): Promise<ContentComponent> => {
    const all = await loadContentComponents();
    const component = all[slug];

    if (!component) {
      throw new Error(`Content component not found: ${slug}`);
    }

    return component;
  },
);

export const getContentComponentPackage = cache(async (slug: string) => {
  const contentComponent = await getContentComponent(slug);

  const dependencyKeys = Object.keys(contentComponent.dependencies ?? {});
  const devDependencyKeys = Object.keys(contentComponent.devDependencies ?? {});

  const uicapsuleDependencies = dependencyKeys.filter(
    (dep) => dep.startsWith("@repo") && dep !== "@repo/shadcn-ui",
  );

  const dependencies = dependencyKeys.filter(
    (dep) => !["react", "react-dom", ...uicapsuleDependencies].includes(dep),
  );

  const devDependencies = devDependencyKeys.filter(
    (dep) => !["@types/react", "@types/react-dom", "typescript"].includes(dep),
  );

  return {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    homepage: `https://uicapsule.com/ui/${slug}`,
    name: slug,
    type: "registry:ui",
    author: "Kaiyu Hsu <uicapsule@kyh.io>",
    dependencies,
    devDependencies,
    registryDependencies: [],
    files: Object.entries(contentComponent.sourceCode).map(
      ([filePath, sourceCode]) => ({
        type: "registry:ui" as const,
        path: filePath,
        content: sourceCode,
        target: `components/ui/uicapsule/${slug}.tsx`,
      }),
    ),
  };
});
