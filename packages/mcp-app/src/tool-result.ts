import { galleryResultSchema } from "./gallery-schema";

import type { GalleryEntry } from "./gallery-schema";

export type Results =
  | { status: "loading" }
  | { status: "ready"; components: GalleryEntry[] }
  | { status: "error"; message: string };

interface ToolResult {
  content?: { type: string; text?: string }[];
  isError?: boolean;
  structuredContent?: unknown;
}

const firstText = (result: ToolResult) =>
  result.content?.find((block) => block.type === "text")?.text ?? "";

/** Reads a `search_components` result into what the gallery renders. */
export const toResults = (result: ToolResult) => {
  if (result.isError === true) {
    return {
      message: firstText(result) || "The search failed.",
      status: "error",
    } satisfies Results;
  }

  const parsed = galleryResultSchema.safeParse(result.structuredContent);

  return parsed.success
    ? ({ components: parsed.data.components, status: "ready" } satisfies Results)
    : ({
        message: "The search returned a result this view can't read.",
        status: "error",
      } satisfies Results);
};
