import "server-only";
import type { AttachmentMeta } from "@repo/contract/request/attachment-schema";

import { postUserAttachment } from "./github-upload";

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
) => {
  const token = process.env.GITHUB_ISSUES_TOKEN;

  if (token === undefined || token === "") {
    throw unavailable("Attachments are temporarily unavailable. Add a link instead.");
  }

  const result = await postUserAttachment({ body, name: meta.name, send, token, type: meta.type });

  if (result.kind === "uploaded") {
    return result.url;
  }

  console.error("Attachment upload failed", result.cause);

  if (result.kind === "malformed") {
    throw new AttachmentUploadError("GitHub returned an unexpected response.", 500);
  }

  throw unavailable("Unable to upload the file. Try again or add a link instead.");
};
