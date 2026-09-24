import { buildSitemapEntries } from "@/lib/agent/sitemap-entries";
import { getAllContent } from "@/lib/content-data";

import type { MetadataRoute } from "next";

/**
 * Every indexable URL. Unlisted components are included: `unlisted` hides a
 * component from the grid and the scroll feed, not from the web — its
 * `/ui/<slug>` page is public, linkable and installable.
 */
const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const components = await getAllContent();

  return buildSitemapEntries(
    components.map((component) => ({ addedAt: component.addedAt, slug: component.slug })),
  );
};

export default sitemap;
