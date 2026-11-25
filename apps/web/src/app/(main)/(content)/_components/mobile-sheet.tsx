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
import { ComponentNav } from "./component-nav";
import { InfoPanel } from "./info-panel";

const CodeDock = dynamic(async () => {
  const mod = await import("./code-dock");

  return mod.CodeDock;
});

export type MobilePanel = "nav" | "info" | "code";

const SHEETS: Record<MobilePanel, { title: string; swipe: "left" | "down" }> = {
  code: { swipe: "down", title: "Source code" },
  info: { swipe: "down", title: "Component details" },
  nav: { swipe: "left", title: "Components" },
};

interface MobileSheetProps {
  panel: MobilePanel | null;
  active: ContentComponentSummary;
  feed: ContentComponentSummary[];
  onSelect: (slug: string) => void;
  onClose: () => void;
}

export const MobileSheet = ({ panel, active, feed, onSelect, onClose }: MobileSheetProps) => {
  const [shown, setShown] = useState<MobilePanel>("info");

  if (panel && panel !== shown) {
    setShown(panel);
  }

  const sheet = SHEETS[shown];

  return (
    <Drawer
      open={panel !== null}
      swipeDirection={sheet.swipe}
      onOpenChange={(open) => !open && onClose()}
    >
      <DrawerContent className="bg-background">
        <DrawerHeader className="sr-only">
          <DrawerTitle>{sheet.title}</DrawerTitle>
          <DrawerDescription>{active.name}</DrawerDescription>
        </DrawerHeader>
        {shown === "nav" && (
          <div className="h-full min-h-0">
            <ComponentNav feed={feed} activeSlug={active.slug} onSelect={onSelect} />
          </div>
        )}
        {shown === "info" && (
          <div className="min-h-0 overflow-y-auto">
            <InfoPanel component={active} />
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
