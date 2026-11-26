"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { noop } from "@tanstack/react-query";

import type { ControlValue, PreviewControls } from "@/lib/preview-controls";
import { parseFrameMessage } from "@/lib/preview-protocol";
import type { InspectBox, ParentMessage, PreviewTheme } from "@/lib/preview-protocol";

interface FrameSession {
  readonly controls: PreviewControls | null;
  readonly frame: HTMLIFrameElement;
}

interface PreviewChannelOptions {
  theme: PreviewTheme | null;
  inspect: boolean;
  values: Readonly<Record<string, ControlValue>>;
  onControlsChange: (controls: PreviewControls | null) => void;
  onInspectBox: (box: InspectBox | null) => void;
}

const send = (frame: HTMLIFrameElement, message: ParentMessage) => {
  frame.contentWindow?.postMessage(message, "*");
};

/**
 * The site's half of the preview protocol for one local preview frame (null for none). Every
 * `uicapsule:ready` opens a session that receives the current theme, inspect state and prop
 * values, so a reload or HMR re-run keeps them; later changes are posted as they happen, props
 * at most once per animation frame. `onControlsChange` hears each session's controls, null when
 * the preview declares none; `onInspectBox` gets boxes in viewport coordinates.
 */
export const usePreviewChannel = (
  frame: HTMLIFrameElement | null,
  { theme, inspect, values, onControlsChange, onInspectBox }: PreviewChannelOptions,
) => {
  const [session, setSession] = useState<FrameSession | null>(null);
  const ready = session?.frame === frame ? session : null;
  const reportControls = useEffectEvent(onControlsChange);
  const reportBox = useEffectEvent(onInspectBox);

  useEffect(() => {
    const target = frame?.contentWindow;

    if (!frame || !target) {
      return noop;
    }

    const onMessage = (event: MessageEvent) => {
      if (event.source !== target) {
        return;
      }

      const message = parseFrameMessage(event);

      if (message?.type === "uicapsule:ready") {
        setSession({ controls: message.controls, frame });
      }

      if (message?.type === "uicapsule:inspect-box") {
        const rect = frame.getBoundingClientRect();

        reportBox(
          message.box && {
            ...message.box,
            x: message.box.x + rect.left,
            y: message.box.y + rect.top,
          },
        );
      }
    };

    window.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("message", onMessage);
      reportBox(null);
    };
  }, [frame]);

  useEffect(() => {
    if (ready) {
      reportControls(ready.controls);
    }
  }, [ready]);

  useEffect(() => {
    if (ready && theme) {
      send(ready.frame, { theme, type: "uicapsule:theme" });
    }
  }, [ready, theme]);

  useEffect(() => {
    if (ready) {
      send(ready.frame, { enabled: inspect, type: "uicapsule:inspect" });
    }
  }, [ready, inspect]);

  useEffect(() => {
    if (!ready?.controls) {
      return noop;
    }

    const { frame: target } = ready;

    const pending = requestAnimationFrame(() => {
      send(target, { type: "uicapsule:props", values });
    });

    return () => {
      cancelAnimationFrame(pending);
    };
  }, [ready, values]);
};
