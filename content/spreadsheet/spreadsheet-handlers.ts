import { useCallback } from "react";

import type { CellPosition, ColumnInfo } from "./spreadsheet-utils";
import {
  getColumnCells,
  getFirstSelectedCell,
  getNextCellPosition,
  getRangeCells,
  getRowCells,
  isWithinDataAttribute,
  shouldAllowEditing,
  toggleCellSelection,
  toggleColumnSelection,
  toggleRowSelection,
} from "./spreadsheet-utils";

interface UseSpreadsheetHandlersProps {
  data: any[];
  columns: ColumnInfo[];
  selectedCells: Set<string>;
  setSelectedCells: (
    cells: Set<string> | ((prev: Set<string>) => Set<string>),
  ) => void;
  editingCell: CellPosition | null;
  setEditingCell: (cell: CellPosition | null) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  setDragStartCell: (cell: CellPosition | null) => void;
  setDragEndCell: (cell: CellPosition | null) => void;
  dragStartCell: CellPosition | null;
}

export const useSpreadsheetHandlers = ({
  data,
  columns,
  selectedCells,
  setSelectedCells,
  editingCell,
  setEditingCell,
  isDragging,
  setIsDragging,
  setDragStartCell,
  setDragEndCell,
  dragStartCell,
}: UseSpreadsheetHandlersProps) => {
  // Mouse down handler for all interactions
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, rowIndex: number, columnId: string) => {
      if (e.button !== 0) return; // Only left mouse button

      const cellKey = `${rowIndex}-${columnId}`;

      // Handle row selection (click on row number)
      if (isWithinDataAttribute(e.target, "row-number")) {
        const rowCells = getRowCells(rowIndex, columns);

        if (e.ctrlKey || e.metaKey) {
          // Toggle row selection
          setSelectedCells((currentSelectedCells) => {
            const newSelection = toggleRowSelection(
              rowIndex,
              currentSelectedCells,
              columns,
            );
            // Exit edit mode if multiple cells are selected
            if (newSelection.size > 1 && editingCell) {
              setEditingCell(null);
            }
            return newSelection;
          });
        } else {
          // Select entire row
          const newSelection = new Set(rowCells);
          setSelectedCells(newSelection);
          // Exit edit mode if multiple cells are selected
          if (newSelection.size > 1 && editingCell) {
            setEditingCell(null);
          }
        }
        return;
      }

      // Handle column selection (click on column header)
      if (isWithinDataAttribute(e.target, "column-header")) {
        const columnCells = getColumnCells(columnId, data.length);

        if (e.ctrlKey || e.metaKey) {
          // Toggle column selection
          setSelectedCells((currentSelectedCells) => {
            const newSelection = toggleColumnSelection(
              columnId,
              currentSelectedCells,
              data.length,
            );
            // Exit edit mode if multiple cells are selected
            if (newSelection.size > 1 && editingCell) {
              setEditingCell(null);
            }
            return newSelection;
          });
        } else {
          // Select entire column
          const newSelection = new Set(columnCells);
          setSelectedCells(newSelection);
          // Exit edit mode if multiple cells are selected
          if (newSelection.size > 1 && editingCell) {
            setEditingCell(null);
          }
        }
        return;
      }

      // Handle cell selection
      if (e.ctrlKey || e.metaKey) {
        // Toggle cell selection
        setSelectedCells((currentSelectedCells) => {
          const newSelection = toggleCellSelection(
            cellKey,
            currentSelectedCells,
          );
          // Exit edit mode if multiple cells are selected
          if (newSelection.size > 1 && editingCell) {
            setEditingCell(null);
          }
          return newSelection;
        });
      } else if (e.shiftKey) {
        // Range selection
        setSelectedCells((currentSelectedCells) => {
          if (currentSelectedCells.size === 0) return new Set([cellKey]);

          const firstSelectedCell = Array.from(currentSelectedCells)[0];
          const [firstRowStr, firstCol] = firstSelectedCell.split("-");
          const firstRow = Number.parseInt(firstRowStr);
          const rangeCells = getRangeCells(
            firstRow,
            firstCol,
            rowIndex,
            columnId,
            columns,
            data.length,
          );
          const newSelection = new Set(rangeCells);
          // Exit edit mode if multiple cells are selected
          if (newSelection.size > 1 && editingCell) {
            setEditingCell(null);
          }
          return newSelection;
        });
      } else {
        // Single cell selection
        const isCurrentlyEditing =
          editingCell?.rowIndex === rowIndex &&
          editingCell?.columnId === columnId;
        const isCurrentlySelected =
          selectedCells.has(cellKey) && selectedCells.size === 1;
        console.log("isCurrentlyEditing", isCurrentlyEditing);
        console.log("isCurrentlySelected", isCurrentlySelected);
        if (isCurrentlyEditing) {
          // If clicking on the cell that's currently being edited, stop editing
          setEditingCell(null);
        } else if (isCurrentlySelected) {
          // If clicking on the cell that's already selected (but not editing), start editing
          setTimeout(() => {
            setEditingCell({ rowIndex, columnId });
          }, 0);
        } else {
          // Select this cell and enter edit mode
          setSelectedCells(new Set([cellKey]));
        }
      }

      // Start drag selection for potential dragging
      setIsDragging(true);
      setDragStartCell({ rowIndex, columnId });
      setDragEndCell({ rowIndex, columnId });
    },
    [
      selectedCells,
      columns,
      data.length,
      setSelectedCells,
      setEditingCell,
      setIsDragging,
      setDragStartCell,
      setDragEndCell,
    ],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent, rowIndex: number, columnId: string) => {
      if (!isDragging || !dragStartCell) return;

      setDragEndCell({ rowIndex, columnId });

      // Update selection based on drag range
      const rangeCells = getRangeCells(
        dragStartCell.rowIndex,
        dragStartCell.columnId,
        rowIndex,
        columnId,
        columns,
        data.length,
      );
      const newSelection = new Set(rangeCells);
      setSelectedCells(newSelection);

      // Exit edit mode if multiple cells are selected during drag
      if (newSelection.size > 1 && editingCell) {
        setEditingCell(null);
      }
    },
    [
      isDragging,
      dragStartCell,
      columns,
      data.length,
      editingCell,
      setDragEndCell,
      setSelectedCells,
      setEditingCell,
    ],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStartCell(null);
    setDragEndCell(null);
  }, [setIsDragging, setDragStartCell, setDragEndCell]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const firstSelectedCell = getFirstSelectedCell(selectedCells);
      if (!firstSelectedCell) return;

      const { rowIndex, columnId } = firstSelectedCell;

      const activeElement = document.activeElement;
      if (activeElement && activeElement.tagName === "INPUT") {
        return;
      }

      switch (e.key) {
        case "Enter":
          e.preventDefault();
          if (
            editingCell?.rowIndex === rowIndex &&
            editingCell?.columnId === columnId
          ) {
            setEditingCell(null);
          } else if (
            shouldAllowEditing(selectedCells, `${rowIndex}-${columnId}`)
          ) {
            // Only allow editing if exactly one cell is selected
            setEditingCell({ rowIndex, columnId });
          }
          break;
        case "ArrowUp": {
          e.preventDefault();
          const nextPosition = getNextCellPosition(
            rowIndex,
            columnId,
            columns,
            data.length,
            "up",
          );
          if (nextPosition) {
            const newCellKey = `${nextPosition.rowIndex}-${nextPosition.columnId}`;
            setSelectedCells(new Set([newCellKey]));
          }
          break;
        }
        case "ArrowDown": {
          e.preventDefault();
          const nextPosition = getNextCellPosition(
            rowIndex,
            columnId,
            columns,
            data.length,
            "down",
          );
          if (nextPosition) {
            const newCellKey = `${nextPosition.rowIndex}-${nextPosition.columnId}`;
            setSelectedCells(new Set([newCellKey]));
          }
          break;
        }
        case "ArrowLeft": {
          e.preventDefault();
          const nextPosition = getNextCellPosition(
            rowIndex,
            columnId,
            columns,
            data.length,
            "left",
          );
          if (nextPosition) {
            const newCellKey = `${nextPosition.rowIndex}-${nextPosition.columnId}`;
            setSelectedCells(new Set([newCellKey]));
          }
          break;
        }
        case "ArrowRight": {
          e.preventDefault();
          const nextPosition = getNextCellPosition(
            rowIndex,
            columnId,
            columns,
            data.length,
            "right",
          );
          if (nextPosition) {
            const newCellKey = `${nextPosition.rowIndex}-${nextPosition.columnId}`;
            setSelectedCells(new Set([newCellKey]));
          }
          break;
        }
        case "Tab": {
          e.preventDefault();
          const nextPosition = getNextCellPosition(
            rowIndex,
            columnId,
            columns,
            data.length,
            "tab",
          );
          if (nextPosition) {
            const newCellKey = `${nextPosition.rowIndex}-${nextPosition.columnId}`;
            setSelectedCells(new Set([newCellKey]));
          }
          break;
        }
      }
    },
    [
      selectedCells,
      columns,
      data.length,
      editingCell,
      setEditingCell,
      setSelectedCells,
    ],
  );

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleKeyDown,
  };
};
