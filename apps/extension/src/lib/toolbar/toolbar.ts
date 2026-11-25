import { componentRequestSchema } from "@repo/contract/request/request-schema";

import { htmlFor, labelFor, selectorFor, videoFor, videoSource } from "../element";
import { decodeFile } from "../encoding";
import { fileResultSchema, submitResultSchema } from "../messages";
import type { Encoded, FileResult, PickMode, WorkerRequest } from "../messages";
import { recordVideo } from "../record";
import { creditItem } from "../storage";
import { createBar } from "./bar";
import type { Preferences } from "./bar";
import { createCard } from "./card";
import type { FieldKey } from "./card";
import { h } from "./dom";
import { createSelection } from "./selection";
import type { Picked } from "./selection";
import { TOOLBAR_CSS } from "./styles";

type Phase = "editing" | "filed" | "filing" | "picking" | "snapping";

const SNAPPED_HOLD_MS = 900;
const TOAST_MS = 3200;
const FIELD_KEYS = new Set<string>(["credit.name", "credit.url", "description", "name"]);

const isFieldKey = (key: string): key is FieldKey => FIELD_KEYS.has(key);

const nextFrame = () =>
  // oxlint-disable-next-line promise/avoid-new -- requestAnimationFrame has no promise form to await
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });

const wait = (ms: number) =>
  // oxlint-disable-next-line promise/avoid-new -- a hold between two label morphs; there is no promise-returning timer
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const ask = (request: WorkerRequest) => browser.runtime.sendMessage(request);

const sizeLabel = (base64: string) => `${((base64.length * 3) / 4 / 1024 / 1024).toFixed(1)} MB`;

/**
 * Mounts the capture toolbar on the page: a closed shadow root holding the picking layer and the
 * dock (request card above the bar). Returns its teardown.
 */
