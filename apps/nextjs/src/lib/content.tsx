import type { ContentComponent } from "./content-components";
import { contentComponents, contentComponentSlugs } from "./content-components";

export type { ContentComponent };

export const getContentComponents = (
  filterTags?: string[],
): Record<string, ContentComponent> => {
  const filtered: Record<string, ContentComponent> = {};

  for (const slug of contentComponentSlugs) {
    const component = contentComponents[slug as keyof typeof contentComponents];
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
};

export const getContentComponent = (slug: string): ContentComponent => {
  const component = contentComponents[slug];

  if (!component) {
    throw new Error(`Content component not found: ${slug}`);
  }

  return component;
};

export const getContentComponentPackage = (slug: string) => {
  const contentComponent = getContentComponent(slug);

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
};
