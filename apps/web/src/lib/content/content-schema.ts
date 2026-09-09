import { z } from "zod";

import { elementSlugs, sourceSlugs } from "./content-categories";

const countIn = (tags: string[], slugs: ReadonlySet<string>) =>
  tags.filter((tag) => slugs.has(tag)).length;

// Gallery axes are single-valued so counts and filters stay exact.
const tagsSchema = z
  .array(z.string())
  .refine((tags) => countIn(tags, elementSlugs) === 1, {
    message: `tags must contain exactly one element tag: ${[...elementSlugs].join(", ")}`,
  })
  .refine((tags) => countIn(tags, sourceSlugs) === 1, {
    message: `tags must contain exactly one source tag: ${[...sourceSlugs].join(", ")}`,
  });

const linkSchema = z.object({ label: z.string().min(1), url: z.url() });
const linkedPersonSchema = z.object({
  name: z.string().min(1),
  url: z.url(),
  avatarUrl: z.url().optional(),
});
const metadataFields = {
  name: z.string(),
  description: z.string().optional(),
  addedAt: z.iso.date(),
  featured: z.boolean().optional(),
  defaultSize: z.enum(["full", "md", "sm"]).optional(),
  coverUrl: z.string().optional(),
  coverType: z.enum(["image", "video"]).optional(),
  category: z.enum(["marketing", "application", "mobile"]).optional(),
  tags: tagsSchema,
  authors: z.array(linkedPersonSchema).optional(),
  inspiredBy: z.array(linkSchema).optional(),
  requestedBy: linkedPersonSchema.optional(),
};

export const contentMetaSchema = z.discriminatedUnion("type", [
  z.object({ ...metadataFields, type: z.literal("local").default("local") }),
  z.object({
    ...metadataFields,
    type: z.literal("remote"),
    iframeUrl: z.string().min(1),
    sourceUrl: z.string().min(1),
  }),
]);

export type ContentComponentSummary = z.infer<typeof contentMetaSchema> & { slug: string };
export type LocalContentComponentSummary = Extract<ContentComponentSummary, { type: "local" }>;
export type DefaultSize = NonNullable<ContentComponentSummary["defaultSize"]>;
export type SourceFile = { path: string; code: string };

export const contentPackageSchema = z.object({
  dependencies: z.record(z.string(), z.string()).optional(),
  devDependencies: z.record(z.string(), z.string()).optional(),
  peerDependencies: z.record(z.string(), z.string()).optional(),
});
