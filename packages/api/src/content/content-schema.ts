import { z } from "zod";

export type ContentComponentBase = {
  slug: string;
  type: "local" | "remote";
  name: string;
  description?: string;
  defaultSize?: "full" | "md" | "sm";
  coverUrl?: string;
  coverType?: "image" | "video";
  category?: "marketing" | "application" | "mobile";
  tags?: string[];
  authors?: { name: string; url: string; avatarUrl: string }[];
  asSeenOn?: { name: string; url: string; avatarUrl: string }[];
  previousSlug?: string;
  nextSlug?: string;
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

export const isLocalContentComponent = (
  component: ContentComponent,
): component is LocalContentComponent => component.type === "local";

export const isRemoteContentComponent = (
  component: ContentComponent,
): component is RemoteContentComponent => component.type === "remote";

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
