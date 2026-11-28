import * as z from "zod/mini";

import { controlValuesPayloadSchema, previewControlsSchema } from "./preview-controls";

/**
 * Sandbox flags for a local component preview, applied twice: as the preview document's
 * `Content-Security-Policy: sandbox` (so it holds even when the URL is opened top-level) and
 * as the embedding `<iframe sandbox>`. No `allow-same-origin`, so the preview runs on an opaque
 * origin with no cookies or storage of the site that serves it.
 */
export const PREVIEW_SANDBOX =
  "allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-pointer-lock allow-downloads";

/** Permissions a preview may ask for: the `allow` attribute of its iframe. */
export const PREVIEW_ALLOW = "camera; microphone; clipboard-write; fullscreen";

export const previewThemeSchema = z.enum(["light", "dark"]);

export type PreviewTheme = z.infer<typeof previewThemeSchema>;

const inspectBoxSchema = z.object({
  height: z.number(),
  label: z.string(),
  width: z.number(),
  x: z.number(),
  y: z.number(),
});

export type InspectBox = z.infer<typeof inspectBoxSchema>;

const parentMessageSchema = z.discriminatedUnion("type", [
  z.object({ theme: previewThemeSchema, type: z.literal("uicapsule:theme") }),
  z.object({ enabled: z.boolean(), type: z.literal("uicapsule:inspect") }),
  z.object({
    type: z.literal("uicapsule:props"),
    values: controlValuesPayloadSchema,
  }),
]);

export type ParentMessage = z.infer<typeof parentMessageSchema>;

const frameMessageSchema = z.discriminatedUnion("type", [
  z.object({
    // oxlint-disable-next-line promise/valid-params -- z.catch is zod's fallback schema, not Promise#catch
    controls: z.catch(z.nullable(previewControlsSchema), null),
    type: z.literal("uicapsule:ready"),
  }),
  z.object({ box: z.nullable(inspectBoxSchema), type: z.literal("uicapsule:inspect-box") }),
]);

export type FrameMessage = z.infer<typeof frameMessageSchema>;

/** A message the site sent into a preview frame, or null for anything else. */
export const parseParentMessage = (event: MessageEvent) => {
  const parsed = parentMessageSchema.safeParse(event.data);

  return parsed.success ? parsed.data : null;
};

/** A message a preview frame sent to the site, or null for anything else. */
export const parseFrameMessage = (event: MessageEvent) => {
  const parsed = frameMessageSchema.safeParse(event.data);

  return parsed.success ? parsed.data : null;
};

/** Where a local component's preview document lives: the preview origin, else this one. */
export const previewFrameSrc = (slug: string, origin = process.env.NEXT_PUBLIC_PREVIEW_URL) =>
  `${origin ?? ""}/preview-frame/${encodeURIComponent(slug)}`;

/** Where a user-published component's preview document lives: `/preview-frame/u/<handle>/<slug>`. */
export const ugcPreviewFrameSrc = (
  handle: string,
  slug: string,
  origin = process.env.NEXT_PUBLIC_PREVIEW_URL,
) => `${origin ?? ""}/preview-frame/u/${encodeURIComponent(handle)}/${encodeURIComponent(slug)}`;
