import type { NextRequest } from "next/server";
import {
  attachmentMetaSchema,
  AttachmentUploadError,
  uploadAttachment,
} from "@repo/api/request/github-attachment";

// Multipart upload proxied to GitHub's attachment store. Same-origin only, like /api/orpc.
export const POST = async (req: NextRequest) => {
  const origin = req.headers.get("origin");
  if (origin !== null && origin !== new URL(req.url).origin) {
    return new Response("Cross-origin request blocked.", { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ message: "No file." }, { status: 400 });

  const meta = attachmentMetaSchema.safeParse({
    name: file.name,
    type: file.type,
    size: file.size,
  });
  if (!meta.success) {
    return Response.json({ message: "Unsupported file type or size." }, { status: 400 });
  }

  try {
    return Response.json({ url: await uploadAttachment(meta.data, file) });
  } catch (error) {
    if (error instanceof AttachmentUploadError) {
      return Response.json({ message: error.message }, { status: error.status });
    }
    throw error;
  }
};
