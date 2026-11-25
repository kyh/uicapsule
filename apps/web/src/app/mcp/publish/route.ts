import { McpServer, createMcpHandler } from "@modelcontextprotocol/server";
import { McpRegistrar, mcp } from "@orpc/mcp";
import { ORPCError, os } from "@orpc/server";
import {
  createUploadSchema,
  handleSchema,
  publishSchema,
  ugcSlugSchema,
} from "@repo/contract/ugc/ugc-schema";
import { AUTH_ISSUER, MCP_PUBLISH_RESOURCE, canonicalOrigin } from "@repo/service/auth";
import {
  createUploads,
  listPublished,
  publishBuild,
  startBuild,
} from "@repo/service/ugc/ugc-publish";
import type { Publisher } from "@repo/service/ugc/ugc-publish";
import { claimUsername, findPublisher } from "@repo/service/ugc/ugc-store";
import { createMcpProtectedRequestHandler } from "@better-auth/mcp";
import { z } from "zod";

import { bundleRules, publishInstructions, uploadCommand } from "@/lib/agent/mcp-publish";
import { ugcPreviewFrameSrc } from "@/lib/preview-protocol";

const writes = { annotations: { destructiveHint: false, openWorldHint: false } };

const withUsername = async (publisher: Publisher, username: string | undefined) => {
  if (publisher.username || !username) {
    return publisher;
  }

  if (!(await claimUsername(publisher.id, username))) {
    throw new ORPCError("CONFLICT", {
      message: `The username ${username} is taken. Pick another.`,
    });
  }

  return { ...publisher, username };
};

const previewUrl = (handle: string, slug: string) =>
  ugcPreviewFrameSrc(handle, slug, process.env.NEXT_PUBLIC_PREVIEW_URL || canonicalOrigin());

const tools = (publisher: Publisher) => ({
  get_upload_urls: os
    .meta(
      mcp.tool({
        ...writes,
        description:
          "Get a signed upload URL, and the curl command that uses it, for each file of a build. Run every command from the directory the bundle was written to. URLs last 15 minutes; files already uploaded to this build are left out.",
        title: "Get upload URLs",
      }),
    )
    .input(createUploadSchema)
    .handler(async ({ input }) => {
      const { uploads } = await createUploads(publisher, input);

      return {
        uploads: uploads.map((upload) => ({ ...upload, command: uploadCommand(upload) })),
      };
    }),

  list_my_components: os
    .meta(
      mcp.tool({
        annotations: { openWorldHint: false, readOnlyHint: true },
        description: "List the components this account has published, newest first.",
        title: "List my components",
      }),
    )
    .handler(async () => {
      const components = await listPublished(publisher);

      return components.map((component) => ({
        ...component,
        previewUrl: previewUrl(component.handle, component.slug),
      }));
    }),

  publish_component: os
    .meta(
      mcp.tool({
        annotations: { destructiveHint: true, idempotentHint: true, openWorldHint: false },
        description:
          "Make an uploaded build the live version of the slug, creating the component on its first publish. It replaces the slug's previous build, which stays stored but no longer shows.",
        title: "Publish component",
      }),
    )
    .input(publishSchema)
    .handler(async ({ input }) => {
      const component = await publishBuild(publisher, input);

      return { ...component, previewUrl: previewUrl(component.handle, component.slug) };
    }),

  start_publish: os
    .meta(
      mcp.tool({
        ...writes,
        description:
          "Start publishing a component under a slug: reserves a build and returns its id, the assetBase URL its files will live under, and the rules and an esbuild command for bundling it.",
        title: "Start publish",
      }),
    )
    .input(
      z.object({
        slug: ugcSlugSchema.describe(
          'The component\'s slug under /u/<username>/, e.g. "rotary-knob". Publishing an existing slug again replaces its build.',
        ),
        username: handleSchema
          .optional()
          .describe(
            "Only for an account with no username yet: the one to claim. It names every URL the account publishes and cannot be changed here later.",
          ),
      }),
    )
    .handler(async ({ input }) => {
      const account = await withUsername(publisher, input.username);
      const { assetBase, build } = await startBuild(account, input.slug);

      return { assetBase, build, slug: input.slug, ...bundleRules(assetBase) };
    }),
});

const serve = async (request: Request, subject: string | undefined) => {
  const publisher = subject ? await findPublisher(subject) : undefined;

  if (!publisher) {
    return Response.json({ error: "This account no longer exists" }, { status: 401 });
  }

  const handler = createMcpHandler(async () => {
    const server = new McpServer(
      { name: "uicapsule-publish", version: "1.0.0" },
      { instructions: publishInstructions },
    );

    await new McpRegistrar(tools(publisher)).register(server);

    return server;
  });

  return await handler.fetch(request);
};

const protectedHandler = createMcpProtectedRequestHandler(
  {
    audience: MCP_PUBLISH_RESOURCE,
    issuer: AUTH_ISSUER,
    jwksUrl: `${AUTH_ISSUER}/jwks`,
  },
  async (request, claims) => await serve(request, claims.sub),
);

export { protectedHandler as GET, protectedHandler as POST };
