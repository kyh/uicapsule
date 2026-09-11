const assetsUrl = process.env.NEXT_PUBLIC_ASSETS_URL;
if (!assetsUrl) {
  throw new Error(
    "NEXT_PUBLIC_ASSETS_URL is unset — copy .env.example to .env (see AGENTS.md). It must " +
      "also be listed in turbo.json globalEnv or turbo's strict env mode strips it.",
  );
}

/** Public URL of a key in the `uicapsule-assets` Vercel Blob store. */
export const assetUrl = (key: string) => `${assetsUrl}/${key}`;

export type CoverType = "image" | "video";
export interface Cover {
  type: CoverType;
  url: string;
}

const VIDEO_EXTENSIONS = new Set(["mp4", "webm"]);

/** A meta.json `cover` key resolved to what the gallery card renders. */
export const resolveCover = (key: string | undefined): Cover | undefined => {
  if (!key) {
    return undefined;
  }
  const extension = key.slice(key.lastIndexOf(".") + 1);
  return { type: VIDEO_EXTENSIONS.has(extension) ? "video" : "image", url: assetUrl(key) };
};
