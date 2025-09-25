/**
 * Pure utility functions for spreadsheet operations
 */

export interface CellPosition {
  rowId: string;
  columnId: string;
}

export interface ColumnInfo {
  accessorKey?: string;
  id?: string;
}

/**
 * Get all cells in a row
 */
export const getRowCells = (rowId: string, columns: ColumnInfo[]): string[] => {
  return columns.map((col) => `${rowId}:${col.accessorKey || col.id || ""}`);
};

/**
 * Get all cells in a column
 */
export const getColumnCells = (columnId: string, data: any[]): string[] => {
  return data.map((row) => `${row.id}:${columnId}`);
};

/**
 * Get cells in a range between two positions
 */
export const getRangeCells = (
  startRowId: string,
  startCol: string,
  endRowId: string,
  endCol: string,
  columns: ColumnInfo[],
  data: any[],
): string[] => {
  const columnIds = columns.map((col) => col.accessorKey || col.id || "");
  const startColIndex = columnIds.indexOf(startCol);
  const endColIndex = columnIds.indexOf(endCol);

  const minColIndex = Math.min(startColIndex, endColIndex);
  const maxColIndex = Math.max(startColIndex, endColIndex);

  // Find the row indices for the start and end rows
  const startRowIndex = data.findIndex((row) => row.id === startRowId);
  const endRowIndex = data.findIndex((row) => row.id === endRowId);

  if (startRowIndex === -1 || endRowIndex === -1) return [];

  const minRowIndex = Math.min(startRowIndex, endRowIndex);
  const maxRowIndex = Math.max(startRowIndex, endRowIndex);

  const cells: string[] = [];
  for (let rowIndex = minRowIndex; rowIndex <= maxRowIndex; rowIndex++) {
    for (let colIndex = minColIndex; colIndex <= maxColIndex; colIndex++) {
      cells.push(`${data[rowIndex].id}:${columnIds[colIndex]}`);
    }
  }
  return cells;
};

/**
 * Check if a row is fully selected
 */
export const isRowFullySelected = (
  rowId: string,
  selectedCells: Set<string>,
  columns: ColumnInfo[],
): boolean => {
  const rowCells = getRowCells(rowId, columns);
  return rowCells.every((cell) => selectedCells.has(cell));
};

/**
 * Check if a column is fully selected
 */
export const isColumnFullySelected = (
  columnId: string,
  selectedCells: Set<string>,
  data: any[],
): boolean => {
  const columnCells = getColumnCells(columnId, data);
  return columnCells.every((cell) => selectedCells.has(cell));
};

/**
 * Toggle row selection
 */
export const toggleRowSelection = (
  rowId: string,
  selectedCells: Set<string>,
  columns: ColumnInfo[],
): Set<string> => {
  const rowCells = getRowCells(rowId, columns);
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
  data: any[],
): Set<string> => {
  const columnCells = getColumnCells(columnId, data);
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

  const [rowId, columnId] = firstSelectedCell.split(":");
  return {
    rowId,
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
  currentRowId: string,
  currentColumnId: string,
  columns: ColumnInfo[],
  data: any[],
  direction: "up" | "down" | "left" | "right" | "tab",
): CellPosition | null => {
  const columnIds = columns.map((col) => col.accessorKey || col.id || "");
  const currentColumnIndex = columnIds.indexOf(currentColumnId);
  const currentRowIndex = data.findIndex((row) => row.id === currentRowId);

  if (currentRowIndex === -1) return null;

  switch (direction) {
    case "up":
      if (currentRowIndex > 0) {
        return {
          rowId: data[currentRowIndex - 1].id,
          columnId: currentColumnId,
        };
      }
      break;
    case "down":
      if (currentRowIndex < data.length - 1) {
        return {
          rowId: data[currentRowIndex + 1].id,
          columnId: currentColumnId,
        };
      }
      break;
    case "left":
      if (currentColumnIndex > 0) {
        return {
          rowId: currentRowId,
          columnId: columnIds[currentColumnIndex - 1],
        };
      }
      break;
    case "right":
      if (currentColumnIndex < columnIds.length - 1) {
        return {
          rowId: currentRowId,
          columnId: columnIds[currentColumnIndex + 1],
        };
      }
      break;
    case "tab":
      if (currentColumnIndex < columnIds.length - 1) {
        return {
          rowId: currentRowId,
          columnId: columnIds[currentColumnIndex + 1],
        };
      } else if (currentRowIndex < data.length - 1) {
        return { rowId: data[currentRowIndex + 1].id, columnId: columnIds[0] };
      }
      break;
  }
  return null;
};
