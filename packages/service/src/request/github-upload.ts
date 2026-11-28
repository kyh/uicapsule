import { ATTACHMENT_URL_PREFIX } from "@repo/contract/request/attachment-schema";
import { z } from "zod";

const REQUESTS_REPO_ID = 329_844_766;

const uploadedAssetSchema = z.object({ url: z.string().startsWith(ATTACHMENT_URL_PREFIX) });

/**
 * Posts a file to GitHub's user-attachments store for this repository, the store a pasted file in
 * an issue or pull request uses. Free of `server-only` so the request builder agent can call it.
 */
export const postUserAttachment = async (input: {
  readonly body: Blob;
  readonly name: string;
  readonly send?: typeof fetch;
  readonly token: string;
  readonly type: string;
}) => {
  const url = new URL("https://uploads.github.com/user-attachments/assets");
  url.searchParams.set("name", input.name);
  url.searchParams.set("content_type", input.type);
  url.searchParams.set("repository_id", String(REQUESTS_REPO_ID));

  const send = input.send ?? fetch;

  let response: Response;

  try {
    response = await send(url, {
      body: input.body,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${input.token}`,
        "Content-Type": "application/octet-stream",
      },
      method: "POST",
      signal: AbortSignal.timeout(60_000),
    });
  } catch (error) {
    return { cause: error, kind: "unreachable" } as const;
  }

  if (!response.ok) {
    return { cause: `${response.status} ${await response.text()}`, kind: "rejected" } as const;
  }

  const parsed = uploadedAssetSchema.safeParse(await response.json());

  return parsed.success
    ? ({ kind: "uploaded", url: parsed.data.url } as const)
    : ({ cause: parsed.error, kind: "malformed" } as const);
};
