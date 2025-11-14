import { z } from "zod";

import type { contentComponent } from "@repo/db/drizzle-schema";

// Content component types
export type ContentComponentBase = {
  slug: string;
  type: "local" | "remote";
  name: string;
  description?: string;
  defaultSize?: "full" | "md" | "sm";
  coverUrl?: string;
  coverType?: "image" | "video";
  category?: "marketing" | "application" | "mobile";
  tags?: string[];
  authors?: { name: string; url: string; avatarUrl: string }[];
  asSeenOn?: { name: string; url: string; avatarUrl: string }[];
  previousSlug?: string;
  nextSlug?: string;
};

export type LocalContentComponent = ContentComponentBase & {
  type: "local";
  previewCode: string;
  sourceCode: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

export type RemoteContentComponent = ContentComponentBase & {
  type: "remote";
  iframeUrl: string;
  sourceUrl: string;
};

export type ContentComponent = LocalContentComponent | RemoteContentComponent;

export const isLocalContentComponent = (
  component: ContentComponent,
): component is LocalContentComponent => component.type === "local";

export const isRemoteContentComponent = (
  component: ContentComponent,
): component is RemoteContentComponent => component.type === "remote";

export const getContentComponentInput = z.object({
  slug: z.string(),
});
export type GetContentComponentInput = z.infer<typeof getContentComponentInput>;

export const getContentComponentsInput = z
  .object({
    filterTags: z.array(z.string()).optional(),
  })
  .optional();
export type GetContentComponentsInput = z.infer<
  typeof getContentComponentsInput
>;

export const searchContentInput = z.object({
  query: z.string().optional(),
  limit: z.number().optional().default(12),
});
export type SearchContentInput = z.infer<typeof searchContentInput>;

// Database row type
export type ContentComponentRow = typeof contentComponent.$inferSelect;

// Validation constants
export const VALID_DEFAULT_SIZES = new Set<ContentComponent["defaultSize"]>([
  "full",
  "md",
  "sm",
]);
export const VALID_COVER_TYPES = new Set<ContentComponent["coverType"]>([
  "image",
  "video",
]);
export const VALID_CATEGORIES = new Set<ContentComponent["category"]>([
  "marketing",
  "application",
  "mobile",
]);

// Helper functions
export const safeParseJson = <T>(value: string | null): T | undefined => {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
};

export const uniq = <T>(items: T[] | undefined): T[] | undefined => {
  if (!items || items.length === 0) return undefined;
  return Array.from(new Set(items));
};

export const normalizeDefaultSize = (
  value: string | null,
): ContentComponent["defaultSize"] =>
  value && VALID_DEFAULT_SIZES.has(value as ContentComponent["defaultSize"])
    ? (value as ContentComponent["defaultSize"])
    : undefined;

export const normalizeCoverType = (
  value: string | null,
): ContentComponent["coverType"] =>
  value && VALID_COVER_TYPES.has(value as ContentComponent["coverType"])
    ? (value as ContentComponent["coverType"])
    : undefined;

export const normalizeCategory = (
  value: string | null,
): ContentComponent["category"] =>
  value && VALID_CATEGORIES.has(value as ContentComponent["category"])
    ? (value as ContentComponent["category"])
    : undefined;

// Database row to component mapping
export const mapRowToComponent = (
  row: ContentComponentRow,
): ContentComponent => {
  const componentType = row.type === "remote" ? "remote" : "local";

  const tags = uniq(safeParseJson<string[]>(row.tags));
  const authors = safeParseJson<
    { name: string; url: string; avatarUrl: string }[]
  >(row.authors);
  const asSeenOn = safeParseJson<
    { name: string; url: string; avatarUrl: string }[]
  >(row.asSeenOn);

  const base = {
    slug: row.slug,
    type: componentType,
    name: row.name,
    description: row.description ?? undefined,
    defaultSize: normalizeDefaultSize(row.defaultSize),
    coverUrl: row.coverUrl ?? undefined,
    coverType: normalizeCoverType(row.coverType),
    category: normalizeCategory(row.category),
    tags,
    authors: authors && authors.length > 0 ? authors : undefined,
    asSeenOn: asSeenOn && asSeenOn.length > 0 ? asSeenOn : undefined,
    previousSlug: row.previousSlug ?? undefined,
    nextSlug: row.nextSlug ?? undefined,
  } satisfies Partial<ContentComponent>;

  if (componentType === "remote") {
    if (!row.iframeUrl || !row.sourceUrl) {
      throw new Error(
        `Remote content "${row.slug}" is missing iframe/source URLs in the database`,
      );
    }

    return {
      ...base,
      type: "remote",
      iframeUrl: row.iframeUrl,
      sourceUrl: row.sourceUrl,
    } as ContentComponent;
  }

  return {
    ...base,
    type: "local",
    previewCode: row.previewCode ?? "",
    sourceCode: safeParseJson<Record<string, string>>(row.sourceCode) ?? {},
    dependencies: safeParseJson<Record<string, string>>(row.dependencies) ?? {},
    devDependencies:
      safeParseJson<Record<string, string>>(row.devDependencies) ?? {},
  } as ContentComponent;
};

// Shadcn registry helper
export const buildShadcnRegistryItem = (component: LocalContentComponent) => {
  const dependencyKeys = Object.keys(component.dependencies ?? {});
  const devDependencyKeys = Object.keys(component.devDependencies ?? {});

  const uicapsuleDependencies = dependencyKeys.filter((dep) =>
    dep.startsWith("@repo"),
  );

  const dependencies = dependencyKeys.filter(
    (dep) => !["react", "react-dom", ...uicapsuleDependencies].includes(dep),
  );

  const devDependencies = devDependencyKeys.filter(
    (dep) => !["@types/react", "@types/react-dom", "typescript"].includes(dep),
  );

  return {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    homepage: `https://uicapsule.com/ui/${component.slug}`,
    name: component.slug,
    type: "registry:block" as const,
    author: "Kaiyu Hsu <uicapsule@kyh.io>",
    dependencies,
    devDependencies,
    registryDependencies: [],
    files: Object.entries(component.sourceCode).map(
      ([filePath, sourceCode]) => ({
        type: "registry:file" as const,
        path: filePath,
        content: sourceCode,
        target: `uicapsule/${component.slug}${filePath}`,
      }),
    ),
  };
};
