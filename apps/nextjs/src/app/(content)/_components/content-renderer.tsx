"use client";

import { useCallback, useEffect, useState } from "react";
import { isRemoteContentComponent } from "@repo/api/content/content-data";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/tabs";
import { useMediaQuery } from "@repo/ui/utils";
import { LaptopIcon, SmartphoneIcon } from "lucide-react";

import type {
  ContentComponent,
  LocalContentComponent,
  RemoteContentComponent,
} from "@repo/api/content/content-data";
import { Resizable } from "./resizable";
import { SandpackLayout, SandpackPreview, useSandpack } from "./sandpack";

type ContentRendererProps = {
  contentComponent: ContentComponent;
};

const getInitialWidth = (defaultSize?: "full" | "md" | "sm") => {
  if (defaultSize === "sm") {
    return 360;
  }
  if (defaultSize === "full") {
    return 1392;
  }
  return 720;
};

const getInitialSize = (defaultSize?: "full" | "md" | "sm") =>
  defaultSize === "sm" ? "mobile" : "desktop";

type PreviewScaffoldProps = {
  isDesktop: boolean;
  width: number;
  size: "mobile" | "desktop";
  onWidthChange: (width: number) => void;
  children: React.ReactNode;
};

const PreviewScaffold = ({
  isDesktop,
  width,
  size,
  onWidthChange,
  children,
}: PreviewScaffoldProps) => (
  <div className="flex h-full flex-col gap-2 pb-2">
    {isDesktop ? (
      <Resizable className="flex-1" width={width} setWidth={onWidthChange}>
        {children}
      </Resizable>
    ) : (
      <div className="w-[calc(100dvw-theme(spacing.3))] flex-1 pb-2">
        {children}
      </div>
    )}
    <Tabs
      className="hidden items-center md:flex"
      value={size}
      onValueChange={(value) => onWidthChange(value === "mobile" ? 360 : 720)}
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

const LocalContentRenderer = ({
  contentComponent,
}: {
  contentComponent: LocalContentComponent;
}) => {
  const isDesktop = useMediaQuery();
  const { sandpack } = useSandpack();
  const [initialized, setInitialized] = useState(false);
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
    if (sandpack.status === "idle" && !initialized) {
      sandpack.runSandpack().catch(console.error);
    }
    if (sandpack.status === "running") {
      document.querySelector(".sp-loading")?.setAttribute("hidden", "true");
    }
    setInitialized(true);
  }, [sandpack, initialized]);

  useEffect(() => {
    setInitialized(false);
  }, [isDesktop, contentComponent.slug]);

  const content = (
    <SandpackLayout>
      <SandpackPreview className="h-full!" />
    </SandpackLayout>
  );

  return (
    <PreviewScaffold
      isDesktop={isDesktop}
      width={width}
      size={size}
      onWidthChange={handleSetWidth}
    >
      {content}
    </PreviewScaffold>
  );
};

const RemoteContentRenderer = ({
  contentComponent,
}: {
  contentComponent: RemoteContentComponent;
}) => {
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

  const content = (
    <SandpackLayout>
      <div className="border-border bg-background h-full w-full overflow-hidden rounded-md border">
        <iframe
          src={contentComponent.iframeUrl}
          title={`${contentComponent.name} preview`}
          className="h-full w-full border-0"
          loading="lazy"
          allow="accelerometer; ambient-light-sensor; autoplay; clipboard-write; encrypted-media; fullscreen; geolocation; gyroscope; magnetometer; microphone; midi; payment; usb; vr"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </SandpackLayout>
  );

  return (
    <PreviewScaffold
      isDesktop={isDesktop}
      width={width}
      size={size}
      onWidthChange={handleSetWidth}
    >
      {content}
    </PreviewScaffold>
  );
};

export const ContentRenderer = ({ contentComponent }: ContentRendererProps) => {
  if (isRemoteContentComponent(contentComponent)) {
    return <RemoteContentRenderer contentComponent={contentComponent} />;
  }

  return <LocalContentRenderer contentComponent={contentComponent} />;
};
