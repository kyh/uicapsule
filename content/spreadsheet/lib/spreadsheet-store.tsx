"use client";

import { createContext, use, useMemo } from "react";
import type { ReactNode } from "react";
import { createStore, useStore } from "zustand";
import "../spreadsheet.css";

/** A cell holds the text typed into it, or `undefined` once cleared by Delete/Backspace. */
export type CellValue = string | undefined;

export interface SpreadsheetRow {
  id: string;
  [key: string]: CellValue;
}

export interface SpreadsheetStore {
  data: SpreadsheetRow[];

  selectedCells: Set<string>;
  setSelectedCells: (update: (prev: Set<string>) => Set<string>) => void;

  editingCell: { rowId: string; columnId: string } | null;
  setEditingCell: (cell: { rowId: string; columnId: string } | null) => void;

  dragStartCell: { rowId: string; columnId: string } | null;
  setDragStartCell: (cell: { rowId: string; columnId: string } | null) => void;

  columnWidths: Record<string, number>;
  setColumnWidths: (update: (prev: Record<string, number>) => Record<string, number>) => void;

  dragLineVisible: boolean;
  setDragLineVisible: (visible: boolean) => void;

  updateData: (rowId: string, columnId: string, value: CellValue) => void;
  updateSelectedCellsData: (value?: CellValue) => void;
  addRow: (onCreateRow?: (rowIndex: number) => SpreadsheetRow) => void;
  deleteRow: (rowId: string) => void;
}

const createSpreadsheetStore = (
  initialData: SpreadsheetRow[],
  initialColumnWidths: Record<string, number>,
) =>
  createStore<SpreadsheetStore>((set, get) => ({
    addRow: (onCreateRow) => {
      set((state) => {
        const nextRow = onCreateRow?.(state.data.length) ?? { id: crypto.randomUUID() };
        return { data: [...state.data, nextRow] };
      });
    },
    columnWidths: initialColumnWidths,
    data: initialData,
    deleteRow: (rowId) => {
      set((state) => ({
        data: state.data.filter((row) => row.id !== rowId),
        dragStartCell: state.dragStartCell?.rowId === rowId ? null : state.dragStartCell,
        editingCell: state.editingCell?.rowId === rowId ? null : state.editingCell,
        selectedCells: new Set(
          [...state.selectedCells].filter((key) => !key.startsWith(`${rowId}:`)),
        ),
      }));
    },
    dragLineVisible: false,
    dragStartCell: null,
    editingCell: null,
    selectedCells: new Set(),
    setColumnWidths: (widths) => {
      set((state) => ({
        columnWidths: widths(state.columnWidths),
      }));
    },
    setDragLineVisible: (visible) => set({ dragLineVisible: visible }),
    setDragStartCell: (cell) => set({ dragStartCell: cell }),
    setEditingCell: (cell) => set({ editingCell: cell }),
    setSelectedCells: (cells) => {
      set((state) => ({
        selectedCells: cells(state.selectedCells),
      }));
    },
    updateData: (rowId, columnId, value) => {
      set((state) => ({
        data: state.data.map((row) => {
          if (row.id === rowId) {
            return { ...row, [columnId]: value };
          }
          return row;
        }),
      }));
    },
    updateSelectedCellsData: (value) => {
      if (get().selectedCells.size === 0) {
        return;
      }

      set((state) => {
        const newData = [...state.data];
        for (const cellKey of state.selectedCells) {
          const [rowId, columnId] = cellKey.split(":");
          if (!rowId || !columnId) {
            continue;
          }
          const rowIndex = newData.findIndex((row) => row.id === rowId);
          const currentRow = newData[rowIndex];
          if (!currentRow) {
            continue;
          }

          newData[rowIndex] = { ...currentRow, [columnId]: value };
        }
        return { data: newData };
      });
    },
  }));

type SpreadsheetStoreApi = ReturnType<typeof createSpreadsheetStore>;
const SpreadsheetContext = createContext<SpreadsheetStoreApi | null>(null);

export const SpreadsheetProvider = ({
  initialData,
  initialColumnWidths,
  children,
}: {
  initialData: SpreadsheetRow[];
  initialColumnWidths: Record<string, number>;
  children: ReactNode;
}) => {
  const store = useMemo(
    () => createSpreadsheetStore(initialData, initialColumnWidths),
    [initialData, initialColumnWidths],
  );
  return (
    <SpreadsheetContext value={store}>
      <div className="spreadsheet">{children}</div>
    </SpreadsheetContext>
  );
};

export const useSpreadsheetApi = () => {
  const store = use(SpreadsheetContext);
  if (!store) {
    throw new Error("Spreadsheet components require SpreadsheetProvider");
  }
  return store;
};

export const useSpreadsheetStore = <T,>(selector: (state: SpreadsheetStore) => T): T =>
  useStore(useSpreadsheetApi(), selector);
