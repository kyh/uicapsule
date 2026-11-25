import type { NextRequest } from "next/server";
import { handleSchema, ugcSlugSchema } from "@repo/contract/ugc/ugc-schema";
import { findPublishedComponent } from "@repo/service/ugc/ugc-store";

import { assetUrl } from "@/lib/assets";
import { previewNotFound, renderPreviewShell, ugcShellHeaders } from "@/lib/content/preview-shell";

const findPreview = async (handle: string, slug: string) => {
  const component = await findPublishedComponent(handle, slug);

  if (!component) {
    return null;
  }

  const base = assetUrl(component.buildKey);

  return { base, name: component.name, origin: new URL(base).origin };
};

export const GET = async (
  _: NextRequest,
  { params }: RouteContext<"/preview-frame/u/[user]/[slug]">,
) => {
  const { slug, user } = await params;
  const handle = handleSchema.safeParse(user);
  const component = ugcSlugSchema.safeParse(slug);

  const preview =
    handle.success && component.success ? await findPreview(handle.data, component.data) : null;

  if (!preview) {
    return previewNotFound();
  }

  return new Response(renderPreviewShell(preview), { headers: ugcShellHeaders(preview.origin) });
};
