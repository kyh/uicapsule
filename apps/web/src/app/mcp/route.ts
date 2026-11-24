import { McpServer, ProtocolError, createMcpHandler } from "@modelcontextprotocol/server";
import { McpRegistrar, mcp } from "@orpc/mcp";
import { ORPCError, os } from "@orpc/server";
import { track } from "@vercel/analytics/server";
import { after } from "next/server";
import { z } from "zod";

import { componentDetail, searchCatalog, serverInstructions } from "@/lib/agent/mcp-catalog";
import {
  SKILL_CACHE_HINT,
  SKILLS,
  SKILLS_EXTENSION,
  skillCatalog,
  skillUri,
} from "@/lib/agent/mcp-skills";
import { contentElements, contentStyles } from "@/lib/content/content-categories";
import { getAllContent, getShadcnRegistryItem } from "@/lib/content/content-data";
import { siteConfig } from "@/lib/site-config";

const tagSlugs = [...contentElements, ...contentStyles].map((filter) => filter.slug);
const slugList = (filters: { slug: string }[]) => filters.map((filter) => filter.slug).join(", ");

const readCatalog = { annotations: { openWorldHint: false, readOnlyHint: true } };

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
    .input(
      z.object({
        slug: z
          .string()
          .describe(
            'The component\'s slug, copied exactly from the slug field of a search_components result, e.g. "card-stack". Lowercase and hyphenated; an unknown slug returns a not-found error.',
          ),
      }),
    )
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
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(20)
          .describe("Most results to return, from 1 to 100. Defaults to 20."),
        query: z
          .string()
          .optional()
          .describe(
            'Free text describing what the component does or looks like, e.g. "rotary dial" or "ios volume slider". Each word is matched against names, slugs, tags and descriptions, and results rank by how many words match; a component matching none is left out. Omit it to list components newest first.',
          ),
        tags: z
          .array(z.enum(tagSlugs))
          .optional()
          .describe(
            `Only return components that carry every one of these tags. Kind tags: ${slugList(contentElements)}. Style tags: ${slugList(contentStyles)}.`,
          ),
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

const registerSkills = (server: McpServer) => {
  server.server.registerCapabilities({ extensions: { [SKILLS_EXTENSION]: {} }, resources: {} });

  for (const skill of SKILLS) {
    for (const file of skill.files) {
      const uri = skillUri(skill, file.path);
      const isSkill = file.path === "SKILL.md";

      server.registerResource(
        isSkill ? skill.name : `${skill.name}/${file.path}`,
        uri,
        {
          cacheHint: SKILL_CACHE_HINT,
          description: isSkill ? skill.description : undefined,
          mimeType: "text/markdown",
        },
        () => ({ contents: [{ mimeType: "text/markdown", text: file.text, uri }] }),
      );
    }
  }

  server.server.setRequestHandler(
    "skills/list",
    { params: z.looseObject({ cursor: z.string().optional() }) },
    async () => ({ resultType: "complete", skills: await skillCatalog(), ...SKILL_CACHE_HINT }),
  );

  server.server.setRequestHandler(
    "skills/get",
    { params: z.looseObject({ uri: z.string() }) },
    async ({ uri }) => {
      const listed = await skillCatalog();
      const skill = listed.find((entry) => entry.uri === uri);

      if (!skill) {
        throw new ProtocolError(-32_602, `No skill at ${uri}. Call skills/list for them.`);
      }

      return { resultType: "complete", skill, ...SKILL_CACHE_HINT };
    },
  );
};

const handler = createMcpHandler(async () => {
  const server = new McpServer(
    { name: "uicapsule", version: "1.0.0" },
    { instructions: serverInstructions },
  );

  await registrar.register(server);
  registerSkills(server);

  return server;
});

const serve = (request: Request) => handler.fetch(request);

export { serve as GET, serve as POST };
