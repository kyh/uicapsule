import type { InferSelectModel } from "drizzle-orm";
import { or, sql } from "@repo/db";
import { contentComponent } from "@repo/db/drizzle-schema";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "../trpc";
import {
  getContentComponentInput,
  getContentComponentsInput,
  searchContentInput,
} from "./content-schema";

// Helper function to safely parse JSON strings
function parseJsonString<T>(jsonString: string | null): T | undefined {
  if (!jsonString) return undefined;
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return undefined;
  }
}

type DbContentComponent = InferSelectModel<typeof contentComponent>;

function toContentComponent(component: DbContentComponent) {
  return {
    slug: component.slug,
    name: component.name,
    description: component.description ?? undefined,
    defaultSize: component.defaultSize ?? undefined,
    coverUrl: component.coverUrl ?? undefined,
    coverType: component.coverType as "image" | "video" | undefined,
    category: component.category ?? undefined,
    tags: parseJsonString<string[]>(component.tags),
    authors: parseJsonString<{ name: string; url: string }[]>(
      component.authors,
    ),
    asSeenOn: parseJsonString<{ name: string; url: string }[]>(
      component.asSeenOn,
    ),
    previewCode: component.previewCode,
    sourceCode:
      parseJsonString<Record<string, string>>(component.sourceCode) ?? {},
    dependencies: parseJsonString<Record<string, string>>(
      component.dependencies,
    ),
    devDependencies: parseJsonString<Record<string, string>>(
      component.devDependencies,
    ),
    previousSlug: component.previousSlug ?? undefined,
    nextSlug: component.nextSlug ?? undefined,
  };
}

export const contentRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(getContentComponentsInput)
    .query(async ({ ctx, input }) => {
      const filterTags = input?.filterTags;

      let components;

      if (filterTags && filterTags.length > 0) {
        // Use SQLite's json_each() to query JSON array
        // This checks if any of the filterTags exist in the tags JSON array
        const tagConditions = filterTags.map(
          (tag) =>
            sql`EXISTS (
            SELECT 1 FROM json_each(${contentComponent.tags})
            WHERE json_each.value = ${tag}
          )`,
        );

        // Combine conditions with OR (any tag matches)
        components = await ctx.db
          .select()
          .from(contentComponent)
          .where(or(...tagConditions));
      } else {
        components = await ctx.db.select().from(contentComponent);
      }

      // Parse JSON fields and transform to expected format
      return components.map(toContentComponent);
    }),

  getOne: publicProcedure
    .input(getContentComponentInput)
    .query(async ({ ctx, input }) => {
      const { slug } = input;

      const component = await ctx.db.query.contentComponent.findFirst({
        where: (content, { eq }) => eq(content.slug, slug),
      });

      if (!component) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Component not found: ${slug}`,
        });
      }

      // Parse JSON fields and transform to expected format
      return toContentComponent(component);
    }),

  getShadcnPackage: publicProcedure
    .input(getContentComponentInput)
    .query(async ({ ctx, input }) => {
      const { slug } = input;

      const component = await ctx.db.query.contentComponent.findFirst({
        where: (content, { eq }) => eq(content.slug, slug),
      });

      if (!component) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Component not found: ${slug}`,
        });
      }

      const contentComponent = toContentComponent(component);
      const dependencyKeys = Object.keys(contentComponent.dependencies ?? {});
      const devDependencyKeys = Object.keys(
        contentComponent.devDependencies ?? {},
      );

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
        files: Object.entries(contentComponent.sourceCode).map(
          ([filePath, sourceCode]) => ({
            type: "registry:ui" as const,
            path: filePath,
            content: sourceCode,
            target: `components/ui/uicapsule/${slug}.tsx`,
          }),
        ),
      };
    }),

  search: publicProcedure
    .input(searchContentInput)
    .query(async ({ ctx, input }) => {
      const { query, limit } = input;
      const normalizedQuery = query?.trim().toLowerCase();

      // Get all components
      const components = await ctx.db.select().from(contentComponent);
      const allComponents = components.map(toContentComponent);

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
