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

export interface NavigationMap {
  up: string | null;
  down: string | null;
  left: string | null;
  right: string | null;
  tab: string | null;
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
export const getColumnCells = (columnId: string, data: Record<string, unknown>[]): string[] => {
  return data.map((row) => `${row.id}:${columnId}`);
};

/**
 * Get cells in a range between two positions
 */
export const getRangeCells = (
  startRowId: string,
  startColId: string,
  endRowId: string,
  endColId: string,
  columns: ColumnInfo[],
  data: Record<string, unknown>[],
): string[] => {
  const columnIds = columns.map((col) => col.accessorKey || col.id || "");
  const startColIndex = columnIds.indexOf(startColId);
  const endColIndex = columnIds.indexOf(endColId);

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
    const row = data[rowIndex];
    if (!row) continue;
    for (let colIndex = minColIndex; colIndex <= maxColIndex; colIndex++) {
      const colId = columnIds[colIndex];
      if (!colId) continue;
      cells.push(`${row.id}:${colId}`);
    }
  }
  return cells;
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
  data: Record<string, unknown>[],
): Set<string> => {
  const columnCells = getColumnCells(columnId, data);
  const isColumnFullySelected = columnCells.every((cell) => selectedCells.has(cell));

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
export const toggleCellSelection = (cellKey: string, selectedCells: Set<string>): Set<string> => {
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
export const getFirstSelectedCell = (selectedCells: Set<string>): CellPosition | null => {
  const firstSelectedCell = Array.from(selectedCells)[0];
  if (!firstSelectedCell) return null;

  const [rowId, columnId] = firstSelectedCell.split(":");
  if (!rowId || !columnId) return null;
  return { rowId, columnId };
};

/**
 * Get column size CSS variables
 */
export const getColumnSizeVars = (columnWidths: Record<string, number>): Record<string, number> => {
  const colSizes: { [key: string]: number } = {};
  Object.entries(columnWidths).forEach(([columnId, width]) => {
    colSizes[`--col-${columnId}-size`] = width;
  });
  return colSizes;
};

/**
 * Check if a target element is within a specific data attribute
 */
export const isWithinDataAttribute = (target: EventTarget | null, attribute: string): boolean => {
  return target instanceof HTMLElement && !!target.closest(`[data-${attribute}]`);
};

/**
 * Check if editing should be allowed based on current selection
 */
export const shouldAllowEditing = (selectedCells: Set<string>, cellKey: string): boolean => {
  return selectedCells.has(cellKey) && selectedCells.size === 1;
};

/**
 * Create a navigation map for all cells in the spreadsheet
 */
export const createNavigationMap = (
  data: Record<string, unknown>[],
  columns: ColumnInfo[],
): Map<string, NavigationMap> => {
  const navigationMap = new Map<string, NavigationMap>();
  const columnIds = columns.map((col) => col.accessorKey || col.id || "");

  data.forEach((row, rowIndex) => {
    columnIds.forEach((columnId, colIndex) => {
      const cellKey = `${row.id}:${columnId}`;
      const prevRowId = data[rowIndex - 1]?.id;
      const nextRowId = data[rowIndex + 1]?.id;
      const prevColId = columnIds[colIndex - 1];
      const nextColId = columnIds[colIndex + 1];
      const firstColId = columnIds[0];

      const navigation: NavigationMap = {
        up: prevRowId ? `${prevRowId}:${columnId}` : null,
        down: nextRowId ? `${nextRowId}:${columnId}` : null,
        left: prevColId ? `${row.id}:${prevColId}` : null,
        right: nextColId ? `${row.id}:${nextColId}` : null,
        tab: null,
      };

      if (nextColId) {
        navigation.tab = `${row.id}:${nextColId}`;
      } else if (nextRowId && firstColId) {
        navigation.tab = `${nextRowId}:${firstColId}`;
      }

      navigationMap.set(cellKey, navigation);
    });
  });

  return navigationMap;
};

/**
 * Get next cell position for navigation using pre-calculated map
 */
export const getNextCellPositionFromMap = (
  cellKey: string,
  direction: "up" | "down" | "left" | "right" | "tab",
  navigationMap: Map<string, NavigationMap>,
): CellPosition | null => {
  const navigation = navigationMap.get(cellKey);
  if (!navigation) return null;

  const nextCellKey = navigation[direction];
  if (!nextCellKey) return null;

  const [rowId, columnId] = nextCellKey.split(":");
  if (!rowId || !columnId) return null;
  return { rowId, columnId };
};
