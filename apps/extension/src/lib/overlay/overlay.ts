import { componentRequestSchema } from "@repo/contract/request/request-schema";

import { htmlFor, labelFor, selectorFor, videoFor, videoSource } from "../element";
import { decodeFile } from "../encoding";
import { fileResultSchema, submitResultSchema } from "../messages";
import type { Encoded, FileResult, OverlayStart, Rect, WorkerRequest } from "../messages";
import { recordVideo } from "../record";
import { creditItem, preferencesItem, serviceUrlItem } from "../storage";
import { createDetails } from "./details";
import type { FieldKey } from "./details";
import { createRegion } from "./region";
import type { Region, RegionPicker } from "./region";
import { OVERLAY_CSS } from "./styles";
import { showToast } from "./toast";

const FIELD_KEYS = new Set<string>(["credit.name", "credit.url", "description", "name"]);

const PAGE_EVENTS = [
  "click",
  "dblclick",
  "keydown",
  "keypress",
  "keyup",
  "mousedown",
  "mouseup",
  "pointerdown",
  "pointerup",
];

const isFieldKey = (key: string): key is FieldKey => FIELD_KEYS.has(key);

const nextFrame = async () =>
  // oxlint-disable-next-line promise/avoid-new -- requestAnimationFrame has no promise form to await
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });

const ask = async (request: WorkerRequest) => await browser.runtime.sendMessage(request);

const sizeLabel = (base64: string) => `${((base64.length * 3) / 4 / 1024 / 1024).toFixed(1)} MB`;

const viewportRect = () =>
  ({ height: window.innerHeight, width: window.innerWidth, x: 0, y: 0 }) satisfies Rect;

const toRect = (box: DOMRect) =>
  ({ height: box.height, width: box.width, x: box.left, y: box.top }) satisfies Rect;

const hostOf = (url: string) => {
  try {
    return new URL(url).host.replace(/^www\./u, "");
  } catch {
    return url;
  }
};

