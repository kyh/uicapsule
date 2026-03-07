"use client";

import { useCallback, useEffect, useState } from "react";
import {
  isLocalContentComponent,
  isRemoteContentComponent,
} from "@repo/api/content/content-schema";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/tabs";
import { useMediaQuery } from "@repo/ui/utils";
import { LaptopIcon, SmartphoneIcon } from "lucide-react";

import type { ContentComponent } from "@repo/api/content/content-schema";
import { Resizable } from "./resizable";
import { initializeSandpack } from "./sandpack";

type ContentRendererProps = {
  contentComponent: ContentComponent;
};

export const ContentRenderer = ({ contentComponent }: ContentRendererProps) => {
  const [iframe, setIframe] = useState<HTMLIFrameElement | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(
    "initializing",
  );
  const isDesktop = useMediaQuery();

  const [width, setWidth] = useState(() =>
    getInitialWidth(contentComponent.defaultSize),
  );
  const [size, setSize] = useState<"mobile" | "desktop">(() =>
    getInitialSize(contentComponent.defaultSize),
  );

  const handleSetWidth = useCallback((nextWidth: number) => {
    setWidth(nextWidth);
    setSize(nextWidth <= 360 ? "mobile" : "desktop");
  }, []);

  useEffect(() => {
    if (!iframe) return;
    if (!isLocalContentComponent(contentComponent)) return;
    initializeSandpack(iframe, contentComponent)
      .then((client) => {
        client.listen((message) => {
          if (message.type === "status") {
            setLoadingMessage(message.status);
          }
          if (message.type === "done") {
            setLoadingMessage(null);
          }
        });
      })
      .catch((error) => {
        console.error(error);
      });
  }, [iframe, contentComponent]);

  const content = (
    <>
      {loadingMessage && (
        <div className="bg-background absolute flex h-full w-full items-center justify-center">
          <p className="text-primary font-mono text-sm">{loadingMessage}...</p>
        </div>
      )}
      <iframe
        className="h-full w-full"
        ref={setIframe}
        {...(isRemoteContentComponent(contentComponent) && {
          title: contentComponent.name,
          src: contentComponent.iframeUrl,
          onLoad: () => {
            setLoadingMessage(null);
          },
          onError: (error) => {
            console.error(error);
            setLoadingMessage("error loading iframe");
          },
        })}
      />
    </>
  );

  return (
    <div className="flex h-full flex-col gap-2 pb-2">
      {isDesktop ? (
        <Resizable className="flex-1" width={width} setWidth={handleSetWidth}>
          {content}
        </Resizable>
      ) : (
        <div className="relative w-[calc(100dvw-(--spacing(3)))] flex-1 pb-2">
          {content}
        </div>
      )}
      <Tabs
        className="hidden items-center md:flex"
        value={size}
        onValueChange={(value) =>
          handleSetWidth(value === "mobile" ? 360 : 720)
        }
      >
        <TabsList>
          <TabsTrigger
            value="desktop"
            className="px-2 py-2"
            isSelected={size === "desktop"}
          >
            <LaptopIcon size={16} aria-hidden="true" />
          </TabsTrigger>
          <TabsTrigger
            value="mobile"
            className="px-2 py-2"
            isSelected={size === "mobile"}
          >
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
