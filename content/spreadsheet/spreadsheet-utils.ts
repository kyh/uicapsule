/**
 * Pure utility functions for spreadsheet operations
 */

export interface CellPosition {
  rowIndex: number;
  columnId: string;
}

export interface ColumnInfo {
  accessorKey?: string;
  id?: string;
}

/**
 * Get all cells in a row
 */
export const getRowCells = (
  rowIndex: number,
  columns: ColumnInfo[],
): string[] => {
  return columns.map((col) => `${rowIndex}-${col.accessorKey || col.id || ""}`);
};

/**
 * Get all cells in a column
 */
export const getColumnCells = (
  columnId: string,
  dataLength: number,
): string[] => {
  return Array.from({ length: dataLength }, (_, i) => `${i}-${columnId}`);
};

/**
 * Get cells in a range between two positions
 */
export const getRangeCells = (
  startRow: number,
  startCol: string,
  endRow: number,
  endCol: string,
  columns: ColumnInfo[],
  dataLength: number,
): string[] => {
  const columnIds = columns.map((col) => col.accessorKey || col.id || "");
  const startColIndex = columnIds.indexOf(startCol);
  const endColIndex = columnIds.indexOf(endCol);

  const minRow = Math.min(startRow, endRow);
  const maxRow = Math.max(startRow, endRow);
  const minColIndex = Math.min(startColIndex, endColIndex);
  const maxColIndex = Math.max(startColIndex, endColIndex);

  const cells: string[] = [];
  for (let row = minRow; row <= maxRow; row++) {
    for (let colIndex = minColIndex; colIndex <= maxColIndex; colIndex++) {
      cells.push(`${row}-${columnIds[colIndex]}`);
    }
  }
  return cells;
};

/**
 * Check if a row is fully selected
 */
export const isRowFullySelected = (
  rowIndex: number,
  selectedCells: Set<string>,
  columns: ColumnInfo[],
): boolean => {
  const rowCells = getRowCells(rowIndex, columns);
  return rowCells.every((cell) => selectedCells.has(cell));
};

/**
 * Check if a column is fully selected
 */
export const isColumnFullySelected = (
  columnId: string,
  selectedCells: Set<string>,
  dataLength: number,
): boolean => {
  const columnCells = getColumnCells(columnId, dataLength);
  return columnCells.every((cell) => selectedCells.has(cell));
};

/**
 * Toggle row selection
 */
export const toggleRowSelection = (
  rowIndex: number,
  selectedCells: Set<string>,
  columns: ColumnInfo[],
): Set<string> => {
  const rowCells = getRowCells(rowIndex, columns);
  const isRowFullySelected = rowCells.every((cell) => selectedCells.has(cell));

  const newSelectedCells = new Set(selectedCells);
  if (isRowFullySelected) {
    // Deselect all cells in this row
    rowCells.forEach((cell) => newSelectedCells.delete(cell));
  } else {
    // Select all cells in this row
    rowCells.forEach((cell) => newSelectedCells.add(cell));
  }
  return newSelectedCells;
};

/**
 * Toggle column selection
 */
export const toggleColumnSelection = (
  columnId: string,
  selectedCells: Set<string>,
  dataLength: number,
): Set<string> => {
  const columnCells = getColumnCells(columnId, dataLength);
  const isColumnFullySelected = columnCells.every((cell) =>
    selectedCells.has(cell),
  );

  const newSelectedCells = new Set(selectedCells);
  if (isColumnFullySelected) {
    // Deselect all cells in this column
    columnCells.forEach((cell) => newSelectedCells.delete(cell));
  } else {
    // Select all cells in this column
    columnCells.forEach((cell) => newSelectedCells.add(cell));
  }
  return newSelectedCells;
};

/**
 * Toggle single cell selection
 */
export const toggleCellSelection = (
  cellKey: string,
  selectedCells: Set<string>,
): Set<string> => {
  const newSelectedCells = new Set(selectedCells);
  if (newSelectedCells.has(cellKey)) {
    newSelectedCells.delete(cellKey);
  } else {
    newSelectedCells.add(cellKey);
  }
  return newSelectedCells;
};

/**
 * Get the first selected cell position
 */
export const getFirstSelectedCell = (
  selectedCells: Set<string>,
): CellPosition | null => {
  const firstSelectedCell = Array.from(selectedCells)[0];
  if (!firstSelectedCell) return null;

  const [rowIndexStr, columnId] = firstSelectedCell.split("-");
  return {
    rowIndex: Number.parseInt(rowIndexStr),
    columnId,
  };
};

/**
 * Get column size CSS variables
 */
export const getColumnSizeVars = (
  columnWidths: Record<string, number>,
): Record<string, number> => {
  const colSizes: { [key: string]: number } = {};
  Object.entries(columnWidths).forEach(([columnId, width]) => {
    colSizes[`--col-${columnId}-size`] = width;
  });
  return colSizes;
};

/**
 * Check if a target element is within a specific data attribute
 */
export const isWithinDataAttribute = (
  target: EventTarget | null,
  attribute: string,
): boolean => {
  return (
    target instanceof HTMLElement && !!target.closest(`[data-${attribute}]`)
  );
};

/**
 * Get column index from column ID
 */
export const getColumnIndex = (
  columnId: string,
  columns: ColumnInfo[],
): number => {
  const columnIds = columns.map((col) => col.accessorKey || col.id || "");
  return columnIds.indexOf(columnId);
};

/**
 * Check if editing should be allowed based on current selection
 */
export const shouldAllowEditing = (
  selectedCells: Set<string>,
  cellKey: string,
): boolean => {
  return selectedCells.has(cellKey) && selectedCells.size === 1;
};

/**
 * Get next cell position for navigation
 */
export const getNextCellPosition = (
  currentRow: number,
  currentColumnId: string,
  columns: ColumnInfo[],
  dataLength: number,
  direction: "up" | "down" | "left" | "right" | "tab",
): CellPosition | null => {
  const columnIds = columns.map((col) => col.accessorKey || col.id || "");
  const currentColumnIndex = columnIds.indexOf(currentColumnId);

  switch (direction) {
    case "up":
      if (currentRow > 0) {
        return { rowIndex: currentRow - 1, columnId: currentColumnId };
      }
      break;
    case "down":
      if (currentRow < dataLength - 1) {
        return { rowIndex: currentRow + 1, columnId: currentColumnId };
      }
      break;
    case "left":
      if (currentColumnIndex > 0) {
        return {
          rowIndex: currentRow,
          columnId: columnIds[currentColumnIndex - 1],
        };
      }
      break;
    case "right":
      if (currentColumnIndex < columnIds.length - 1) {
        return {
          rowIndex: currentRow,
          columnId: columnIds[currentColumnIndex + 1],
        };
      }
      break;
    case "tab":
      if (currentColumnIndex < columnIds.length - 1) {
        return {
          rowIndex: currentRow,
          columnId: columnIds[currentColumnIndex + 1],
        };
      } else if (currentRow < dataLength - 1) {
        return { rowIndex: currentRow + 1, columnId: columnIds[0] };
      }
      break;
  }
  return null;
};
