"use client";

import React from "react";

import { useSpreadsheet } from "./spreadsheet-provider";

export const StatusBar: React.FC = () => {
  const { selectedCells, editingCell, data } = useSpreadsheet();
  const selectedCellsCount = selectedCells.size;
  const rowCount = data.length;
  const columnCount = 6; // LinkedIn URL, First Name, Last Name, Email, Company, Role

  return (
    <div className="text-muted-foreground bg-background sticky bottom-0 flex items-center justify-between border-t p-2 text-xs">
      <div>
        {editingCell ? (
          <span>
            Editing row {editingCell.rowIndex + 1}, column{" "}
            {editingCell.columnId}
          </span>
        ) : selectedCellsCount > 0 ? (
          <span>
            Selected: {selectedCellsCount} cell
            {selectedCellsCount > 1 ? "s" : ""}
          </span>
        ) : (
          <span>Click a cell to select</span>
        )}
      </div>
      <div>
        {rowCount} rows × {columnCount} columns
      </div>
    </div>
  );
};
