import { RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import type {
  McpUiAppToolConfig,
  McpUiReadResourceResult,
} from "@modelcontextprotocol/ext-apps/server";
import { GALLERY_RESOURCE_URI } from "@repo/mcp-app/gallery-schema";

import { assetsOrigin } from "@/lib/assets";
import { siteConfig } from "@/lib/site-config";

/** Attaches the gallery view to a tool, which both the model and the view may call. */
export const galleryToolMeta = {
  ui: { resourceUri: GALLERY_RESOURCE_URI, visibility: ["model", "app"] },
} satisfies McpUiAppToolConfig["_meta"];

/**
 * The view loads covers from the asset store and nothing else: no fetches and
 * no nested frames, which is what keeps it reviewable on every host.
 */
export const galleryResourceMeta = {
  ui: {
    csp: { connectDomains: [], frameDomains: [], resourceDomains: [assetsOrigin] },
    permissions: { clipboardWrite: {} },
    prefersBorder: true,
  },
} satisfies McpUiReadResourceResult["_meta"];

export const galleryResource = {
  description: `Browse ${siteConfig.name} search results as the site's gallery: covers, tags, install commands.`,
  mimeType: RESOURCE_MIME_TYPE,
  name: `${siteConfig.name} gallery`,
  uri: GALLERY_RESOURCE_URI,
};

/** The `resources/read` result for the gallery view, given its built HTML. */
export const galleryResourceContents = (html: string) =>
  ({
    contents: [
      {
        _meta: galleryResourceMeta,
        mimeType: RESOURCE_MIME_TYPE,
        text: html,
        uri: GALLERY_RESOURCE_URI,
      },
    ],
  }) satisfies McpUiReadResourceResult;
