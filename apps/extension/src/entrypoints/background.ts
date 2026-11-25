import { componentRequestSchema } from "@repo/contract/request/request-schema";

import { fileRequest, uploadAttachment } from "@/lib/api";
import { cropScreenshot, downloadVideo } from "@/lib/capture";
import { decodeFile, encodeBlob } from "@/lib/encoding";
import { clampToViewport } from "@/lib/geometry";
import { workerRequestSchema } from "@/lib/messages";
import type { FileResult, SubmitResult, WorkerRequest } from "@/lib/messages";
import { serviceUrlItem } from "@/lib/storage";

const FALLBACK = "Something went wrong. Try again.";

const reasonFor = (error: Error | null) => error?.message ?? FALLBACK;

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
  const attachments: string[] = [];

  for (const file of request.files) {
    attachments.push(await uploadAttachment(serviceUrl, decodeFile(file)));
  }

  const filed = await fileRequest(serviceUrl, { ...parsed.data, attachments });

  return { number: filed.number, ok: true, url: filed.url } satisfies SubmitResult;
};

const handle = async (request: WorkerRequest, windowId: number | undefined) => {
  switch (request.type) {
    case "capture": {
      return capture(request, windowId);
    }

    case "video": {
      return video(request.src);
    }

    case "submit": {
      return submit(request);
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

const toggleToolbar = async (tabId: number) => {
  try {
    await browser.scripting.executeScript({ files: ["/picker.js"], target: { tabId } });
    await browser.tabs.sendMessage(tabId, { type: "toolbar:toggle" });
  } catch {
    await browser.action.setBadgeText({ tabId, text: "!" });
    await browser.action.setTitle({ tabId, title: "UICapsule can't capture this page" });
  }
};

export default defineBackground(() => {
  browser.action.onClicked.addListener((tab) => {
    if (tab.id !== undefined) {
      void toggleToolbar(tab.id);
    }
  });

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const request = workerRequestSchema.safeParse(message);

    if (!request.success) {
      return;
    }

    void respond(request.data, sender.tab?.windowId, sendResponse);

    return true;
  });
});
