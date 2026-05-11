import { z } from "zod";

export type DefaultSize = "full" | "md" | "sm";

export type ContentComponentBase = {
  slug: string;
  type: "local" | "remote";
  name: string;
  description?: string;
  defaultSize?: DefaultSize;
  coverUrl?: string;
  coverType?: "image" | "video";
  category?: "marketing" | "application" | "mobile";
  tags?: string[];
  authors?: { name: string; url: string; avatarUrl: string }[];
  asSeenOn?: { name: string; url: string; avatarUrl: string }[];
};

export type LocalContentComponent = ContentComponentBase & {
  type: "local";
  sourceFiles: { path: string; code: string }[];
};

export type RemoteContentComponent = ContentComponentBase & {
  type: "remote";
  iframeUrl: string;
  sourceUrl: string;
};

export type ContentComponent = LocalContentComponent | RemoteContentComponent;

export type LocalContentComponentSummary = Omit<LocalContentComponent, "sourceFiles">;
export type ContentComponentSummary = LocalContentComponentSummary | RemoteContentComponent;

export const isLocalContentComponent = <T extends { type: "local" | "remote" }>(
  component: T,
): component is Extract<T, { type: "local" }> => component.type === "local";

export const isRemoteContentComponent = <T extends { type: "local" | "remote" }>(
  component: T,
): component is Extract<T, { type: "remote" }> => component.type === "remote";

export const getContentComponentInput = z.object({
  slug: z.string(),
});
export type GetContentComponentInput = z.infer<typeof getContentComponentInput>;

export const getContentComponentsInput = z
  .object({
    filterTags: z.array(z.string()).optional(),
  })
  .optional();
export type GetContentComponentsInput = z.infer<typeof getContentComponentsInput>;

export const searchContentInput = z.object({
  query: z.string().optional(),
  limit: z.number().optional().default(12),
});
export type SearchContentInput = z.infer<typeof searchContentInput>;
