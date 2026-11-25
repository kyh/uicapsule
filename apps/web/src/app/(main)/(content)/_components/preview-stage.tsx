"use client";

import { memo, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

import type { ContentComponentSummary } from "@/lib/content/content-schema";
import { parseFrameMessage, previewFrameSrc } from "@/lib/preview-protocol";
import type { InspectBox, ParentMessage } from "@/lib/preview-protocol";
import { cn } from "cn";

import { MediaReveal } from "@/components/media-reveal";
import { Resizable } from "./resizable";

const useInspector = (enabled: boolean, wrapperRef: RefObject<HTMLDivElement | null>) => {
  const [box, setBox] = useState<InspectBox | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;

    if (!enabled || !wrapper) {
      setBox(null);

      return;
    }

    let current: HTMLIFrameElement | null = null;

    const send = (inspect: boolean) => {
      const message: ParentMessage = { enabled: inspect, type: "uicapsule:inspect" };
      current?.contentWindow?.postMessage(message, "*");
    };

    const onMessage = (event: MessageEvent) => {
      const iframe = current;

      if (!iframe || event.source !== iframe.contentWindow) {
        return;
      }

      const message = parseFrameMessage(event);

      if (message?.type === "uicapsule:ready") {
        send(true);
      }

      if (message?.type !== "uicapsule:inspect-box") {
        return;
      }

      if (!message.box) {
        setBox(null);

        return;
      }

      const frame = iframe.getBoundingClientRect();
      const outer = wrapper.getBoundingClientRect();

      setBox({
        ...message.box,
        x: message.box.x + frame.left - outer.left,
        y: message.box.y + frame.top - outer.top,
      });
    };

    const bind = () => {
      const iframe = wrapper.querySelector("iframe");

      if (iframe === current) {
        return;
      }

      current = iframe;
      send(true);
    };

    window.addEventListener("message", onMessage);
    bind();

    const observer = new MutationObserver(bind);
    observer.observe(wrapper, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("message", onMessage);
      send(false);
      setBox(null);
    };
  }, [enabled, wrapperRef]);

  return box;
};

export const PREVIEW_WIDTH = { full: 4000, md: 720, sm: 375 } as const;

interface PreviewStageProps {
  component: ContentComponentSummary;
  inspect: boolean;
  width: number;
  onWidthChange: (width: number) => void;
}

const PreviewStageBase = ({ component, inspect, width, onWidthChange }: PreviewStageProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const box = useInspector(inspect && component.type === "local", wrapperRef);

  const src = component.type === "remote" ? component.iframeUrl : previewFrameSrc(component.slug);

  return (
    <div ref={wrapperRef} className="relative flex h-full min-h-0 justify-center p-3 md:px-6">
      <Resizable
        className="h-full"
        width={width}
        minWidth={PREVIEW_WIDTH.sm}
        maxWidth={PREVIEW_WIDTH.full}
        onWidthChange={onWidthChange}
      >
        <div className="bg-background h-full w-full overflow-hidden rounded-lg border">
          <MediaReveal
            key={component.slug}
            className="h-full w-full"
            iframe={{ src, title: component.name, type: component.type }}
          />
        </div>
      </Resizable>
      {box && (
        <div
          aria-hidden
          className="border-primary bg-primary/10 pointer-events-none absolute z-10 rounded-[2px] border"
          style={{ height: box.height, left: box.x, top: box.y, width: box.width }}
        >
          <span className={cn("absolute left-[-1px]", box.y < 20 ? "top-0" : "-top-5")}>
            <span className="bg-primary text-primary-foreground block max-w-64 truncate rounded-sm px-1.5 py-0.5 font-[monospace] text-[10px] leading-none whitespace-nowrap">
              {box.label}
            </span>
          </span>
        </div>
      )}
    </div>
  );
};

export const PreviewStage = memo(PreviewStageBase);
