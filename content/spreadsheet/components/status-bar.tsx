"use client";

import { forwardRef, type FC, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@repo/ui/lib/utils";

import { useSpreadsheetStore } from "../lib/spreadsheet-store";

export interface StatusBarProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export const StatusBar = forwardRef<HTMLDivElement, StatusBarProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "text-muted-foreground bg-background dark:bg-background/95 sticky bottom-0 flex items-center justify-between border-t p-2 text-xs",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
StatusBar.displayName = "StatusBar";

interface StatusBarSectionProps extends HTMLAttributes<HTMLDivElement> {}

export const StatusBarSection = forwardRef<HTMLDivElement, StatusBarSectionProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-1 items-center gap-2", className)} {...props} />
  ),
);
StatusBarSection.displayName = "StatusBarSection";

export const StatusBarMessage: FC = () => {
  const editingCell = useSpreadsheetStore((state) => state.editingCell);
  const selectedCells = useSpreadsheetStore((state) => state.selectedCells);
  const data = useSpreadsheetStore((state) => state.data);
  const selectedCellsCount = selectedCells.size;

  if (editingCell) {
    const rowIndex = data.findIndex((row) => row.id === editingCell.rowId);
    const displayRowNumber = rowIndex !== -1 ? rowIndex + 1 : "?";

    return (
      <span>
        Editing row {displayRowNumber}, column {editingCell.columnId}
      </span>
    );
  }

  if (selectedCellsCount > 0) {
    return (
      <span>
        Selected: {selectedCellsCount} cell
        {selectedCellsCount > 1 ? "s" : ""}
      </span>
    );
  }

  return <span>Click a cell to select</span>;
};

export const StatusBarSummary: FC = () => {
  const data = useSpreadsheetStore((state) => state.data);
  const rowCount = data.length;

  return (
    <span>
      {rowCount} rows × {data[0]?.length} columns
    </span>
  );
};
