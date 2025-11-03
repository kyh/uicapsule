import { create } from "zustand";

export type SpreadsheetRow = Record<string, any>;

export interface SpreadsheetStore<
  TRow extends SpreadsheetRow = SpreadsheetRow,
> {
  // Data state
  data: TRow[];
  setData: (data: TRow[] | ((prev: TRow[]) => TRow[])) => void;

  // Selection state
  selectedCells: Set<string>;
  setSelectedCells: (
    cells: Set<string> | ((prev: Set<string>) => Set<string>),
  ) => void;

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
    widths:
      | Record<string, number>
      | ((prev: Record<string, number>) => Record<string, number>),
  ) => void;

  // Drag line
  dragLineVisible: boolean;
  setDragLineVisible: (visible: boolean) => void;

  // Actions
  updateData: (rowId: string, columnId: string, value: unknown) => void;
  updateSelectedCellsData: (
    value:
      | unknown
      | ((options: {
          row: SpreadsheetRow;
          columnId: string;
          currentValue: unknown;
        }) => unknown),
  ) => void;
  addRow: (onCreateRow?: (rowIndex: number) => TRow) => void;
  deleteRow: (rowId: string, onDeleteRow?: (rowId: string) => void) => void;
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
      selectedCells:
        typeof cells === "function" ? cells(state.selectedCells) : cells,
    }));
  },

  setEditingCell: (cell) => set({ editingCell: cell }),
  setIsDragging: (dragging) => set({ isDragging: dragging }),
  setDragStartCell: (cell) => set({ dragStartCell: cell }),

  setColumnWidths: (widths) => {
    set((state) => ({
      columnWidths:
        typeof widths === "function" ? widths(state.columnWidths) : widths,
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
    const state = get();
    if (state.selectedCells.size === 0) return;

    set((state) => {
      const newData = [...state.data];
      state.selectedCells.forEach((cellKey) => {
        const [rowId, columnId] = cellKey.split(":");
        const rowIndex = newData.findIndex((row) => row.id === rowId);

        if (rowIndex >= 0 && rowIndex < newData.length) {
          const currentRow = newData[rowIndex];
          const newValue =
            typeof value === "function"
              ? (
                  value as (options: {
                    row: SpreadsheetRow;
                    columnId: string;
                    currentValue: unknown;
                  }) => unknown
                )({
                  row: currentRow,
                  columnId,
                  currentValue: currentRow?.[columnId],
                })
              : value;

          newData[rowIndex] = {
            ...currentRow,
            [columnId]: newValue,
          };
        }
      });
      return { data: newData };
    });
  },

  addRow: (onCreateRow) => {
    set((state) => {
      const nextRow =
        onCreateRow?.(state.data.length) ?? ({} as SpreadsheetRow);
      return { data: [...state.data, nextRow] };
    });
  },

  deleteRow: (rowId, onDeleteRow) => {
    set((state) => {
      onDeleteRow?.(rowId);
      return { data: state.data.filter((row) => row.id !== rowId) };
    });
  },
}));