export const mountToolbar = (onClosed: () => void) => {
  const host = document.createElement("uicapsule-capture");
  const root = host.attachShadow({ mode: "closed" });
  const layer = h("div", { class: "layer" });
  const toast = h("div", { class: "toast", role: "status" });
  const preferences: Preferences = { html: true, video: true };
  const card = createCard();
  const controller = new AbortController();
  const { signal } = controller;

  let phase: Phase = "picking";
  let mode: PickMode = "element";
  let shot: Encoded | null = null;
  let video: Encoded | null = null;
  let videoWorking = false;
  let references: string[] = [];
  let snapped: Picked | null = null;
  let toastTimer: ReturnType<typeof setTimeout> | undefined;

  const showToast = (message: string) => {
    toast.textContent = message;
    toast.dataset.show = "";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      delete toast.dataset.show;
    }, TOAST_MS);
  };

  const destroy = () => {
    controller.abort();
    selection.destroy();
    host.remove();
    onClosed();
  };

  const bar = createBar({
    onClose: () => destroy(),
    onMode: (next) => {
      if (next === mode && phase === "picking") {
        return;
      }

      mode = next;
      startPicking();
    },
    onSettings: () => {
      void ask({ type: "options" });
    },
    preferences,
  });

  const dock = h("div", { class: "dock" }, [toast, card.element, bar.element]);

  const selection = createSelection({
    host,
    layer,
    onChange: (picked) => {
      if (phase === "picking") {
        bar.action.button.disabled = picked === null;
      }
    },
  });

  const updateAction = () => {
    bar.action.button.disabled = phase === "filing" || phase === "snapping" || videoWorking;
  };

  const startPicking = () => {
    phase = "picking";
    shot = null;
    video = null;
    references = [];
    card.close();
    card.setDone(null);
    card.setProblem(null);
    card.setChip(null);
    selection.clear();
    selection.setVisible(true);
    selection.setMode(mode);
    bar.selectMode(mode, true);
    bar.action.show("capture", "Snap");
    bar.action.button.disabled = true;
  };

  const attachVideo = async (picked: Picked) => {
    const element = picked.element && preferences.video ? videoFor(picked.element) : undefined;

    if (!element) {
      return;
    }

    const source = videoSource(element);
    videoWorking = true;
    updateAction();
    card.setChip("working", "Getting the video…");

    let result: FileResult = { ok: false, reason: "" };

    if (source.kind === "file") {
      result = fileResultSchema.parse(await ask({ src: source.src, type: "video" }));
    }

    if (!result.ok) {
      card.setChip("working", "Recording a few seconds…");
      result = await recordVideo(element);
    }

    videoWorking = false;

    if (result.ok) {
      video = result.file;
      card.setChip("attached", `Video · ${sizeLabel(result.file.base64)}`);
    } else if (source.kind === "file") {
      references = [source.src];
      card.setChip("linked", "Video linked");
    } else {
      card.setChip("linked", "Video not attached");
    }

    updateAction();
  };

  const snap = async () => {
    const { picked } = selection;

    if (!picked) {
      return;
    }

    phase = "snapping";
    updateAction();
    bar.closeMenu();
    dock.toggleAttribute("data-hidden", true);
    selection.setVisible(false);
    await nextFrame();
    await nextFrame();

    const result = fileResultSchema.parse(
      await ask({
        rect: picked.rect,
        type: "capture",
        viewport: { height: window.innerHeight, width: window.innerWidth },
      }),
    );

    dock.toggleAttribute("data-hidden", false);

    if (!result.ok) {
      selection.setVisible(true);
      phase = "picking";
      updateAction();
      showToast(result.reason);

      return;
    }

    snapped = picked;
    shot = result.file;
    selection.setMode(null);
    await card.setShot(decodeFile(result.file));
    card.setWhere(`${picked.element ? labelFor(picked.element) : "Area"} on ${location.host}`);
    card.open();
    bar.action.show("check", "Snapped!");
    void attachVideo(picked);
    await wait(SNAPPED_HOLD_MS);
    phase = "editing";
    updateAction();
    bar.action.show("send", "File request");
    card.fields.name.control.focus();
  };

  const draft = async () => {
    const credit = {
      name: card.fields["credit.name"].control.value,
      url: card.fields["credit.url"].control.value,
    };

    await creditItem.setValue(credit);

    return {
      capture: {
        html: snapped?.element && preferences.html ? htmlFor(snapped.element) : undefined,
        selector: snapped?.element ? selectorFor(snapped.element) : undefined,
        url: location.href,
      },
      credit,
      description: card.fields.description.control.value,
      name: card.fields.name.control.value,
      references,
    };
  };

  const validate = (request: Awaited<ReturnType<typeof draft>>) => {
    const parsed = componentRequestSchema.safeParse({ ...request, attachments: [] });
    const errors: Partial<Record<FieldKey, string>> = {};

    for (const issue of parsed.error?.issues ?? []) {
      const key = issue.path.join(".");

      if (isFieldKey(key)) {
        errors[key] ??= issue.message;
      }
    }

    card.setErrors(errors);

    return parsed.success;
  };

  const file = async () => {
    const request = await draft();

    if (!shot || !validate(request)) {
      return;
    }

    phase = "filing";
    updateAction();
    card.setProblem(null);
    bar.action.show("send", "Filing…");

    const result = submitResultSchema.parse(
      await ask({ draft: request, files: video ? [shot, video] : [shot], type: "submit" }),
    );

    if (!result.ok) {
      phase = "editing";
      updateAction();
      card.setProblem(result.reason);
      bar.action.show("send", "File request");

      return;
    }

    phase = "filed";
    updateAction();
    card.setDone(result);
    bar.action.show("check", "Filed!");
    await wait(SNAPPED_HOLD_MS);
    bar.action.show("capture", "New request");
  };

  bar.action.button.addEventListener("click", () => {
    if (phase === "picking") {
      void snap();
    } else if (phase === "editing") {
      void file();
    } else if (phase === "filed") {
      card.fields.name.control.value = "";
      card.fields.description.control.value = "";
      startPicking();
    }
  });

  const onKey = (event: KeyboardEvent) => {
    const fromToolbar = event.composedPath().includes(host);

    if (event.key === "Escape") {
      event.stopPropagation();

      if (bar.closeMenu()) {
        return;
      }

      if (phase === "picking" && selection.picked) {
        selection.clear();
      } else {
        destroy();
      }

      return;
    }

    if (phase !== "picking") {
      return;
    }

    if (event.key === "Enter" && selection.picked && !event.composedPath().includes(bar.menu)) {
      event.preventDefault();
      void snap();
    } else if (!fromToolbar && selection.walk(event.key)) {
      event.preventDefault();
    }
  };

  window.addEventListener("keydown", onKey, { capture: true, signal });
  root.addEventListener("click", (event) => {
    if (!event.composedPath().includes(bar.menu)) {
      bar.closeMenu();
    }
  });

  for (const type of ["keydown", "keyup", "keypress"]) {
    host.addEventListener(type, (event) => event.stopPropagation(), { signal });
  }

  const loadCredit = async () => {
    const credit = await creditItem.getValue();
    card.fields["credit.name"].control.value = credit.name;
    card.fields["credit.url"].control.value = credit.url;
  };

  void loadCredit();

  root.append(h("style", {}, [TOOLBAR_CSS]), layer, dock);
  document.documentElement.append(host);
  startPicking();

  return destroy;
};
