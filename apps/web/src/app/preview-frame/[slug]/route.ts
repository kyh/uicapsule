import type { NextRequest } from "next/server";

import { getAllContent, getLocalSlugs, getUgcPreview } from "@/lib/content/content-data";
import {
  previewAssetPath,
  previewShellHeaders,
  renderPreviewShell,
  ugcShellHeaders,
} from "@/lib/content/preview-shell";
import { parseUgcSlug } from "@/lib/content/ugc-preview";

export const generateStaticParams = async () => {
  const slugs = await getLocalSlugs();

  return slugs.map((slug) => ({ slug }));
};

const notFound = () =>
  new Response("Not found", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
    status: 404,
  });

const ugcShell = async (slug: string) => {
  const safeSlug = parseUgcSlug(slug);
  const preview = safeSlug ? await getUgcPreview(safeSlug) : null;

  if (!preview) {
    return notFound();
  }

  return new Response(renderPreviewShell(preview), { headers: ugcShellHeaders(preview.origin) });
};

export const GET = async (_: NextRequest, { params }: RouteContext<"/preview-frame/[slug]">) => {
  const { slug } = await params;
  const all = await getAllContent();
  const entry = all.find((component) => component.slug === slug);

  if (!entry) {
    return await ugcShell(slug);
  }

  if (entry.type !== "local") {
    return notFound();
  }

  return new Response(renderPreviewShell({ base: previewAssetPath(slug), name: entry.name }), {
    headers: previewShellHeaders,
  });
};
