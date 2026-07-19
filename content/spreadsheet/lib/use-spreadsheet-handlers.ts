import { useCallback, type KeyboardEvent, type MouseEvent } from "react";
import type { ColumnInfo, NavigationDirection, NavigationMap } from "./spreadsheet-utils";
import { useSpreadsheetStore } from "./spreadsheet-store";
import {
  getColumnCells,
  getFirstSelectedCell,
  getNextCellPositionFromMap,
  getRangeCells,
  getRowCells,
  isWithinDataAttribute,
  shouldAllowEditing,
  toggleCellSelection,
  toggleColumnSelection,
  toggleRowSelection,
} from "./spreadsheet-utils";

interface UseSpreadsheetHandlersProps {
  columns: ColumnInfo[];
  navigationMap: Map<string, NavigationMap>;
}

/** Keys that move the single-cell selection, mapped to their direction in the navigation map. */
const NAVIGATION_KEYS: Record<string, NavigationDirection | undefined> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  Tab: "tab",
};

export const useSpreadsheetHandlers = ({ columns, navigationMap }: UseSpreadsheetHandlersProps) => {
  const data = useSpreadsheetStore((state) => state.data);
  const selectedCells = useSpreadsheetStore((state) => state.selectedCells);
  const setSelectedCells = useSpreadsheetStore((state) => state.setSelectedCells);
  const editingCell = useSpreadsheetStore((state) => state.editingCell);
  const setEditingCell = useSpreadsheetStore((state) => state.setEditingCell);
  const isDragging = useSpreadsheetStore((state) => state.isDragging);
  const setIsDragging = useSpreadsheetStore((state) => state.setIsDragging);
  const dragStartCell = useSpreadsheetStore((state) => state.dragStartCell);
  const setDragStartCell = useSpreadsheetStore((state) => state.setDragStartCell);
  const updateSelectedCellsData = useSpreadsheetStore((state) => state.updateSelectedCellsData);

  /** A multi-cell selection has no single edit target, so editing is cancelled. Returns `selection` for chaining. */
  const exitEditIfMultiple = useCallback(
    (selection: Set<string>) => {
      if (selection.size > 1 && editingCell) {
        setEditingCell(null);
      }
      return selection;
    },
    [editingCell, setEditingCell],
  );

  // Mouse down handler for all interactions
  const handleMouseDown = useCallback(
    (e: MouseEvent, rowId: string, columnId: string) => {
      if (e.button !== 0) return; // Only left mouse button

      const cellKey = `${rowId}:${columnId}`;

      // Handle row selection (click on row number)
      if (isWithinDataAttribute(e.target, "row-number")) {
        if (e.ctrlKey || e.metaKey) {
          setSelectedCells((currentSelectedCells) =>
            exitEditIfMultiple(toggleRowSelection(rowId, currentSelectedCells, columns)),
          );
        } else {
          setSelectedCells(exitEditIfMultiple(new Set(getRowCells(rowId, columns))));
        }
        return;
      }

      // Handle column selection (click on column header)
      if (isWithinDataAttribute(e.target, "column-header")) {
        if (e.ctrlKey || e.metaKey) {
          setSelectedCells((currentSelectedCells) =>
            exitEditIfMultiple(toggleColumnSelection(columnId, currentSelectedCells, data)),
          );
        } else {
          setSelectedCells(exitEditIfMultiple(new Set(getColumnCells(columnId, data))));
        }
        return;
      }

      // Handle cell selection
      if (e.ctrlKey || e.metaKey) {
        setSelectedCells((currentSelectedCells) =>
          exitEditIfMultiple(toggleCellSelection(cellKey, currentSelectedCells)),
        );
      } else if (e.shiftKey) {
        // Range selection
        setSelectedCells((currentSelectedCells) => {
          if (currentSelectedCells.size === 0) return new Set([cellKey]);

          const firstSelectedCell = Array.from(currentSelectedCells)[0];
          if (!firstSelectedCell) return new Set([cellKey]);
          const [firstRowId, firstCol] = firstSelectedCell.split(":");
          if (!firstRowId || !firstCol) return new Set([cellKey]);
          const rangeCells = getRangeCells(firstRowId, firstCol, rowId, columnId, columns, data);
          return exitEditIfMultiple(new Set(rangeCells));
        });
      } else {
        // Single cell selection
        const isCurrentlyEditing =
          editingCell?.rowId === rowId && editingCell?.columnId === columnId;
        const isCurrentlySelected = selectedCells.has(cellKey) && selectedCells.size === 1;

        if (isCurrentlyEditing) {
          // If clicking on the cell that's currently being edited, stop editing
          setTimeout(() => setEditingCell(null), 0);
        } else if (isCurrentlySelected) {
          // If clicking on the cell that's already selected (but not editing), start editing
          setTimeout(() => setEditingCell({ rowId, columnId }), 0);
        } else {
          // Select this cell and enter edit mode
          setSelectedCells(new Set([cellKey]));
        }
      }

      // Start drag selection for potential dragging
      setIsDragging(true);
      setDragStartCell({ rowId, columnId });
    },
    [
      selectedCells,
      columns,
      data,
      editingCell,
      exitEditIfMultiple,
      setSelectedCells,
      setEditingCell,
      setIsDragging,
      setDragStartCell,
    ],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent, rowId: string, columnId: string) => {
      if (!isDragging || !dragStartCell) return;

      // Update selection based on drag range
      const rangeCells = getRangeCells(
        dragStartCell.rowId,
        dragStartCell.columnId,
        rowId,
        columnId,
        columns,
        data,
      );
      setSelectedCells(exitEditIfMultiple(new Set(rangeCells)));
    },
    [isDragging, dragStartCell, columns, data, exitEditIfMultiple, setSelectedCells],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStartCell(null);
  }, [setIsDragging, setDragStartCell]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const firstSelectedCell = getFirstSelectedCell(selectedCells);
      if (!firstSelectedCell) return;

      const { rowId, columnId } = firstSelectedCell;

      const activeElement = document.activeElement;
      if (activeElement && activeElement.tagName === "INPUT") {
        return;
      }

      const direction = NAVIGATION_KEYS[e.key];
      if (direction) {
        e.preventDefault();
        const nextPosition = getNextCellPositionFromMap(
          `${rowId}:${columnId}`,
          direction,
          navigationMap,
        );
        if (nextPosition) {
          setSelectedCells(new Set([`${nextPosition.rowId}:${nextPosition.columnId}`]));
        }
        return;
      }

      switch (e.key) {
        case "Enter":
          e.preventDefault();
          if (editingCell?.rowId === rowId && editingCell?.columnId === columnId) {
            setEditingCell(null);
          } else if (shouldAllowEditing(selectedCells, `${rowId}:${columnId}`)) {
            // Only allow editing if exactly one cell is selected
            setEditingCell({ rowId, columnId });
          }
          break;
        case "Escape": {
          e.preventDefault();
          if (editingCell) {
            // If editing, stop editing
            setEditingCell(null);
          } else {
            // If not editing, deselect everything
            setSelectedCells(new Set());
          }
          break;
        }
        case "Delete":
        case "Backspace": {
          e.preventDefault();
          if (selectedCells.size > 0) {
            updateSelectedCellsData(undefined);
          }
          break;
        }
      }
    },
    [
      selectedCells,
      editingCell,
      setEditingCell,
      setSelectedCells,
      updateSelectedCellsData,
      navigationMap,
    ],
  );

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleKeyDown,
  };
};
