import "server-only";
import { put } from "@vercel/blob";

import { auth } from "../auth/auth";
import { blobToken } from "./ugc-publish";
import { verifyUploadGrant } from "./ugc-upload-token";

const answer = (status: number, message: string) =>
  Response.json({ error: message }, { headers: { "Cache-Control": "no-store" }, status });

const readBody = async (request: Request, limit: number) => {
  const chunks: Uint8Array[] = [];
  let size = 0;

  if (!request.body) {
    return Buffer.alloc(0);
  }

  for await (const chunk of request.body) {
    size += chunk.byteLength;

    if (size > limit) {
      return null;
    }

    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
};

/**
 * Receives one file a signed upload URL grants: the token names the Blob key, type and most
 * bytes, so the uploader needs no session, and a file once written is never replaced.
 */
export const receiveUpload = async (request: Request) => {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const { secret } = await auth.$context;
  const grant = verifyUploadGrant(token, secret);

  if (!grant) {
    return answer(403, "This upload URL is invalid or has expired. Ask for new upload URLs.");
  }

  if (Number(request.headers.get("content-length") ?? 0) > grant.size) {
    return answer(413, `This file may be at most ${grant.size} bytes.`);
  }

  const body = await readBody(request, grant.size);

  if (!body) {
    return answer(413, `This file may be at most ${grant.size} bytes.`);
  }

  try {
    await put(grant.pathname, body, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: false,
      cacheControlMaxAge: 31_536_000,
      contentType: grant.contentType,
      token: blobToken(),
    });
  } catch (error) {
    if (error instanceof Error && /already exists/iu.test(error.message)) {
      return answer(409, "This file is already uploaded. A build never changes once written.");
    }

    throw error;
  }

  return new Response(null, { status: 204 });
};
