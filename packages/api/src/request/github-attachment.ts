import "server-only";
import { z } from "zod";

import { ATTACHMENT_URL_PREFIX } from "./attachment";
import type { AttachmentMeta } from "./attachment";

// GitHub's own issue-attachment store, the same one the web uploader and
// `gh --attach` use. Requires write access on the repository the asset targets.
const REQUESTS_REPO_ID = 329_844_766;

const uploadedAssetSchema = z.object({ url: z.string().startsWith(ATTACHMENT_URL_PREFIX) });

export class AttachmentUploadError extends Error {
  readonly status: 503 | 500;

  constructor(message: string, status: 503 | 500) {
    super(message);
    this.name = "AttachmentUploadError";
    this.status = status;
  }
}

const unavailable = (message: string) => new AttachmentUploadError(message, 503);

export const uploadAttachment = async (
  meta: AttachmentMeta,
  body: Blob,
  send: typeof fetch = fetch,
): Promise<string> => {
  const token = process.env.GITHUB_ISSUES_TOKEN;
  if (!token) {
    throw unavailable("Attachments are temporarily unavailable. Add a link instead.");
  }

  const url = new URL("https://uploads.github.com/user-attachments/assets");
  url.searchParams.set("name", meta.name);
  url.searchParams.set("content_type", meta.type);
  url.searchParams.set("repository_id", String(REQUESTS_REPO_ID));

  let response: Response;
  try {
    response = await send(url, {
      body,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/octet-stream",
      },
      method: "POST",
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
