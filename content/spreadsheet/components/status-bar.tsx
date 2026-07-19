"use client";

import { type ComponentProps } from "react";
import { cn } from "@repo/ui/lib/utils";

import { useSpreadsheetStore } from "../lib/spreadsheet-store";

export type StatusBarProps = ComponentProps<"div">;

export const StatusBar = ({ className, ...props }: StatusBarProps) => (
  <div
    className={cn(
      "text-muted-foreground bg-background dark:bg-background/95 sticky bottom-0 flex items-center justify-between border-t p-2 text-xs",
      className,
    )}
    {...props}
  />
);

export type StatusBarSectionProps = ComponentProps<"div">;

export const StatusBarSection = ({ className, ...props }: StatusBarSectionProps) => (
  <div className={cn("flex flex-1 items-center gap-2", className)} {...props} />
);

export const StatusBarMessage = () => {
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

export const StatusBarSummary = () => {
  const data = useSpreadsheetStore((state) => state.data);
  // Rows carry an `id` alongside their cell values; only the latter are columns.
  const columnCount = Object.keys(data[0] ?? {}).filter((key) => key !== "id").length;

  return (
    <span>
      {data.length} rows × {columnCount} columns
    </span>
  );
};
