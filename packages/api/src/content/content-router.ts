import { asc, eq, like, or, sql } from "@repo/db";
import { contentComponent } from "@repo/db/drizzle-schema";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "../trpc";
import {
  getContentComponentInput,
  getContentComponentsInput,
  isLocalContentComponent,
  mapRowToComponent,
  safeParseJson,
  searchContentInput,
} from "./content-schema";

export const contentRouter = createTRPCRouter({
  bySlug: publicProcedure
    .input(getContentComponentInput)
    .query(async ({ ctx, input }) => {
      const row = await ctx.db.query.contentComponent.findFirst({
        where: eq(contentComponent.slug, input.slug),
      });

      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Component not found: ${input.slug}`,
        });
      }

      return mapRowToComponent(row);
    }),

  list: publicProcedure
    .input(getContentComponentsInput)
    .query(async ({ ctx, input }) => {
      const filterTags = input?.filterTags;

      if (!filterTags || filterTags.length === 0) {
        const rows = await ctx.db.query.contentComponent.findMany({
          orderBy: asc(contentComponent.slug),
        });

        return rows.map(mapRowToComponent);
      }

      const normalizedFilters = filterTags
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean);

      if (normalizedFilters.length === 0) {
        // If all filter tags were empty/whitespace, return no results
        return [];
      }

      // Use SQL JSON functions to filter by tags at database level
      const tagConditions = normalizedFilters.map(
        (tag) =>
          sql`json_extract(${contentComponent.tags}, '$') LIKE ${`%"${tag}"%`}`,
      );

      const rows = await ctx.db.query.contentComponent.findMany({
        where: or(...tagConditions),
        orderBy: asc(contentComponent.slug),
      });

      return rows.map(mapRowToComponent);
    }),

  search: publicProcedure
    .input(searchContentInput)
    .query(async ({ ctx, input }) => {
      const { query, limit } = input;
      const normalizedQuery = query?.trim().toLowerCase();

      if (!normalizedQuery) {
        // Return trending components when no query
        const rows = await ctx.db.query.contentComponent.findMany({
          orderBy: asc(contentComponent.slug),
          limit: 8,
        });

        const trending = rows.map((c) => ({
          slug: c.slug,
          name: c.name,
          description: c.description ?? "",
          tags: safeParseJson<string[]>(c.tags) ?? [],
        }));

        // Get tag counts for all components
        const allRows = await ctx.db.query.contentComponent.findMany({
          orderBy: asc(contentComponent.slug),
        });

        const tagCounts = allRows.reduce(
          (acc, component) => {
            const tags = safeParseJson<string[]>(component.tags) ?? [];
            tags.forEach((tag) => {
              acc[tag] = (acc[tag] ?? 0) + 1;
            });
            return acc;
          },
          {} as Record<string, number>,
        );

        return {
          components: [],
          tagCounts,
          trending,
          totalMatches: 0,
        };
      }

      // Use SQL LIKE for text search across name, description, and tags
      const searchPattern = `%${normalizedQuery}%`;

      const rows = await ctx.db.query.contentComponent.findMany({
        where: or(
          like(contentComponent.name, searchPattern),
          like(contentComponent.description, searchPattern),
          sql`json_extract(${contentComponent.tags}, '$') LIKE ${searchPattern}`,
        ),
        orderBy: asc(contentComponent.slug),
        limit,
      });

      const matchingComponents = rows.map((c) => ({
        slug: c.slug,
        name: c.name,
        description: c.description ?? "",
        tags: safeParseJson<string[]>(c.tags) ?? [],
      }));

      // Get tag counts for all components
      const allRows = await ctx.db.query.contentComponent.findMany({
        orderBy: asc(contentComponent.slug),
      });

      const tagCounts = allRows.reduce(
        (acc, component) => {
          const tags = safeParseJson<string[]>(component.tags) ?? [];
          tags.forEach((tag) => {
            acc[tag] = (acc[tag] ?? 0) + 1;
          });
          return acc;
        },
        {} as Record<string, number>,
      );

      // Get trending components
      const trendingRows = await ctx.db.query.contentComponent.findMany({
        orderBy: asc(contentComponent.slug),
        limit: 8,
      });

      const trending = trendingRows.map((c) => ({
        slug: c.slug,
        name: c.name,
        description: c.description ?? "",
        tags: safeParseJson<string[]>(c.tags) ?? [],
      }));

      return {
        components: matchingComponents,
        tagCounts,
        trending,
        totalMatches: matchingComponents.length,
      };
    }),

  shadcnPackage: publicProcedure
    .input(getContentComponentInput)
    .query(async ({ ctx, input }) => {
      const { slug } = input;
      const row = await ctx.db.query.contentComponent.findFirst({
        where: eq(contentComponent.slug, slug),
      });

      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Component not found: ${slug}`,
        });
      }

      const component = mapRowToComponent(row);

      if (!isLocalContentComponent(component)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Component "${slug}" does not support shadcn registry exports.`,
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
});
