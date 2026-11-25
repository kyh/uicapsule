"use client";

import { memo, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

import type { ContentComponentSummary } from "@/lib/content/content-schema";
import { cn } from "cn";

import { MediaReveal } from "@/components/media-reveal";
import { Resizable } from "./resizable";

interface InspectBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

const blockEvent = (event: Event) => {
  event.preventDefault();
  event.stopPropagation();
};

const describe = (element: Element) => {
  const slot = "dataset" in element ? (element as HTMLElement).dataset.slot : undefined;

  if (slot) {
    return slot;
  }

  const tag = element.tagName.toLowerCase();
  const [firstClass] = element.classList;

  return firstClass ? `${tag}.${firstClass}` : tag;
};

const useInspector = (enabled: boolean, wrapperRef: RefObject<HTMLDivElement | null>) => {
  const [box, setBox] = useState<InspectBox | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;

    if (!enabled || !wrapper) {
      setBox(null);

      return;
    }

    let detach: (() => void) | null = null;

    const onLeave = () => setBox(null);

    const attach = (iframe: HTMLIFrameElement) => {
      detach?.();

      const doc = iframe.contentDocument;

      if (!doc?.documentElement) {
        return;
      }

      const root = doc.documentElement;

      const onMove = (event: PointerEvent) => {
        const { target } = event;

        if (!target || !("getBoundingClientRect" in target) || target === root) {
          setBox(null);

          return;
        }

        const element = target as Element;
        const rect = element.getBoundingClientRect();
        const frame = iframe.getBoundingClientRect();
        const outer = wrapper.getBoundingClientRect();

        setBox({
          height: rect.height,
          label: `${describe(element)} · ${Math.round(rect.width)}×${Math.round(rect.height)}`,
          width: rect.width,
          x: rect.left + frame.left - outer.left,
          y: rect.top + frame.top - outer.top,
        });
      };

      const previousCursor = root.style.cursor;
      root.style.cursor = "crosshair";
      doc.addEventListener("pointermove", onMove, true);
      root.addEventListener("pointerleave", onLeave);
      doc.addEventListener("click", blockEvent, true);
      doc.addEventListener("pointerdown", blockEvent, true);

      detach = () => {
        root.style.cursor = previousCursor;
        doc.removeEventListener("pointermove", onMove, true);
        root.removeEventListener("pointerleave", onLeave);
        doc.removeEventListener("click", blockEvent, true);
        doc.removeEventListener("pointerdown", blockEvent, true);
      };
    };

    let current: HTMLIFrameElement | null = null;
    const onLoad = () => current && attach(current);

    const bind = () => {
      const iframe = wrapper.querySelector("iframe");

      if (iframe === current) {
        return;
      }

      current?.removeEventListener("load", onLoad);
      current = iframe;

      if (!iframe) {
        return;
      }

      iframe.addEventListener("load", onLoad);
      attach(iframe);
    };

    bind();

    const observer = new MutationObserver(bind);
    observer.observe(wrapper, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      current?.removeEventListener("load", onLoad);
      detach?.();
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

  const src =
    component.type === "remote" ? component.iframeUrl : `/preview-frame/${component.slug}`;

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
