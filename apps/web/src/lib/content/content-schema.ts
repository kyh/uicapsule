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

export type SourceFile = { path: string; code: string };

export type LocalContentComponent = ContentComponentBase & {
  type: "local";
  sourceFiles: SourceFile[];
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
