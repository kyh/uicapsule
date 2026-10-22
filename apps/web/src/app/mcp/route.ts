import { McpServer, createMcpHandler } from "@modelcontextprotocol/server";
import { McpRegistrar, mcp } from "@orpc/mcp";
import { ORPCError, os } from "@orpc/server";
import { track } from "@vercel/analytics/server";
import { after } from "next/server";
import { z } from "zod";

import { componentDetail, searchCatalog, serverInstructions } from "@/lib/agent/mcp-catalog";
import { contentElements, contentStyles } from "@/lib/content/content-categories";
import { getAllContent, getShadcnRegistryItem } from "@/lib/content-data";
import { siteConfig } from "@/lib/site-config";

const tagSlugs = [...contentElements, ...contentStyles].map((filter) => filter.slug);

// Read-only and closed-world: the tools only ever read this site's own catalog.
const readCatalog = { annotations: { openWorldHint: false, readOnlyHint: true } };

// MCP-only procedures, not part of @repo/contract: no client calls them over RPC,
// and their data lives in this app's filesystem loader.
const router = {
  get_component: os
    .meta(
      mcp.tool({
        ...readCatalog,
        description:
          "Get one component by slug: its install command, npm dependencies, and the full source of every file it ships.",
        title: "Get component",
      }),
    )
    .input(z.object({ slug: z.string().describe("Slug from search_components") }))
    .handler(async ({ input: { slug } }) => {
      const all = await getAllContent();
      const component = all.find((c) => c.slug === slug);
      after(() => track("mcp_get", { found: Boolean(component), slug: slug.slice(0, 100) }));
      if (!component) {
        throw new ORPCError("NOT_FOUND", { message: `Component not found: ${slug}` });
      }
      return componentDetail(component, await getShadcnRegistryItem(slug));
    }),

  search_components: os
    .meta(
      mcp.tool({
        ...readCatalog,
        description: `Search the ${siteConfig.name} catalog by what a component does or looks like. An empty query lists everything, newest first.`,
        title: "Search components",
      }),
    )
    .input(
      z.object({
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
    )
    .handler(async ({ input }) => {
      const results = searchCatalog(await getAllContent(), input);
      after(() =>
        track("mcp_search", {
          query: input.query?.slice(0, 100) ?? "",
          results: results.length,
          tags: input.tags?.join(",") ?? "",
        }),
      );
      return results;
    }),
};

const registrar = new McpRegistrar(router);

// Stateless Streamable HTTP: a fresh server per request, so nothing is held between calls.
const handler = createMcpHandler(async () => {
  const server = new McpServer(
    { name: "uicapsule", version: "1.0.0" },
    { instructions: serverInstructions },
  );
  await registrar.register(server);
  return server;
});

const serve = (request: Request) => handler.fetch(request);

export { serve as GET, serve as POST };
