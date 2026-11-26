"use client";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@repo/ui/components/drawer";

import type { ContentComponentSummary } from "@/lib/content/content-schema";
import { InfoPanel } from "./info-panel";

interface MobileSheetProps {
  open: boolean;
  active: ContentComponentSummary;
  onClose: () => void;
}

export const MobileSheet = ({ open, active, onClose }: MobileSheetProps) => (
  <Drawer
    open={open}
    onOpenChange={(next) => {
      if (!next) {
        onClose();
      }
    }}
  >
    <DrawerContent className="bg-background">
      <DrawerHeader className="sr-only">
        <DrawerTitle>Component details</DrawerTitle>
        <DrawerDescription>{active.name}</DrawerDescription>
      </DrawerHeader>
      <div className="min-h-0 overflow-y-auto">
        <InfoPanel component={active} />
      </div>
    </DrawerContent>
  </Drawer>
);
