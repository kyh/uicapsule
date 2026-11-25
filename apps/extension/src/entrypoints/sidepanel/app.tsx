import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@repo/ui/components/button";
import { Logo } from "@repo/ui/components/logo";
import { Spinner } from "@repo/ui/components/spinner";
import { cn } from "cn";
import { MousePointerClick, SquareDashedMousePointer } from "lucide-react";

import { cropScreenshot, dataUrlToFile, downloadVideo } from "@/lib/capture";
import { pickerEventSchema, recordingSchema } from "@/lib/messages";
import type { PickMode, Selection } from "@/lib/messages";
import { addReference } from "@/lib/references";
import { creditItem, DEFAULT_SERVICE_URL, serviceUrlItem } from "@/lib/storage";

import { CapturePreview } from "./capture-preview";
import { FiledCard } from "./filed-card";
import { RequestForm } from "./request-form";
import { Settings } from "./settings";
import type { Capture, Filed, Media, Target, VideoStatus } from "./types";
import { FALLBACK_ERROR, toMedia } from "./types";

type MessageListener = Parameters<typeof browser.runtime.onMessage.addListener>[0];

const revokeAll = (capture: Capture | null) => {
  for (const media of capture?.media ?? []) {
    URL.revokeObjectURL(media.previewUrl);
  }
};

