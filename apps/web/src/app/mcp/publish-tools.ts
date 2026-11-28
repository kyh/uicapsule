import { mcp } from "@orpc/mcp";
import { ORPCError, os } from "@orpc/server";
import {
  createUploadSchema,
  handleSchema,
  publishSchema,
  ugcSlugSchema,
} from "@repo/contract/ugc/ugc-schema";
import { canonicalOrigin } from "@repo/service/auth";
import {
  createUploads,
  listPublished,
  publishBuild,
  startBuild,
} from "@repo/service/ugc/ugc-publish";
import type { Publisher } from "@repo/service/ugc/ugc-publish";
import { claimUsername } from "@repo/service/ugc/ugc-store";
import { z } from "zod";

import { SIGN_IN_NOTE, bundleRules, uploadCommand } from "@/lib/agent/mcp-publish";
import { ugcPreviewFrameSrc } from "@/lib/preview-protocol";

const writes = { annotations: { destructiveHint: false, openWorldHint: false } };

const withUsername = async (publisher: Publisher, username: string | undefined) => {
  if (
    (publisher.username !== null && publisher.username !== "") ||
    username === undefined ||
    username === ""
  ) {
    return publisher;
  }

  const claimed = await claimUsername(publisher.id, username);

  if (claimed === undefined || claimed === null || claimed === "") {
    throw new ORPCError("CONFLICT", {
      message: `The username ${username} is taken. Pick another.`,
    });
  }

  return { ...publisher, username: claimed };
};

const previewOrigin = () => {
  const url = process.env.NEXT_PUBLIC_PREVIEW_URL;

  return url === undefined || url === "" ? canonicalOrigin() : url;
};

const previewUrl = (handle: string, slug: string) =>
  ugcPreviewFrameSrc(handle, slug, previewOrigin());

/** The publishing tools, named so the route can tell a call to one before it reads a token. */
export const PUBLISH_TOOL_NAMES = [
  "get_upload_urls",
  "list_my_components",
  "publish_component",
  "start_publish",
] as const;

/**
 * The publishing tools for the signed-in account, or for nobody: the route answers a call to one
 * without a token with a sign-in challenge before it reaches a handler.
 */
export const publishTools = (signedIn: Publisher | null) => {
  const account = () => {
    if (!signedIn) {
      throw new ORPCError("UNAUTHORIZED", { message: "Sign in to publish." });
    }

    return signedIn;
  };

  return {
    get_upload_urls: os
      .meta(
        mcp.tool({
          ...writes,
          description: `${SIGN_IN_NOTE} Get a signed upload URL, and the curl command that uses it, for each file of a build. Run every command from the directory the bundle was written to. URLs last 15 minutes; files already uploaded to this build are left out.`,
          title: "Get upload URLs",
        }),
      )
      .input(createUploadSchema)
      .handler(async ({ input }) => {
        const { uploads } = await createUploads(account(), input);

        return {
          uploads: uploads.map((upload) => ({ ...upload, command: uploadCommand(upload) })),
        };
      }),

    list_my_components: os
      .meta(
        mcp.tool({
          annotations: { destructiveHint: false, openWorldHint: false, readOnlyHint: true },
          description: `${SIGN_IN_NOTE} List the components this account has published, newest first.`,
          title: "List my components",
        }),
      )
      .handler(async () => {
        const components = await listPublished(account());

        return components.map((component) => ({
          ...component,
          previewUrl: previewUrl(component.handle, component.slug),
        }));
      }),

    publish_component: os
      .meta(
        mcp.tool({
          annotations: { destructiveHint: true, idempotentHint: true, openWorldHint: false },
          description: `${SIGN_IN_NOTE} Make an uploaded build the live version of the slug, creating the component on its first publish. It replaces the slug's previous build, which stays stored but no longer shows.`,
          title: "Publish component",
        }),
      )
      .input(publishSchema)
      .handler(async ({ input }) => {
        const component = await publishBuild(account(), input);

        return { ...component, previewUrl: previewUrl(component.handle, component.slug) };
      }),

    start_publish: os
      .meta(
        mcp.tool({
          ...writes,
          description: `${SIGN_IN_NOTE} Start publishing a component under a slug: reserves a build and returns its id, the assetBase URL its files will live under, and the rules and an esbuild command for bundling it.`,
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
        const claimed = await withUsername(account(), input.username);
        const { assetBase, build } = await startBuild(claimed, input.slug);

        return { assetBase, build, slug: input.slug, ...bundleRules(assetBase) };
      }),
  };
};
