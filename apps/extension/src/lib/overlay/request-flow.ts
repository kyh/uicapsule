import { componentRequestSchema } from "@repo/contract/request/request-schema";
import type { Rect } from "@repo/inspector/geometry";
import type { z } from "zod";

import { htmlFor, selectorFor, videoFor, videoSource } from "../element";
import { fileResultSchema, submitResultSchema } from "../messages";
import type { Draft, Encoded, FileResult, WorkerRequest } from "../messages";
import { recordVideo } from "../record";
import { creditItem, preferencesItem } from "../storage";
import type { FieldErrors, FieldKey, Fields, VideoChip } from "./request-dialog";

const FIELD_KEYS = new Set<string>(["credit.name", "credit.url", "description", "name"]);

const isFieldKey = (key: string): key is FieldKey => FIELD_KEYS.has(key);

/** What a request is captured from: the selected element (when there is one) and its box. */
export interface Picked {
  element?: Element;
  label: string;
  rect: Rect;
}

const ask = async <T extends z.ZodType>(request: WorkerRequest, schema: T) =>
  schema.parse(await browser.runtime.sendMessage(request));

export const sizeLabel = (base64: string) =>
  `${((base64.length * 3) / 4 / 1024 / 1024).toFixed(1)} MB`;

/** Screenshots `rect` of the viewport through the background worker. */
export const captureRect = async (rect: Rect) =>
  await ask(
    {
      rect,
      type: "capture",
      viewport: { height: window.innerHeight, width: window.innerWidth },
    },
    fileResultSchema,
  );

/** The image or video a right-click was on, found again by its source. */
export const mediaFor = (src: string) => {
  const media = [...document.querySelectorAll("video, img")].find(
    (element) =>
      (element instanceof HTMLVideoElement || element instanceof HTMLImageElement) &&
      (element.currentSrc === src || element.src === src),
  );

  const source = [...document.querySelectorAll("video source")].find(
    (element) => element instanceof HTMLSourceElement && element.src === src,
  );

  return media ?? source?.parentElement ?? undefined;
};

/**
 * Attaches the picked video, if there is one and video is on in Settings: its file when the
 * background can fetch it, else a few seconds recorded from the page, else a link to it.
 */
export const attachVideo = async (
  element: Element | undefined,
  onChip: (chip: VideoChip) => void,
) => {
  const { video: wanted } = await preferencesItem.getValue();
  const target = element && wanted ? videoFor(element) : undefined;

  if (!target) {
    return { references: [], video: null };
  }

  const source = videoSource(target);
  onChip({ state: "working", text: "Getting the video…" });

  let result: FileResult = { ok: false, reason: "" };

  if (source.kind === "file") {
    result = await ask({ src: source.src, type: "video" }, fileResultSchema);
  }

  if (!result.ok) {
    onChip({ state: "working", text: "Recording a few seconds…" });
    result = await recordVideo(target);
  }

  if (result.ok) {
    onChip({ state: "attached", text: `Video · ${sizeLabel(result.file.base64)}` });

    return { references: [], video: result.file };
  }

  onChip({ state: "linked", text: source.kind === "file" ? "Video linked" : "Video not attached" });

  return { references: source.kind === "file" ? [source.src] : [], video: null };
};

export const savedFields = async () => {
  const credit = await creditItem.getValue();

  return {
    "credit.name": credit.name,
    "credit.url": credit.url,
    description: "",
    name: "",
  } satisfies Fields;
};

/** The request as the background files it, plus the field errors that stop it from being filed. */
export const draftFor = async (fields: Fields, picked: Picked, references: string[]) => {
  const { html } = await preferencesItem.getValue();
  const credit = { name: fields["credit.name"], url: fields["credit.url"] };
  await creditItem.setValue(credit);

  const draft = {
    capture: {
      html: picked.element && html ? htmlFor(picked.element) : undefined,
      selector: picked.element ? selectorFor(picked.element) : undefined,
      url: location.href,
    },
    credit,
    description: fields.description,
    name: fields.name,
    references,
  } satisfies Draft;

  const parsed = componentRequestSchema.safeParse({ ...draft, attachments: [] });
  const errors: FieldErrors = {};

  for (const issue of parsed.error?.issues ?? []) {
    const key = issue.path.join(".");

    if (isFieldKey(key)) {
      errors[key] ??= issue.message;
    }
  }

  return { draft, errors, ok: parsed.success };
};

export const fileDraft = async (draft: Draft, files: Encoded[]) =>
  await ask({ draft, files, type: "submit" }, submitResultSchema);