const ModeButton = (props: {
  active: boolean;
  disabled: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    disabled={props.disabled}
    onClick={props.onClick}
    className={cn(
      "flex flex-1 flex-col items-center gap-2 rounded-xl border border-border px-3 py-4 text-sm font-medium transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-5",
      props.active && "border-primary bg-muted",
    )}
  >
    {props.icon}
    {props.label}
  </button>
);

const injectPicker = async (mode: PickMode) => {
  const granted = await browser.permissions.request({ origins: ["<all_urls>"] });

  if (!granted) {
    throw new Error("UICapsule needs access to the page to capture it.");
  }

  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

  if (tab?.id === undefined) {
    throw new Error("Open the page you want to capture first.");
  }

  try {
    await browser.scripting.executeScript({ files: ["/picker.js"], target: { tabId: tab.id } });
    await browser.tabs.sendMessage(tab.id, { mode, type: "picker:start" });
  } catch {
    throw new Error("This page can't be captured. Try it on a regular website.");
  }

  return { mode, tabId: tab.id, windowId: tab.windowId } satisfies Target;
};

const recordInTab = async (tabId: number) => {
  const response = await browser.tabs
    .sendMessage(tabId, { type: "picker:record" })
    .catch(() => null);

  const recording = recordingSchema.safeParse(response);

  if (!recording.success) {
    return { ok: false, reason: "The recording didn't come back." } as const;
  }

  if (!recording.data.ok) {
    return recording.data;
  }

  return { file: await dataUrlToFile(recording.data.dataUrl, "recording.webm"), ok: true } as const;
};

export const App = () => {
  const [serviceUrl, setServiceUrl] = useState(DEFAULT_SERVICE_URL);
  const [credit, setCredit] = useState({ name: "", url: "" });
  const [target, setTarget] = useState<Target | null>(null);
  const [processing, setProcessing] = useState(false);
  const [capture, setCapture] = useState<Capture | null>(null);
  const [references, setReferences] = useState("");
  const [filed, setFiled] = useState<Filed | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [url, savedCredit] = await Promise.all([
        serviceUrlItem.getValue(),
        creditItem.getValue(),
      ]);

      setServiceUrl(url);
      setCredit(savedCredit);
    };

    void load();
  }, []);

  useEffect(() => {
    const dark = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => document.documentElement.classList.toggle("dark", dark.matches);

    apply();
    dark.addEventListener("change", apply);

    return () => dark.removeEventListener("change", apply);
  }, []);

  const updateVideo = (video: VideoStatus, media?: Media) =>
    setCapture((current) =>
      current
        ? { ...current, media: media ? [...current.media, media] : current.media, video }
        : current,
    );

  const captureVideo = async (selection: Selection, tabId: number) => {
    const { video } = selection;

    if (!video) {
      return;
    }

    if (video.kind === "file") {
      updateVideo({ state: "working", text: "Downloading the video…" });
      const download = await downloadVideo(video.src);

      if (download.ok) {
        updateVideo(
          { state: "attached", text: "Video file attached." },
          toMedia(download.file, "Video file"),
        );

        return;
      }
    }

    updateVideo({ state: "working", text: "Recording a few seconds of the video…" });
    const recording = await recordInTab(tabId);

    if (recording.ok) {
      updateVideo(
        { state: "attached", text: "Recorded clip attached." },
        toMedia(recording.file, "Recorded clip"),
      );

      return;
    }

    if (video.kind === "file") {
      setReferences((current) => addReference(current, video.src));
    }

    updateVideo({
      state: "linked",
      text:
        video.kind === "file"
          ? `${recording.reason} Linked the video under other links instead.`
          : `${recording.reason} Only the screenshot is attached.`,
    });
  };

  const process = async (selection: Selection, picked: Target) => {
    setProcessing(true);

    try {
      const shot = await browser.tabs.captureVisibleTab(picked.windowId, { format: "png" });
      const image = await cropScreenshot(shot, selection);

      setCapture((current) => {
        revokeAll(current);

        return { media: [toMedia(image, "Screenshot")], selection, video: { state: "none" } };
      });
      setProcessing(false);
      await captureVideo(selection, picked.tabId);
    } catch (error) {
      setProcessing(false);
      setProblem(error instanceof Error ? error.message : FALLBACK_ERROR);
    }
  };

  useEffect(() => {
    if (!target) {
      return;
    }

    const listener: MessageListener = (message, sender) => {
      const event = pickerEventSchema.safeParse(message);

      if (!event.success || sender.tab?.id !== target.tabId) {
        return;
      }

      setTarget(null);

      if (event.data.type === "picker:done") {
        void process(event.data.selection, target);
      }
    };

    browser.runtime.onMessage.addListener(listener);

    return () => browser.runtime.onMessage.removeListener(listener);
  });

  const stopPicker = () => {
    if (target) {
      void browser.tabs.sendMessage(target.tabId, { type: "picker:stop" }).catch(() => null);
    }
  };

  const pick = async (mode: PickMode) => {
    setProblem(null);
    stopPicker();
    setTarget(null);

    try {
      setTarget(await injectPicker(mode));
    } catch (error) {
      setProblem(error instanceof Error ? error.message : FALLBACK_ERROR);
    }
  };

  const cancelPick = () => {
    stopPicker();
    setTarget(null);
  };

  const removeMedia = (id: string) =>
    setCapture((current) => {
      if (!current) {
        return current;
      }

      for (const media of current.media) {
        if (media.id === id) {
          URL.revokeObjectURL(media.previewUrl);
        }
      }

      return { ...current, media: current.media.filter((media) => media.id !== id) };
    });

  const reset = () => {
    revokeAll(capture);
    setCapture(null);
    setFiled(null);
    setReferences("");
    setProblem(null);
  };

  const changeServiceUrl = (url: string) => {
    setServiceUrl(url);
    void serviceUrlItem.setValue(url);
  };

  const busy = processing || capture?.video.state === "working";

  return (
    <main className="flex min-h-screen flex-col gap-5 p-4">
      <header className="flex items-center gap-2">
        <Logo className="size-6" />
        <h1 className="text-sm font-semibold">Request a component</h1>
      </header>

      {filed && <FiledCard filed={filed} onReset={reset} />}

      {!filed && (
        <section className="flex flex-col gap-2">
          <div className="flex gap-2">
            <ModeButton
              active={target?.mode === "area"}
              disabled={busy}
              icon={<SquareDashedMousePointer />}
              label="Select area"
              onClick={() => {
                void pick("area");
              }}
            />
            <ModeButton
              active={target?.mode === "element"}
              disabled={busy}
              icon={<MousePointerClick />}
              label="Pick element"
              onClick={() => {
                void pick("element");
              }}
            />
          </div>
          {target ? (
            <p className="flex items-center justify-between text-xs text-muted-foreground">
              {target.mode === "area"
                ? "Drag over the page to select."
                : "Click an element on the page."}
              <Button variant="ghost" size="xs" onClick={cancelPick}>
                Cancel
              </Button>
            </p>
          ) : (
            !capture && (
              <p className="text-xs text-muted-foreground">
                Saw an interaction worth having? Select it on the page. Pick a video and it comes
                along too.
              </p>
            )
          )}
        </section>
      )}

      {processing && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="size-4" />
          Capturing…
        </p>
      )}

      {problem && <p className="text-sm text-destructive">{problem}</p>}

      {capture && !filed && (
        <>
          <CapturePreview capture={capture} onRemove={removeMedia} />
          <RequestForm
            busy={busy}
            capture={capture}
            credit={credit}
            onCreditChange={setCredit}
            onFiled={setFiled}
            onReferencesChange={setReferences}
            onReset={reset}
            references={references}
            serviceUrl={serviceUrl}
          />
        </>
      )}

      <Settings key={serviceUrl} serviceUrl={serviceUrl} onChange={changeServiceUrl} />
    </main>
  );
};
