import type { NextRequest } from "next/server";

import { getAllContent, getLocalSlugs } from "@/lib/content/content-data";
import {
  previewNotFound,
  previewShellHeaders,
  renderPreviewShell,
} from "@/lib/content/preview-shell";

export const generateStaticParams = async () => {
  const slugs = await getLocalSlugs();

  return slugs.map((slug) => ({ slug }));
};

export const GET = async (_: NextRequest, { params }: RouteContext<"/preview-frame/[slug]">) => {
  const { slug } = await params;
  const all = await getAllContent();
  const component = all.find((entry) => entry.slug === slug && entry.type === "local");

  if (!component) {
    return previewNotFound();
  }

  const dev = process.env.NODE_ENV === "development";

  return new Response(renderPreviewShell({ dev, name: component.name, slug }), {
    headers: previewShellHeaders,
  });
};
