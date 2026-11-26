"use client";

import { memo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { noop } from "@tanstack/react-query";
import { cn } from "cn";

import type { ContentComponentSummary } from "@/lib/content/content-schema";
import type { ControlValue, PreviewControls } from "@/lib/preview-controls";
import { previewFrameSrc } from "@/lib/preview-protocol";
import type { InspectBox } from "@/lib/preview-protocol";

import { MediaReveal } from "@/components/media-reveal";
import { Resizable } from "./resizable";
import { usePreviewChannel } from "./use-preview-channel";

const NO_VALUES: Readonly<Record<string, ControlValue>> = {};

const previewTheme = (resolvedTheme: string | undefined) => {
  if (resolvedTheme === undefined || resolvedTheme === "") {
    return null;
  }

  return resolvedTheme === "dark" ? "dark" : "light";
};

export const PREVIEW_WIDTH = { full: 4000, md: 720, sm: 375 } as const;

interface PreviewStageProps {
  component: ContentComponentSummary;
  inspect: boolean;
  width: number;
  onWidthChange: (width: number) => void;
  values?: Readonly<Record<string, ControlValue>>;
  onControlsChange?: (controls: PreviewControls | null) => void;
}

const PreviewStageBase = ({
  component,
  inspect,
  width,
  onWidthChange,
  values = NO_VALUES,
  onControlsChange = noop,
}: PreviewStageProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState<HTMLIFrameElement | null>(null);
  const [box, setBox] = useState<InspectBox | null>(null);
  const { resolvedTheme } = useTheme();

  usePreviewChannel(component.type === "local" ? frame : null, {
    inspect,
    onControlsChange,
    onInspectBox: (viewportBox) => {
      const outer = wrapperRef.current?.getBoundingClientRect();

      setBox(
        viewportBox && outer
          ? { ...viewportBox, x: viewportBox.x - outer.left, y: viewportBox.y - outer.top }
          : null,
      );
    },
    theme: previewTheme(resolvedTheme),
    values,
  });

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
            frameRef={setFrame}
            iframe={{ src, title: component.name, type: component.type }}
          />
        </div>
      </Resizable>
      {inspect && box && (
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
