"use client";

import { useCallback, useState } from "react";
import { isRemoteContentComponent } from "@repo/api/content/content-schema";
import { Tabs, TabsIndicator, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { useMediaQuery } from "@repo/ui/hooks/use-media-query";
import { LaptopIcon, SmartphoneIcon } from "lucide-react";

import type { ContentComponent } from "@repo/api/content/content-schema";
import { Resizable } from "./resizable";

type ContentRendererProps = {
  contentComponent: ContentComponent;
};

export const ContentRenderer = ({ contentComponent }: ContentRendererProps) => {
  const isDesktop = useMediaQuery();

  const [width, setWidth] = useState(() => getInitialWidth(contentComponent.defaultSize));
  const [size, setSize] = useState<"mobile" | "desktop">(() =>
    getInitialSize(contentComponent.defaultSize),
  );

  const handleSetWidth = useCallback((nextWidth: number) => {
    setWidth(nextWidth);
    setSize(nextWidth <= 360 ? "mobile" : "desktop");
  }, []);

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
        <Resizable className="flex-1" width={width} setWidth={handleSetWidth}>
          {content}
        </Resizable>
      ) : (
        <div className="relative w-[calc(100dvw-(--spacing(3)))] flex-1 pb-2">{content}</div>
      )}
      <Tabs
        className="hidden items-center md:flex"
        value={size}
        onValueChange={(value) => handleSetWidth(value === "mobile" ? 360 : 720)}
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

const getInitialWidth = (defaultSize?: "full" | "md" | "sm") => {
  if (defaultSize === "sm") return 360;
  if (defaultSize === "full") return 1392;
  return 720;
};

const getInitialSize = (defaultSize?: "full" | "md" | "sm") =>
  defaultSize === "sm" ? "mobile" : "desktop";
