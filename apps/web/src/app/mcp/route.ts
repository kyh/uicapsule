import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

import { componentDetail, searchCatalog, serverInstructions } from "@/lib/agent/mcp-catalog";
import { contentElements, contentStyles } from "@/lib/content/content-categories";
import { getAllContent, getShadcnRegistryItem } from "@/lib/content-data";
import { siteConfig } from "@/lib/site-config";

import type { CatalogEntry, ComponentDetail } from "@/lib/agent/mcp-catalog";

const tagSlugs = [...contentElements, ...contentStyles].map((filter) => filter.slug);

const json = (value: CatalogEntry[] | ComponentDetail | { error: string }) => ({
  content: [{ text: JSON.stringify(value, null, 2), type: "text" as const }],
});

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "search_components",
      {
        annotations: { openWorldHint: false, readOnlyHint: true },
        description: `Search the ${siteConfig.name} catalog by what a component does or looks like. An empty query lists everything, newest first.`,
        inputSchema: z.object({
          limit: z.number().int().min(1).max(100).default(20),
          query: z
            .string()
            .optional()
            .describe('Free text, e.g. "rotary dial" or "ios volume slider"'),
          tags: z
            .array(z.enum(tagSlugs))
            .optional()
            .describe("Only components carrying every one of these tags"),
        }),
        title: "Search components",
      },
      async (input) => json(searchCatalog(await getAllContent(), input)),
    );

    server.registerTool(
      "get_component",
      {
        annotations: { openWorldHint: false, readOnlyHint: true },
        description:
          "Get one component by slug: its install command, npm dependencies, and the full source of every file it ships.",
        inputSchema: z.object({ slug: z.string().describe("Slug from search_components") }),
        title: "Get component",
      },
      async ({ slug }) => {
        const all = await getAllContent();
        const component = all.find((c) => c.slug === slug);
        if (!component) {
          return { ...json({ error: `Component not found: ${slug}` }), isError: true };
        }
        return json(componentDetail(component, await getShadcnRegistryItem(slug)));
      },
    );
  },
  {
    instructions: serverInstructions,
    serverInfo: { name: "uicapsule", version: "1.0.0" },
  },
);

export { handler as GET, handler as POST };
