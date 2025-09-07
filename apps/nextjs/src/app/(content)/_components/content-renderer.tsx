"use client";

import { useCallback, useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/tabs";
import { useMediaQuery } from "@repo/ui/utils";
import { LaptopIcon, SmartphoneIcon } from "lucide-react";

import type { ContentComponent } from "@/lib/content";
import { Resizable } from "./resizable";
import { SandpackLayout, SandpackPreview, useSandpack } from "./sandpack";

type ContentRendererProps = {
  contentComponent: ContentComponent;
};

export const ContentRenderer = ({ contentComponent }: ContentRendererProps) => {
  const isDesktop = useMediaQuery();
  const { sandpack } = useSandpack();
  const [initialized, setInitialized] = useState(false);
  const [width, setWidth] = useState(
    contentComponent.defaultSize === "mobile" ? 360 : 720,
  );
  const [size, setSize] = useState(contentComponent.defaultSize ?? "desktop");

  const handleSetWidth = useCallback((width: number) => {
    setWidth(width);
    setSize(width <= 360 ? "mobile" : "desktop");
  }, []);

  useEffect(() => {
    // Hacks to ensure the Sandpack runs.
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
  }, [isDesktop]);

  const content = (
    <SandpackLayout>
      <SandpackPreview className="h-full!" />
    </SandpackLayout>
  );

  return (
    <div className="flex h-full flex-col gap-2 pb-2">
      {isDesktop ? (
        <Resizable className="flex-1" width={width} setWidth={handleSetWidth}>
          {content}
        </Resizable>
      ) : (
        <div className="w-[calc(100dvw-theme(spacing.3))] flex-1 pb-2">
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
