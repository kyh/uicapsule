import { componentRequestSchema } from "@repo/contract/request/request-schema";

import { fileRequest, uploadAttachment } from "@/lib/api";
import { cropScreenshot, downloadVideo } from "@/lib/capture";
import { decodeFile, encodeBlob } from "@/lib/encoding";
import { clampToViewport } from "@repo/inspector/geometry";
import { workerRequestSchema } from "@/lib/messages";
import type {
  FileResult,
  OverlayMessage,
  OverlayStart,
  SubmitResult,
  WorkerRequest,
} from "@/lib/messages";
import { serviceUrlItem } from "@/lib/storage";

const FALLBACK = "Something went wrong. Try again.";

const OFFLINE = "Couldn't reach UICapsule. Check your connection, or the service URL in Settings.";

const reasonFor = (error: Error | null) => {
  if (error instanceof TypeError) {
    return OFFLINE;
  }

  return error?.message ?? FALLBACK;
};

const capture = async (
  request: Extract<WorkerRequest, { type: "capture" }>,
  windowId: number | undefined,
) => {
  const visible = clampToViewport(request.rect, request.viewport);

  if (!visible || windowId === undefined) {
    return { ok: false, reason: "Nothing visible to capture." } satisfies FileResult;
  }

  const shot = await browser.tabs.captureVisibleTab(windowId, { format: "png" });
  const image = await cropScreenshot(shot, visible, request.viewport.width);

  return { file: await encodeBlob(image, image.name), ok: true } satisfies FileResult;
};

const video = async (src: string) => {
  const download = await downloadVideo(src);

  if (!download.ok) {
    return download;
  }

  return {
    file: await encodeBlob(download.file, download.file.name),
    ok: true,
  } satisfies FileResult;
};

const submit = async (request: Extract<WorkerRequest, { type: "submit" }>) => {
  const parsed = componentRequestSchema.safeParse({ ...request.draft, attachments: [] });

  if (!parsed.success) {
    return {
      ok: false,
      reason: parsed.error.issues[0]?.message ?? "Check the form.",
    } satisfies SubmitResult;
  }

  const serviceUrl = await serviceUrlItem.getValue();

  const attachments = await Promise.all(
    request.files.map(async (file) => await uploadAttachment(serviceUrl, decodeFile(file))),
  );

  const filed = await fileRequest(serviceUrl, { ...parsed.data, attachments });

  return { number: filed.number, ok: true, url: filed.url } satisfies SubmitResult;
};

const handle = async (request: WorkerRequest, windowId: number | undefined) => {
  switch (request.type) {
    case "capture": {
      return await capture(request, windowId);
    }

    case "video": {
      return await video(request.src);
    }

    case "submit": {
      return await submit(request);
    }

    case "options": {
      await browser.runtime.openOptionsPage();

      return { ok: true };
    }

    default: {
      return { ok: false, reason: FALLBACK };
    }
  }
};

const respond = async (
  request: WorkerRequest,
  windowId: number | undefined,
  sendResponse: (response: Awaited<ReturnType<typeof handle>>) => void,
) => {
  try {
    sendResponse(await handle(request, windowId));
  } catch (error) {
    sendResponse({ ok: false, reason: reasonFor(error instanceof Error ? error : null) });
  }
};

const UNREACHABLE = "UICapsule can't capture this page. Open a regular web page and try again.";
const TITLE = "Request a component";

const MENUS = {
  "uicapsule-image": { contexts: ["image"], title: "Request from this image", tool: "media" },
  "uicapsule-region": { contexts: ["all"], title: "Capture region", tool: "region" },
  "uicapsule-video": { contexts: ["video"], title: "Request from this video", tool: "media" },
  "uicapsule-visible": { contexts: ["all"], title: "Capture visible area", tool: "visible" },
} satisfies Record<
  string,
  { contexts: ["all" | "image" | "video"]; title: string; tool: OverlayStart["tool"] }
>;

const COMMANDS = {
  "capture-region": "region",
  "capture-visible": "visible",
} satisfies Record<string, OverlayStart["tool"]>;

const isCommand = (command: string): command is keyof typeof COMMANDS =>
  Object.hasOwn(COMMANDS, command);

const createMenus = async () => {
  await browser.contextMenus.removeAll();

  for (const [id, menu] of Object.entries(MENUS)) {
    browser.contextMenus.create({ contexts: menu.contexts, id, title: menu.title });
  }
};

const isMenu = (id: string): id is keyof typeof MENUS => Object.hasOwn(MENUS, id);

const sendToOverlay = async (tabId: number, message: OverlayMessage) => {
  try {
    await browser.scripting.executeScript({ files: ["/overlay.js"], target: { tabId } });
    await browser.tabs.sendMessage(tabId, message);
    await browser.action.setBadgeText({ tabId, text: "" });
    await browser.action.setTitle({ tabId, title: TITLE });
  } catch {
    await browser.action.setBadgeText({ tabId, text: "!" });
    await browser.action.setTitle({ tabId, title: UNREACHABLE });
  }
};

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    void createMenus();
  });

  browser.contextMenus.onClicked.addListener((info, tab) => {
    const id = String(info.menuItemId);

    if (tab?.id !== undefined && isMenu(id)) {
      void sendToOverlay(tab.id, { src: info.srcUrl, tool: MENUS[id].tool, type: "overlay:start" });
    }
  });

  browser.action.onClicked.addListener((tab) => {
    if (tab.id !== undefined) {
      void sendToOverlay(tab.id, { type: "overlay:toggle" });
    }
  });

  browser.commands.onCommand.addListener((command, tab) => {
    if (isCommand(command) && tab?.id !== undefined) {
      void sendToOverlay(tab.id, { tool: COMMANDS[command], type: "overlay:start" });
    }
  });

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const request = workerRequestSchema.safeParse(message);

    if (request.success) {
      void respond(request.data, sender.tab?.windowId, sendResponse);
    }

    // oxlint-disable-next-line typescript/strict-void-return -- Chrome keeps the channel open for an async sendResponse only when the listener returns true; @wxt-dev/browser types the listener as returning void
    return request.success;
  });
});
