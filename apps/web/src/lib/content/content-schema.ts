import { z } from "zod";

import { elementSlugs } from "./content-categories";

// The element axis is single-valued so counts and filters stay exact.
const tagsSchema = z
  .array(z.string())
  .refine((tags) => tags.filter((tag) => elementSlugs.has(tag)).length === 1, {
    message: `tags must contain exactly one element tag: ${[...elementSlugs].join(", ")}`,
  });

const linkSchema = z.object({ label: z.string().min(1), url: z.url() });
const linkedPersonSchema = z.object({
  avatarUrl: z.url().optional(),
  name: z.string().min(1),
  url: z.url(),
});
const metadataFields = {
  addedAt: z.iso.date(),
  authors: z.array(linkedPersonSchema).optional(),
  category: z.enum(["marketing", "application", "mobile"]).optional(),
  coverType: z.enum(["image", "video"]).optional(),
  coverUrl: z.string().optional(),
  defaultSize: z.enum(["full", "md", "sm"]).optional(),
  description: z.string().optional(),
  featured: z.boolean().optional(),
  inspiredBy: z.array(linkSchema).optional(),
  name: z.string(),
  requestedBy: linkedPersonSchema.optional(),
  tags: tagsSchema,
};

export const contentMetaSchema = z.discriminatedUnion("type", [
  z.object({ ...metadataFields, type: z.literal("local").default("local") }),
  z.object({
    ...metadataFields,
    iframeUrl: z.string().min(1),
    sourceUrl: z.string().min(1),
    type: z.literal("remote"),
  }),
]);

export type ContentComponentSummary = z.infer<typeof contentMetaSchema> & { slug: string };
export type LocalContentComponentSummary = Extract<ContentComponentSummary, { type: "local" }>;
export type DefaultSize = NonNullable<ContentComponentSummary["defaultSize"]>;
export interface SourceFile {
  path: string;
  code: string;
}

export const contentPackageSchema = z.object({
  dependencies: z.record(z.string(), z.string()).optional(),
  devDependencies: z.record(z.string(), z.string()).optional(),
  peerDependencies: z.record(z.string(), z.string()).optional(),
});
