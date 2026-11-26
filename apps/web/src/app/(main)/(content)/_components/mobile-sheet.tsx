"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@repo/ui/components/drawer";

import type { ContentComponentSummary } from "@/lib/content/content-schema";
import { InfoPanel } from "./info-panel";
import type { PanelId } from "./panel-layout";
import { PropsPanel } from "./props-panel";

const CodeDock = dynamic(async () => {
  const mod = await import("./code-dock");

  return mod.CodeDock;
});

const TITLES = {
  code: "Source code",
  info: "Component details",
  props: "Props",
} satisfies Record<PanelId, string>;

interface MobileSheetProps {
  panel: PanelId | null;
  active: ContentComponentSummary;
  onClose: () => void;
}

export const MobileSheet = ({ panel, active, onClose }: MobileSheetProps) => {
  const [shown, setShown] = useState<PanelId>("info");

  if (panel && panel !== shown) {
    setShown(panel);
  }

  return (
    <Drawer
      open={panel !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DrawerContent className="bg-background">
        <DrawerHeader className="sr-only">
          <DrawerTitle>{TITLES[shown]}</DrawerTitle>
          <DrawerDescription>{active.name}</DrawerDescription>
        </DrawerHeader>
        {shown === "info" && (
          <div className="min-h-0 overflow-y-auto">
            <InfoPanel component={active} />
          </div>
        )}
        {shown === "props" && (
          <div className="min-h-0 overflow-y-auto">
            <PropsPanel />
          </div>
        )}
        {shown === "code" && (
          <div className="mt-2 flex h-[70dvh] min-h-0 flex-col border-t">
            <CodeDock component={active} onClose={onClose} />
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
};
