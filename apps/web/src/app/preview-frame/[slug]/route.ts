import type { NextRequest } from "next/server";

import { getAllContent, getLocalSlugs } from "@/lib/content/content-data";
import { previewShellHeaders, renderPreviewShell } from "@/lib/content/preview-shell";

export const generateStaticParams = async () => {
  const slugs = await getLocalSlugs();

  return slugs.map((slug) => ({ slug }));
};

export const GET = async (_: NextRequest, { params }: RouteContext<"/preview-frame/[slug]">) => {
  const { slug } = await params;
  const all = await getAllContent();
  const component = all.find((entry) => entry.slug === slug && entry.type === "local");

  if (!component) {
    return new Response("Not found", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
      status: 404,
    });
  }

  return new Response(renderPreviewShell({ name: component.name, slug }), {
    headers: previewShellHeaders,
  });
};
