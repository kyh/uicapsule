"use client";

import React from "react";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/utils";
import { Download, Plus, Upload } from "lucide-react";

import { useSpreadsheet } from "./spreadsheet-provider";

export interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center gap-2 p-2", className)}
      {...props}
    >
      {children}
    </div>
  ),
);
Toolbar.displayName = "Toolbar";

type ToolbarButtonProps = React.ComponentProps<typeof Button>;

export const ToolbarEnrichButton = React.forwardRef<
  HTMLButtonElement,
  ToolbarButtonProps
>(({ className, children, onClick, disabled, ...props }, ref) => {
  const { isEnriching, startEnrichment, canEnrich } = useSpreadsheet();

  return (
    <Button
      ref={ref}
      size="sm"
      variant="default"
      className={cn("bg-primary hover:bg-primary/90", className)}
      onClick={(event) => {
        startEnrichment();
        onClick?.(event);
      }}
      disabled={(disabled ?? isEnriching) || !canEnrich}
      {...props}
    >
      {children ?? (isEnriching ? "Enriching..." : "Enrich")}
    </Button>
  );
});
ToolbarEnrichButton.displayName = "ToolbarEnrichButton";

export const ToolbarAddRowButton = React.forwardRef<
  HTMLButtonElement,
  ToolbarButtonProps
>(({ children, ...props }, ref) => (
  <Button ref={ref} size="sm" variant="outline" {...props}>
    <Plus />
    {children ?? "Add Row"}
  </Button>
));
ToolbarAddRowButton.displayName = "ToolbarAddRowButton";

export const ToolbarImportButton = React.forwardRef<
  HTMLButtonElement,
  ToolbarButtonProps
>(({ children, ...props }, ref) => (
  <Button ref={ref} size="sm" variant="outline" {...props}>
    <Upload />
    {children ?? "Import"}
  </Button>
));
ToolbarImportButton.displayName = "ToolbarImportButton";

export const ToolbarExportButton = React.forwardRef<
  HTMLButtonElement,
  ToolbarButtonProps
>(({ children, ...props }, ref) => (
  <Button ref={ref} size="sm" variant="outline" {...props}>
    <Download />
    {children ?? "Export"}
  </Button>
));
ToolbarExportButton.displayName = "ToolbarExportButton";
