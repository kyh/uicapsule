import { columnVisibilityFeature, tableFeatures } from "@tanstack/react-table";

import type { SpreadsheetRow } from "./spreadsheet-store";

/**
 * Features every spreadsheet table is built on. Features are opt-in in
 * react-table v9, and the body renders through `row.getVisibleCells()`, which
 * column visibility provides. Declared here rather than in `spreadsheet.tsx` so
 * the body and cell components can type against it without an import cycle.
 */
export const spreadsheetFeatures = tableFeatures({ columnVisibilityFeature });

export type SpreadsheetFeatures = typeof spreadsheetFeatures;

/** Columns never resize below this, both while dragging and once committed. */
export const MIN_COLUMN_WIDTH = 60;

export interface CellPosition {
  rowId: string;
  columnId: string;
}

export interface ColumnInfo {
  id: string;
}

export interface NavigationMap {
  up: string | null;
  down: string | null;
  left: string | null;
  right: string | null;
  tab: string | null;
}

export type NavigationDirection = keyof NavigationMap;

export const getRowCells = (rowId: string, columns: ColumnInfo[]): string[] =>
  columns.map((col) => `${rowId}:${col.id}`);

export const getColumnCells = (columnId: string, data: SpreadsheetRow[]): string[] =>
  data.map((row) => `${row.id}:${columnId}`);

export const getRangeCells = (
  startRowId: string,
  startColId: string,
  endRowId: string,
  endColId: string,
  columns: ColumnInfo[],
  data: SpreadsheetRow[],
): string[] => {
  const columnIds = columns.map((col) => col.id);
  const startColIndex = columnIds.indexOf(startColId);
  const endColIndex = columnIds.indexOf(endColId);

  const minColIndex = Math.min(startColIndex, endColIndex);
  const maxColIndex = Math.max(startColIndex, endColIndex);

  const startRowIndex = data.findIndex((row) => row.id === startRowId);
  const endRowIndex = data.findIndex((row) => row.id === endRowId);

  if (startRowIndex === -1 || endRowIndex === -1 || startColIndex === -1 || endColIndex === -1) {
    return [];
  }

  const minRowIndex = Math.min(startRowIndex, endRowIndex);
  const maxRowIndex = Math.max(startRowIndex, endRowIndex);

  const cells: string[] = [];
  for (let rowIndex = minRowIndex; rowIndex <= maxRowIndex; rowIndex += 1) {
    const row = data[rowIndex];
    if (!row) {
      continue;
    }
    for (let colIndex = minColIndex; colIndex <= maxColIndex; colIndex += 1) {
      const colId = columnIds[colIndex];
      if (!colId) {
        continue;
      }
      cells.push(`${row.id}:${colId}`);
    }
  }
  return cells;
};

export const toggleRowSelection = (
  rowId: string,
  selectedCells: Set<string>,
  columns: ColumnInfo[],
): Set<string> => {
  const rowCells = getRowCells(rowId, columns);
  const isRowFullySelected = rowCells.every((cell) => selectedCells.has(cell));

  const newSelectedCells = new Set(selectedCells);
  for (const cell of rowCells) {
    if (isRowFullySelected) {
      newSelectedCells.delete(cell);
    } else {
      newSelectedCells.add(cell);
    }
  }
  return newSelectedCells;
};

export const toggleColumnSelection = (
  columnId: string,
  selectedCells: Set<string>,
  data: SpreadsheetRow[],
): Set<string> => {
  const columnCells = getColumnCells(columnId, data);
  const isColumnFullySelected = columnCells.every((cell) => selectedCells.has(cell));

  const newSelectedCells = new Set(selectedCells);
  for (const cell of columnCells) {
    if (isColumnFullySelected) {
      newSelectedCells.delete(cell);
    } else {
      newSelectedCells.add(cell);
    }
  }
  return newSelectedCells;
};

export const toggleCellSelection = (cellKey: string, selectedCells: Set<string>): Set<string> => {
  const newSelectedCells = new Set(selectedCells);
  if (newSelectedCells.has(cellKey)) {
    newSelectedCells.delete(cellKey);
  } else {
    newSelectedCells.add(cellKey);
  }
  return newSelectedCells;
};

export const getFirstSelectedCell = (selectedCells: Set<string>): CellPosition | null => {
  const [firstSelectedCell] = [...selectedCells];
  if (!firstSelectedCell) {
    return null;
  }

  const [rowId, columnId] = firstSelectedCell.split(":");
  if (!rowId || !columnId) {
    return null;
  }
  return { columnId, rowId };
};

export const getColumnSizeVars = (columnWidths: Record<string, number>) => {
  const colSizes: { [key: string]: number } = {};
  for (const [columnId, width] of Object.entries(columnWidths)) {
    colSizes[`--col-${columnId}-size`] = width;
  }
  return colSizes;
};

export const isWithinDataAttribute = (target: EventTarget | null, attribute: string): boolean =>
  target instanceof HTMLElement && !!target.closest(`[data-${attribute}]`);

export const shouldAllowEditing = (selectedCells: Set<string>, cellKey: string): boolean =>
  selectedCells.has(cellKey) && selectedCells.size === 1;

export const createNavigationMap = (
  data: SpreadsheetRow[],
  columns: ColumnInfo[],
): Map<string, NavigationMap> => {
  const navigationMap = new Map<string, NavigationMap>();
  const columnIds = columns.map((col) => col.id);

  for (const [rowIndex, row] of data.entries()) {
    for (const [colIndex, columnId] of columnIds.entries()) {
      const cellKey = `${row.id}:${columnId}`;
      const prevRowId = data[rowIndex - 1]?.id;
      const nextRowId = data[rowIndex + 1]?.id;
      const prevColId = columnIds[colIndex - 1];
      const nextColId = columnIds[colIndex + 1];
      const [firstColId] = columnIds;

      const navigation: NavigationMap = {
        down: nextRowId ? `${nextRowId}:${columnId}` : null,
        left: prevColId ? `${row.id}:${prevColId}` : null,
        right: nextColId ? `${row.id}:${nextColId}` : null,
        tab: null,
        up: prevRowId ? `${prevRowId}:${columnId}` : null,
      };

      if (nextColId) {
        navigation.tab = `${row.id}:${nextColId}`;
      } else if (nextRowId && firstColId) {
        navigation.tab = `${nextRowId}:${firstColId}`;
      }

      navigationMap.set(cellKey, navigation);
    }
  }

  return navigationMap;
};

export const getNextCellPositionFromMap = (
  cellKey: string,
  direction: NavigationDirection,
  navigationMap: Map<string, NavigationMap>,
): CellPosition | null => {
  const navigation = navigationMap.get(cellKey);
  if (!navigation) {
    return null;
  }

  const nextCellKey = navigation[direction];
  if (!nextCellKey) {
    return null;
  }

  const [rowId, columnId] = nextCellKey.split(":");
  if (!rowId || !columnId) {
    return null;
  }
  return { columnId, rowId };
};
