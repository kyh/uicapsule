import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { sharePages } from "@/lib/agent/site-pages";
import { getAllContent } from "@/lib/content-data";
import { readStill, renderShareCard } from "@/lib/og/share-card";
import { coverMediaFor } from "@/lib/social-video";

/**
 * `/card<path>`: the share card for the page at `<path>`, named in its
 * og:image / twitter:image by `shareCardImage`. Every card prerenders: one per
 * page in `sharePages` and one per component. The home page keeps /og.jpg.
 */

export const generateStaticParams = async () => {
  const components = await getAllContent();
  return [
    ...sharePages.map((page) => ({ path: page.path.split("/").filter(Boolean) })),
    ...components.map((component) => ({ path: ["ui", component.slug] })),
  ];
};

const cardFor = async (pagePath: string) => {
  const page = sharePages.find((candidate) => candidate.path === pagePath);
  if (page) {
    return renderShareCard(page);
  }
  const components = await getAllContent();
  const component = components.find((candidate) => `/ui/${candidate.slug}` === pagePath);
  if (!component) {
    return null;
  }
  const media = coverMediaFor(component);
  return renderShareCard({
    description: component.description,
    path: pagePath,
    still: media ? await readStill(media.still) : undefined,
    title: component.name,
  });
};

export const GET = async (_: NextRequest, { params }: RouteContext<"/card/[...path]">) => {
  const { path } = await params;
  const card = await cardFor(`/${path.join("/")}`);
  return card ?? NextResponse.json({ error: "No share card for this path" }, { status: 404 });
};
