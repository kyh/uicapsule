"use client";

import { useCallback, useState } from "react";
import { SandpackLayout, SandpackPreview } from "@codesandbox/sandpack-react";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/tabs";
import { LaptopIcon, SmartphoneIcon } from "lucide-react";

import { Resizable } from "./resizable";

type PreviewProps = {
  defaultSize?: "mobile" | "desktop";
};

export const Preview = ({ defaultSize = "desktop" }: PreviewProps) => {
  const [width, setWidth] = useState(defaultSize === "mobile" ? 360 : 720);
  const [size, setSize] = useState(defaultSize);

  const handleSetWidth = useCallback((width: number) => {
    setWidth(width);
    setSize(width <= 360 ? "mobile" : "desktop");
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <Resizable className="flex-1" width={width} setWidth={handleSetWidth}>
        <SandpackLayout className="h-full rounded-xl! shadow-[0_5px_100px_1px_#0000001a]">
          <SandpackPreview className="h-full!" />
        </SandpackLayout>
      </Resizable>
      <Tabs
        className="flex justify-center"
        value={size}
        onValueChange={(value) =>
          handleSetWidth(value === "mobile" ? 360 : 720)
        }
      >
        <TabsList>
          <TabsTrigger value="mobile" className="px-2 py-2">
            <SmartphoneIcon size={16} aria-hidden="true" />
          </TabsTrigger>
          <TabsTrigger value="desktop" className="px-2 py-2">
            <LaptopIcon size={16} aria-hidden="true" />
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};
