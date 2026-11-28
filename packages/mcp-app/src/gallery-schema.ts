import { z } from "zod";

/** Versioned: a breaking change to the view or its data ships under a new URI. */
export const GALLERY_RESOURCE_URI = "ui://uicapsule/gallery-v1.html";

const coverSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("image"), url: z.url() }),
  z.object({ poster: z.url(), type: z.literal("video"), url: z.url() }),
]);

const entryFields = {
  cover: coverSchema.optional(),
  description: z.string(),
  name: z.string(),
  slug: z.string(),
  tags: z.array(z.string()),
  url: z.url(),
};

export const galleryEntrySchema = z.discriminatedUnion("installable", [
  z.looseObject({ ...entryFields, install: z.string(), installable: z.literal(true) }),
  z.looseObject({ ...entryFields, installable: z.literal(false), sourceUrl: z.string() }),
]);

/** `search_components`' structured result: what the model reads and the gallery view renders. */
export const galleryResultSchema = z.looseObject({ components: z.array(galleryEntrySchema) });

/** The arguments `search_components` was called with, as far as the view needs them. */
export const searchArgumentsSchema = z.looseObject({ query: z.string().optional() });

export type GalleryCover = z.infer<typeof coverSchema>;

export type GalleryEntry = z.infer<typeof galleryEntrySchema>;

export type GalleryResult = z.infer<typeof galleryResultSchema>;
