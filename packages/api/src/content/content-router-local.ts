import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "../trpc";
import { getAllContentComponents, getContentComponent } from "./content-data";
import {
  buildShadcnRegistryItem,
  getContentComponentInput,
  getContentComponentsInput,
  isLocalContentComponent,
  searchContentInput,
} from "./content-schema";

export const contentRouter = createTRPCRouter({
  bySlug: publicProcedure.input(getContentComponentInput).query(({ input }) => {
    const component = getContentComponent(input.slug);

    if (!component) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Component not found: ${input.slug}`,
      });
    }

    return component;
  }),

  list: publicProcedure.input(getContentComponentsInput).query(({ input }) => {
    const filterTags = input?.filterTags;

    if (!filterTags || filterTags.length === 0) {
      return getAllContentComponents();
    }

    const normalizedFilters = filterTags
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);

    if (normalizedFilters.length === 0) {
      // If all filter tags were empty/whitespace, return no results
      return [];
    }

    // Filter components that have any of the filter tags
    return getAllContentComponents(normalizedFilters);
  }),

  search: publicProcedure.input(searchContentInput).query(({ input }) => {
    const { query, limit } = input;
    const normalizedQuery = query?.trim().toLowerCase();

    const allComponents = getAllContentComponents();

    // Calculate tag counts for all components
    const tagCounts = allComponents.reduce(
      (acc, component) => {
        const tags = component.tags ?? [];
        tags.forEach((tag) => {
          acc[tag] = (acc[tag] ?? 0) + 1;
        });
        return acc;
      },
      {} as Record<string, number>,
    );

    // Get trending components (first 8)
    const trending = allComponents.slice(0, 8).map((c) => ({
      slug: c.slug,
      name: c.name,
      description: c.description ?? "",
      tags: c.tags ?? [],
    }));

    if (!normalizedQuery) {
      // Return trending components when no query
      return {
        components: [],
        tagCounts,
        trending,
        totalMatches: 0,
      };
    }

    // Filter components by search query (name, description, or tags)
    const matchingComponents = allComponents
      .filter((component) => {
        const nameMatch = component.name
          .toLowerCase()
          .includes(normalizedQuery);
        const descriptionMatch = component.description
          ?.toLowerCase()
          .includes(normalizedQuery);
        const tagsMatch = component.tags?.some((tag) =>
          tag.toLowerCase().includes(normalizedQuery),
        );

        return nameMatch || descriptionMatch || tagsMatch;
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

  shadcnRegistry: publicProcedure.query(() => {
    const components = getAllContentComponents();
    const localComponents = components.filter(isLocalContentComponent);

    // Build registry items using the same helper as shadcnRegistryItem
    const items = localComponents.map((component) => {
      const item = buildShadcnRegistryItem(component);
      // Remove content from files for registry index
      return {
        ...item,
        files: item.files.map(({ content: _content, ...file }) => file),
      };
    });

    return {
      $schema: "https://ui.shadcn.com/schema/registry.json",
      name: "uicapsule",
      homepage: "https://uicapsule.com",
      items,
    };
  }),

  shadcnRegistryItem: publicProcedure
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

      if (!isLocalContentComponent(component)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Component "${slug}" does not support shadcn registry exports.`,
        });
      }

      return buildShadcnRegistryItem(component);
    }),
});
