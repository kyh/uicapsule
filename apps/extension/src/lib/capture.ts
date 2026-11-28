import { ATTACHMENT_MAX_BYTES, ATTACHMENT_TYPES } from "@repo/contract/request/attachment-schema";

import { toImagePixels } from "@repo/inspector/geometry";
import type { Rect } from "./messages";

const isAttachmentType = (type: string): type is keyof typeof ATTACHMENT_TYPES =>
  type in ATTACHMENT_TYPES;

const EXTENSION_TYPES = new Map<string, keyof typeof ATTACHMENT_TYPES>([
  ["m4v", "video/mp4"],
  ["mov", "video/quicktime"],
  ["mp4", "video/mp4"],
  ["webm", "video/webm"],
]);

const loadImage = async (dataUrl: string) => {
  const response = await fetch(dataUrl);

  return await createImageBitmap(await response.blob());
};

/** Crops a screenshot of the visible tab to the selection, shrinking it until it fits the upload cap. */
export const cropScreenshot = async (dataUrl: string, rect: Rect, viewportWidth: number) => {
  const image = await loadImage(dataUrl);
  const crop = toImagePixels(rect, viewportWidth, image.width);

  const fit: (scale: number) => Promise<File> = async (scale) => {
    const canvas = new OffscreenCanvas(
      Math.max(1, Math.round(crop.width * scale)),
      Math.max(1, Math.round(crop.height * scale)),
    );

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Couldn't draw the screenshot.");
    }

    context.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    const png = await canvas.convertToBlob({ type: "image/png" });

    if (png.size <= ATTACHMENT_MAX_BYTES) {
      return new File([png], "capture.png", { type: "image/png" });
    }

    const webp = await canvas.convertToBlob({ quality: 0.9, type: "image/webp" });

    if (webp.size <= ATTACHMENT_MAX_BYTES) {
      return new File([webp], "capture.webp", { type: "image/webp" });
    }

    return await fit(scale * 0.75);
  };

  return await fit(1);
};

const fileName = (src: string, type: string) => {
  const last = new URL(src).pathname.split("/").at(-1) ?? "";

  return last.includes(".") ? last : `video.${type.split("/")[1] ?? "mp4"}`;
};

const typeFor = (src: string, contentType: string | null) => {
  const type = contentType?.split(";")[0]?.trim() ?? "";

  if (isAttachmentType(type)) {
    return type;
  }

  const extension = new URL(src).pathname.split(".").at(-1)?.toLowerCase() ?? "";

  return EXTENSION_TYPES.get(extension);
};

/**
 * Downloads a picked video's file when it is a type and size the request accepts. Returns why
 * not otherwise, so the caller can fall back to recording a clip.
 */
export const downloadVideo = async (src: string) => {
  const controller = new AbortController();
  let response: Response;

  try {
    response = await fetch(src, { credentials: "omit", signal: controller.signal });
  } catch {
    return { ok: false, reason: "Couldn't download the video." } as const;
  }

  const type = typeFor(src, response.headers.get("content-type"));
  const length = Number(response.headers.get("content-length") ?? 0);

  if (
    !response.ok ||
    !type ||
    ATTACHMENT_TYPES[type] !== "video" ||
    length > ATTACHMENT_MAX_BYTES
  ) {
    controller.abort();

    return { ok: false, reason: "The video file is too large or an unsupported type." } as const;
  }

  const blob = await response.blob();

  if (blob.size > ATTACHMENT_MAX_BYTES) {
    return { ok: false, reason: "The video file is too large." } as const;
  }

  return { file: new File([blob], fileName(src, type), { type }), ok: true } as const;
};
