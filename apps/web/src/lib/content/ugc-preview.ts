import * as z from "zod/mini";

/** Blob key prefix every user-published preview lives under. */
export const UGC_PREFIX = "ugc";

const slugSchema = z.string().check(z.regex(/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/u));

/** `ugc/<slug>/manifest.json`: the one mutable key, pointing at the slug's current immutable build. */
export const ugcManifestSchema = z.object({
  build: z.string().check(z.regex(/^[a-f0-9]{16}$/u)),
  name: z.string().check(z.minLength(1), z.maxLength(120)),
  version: z.literal(1),
});

export type UgcManifest = z.infer<typeof ugcManifestSchema>;

/** The slug, if it is safe to use as a Blob key segment; null otherwise. */
export const parseUgcSlug = (slug: string) => {
  const parsed = slugSchema.safeParse(slug);

  return parsed.success ? parsed.data : null;
};

/** A manifest's JSON text, parsed, or null when it is malformed. */
export const parseUgcManifest = (source: string) => {
  try {
    const parsed = ugcManifestSchema.safeParse(JSON.parse(source));

    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};

export const ugcManifestKey = (slug: string) => `${UGC_PREFIX}/${slug}/manifest.json`;

/** Key prefix of one build's files: `index.js`, `index.css`, `tailwind.css`, `assets/*`. */
export const ugcBuildKey = (slug: string, build: string) => `${UGC_PREFIX}/${slug}/${build}`;
