import { z } from "zod";

// GitHub's own issue-attachment store, the same one the web uploader and
// `gh --attach` use. Requires write access on the repository the asset targets.
export const REQUESTS_REPO_ID = 329844766;
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
  "image/png": "image",
  "image/jpeg": "image",
  "image/gif": "image",
  "image/webp": "image",
  "video/mp4": "video",
  "video/quicktime": "video",
  "video/webm": "video",
} satisfies Record<AttachmentType, "image" | "video">;

export const attachmentMetaSchema = z.object({
  name: z.string().trim().min(1).max(200),
  type: z.enum(ATTACHMENT_TYPE_LIST),
  size: z.number().int().positive().max(ATTACHMENT_MAX_BYTES),
});

export type AttachmentMeta = z.infer<typeof attachmentMetaSchema>;

const uploadedAssetSchema = z.object({ url: z.string().startsWith(ATTACHMENT_URL_PREFIX) });

export class AttachmentUploadError extends Error {
  constructor(
    message: string,
    readonly status: 503 | 500,
  ) {
    super(message);
  }
}

const unavailable = (message: string) => new AttachmentUploadError(message, 503);

export const uploadAttachment = async (
  meta: AttachmentMeta,
  body: Blob,
  send: typeof fetch = fetch,
): Promise<string> => {
  const token = process.env.GITHUB_ISSUES_TOKEN;
  if (!token) throw unavailable("Attachments are temporarily unavailable. Add a link instead.");

  const url = new URL("https://uploads.github.com/user-attachments/assets");
  url.searchParams.set("name", meta.name);
  url.searchParams.set("content_type", meta.type);
  url.searchParams.set("repository_id", String(REQUESTS_REPO_ID));

  let response: Response;
  try {
    response = await send(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/octet-stream",
        Accept: "application/vnd.github+json",
      },
      body,
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    console.error("Attachment upload failed", error);
    throw unavailable("Unable to upload the file. Try again or add a link instead.");
  }
  if (!response.ok) {
    console.error("Attachment upload failed", response.status, await response.text());
    throw unavailable("Unable to upload the file. Try again or add a link instead.");
  }

  const parsed = uploadedAssetSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new AttachmentUploadError("GitHub returned an unexpected response.", 500);
  }
  return parsed.data.url;
};
