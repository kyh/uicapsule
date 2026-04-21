"use client";

import { useState } from "react";
import { isRemoteContentComponent } from "@repo/api/content/content-schema";
import { Tabs, TabsIndicator, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { useMediaQuery } from "@repo/ui/hooks/use-media-query";
import { LaptopIcon, SmartphoneIcon } from "lucide-react";

import type { ContentComponent, DefaultSize } from "@repo/api/content/content-schema";
import { Resizable } from "./resizable";

const WIDTH_BY_SIZE = { sm: 360, md: 720, full: 1392 } as const satisfies Record<
  DefaultSize,
  number
>;
const MOBILE_MAX_WIDTH = WIDTH_BY_SIZE.sm;
const MOBILE_WIDTH = WIDTH_BY_SIZE.sm;
const DESKTOP_WIDTH = WIDTH_BY_SIZE.md;

type ContentRendererProps = {
  contentComponent: ContentComponent;
};

export const ContentRenderer = ({ contentComponent }: ContentRendererProps) => {
  const isDesktop = useMediaQuery();
  const [width, setWidth] = useState<number>(
    () => WIDTH_BY_SIZE[contentComponent.defaultSize ?? "md"],
  );
  const size = width <= MOBILE_MAX_WIDTH ? "mobile" : "desktop";

  const src = isRemoteContentComponent(contentComponent)
    ? contentComponent.iframeUrl
    : `/preview-frame/${contentComponent.slug}`;

  const content = (
    <iframe
      className="bg-background h-full w-full"
      title={contentComponent.name}
      src={src}
    />
  );

  return (
    <div className="flex h-full flex-col gap-2 pb-2">
      {isDesktop ? (
        <Resizable className="flex-1" width={width} setWidth={setWidth}>
          {content}
        </Resizable>
      ) : (
        <div className="relative w-[calc(100dvw-(--spacing(3)))] flex-1 pb-2">{content}</div>
      )}
      <Tabs
        className="hidden items-center md:flex"
        value={size}
        onValueChange={(value) => setWidth(value === "mobile" ? MOBILE_WIDTH : DESKTOP_WIDTH)}
      >
        <TabsList>
          <TabsIndicator />
          <TabsTrigger value="desktop" className="px-2 py-2">
            <LaptopIcon size={16} aria-hidden="true" />
          </TabsTrigger>
          <TabsTrigger value="mobile" className="px-2 py-2">
            <SmartphoneIcon size={16} aria-hidden="true" />
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export const ContentRendererSkeleton = () => {
  return (
    <div className="flex h-full w-full flex-col gap-2 pb-2">
      <div className="bg-muted mx-auto h-full w-full max-w-[720px] animate-pulse rounded-md" />
      <div className="bg-muted mx-auto hidden h-9 w-18.5 animate-pulse rounded-lg md:flex" />
    </div>
  );
};
