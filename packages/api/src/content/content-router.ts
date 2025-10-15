import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "../trpc";
import { contentComponents, getContentComponent } from "./content-data";
import { getContentComponentInput, searchContentInput } from "./content-schema";

export const contentRouter = createTRPCRouter({
  getShadcnPackage: publicProcedure
    .input(getContentComponentInput)
    .query(({ input }) => {
      const { slug } = input;
      const component = getContentComponent(slug);

      if (!component) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Component not found: ${slug}`,
        });
      }

      const dependencyKeys = Object.keys(component.dependencies ?? {});
      const devDependencyKeys = Object.keys(component.devDependencies ?? {});

      const uicapsuleDependencies = dependencyKeys.filter(
        (dep) => dep.startsWith("@repo") && dep !== "@repo/shadcn-ui",
      );

      const dependencies = dependencyKeys.filter(
        (dep) =>
          !["react", "react-dom", ...uicapsuleDependencies].includes(dep),
      );

      const devDependencies = devDependencyKeys.filter(
        (dep) =>
          !["@types/react", "@types/react-dom", "typescript"].includes(dep),
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
        files: Object.entries(component.sourceCode).map(
          ([filePath, sourceCode]) => ({
            type: "registry:ui" as const,
            path: filePath,
            content: sourceCode,
            target: `components/ui/uicapsule/${slug}.tsx`,
          }),
        ),
      };
    }),

  search: publicProcedure.input(searchContentInput).query(({ input }) => {
    const { query, limit } = input;
    const normalizedQuery = query?.trim().toLowerCase();

    // Get all components
    const allComponents = Object.values(contentComponents);

    // Calculate tag counts for browse views
    const tagCounts = allComponents.reduce(
      (acc, component) => {
        (component.tags ?? []).forEach((tag) => {
          acc[tag] = (acc[tag] ?? 0) + 1;
        });
        return acc;
      },
      {} as Record<string, number>,
    );

    // Get trending (first 8 components)
    const trending = allComponents.slice(0, 8).map((c) => ({
      slug: c.slug,
      name: c.name,
      description: c.description ?? "",
      tags: c.tags ?? [],
    }));

    // If no query, return browse data only
    if (!normalizedQuery) {
      return {
        components: [],
        tagCounts,
        trending,
        totalMatches: 0,
      };
    }

    // Perform search
    const matchingComponents = allComponents
      .filter((component) => {
        const inName = component.name.toLowerCase().includes(normalizedQuery);
        const inDescription = (component.description ?? "")
          .toLowerCase()
          .includes(normalizedQuery);
        const inTags = (component.tags ?? []).some((tag) =>
          tag.toLowerCase().includes(normalizedQuery),
        );
        return inName || inDescription || inTags;
      })
      .slice(0, limit)
      .map((c) => ({
        slug: c.slug,
        name: c.name,
        description: c.description ?? "",
        tags: c.tags ?? [],
      }));

    return {
      components: matchingComponents,
      tagCounts,
      trending,
      totalMatches: matchingComponents.length,
    };
  }),
});
