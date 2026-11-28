import { useEffect, useEffectEvent, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { AnnotationLayer, marksBox } from "@repo/inspector/annotation-layer";
import type { AnnotationTool } from "@repo/inspector/annotation-layer";
import { ElementPicker } from "@repo/inspector/element-picker";
import { Inspector } from "@repo/inspector/inspector-root";
import { unionRect } from "@repo/inspector/geometry";
import { selectionBox, visiblePart } from "@repo/inspector/selection";
import type { Selection } from "@repo/inspector/selection";
import { isTyping, useAnnotations } from "@repo/inspector/use-annotations";

import { labelFor } from "../element";
import { decodeFile } from "../encoding";
import type { Encoded, OverlayStart } from "../messages";
import { serviceUrlItem } from "../storage";
import { barCommand } from "./bar-keys";
import type { BarCommand } from "./bar-keys";
import { CaptureBar } from "./capture-bar";
import type { BarTool } from "./capture-bar";
import { RequestDialog } from "./request-dialog";
import type { FieldErrors, Fields, VideoChip } from "./request-dialog";
import {
  attachVideo,
  captureRect,
  draftFor,
  fileDraft,
  mediaFor,
  savedFields,
} from "./request-flow";
import type { Picked } from "./request-flow";
import { Toast } from "./toast";
import type { ToastData } from "./toast";

interface Filing {
  busy: string | null;
  errors: FieldErrors;
  initial: Fields;
  picked: Picked;
  problem: string | null;
  references: string[];
  shot: Encoded;
  url: string;
  video: Encoded | null;
  videoChip: VideoChip;
}

type Phase =
  | { kind: "capturing" }
  | { kind: "done" }
  | { kind: "editing" }
  | ({ kind: "dialog" } & Filing);

const nextFrame = async () => {
  const frame = Promise.withResolvers<null>();

  requestAnimationFrame(() => {
    frame.resolve(null);
  });

  await frame.promise;
};

const hostOf = (url: string) => {
  try {
    return new URL(url).host.replace(/^www\./u, "");
  } catch {
    return url;
  }
};

const initialSelection = (start: OverlayStart) => {
  if (start.tool === "visible") {
    return { kind: "visible" } satisfies Selection;
  }

  const element =
    start.tool === "media" && start.src !== undefined ? mediaFor(start.src) : undefined;

  if (element) {
    element.scrollIntoView({ block: "nearest", inline: "nearest" });

    return { element, kind: "element" } satisfies Selection;
  }

  return start.tool === "media" ? ({ kind: "visible" } satisfies Selection) : null;
};

const pickedFrom = (selection: Selection, rect: Picked["rect"]) => {
  if (selection.kind === "element") {
    return {
      element: selection.element,
      label: labelFor(selection.element),
      rect,
    } satisfies Picked;
  }

  return { label: selection.kind === "visible" ? "Visible area" : "Area", rect } satisfies Picked;
};

const shotRect = (selection: Selection, marks: Element | null) => {
  const box = selectionBox(selection);
  const drawn = marks ? marksBox(marks) : null;

  return visiblePart(drawn ? unionRect(box, drawn) : box);
};

/**
 * The extension's overlay: the inspect bar over the page, then the request dialog over a capture
 * of the selection with its annotations, then a toast. Closing before filing keeps nothing.
 */
export const OverlayApp = ({ onClose, start }: { onClose: () => void; start: OverlayStart }) => {
  const [selection, setSelection] = useState<Selection | null>(() => initialSelection(start));
  const [tool, setTool] = useState<BarTool>("inspect");
  const [lastAnnotate, setLastAnnotate] = useState<AnnotationTool>("select");
  const [phase, setPhase] = useState<Phase>({ kind: "editing" });
  const [toast, setToast] = useState<ToastData | null>(null);
  const generation = useRef(0);
  const marks = useRef<HTMLDivElement>(null);
  const editing = phase.kind === "editing";
  const annotations = useAnnotations(editing);

  const updateFiling = (patch: Partial<Filing>) => {
    setPhase((current) => (current.kind === "dialog" ? { ...current, ...patch } : current));
  };

  const chooseTool = (next: BarTool) => {
    setTool(next);

    if (next !== "inspect") {
      setLastAnnotate(next);
    }
  };

  const request = async () => {
    const target = selection ?? ({ kind: "visible" } satisfies Selection);
    const rect = shotRect(target, marks.current);

    if (!editing) {
      return;
    }

    if (!rect) {
      setToast({
        text: "Scroll it into view, then try again.",
        title: "Nothing visible to capture",
        tone: "error",
      });

      return;
    }

    generation.current += 1;
    const run = generation.current;
    flushSync(() => {
      setPhase({ kind: "capturing" });
    });
    await nextFrame();
    await nextFrame();

    const result = await captureRect(rect);

    if (!result.ok) {
      setPhase({ kind: "editing" });
      setToast({ text: result.reason, title: "Couldn't capture this", tone: "error" });

      return;
    }

    const picked = pickedFrom(target, rect);

    setPhase({
      busy: null,
      errors: {},
      initial: await savedFields(),
      kind: "dialog",
      picked,
      problem: null,
      references: [],
      shot: result.file,
      url: URL.createObjectURL(decodeFile(result.file)),
      video: null,
      videoChip: null,
    });

    const video = await attachVideo(picked.element, (videoChip) => {
      if (run === generation.current) {
        updateFiling({
          busy: videoChip?.state === "working" ? "Attaching video…" : null,
          videoChip,
        });
      }
    });

    if (run === generation.current) {
      updateFiling({ busy: null, references: video.references, video: video.video });
    }
  };

  const backToPage = () => {
    generation.current += 1;
    setPhase((current) => {
      if (current.kind === "dialog") {
        URL.revokeObjectURL(current.url);
      }

      return { kind: "editing" };
    });
  };

  const submit = async (fields: Fields) => {
    if (phase.kind !== "dialog" || phase.busy !== null) {
      return;
    }

    const run = generation.current;
    updateFiling({ busy: "Filing…", problem: null });

    const { draft, errors, ok } = await draftFor(fields, phase.picked, phase.references);

    if (!ok) {
      updateFiling({ busy: null, errors });

      return;
    }

    const filed = await fileDraft(draft, phase.video ? [phase.shot, phase.video] : [phase.shot]);

    if (run !== generation.current) {
      return;
    }

    if (!filed.ok) {
      updateFiling({ busy: null, errors: {}, problem: filed.reason });

      return;
    }

    URL.revokeObjectURL(phase.url);
    setPhase({ kind: "done" });
    setToast({
      link: { href: filed.url, label: "View" },
      text: "If it gets built, it lands in the gallery with your credit.",
      title: filed.number === undefined ? "Request filed" : `Request #${filed.number} filed`,
    });
  };

  const back = () => {
    if (annotations.selectedId !== null) {
      annotations.setSelectedId(null);
    } else if (selection === null) {
      onClose();
    } else {
      setSelection(null);
      chooseTool("inspect");
    }
  };

  const run = (command: BarCommand) => {
    switch (command.kind) {
      case "back": {
        back();
        break;
      }

      case "request": {
        void request();
        break;
      }

      case "visible": {
        setSelection({ kind: "visible" });
        chooseTool("inspect");
        break;
      }

      case "tool": {
        chooseTool(command.tool === "last-annotate" ? lastAnnotate : command.tool);
        break;
      }

      default: {
        break;
      }
    }
  };

  const onKey = useEffectEvent((event: KeyboardEvent) => {
    const command = editing && !isTyping(event) ? barCommand(event) : null;

    if (command) {
      event.preventDefault();
      event.stopPropagation();
      run(command);
    }
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      onKey(event);
    };

    window.addEventListener("keydown", listener, { capture: true });

    return () => {
      window.removeEventListener("keydown", listener, { capture: true });
    };
  }, []);

  const [target, setTarget] = useState("uicapsule.com");

  useEffect(() => {
    const load = async () => {
      setTarget(hostOf(await serviceUrlItem.getValue()));
    };

    void load();
  }, []);

  return (
    <Inspector capturing={phase.kind === "capturing"}>
      {phase.kind === "done" ? null : (
        <>
          <ElementPicker
            active={editing && tool === "inspect"}
            hint={
              <>
                Click an element or drag an area. <kbd>Esc</kbd> to close.
              </>
            }
            labelFor={labelFor}
            selection={selection}
            onSelect={setSelection}
          />
          <AnnotationLayer
            ref={marks}
            state={annotations}
            tool={editing && tool !== "inspect" ? tool : null}
          />
        </>
      )}
      {editing || phase.kind === "capturing" ? (
        <CaptureBar
          tool={tool}
          visible={selection?.kind === "visible"}
          onClose={onClose}
          onGroup={(group) => {
            chooseTool(group === "capture" ? "inspect" : lastAnnotate);
          }}
          onRequest={() => {
            void request();
          }}
          onTool={chooseTool}
          onVisible={() => {
            setSelection({ kind: "visible" });
          }}
        />
      ) : null}
      {phase.kind === "dialog" ? (
        <RequestDialog
          busy={phase.busy}
          errors={phase.errors}
          initial={phase.initial}
          problem={phase.problem}
          shot={{
            height: phase.picked.rect.height,
            url: phase.url,
            width: phase.picked.rect.width,
          }}
          target={target}
          video={phase.videoChip}
          where={`${phase.picked.label} on ${location.host}`}
          onCancel={backToPage}
          onSubmit={(fields) => {
            void submit(fields);
          }}
        />
      ) : null}
      {toast ? (
        <Toast
          toast={toast}
          onGone={() => {
            setToast(null);

            if (phase.kind === "done") {
              onClose();
            }
          }}
        />
      ) : null}
    </Inspector>
  );
};
