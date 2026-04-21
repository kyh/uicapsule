import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "../trpc";
import {
  buildShadcnRegistryItem,
  readContentBySlug,
  readContentIndex,
} from "./content-fs";
import {
  getContentComponentInput,
  getContentComponentsInput,
  isLocalContentComponent,
  searchContentInput,
} from "./content-schema";

import type { ContentComponent } from "./content-schema";

type TagSummary = {
  slug: string;
  name: string;
  description: string;
  tags: string[];
};

const toSummary = (component: ContentComponent): TagSummary => ({
  slug: component.slug,
  name: component.name,
  description: component.description ?? "",
  tags: component.tags ?? [],
});

const computeTagCounts = (components: ContentComponent[]): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const component of components) {
    for (const tag of component.tags ?? []) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }
  return counts;
};

export const contentRouter = createTRPCRouter({
  bySlug: publicProcedure.input(getContentComponentInput).query(async ({ input }) => {
    const component = await readContentBySlug(input.slug);
    if (!component) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Component not found: ${input.slug}`,
      });
    }
    return component;
  }),

  list: publicProcedure.input(getContentComponentsInput).query(async ({ input }) => {
    const all = await readContentIndex();
    const filterTags = input?.filterTags;

    if (!filterTags || filterTags.length === 0) {
      return all;
    }

    const normalizedFilters = filterTags.map((tag) => tag.trim().toLowerCase()).filter(Boolean);
    if (normalizedFilters.length === 0) return [];

    return all.filter((component) => {
      const tags = component.tags ?? [];
      return normalizedFilters.some((filter) => tags.includes(filter));
    });
  }),

  search: publicProcedure.input(searchContentInput).query(async ({ input }) => {
    const all = await readContentIndex();
    const { query, limit } = input;
    const normalizedQuery = query?.trim().toLowerCase() ?? "";

    const trending = all.slice(0, 8).map(toSummary);
    const tagCounts = computeTagCounts(all);

    if (!normalizedQuery) {
      return { components: [], tagCounts, trending, totalMatches: 0 };
    }

    const matches = all.filter((component) => {
      const haystacks = [
        component.name,
        component.description ?? "",
        ...(component.tags ?? []),
      ];
      return haystacks.some((field) => field.toLowerCase().includes(normalizedQuery));
    });

    const components = matches.slice(0, limit).map(toSummary);
    return { components, tagCounts, trending, totalMatches: matches.length };
  }),

  shadcnRegistry: publicProcedure.query(async () => {
    const all = await readContentIndex();
    const locals = all.filter(isLocalContentComponent);

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
  }),

  shadcnRegistryItem: publicProcedure
    .input(getContentComponentInput)
    .query(async ({ input }) => {
      const component = await readContentBySlug(input.slug);
      if (!component) {
        throw new TRPCError({ code: "NOT_FOUND", message: `Component not found: ${input.slug}` });
      }
      if (!isLocalContentComponent(component)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Component "${input.slug}" does not support shadcn registry exports.`,
        });
      }
      return buildShadcnRegistryItem(component);
    }),
});
