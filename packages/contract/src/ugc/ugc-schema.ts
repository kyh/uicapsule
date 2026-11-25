import { z } from "zod";

/** A username as it appears in `/u/<handle>/<slug>`: lowercase letters, digits and inner dashes. */
export const handleSchema = z.string().regex(/^[a-z0-9](?:[a-z0-9-]{1,37}[a-z0-9])$/u, {
  message: "3 to 39 lowercase letters, digits or dashes, not starting or ending with a dash",
});

/** A component's slug, unique per user. */
export const ugcSlugSchema = z.string().regex(/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/u, {
  message: "Up to 64 lowercase letters, digits or dashes, not starting or ending with a dash",
});

/** A build's id: the first 16 hex characters of the SHA-256 of its files, so it names its content. */
export const ugcBuildSchema = z.string().regex(/^[a-f0-9]{16}$/u, {
  message: "16 lowercase hex characters",
});

export const UGC_MAX_FILES = 50;
export const UGC_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const UGC_MAX_BUILD_BYTES = 20 * 1024 * 1024;

/** Every build ships these three; the preview shell loads them by name. */
export const UGC_REQUIRED_FILES = ["index.js", "index.css", "tailwind.css"] as const;

/** Content type each uploadable extension is pinned to, so a build can only hold what a preview loads. */
export const UGC_CONTENT_TYPES = new Map([
  [".avif", "image/avif"],
  [".css", "text/css"],
  [".gif", "image/gif"],
  [".glb", "model/gltf-binary"],
  [".gltf", "model/gltf+json"],
  [".hdr", "image/vnd.radiance"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript"],
  [".mp3", "audio/mpeg"],
  [".mp4", "video/mp4"],
  [".otf", "font/otf"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".ttf", "font/ttf"],
  [".wav", "audio/wav"],
  [".webm", "video/webm"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

const extensionOf = (file: string) => file.slice(file.lastIndexOf("."));

/** The content type a build file is uploaded as, or undefined when its extension is not allowed. */
export const ugcContentType = (file: string) => UGC_CONTENT_TYPES.get(extensionOf(file));

const ugcFileSchema = z.object({
  path: z
    .string()
    .regex(/^(?:index\.js|index\.css|tailwind\.css|assets\/[\w.-]{1,120})$/u, {
      message: "Only index.js, index.css, tailwind.css and assets/<file>",
    })
    .refine((file) => ugcContentType(file) !== undefined, { message: "File type not allowed" }),
  size: z.int().min(0).max(UGC_MAX_FILE_BYTES),
});

export const createUploadSchema = z.object({
  build: ugcBuildSchema,
  files: z
    .array(ugcFileSchema)
    .min(UGC_REQUIRED_FILES.length)
    .max(UGC_MAX_FILES)
    .refine((files) => new Set(files.map((file) => file.path)).size === files.length, {
      message: "Duplicate file paths",
    })
    .refine((files) => UGC_REQUIRED_FILES.every((name) => files.some((f) => f.path === name)), {
      message: `A build must include ${UGC_REQUIRED_FILES.join(", ")}`,
    })
    .refine((files) => files.reduce((total, file) => total + file.size, 0) <= UGC_MAX_BUILD_BYTES, {
      message: "Build is too large",
    }),
  slug: ugcSlugSchema,
});

export type CreateUploadInput = z.infer<typeof createUploadSchema>;

export const publishSchema = z.object({
  build: ugcBuildSchema,
  name: z.string().trim().min(1).max(120),
  slug: ugcSlugSchema,
});

export type PublishInput = z.infer<typeof publishSchema>;

export const prepareSchema = z.object({ slug: ugcSlugSchema });

/** Blob key prefix of one component. Keyed by user id, so a renamed handle never moves files. */
export const ugcSlugKey = (userId: string, slug: string) => `ugc/${userId}/${slug}`;

/** Blob key prefix of one build's entry files. */
export const ugcBuildKey = (userId: string, slug: string, build: string) =>
  `${ugcSlugKey(userId, slug)}/${build}`;

/**
 * Blob key of one build file. Assets sit beside the builds, not inside one: their names carry a
 * content hash, so builds share them, and a bundle can reference them before its build id exists.
 */
export const ugcFileKey = (userId: string, slug: string, build: string, file: string) =>
  file.startsWith("assets/")
    ? `${ugcSlugKey(userId, slug)}/${file}`
    : `${ugcBuildKey(userId, slug, build)}/${file}`;

/** Path of a published component's page and preview frame. */
export const ugcPath = (handle: string, slug: string) => `/u/${handle}/${slug}`;
