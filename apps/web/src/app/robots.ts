import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site-config";

const robots = (): MetadataRoute.Robots => ({
  rules: {
    allow: "/",
    disallow: "/api/",
    userAgent: "*",
  },
  sitemap: `${siteConfig.url}/sitemap.xml`,
});

export default robots;
