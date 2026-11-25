import type { NextRequest } from "next/server";
import { handleSchema, ugcSlugSchema } from "@repo/contract/ugc/ugc-schema";
import { findPublishedComponent } from "@repo/service/ugc/ugc-store";

import { assetUrl } from "@/lib/assets";
import { previewNotFound, renderUgcShell } from "@/lib/content/preview-shell";

export const GET = async (
  request: NextRequest,
  { params }: RouteContext<"/preview-frame/u/[user]/[slug]">,
) => {
  const { slug, user } = await params;
  const handle = handleSchema.safeParse(user);
  const name = ugcSlugSchema.safeParse(slug);

  const component =
    handle.success && name.success
      ? await findPublishedComponent(handle.data, name.data)
      : undefined;

  if (!component) {
    return previewNotFound();
  }

  const { body, headers } = renderUgcShell({
    entry: assetUrl(component.buildKey),
    name: component.name,
    shellOrigin: request.nextUrl.origin,
  });

  return new Response(body, { headers });
};