const mediaFor = (src: string) => {
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
 * Mounts the capture overlay: a closed shadow root that runs one capture (region picker, visible
 * area, or a right-clicked image or video), then the request dialog, then a toast. Returns its
 * teardown and a way to start over with another tool.
 */
export const mountOverlay = (onClosed: () => void) => {
  const host = document.createElement("uicapsule-capture");
  const root = host.attachShadow({ mode: "closed" });
  const controller = new AbortController();
  const { signal } = controller;

  let region: RegionPicker | null = null;
  let details: ReturnType<typeof createDetails> | null = null;
  let generation = 0;
  let shot: Encoded | null = null;
  let video: Encoded | null = null;
  let references: string[] = [];
  let captured: Region | null = null;
  let filing = false;
  let videoWorking = false;

  const destroy = () => {
    controller.abort();
    region?.destroy();
    host.remove();
    onClosed();
  };

  const clear = () => {
    generation += 1;
    region?.destroy();
    region = null;
    details?.element.remove();
    details = null;
    shot = null;
    video = null;
    references = [];
    captured = null;
    filing = false;
    videoWorking = false;
  };

  const attachVideo = async (element: Element | undefined) => {
    const { video: wanted } = await preferencesItem.getValue();
    const target = element && wanted ? videoFor(element) : undefined;

    if (!target || !details) {
      return;
    }

    const run = generation;
    const source = videoSource(target);
    videoWorking = true;
    details.setBusy(true, "Attaching video…");
    details.setChip("working", "Getting the video…");

    let result: FileResult = { ok: false, reason: "" };

    if (source.kind === "file") {
      result = fileResultSchema.parse(await ask({ src: source.src, type: "video" }));
    }

    if (run !== generation) {
      return;
    }

    if (!result.ok) {
      details.setChip("working", "Recording a few seconds…");
      result = await recordVideo(target);
    }

    if (run !== generation) {
      return;
    }

    videoWorking = false;
    details.setBusy(false);

    if (result.ok) {
      video = result.file;
      details.setChip("attached", `Video · ${sizeLabel(result.file.base64)}`);
    } else if (source.kind === "file") {
      references = [source.src];
      details.setChip("linked", "Video linked");
    } else {
      details.setChip("linked", "Video not attached");
    }
  };

  const toastAndClose = async (toast: Parameters<typeof showToast>[1]) => {
    const run = generation;
    await showToast(root, toast);

    if (run === generation && !region && !details) {
      destroy();
    }
  };

  const draft = async () => {
    if (!details || !captured) {
      return null;
    }

    const { fields } = details;
    const { element } = captured;
    const { html } = await preferencesItem.getValue();

    const credit = {
      name: fields["credit.name"].control.value,
      url: fields["credit.url"].control.value,
    };

    await creditItem.setValue(credit);

    return {
      capture: {
        html: element && html ? htmlFor(element) : undefined,
        selector: element ? selectorFor(element) : undefined,
        url: location.href,
      },
      credit,
      description: fields.description.control.value,
      name: fields.name.control.value,
      references,
    };
  };

  const validate = (request: NonNullable<Awaited<ReturnType<typeof draft>>>) => {
    const parsed = componentRequestSchema.safeParse({ ...request, attachments: [] });
    const errors: Partial<Record<FieldKey, string>> = {};

    for (const issue of parsed.error?.issues ?? []) {
      const key = issue.path.join(".");

      if (isFieldKey(key)) {
        errors[key] ??= issue.message;
      }
    }

    details?.setErrors(errors);

    return parsed.success;
  };

  const file = async () => {
    if (filing || videoWorking || !details) {
      return;
    }

    filing = true;
    details.setBusy(true);
    details.setProblem(null);

    const request = await draft();

    if (!request || !shot || !validate(request)) {
      filing = false;
      details?.setBusy(false);

      return;
    }

    const run = generation;

    const result = submitResultSchema.parse(
      await ask({ draft: request, files: video ? [shot, video] : [shot], type: "submit" }),
    );

    if (run !== generation || !details) {
      return;
    }

    if (!result.ok) {
      filing = false;
      details.setBusy(false);
      details.setProblem(result.reason);

      return;
    }

    clear();
    void toastAndClose({
      link: { href: result.url, label: "View" },
      text: "If it gets built, it lands in the gallery with your credit.",
      title:
        result.number !== undefined && result.number !== 0
          ? `Request #${result.number} filed`
          : "Request filed",
    });
  };

  const openDetails = async (picked: Region, encoded: Encoded) => {
    const run = generation;

    const created = createDetails({
      onCancel: destroy,
      onSubmit: () => {
        void file();
      },
    });

    const credit = await creditItem.getValue();
    created.fields["credit.name"].control.value = credit.name;
    created.fields["credit.url"].control.value = credit.url;
    created.setTarget(hostOf(await serviceUrlItem.getValue()));
    created.setWhere(
      `${picked.element ? labelFor(picked.element) : (picked.label ?? "Area")} on ${location.host}`,
    );
    await created.setShot(decodeFile(encoded), picked.rect);

    if (run !== generation) {
      return;
    }

    details = created;
    captured = picked;
    shot = encoded;
    root.append(created.element);
    created.focus();
    void attachVideo(picked.element);
  };

  const snap = async (picked: Region) => {
    const run = generation;
    region?.destroy();
    region = null;
    host.toggleAttribute("data-hidden", true);
    await nextFrame();
    await nextFrame();

    const result = fileResultSchema.parse(
      await ask({
        rect: picked.rect,
        type: "capture",
        viewport: { height: window.innerHeight, width: window.innerWidth },
      }),
    );

    host.toggleAttribute("data-hidden", false);

    if (run !== generation) {
      return;
    }

    if (!result.ok) {
      void toastAndClose({ text: result.reason, title: "Couldn't capture this", tone: "error" });

      return;
    }

    await openDetails(picked, result.file);
  };

  const start = async (request: OverlayStart) => {
    clear();

    if (request.tool === "region") {
      region = createRegion({
        host,
        onCancel: destroy,
        onSave: (picked) => {
          void snap(picked);
        },
      });
      root.append(region.element);

      return;
    }

    if (request.tool === "media" && request.src !== undefined && request.src !== "") {
      const element = mediaFor(request.src);

      if (element) {
        element.scrollIntoView({ block: "nearest", inline: "nearest" });
        await nextFrame();
        await snap({ element, rect: toRect(element.getBoundingClientRect()) });

        return;
      }
    }

    await snap({ label: "Visible area", rect: viewportRect() });
  };

  const onKey = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      event.preventDefault();
      destroy();

      return;
    }

    if (!region) {
      return;
    }

    if (event.key === "Enter" && region.ready) {
      event.preventDefault();
      event.stopPropagation();
      region.submit();
    } else if (region.walk(event.key)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  window.addEventListener("keydown", onKey, { capture: true, signal });

  for (const type of PAGE_EVENTS) {
    host.addEventListener(
      type,
      (event) => {
        event.stopPropagation();
      },
      { signal },
    );
  }

  const style = document.createElement("style");
  style.textContent = OVERLAY_CSS;
  root.append(style);
  document.documentElement.append(host);

  return { destroy, start };
};
