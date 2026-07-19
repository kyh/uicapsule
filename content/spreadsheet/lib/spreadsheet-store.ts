import { create } from "zustand";

export interface SpreadsheetRow {
  id: string;
  [key: string]: unknown;
}

export interface SpreadsheetStore {
  // Data state
  data: SpreadsheetRow[];
  setData: (data: SpreadsheetRow[] | ((prev: SpreadsheetRow[]) => SpreadsheetRow[])) => void;

  // Selection state
  selectedCells: Set<string>;
  setSelectedCells: (cells: Set<string> | ((prev: Set<string>) => Set<string>)) => void;

  // Editing state
  editingCell: { rowId: string; columnId: string } | null;
  setEditingCell: (cell: { rowId: string; columnId: string } | null) => void;

  // Drag state
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  dragStartCell: { rowId: string; columnId: string } | null;
  setDragStartCell: (cell: { rowId: string; columnId: string } | null) => void;

  // Column widths
  columnWidths: Record<string, number>;
  setColumnWidths: (
    widths: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>),
  ) => void;

  // Drag line
  dragLineVisible: boolean;
  setDragLineVisible: (visible: boolean) => void;

  // Actions
  updateData: (rowId: string, columnId: string, value: unknown) => void;
  updateSelectedCellsData: (value: unknown) => void;
  addRow: (onCreateRow?: (rowIndex: number) => SpreadsheetRow) => void;
  deleteRow: (rowId: string) => void;
}

export const useSpreadsheetStore = create<SpreadsheetStore>((set, get) => ({
  // Initial state
  data: [],
  selectedCells: new Set(),
  editingCell: null,
  isDragging: false,
  dragStartCell: null,
  columnWidths: {},
  dragLineVisible: false,

  // Setters
  setData: (data) => {
    set((state) => ({
      data: typeof data === "function" ? data(state.data) : data,
    }));
  },

  setSelectedCells: (cells) => {
    set((state) => ({
      selectedCells: typeof cells === "function" ? cells(state.selectedCells) : cells,
    }));
  },

  setEditingCell: (cell) => set({ editingCell: cell }),
  setIsDragging: (dragging) => set({ isDragging: dragging }),
  setDragStartCell: (cell) => set({ dragStartCell: cell }),

  setColumnWidths: (widths) => {
    set((state) => ({
      columnWidths: typeof widths === "function" ? widths(state.columnWidths) : widths,
    }));
  },

  setDragLineVisible: (visible) => set({ dragLineVisible: visible }),

  // Actions
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
    if (get().selectedCells.size === 0) return;

    set((state) => {
      const newData = [...state.data];
      state.selectedCells.forEach((cellKey) => {
        const [rowId, columnId] = cellKey.split(":");
        if (!rowId || !columnId) return;
        const rowIndex = newData.findIndex((row) => row.id === rowId);
        const currentRow = newData[rowIndex];
        if (!currentRow) return;

        newData[rowIndex] = { ...currentRow, [columnId]: value };
      });
      return { data: newData };
    });
  },

  addRow: (onCreateRow) => {
    set((state) => {
      const nextRow = onCreateRow?.(state.data.length) ?? { id: `${Date.now()}` };
      return { data: [...state.data, nextRow] };
    });
  },

  deleteRow: (rowId) => {
    set((state) => ({ data: state.data.filter((row) => row.id !== rowId) }));
  },
}));
