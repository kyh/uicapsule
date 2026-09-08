import { z } from "zod";

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
  defaultSize: z.enum(["full", "md", "sm"]).optional(),
  coverUrl: z.string().optional(),
  coverType: z.enum(["image", "video"]).optional(),
  category: z.enum(["marketing", "application", "mobile"]).optional(),
  tags: z.array(z.string()).optional(),
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
