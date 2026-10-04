import { z } from "zod";

export const ATTACHMENT_URL_PREFIX = "https://github.com/user-attachments/assets/";
export const ATTACHMENT_MAX_COUNT = 3;
// Vercel refuses request bodies over 4.5MB before our code runs; stay under it.
export const ATTACHMENT_MAX_BYTES = 4 * 1024 * 1024;

const ATTACHMENT_TYPE_LIST = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

export type AttachmentType = (typeof ATTACHMENT_TYPE_LIST)[number];

export const ATTACHMENT_TYPES = {
  "image/gif": "image",
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "video/mp4": "video",
  "video/quicktime": "video",
  "video/webm": "video",
} satisfies Record<AttachmentType, "image" | "video">;

export const attachmentMetaSchema = z.object({
  name: z.string().trim().min(1).max(200),
  size: z.number().int().positive().max(ATTACHMENT_MAX_BYTES),
  type: z.enum(ATTACHMENT_TYPE_LIST),
});

export type AttachmentMeta = z.infer<typeof attachmentMetaSchema>;
