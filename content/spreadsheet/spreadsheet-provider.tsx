"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ColumnDef, Table } from "@tanstack/react-table";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";

import type { ColumnInfo } from "./spreadsheet-utils";

type SpreadsheetRow = Record<string, any>;

export interface EnrichmentHandlerParams<TData extends SpreadsheetRow> {
  data: TData[];
  updateData: (rowIndex: number, columnId: string, value: any) => void;
  selectedCells: Set<string>;
  setData: React.Dispatch<React.SetStateAction<TData[]>>;
}

export type SpreadsheetEnrichmentHandler<TData extends SpreadsheetRow> = (
  params: EnrichmentHandlerParams<TData>,
) => Promise<void> | void;

interface SpreadsheetContextType<TData extends SpreadsheetRow> {
  data: TData[];
  setData: React.Dispatch<React.SetStateAction<TData[]>>;
  table: Table<TData>;
  columnMeta: ColumnInfo[];
  selectedCells: Set<string>;
  setSelectedCells: React.Dispatch<React.SetStateAction<Set<string>>>;
  editingCell: { rowIndex: number; columnId: string } | null;
  setEditingCell: React.Dispatch<
    React.SetStateAction<{ rowIndex: number; columnId: string } | null>
  >;
  isDragging: boolean;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
  dragStartCell: { rowIndex: number; columnId: string } | null;
  setDragStartCell: React.Dispatch<
    React.SetStateAction<{ rowIndex: number; columnId: string } | null>
  >;
  columnWidths: Record<string, number>;
  setColumnWidths: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  isEnriching: boolean;
  startEnrichment: () => void;
  canEnrich: boolean;
  addRow: () => void;
  deleteRow: (rowIndex: number) => void;
  updateData: (rowIndex: number, columnId: string, value: any) => void;
  clearSelectedCells: () => void;
  tableContainerRef: React.RefObject<HTMLDivElement | null>;
  dragLineRef: React.RefObject<HTMLDivElement | null>;
  dragLineVisible: boolean;
  setDragLineVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const SpreadsheetContext =
  createContext<SpreadsheetContextType<SpreadsheetRow> | undefined>(undefined);

const getColumnId = <TData extends SpreadsheetRow>(
  column: ColumnDef<TData, any>,
) => {
  if (typeof column.id === "string" && column.id) {
    return column.id;
  }
  if (typeof column.accessorKey === "string" && column.accessorKey) {
    return column.accessorKey;
  }
  return "";
};

interface SpreadsheetProviderProps<TData extends SpreadsheetRow> {
  children: React.ReactNode;
  columns: ColumnDef<TData, any>[];
  initialData?: TData[];
  initialColumnWidths?: Record<string, number>;
  createRow?: (rowIndex: number) => TData;
  clearCellValue?: (options: {
    row: TData;
    columnId: string;
    value: any;
  }) => any;
  onEnrich?: SpreadsheetEnrichmentHandler<TData>;
}

export function SpreadsheetProvider<TData extends SpreadsheetRow>({
  children,
  columns,
  initialData,
  initialColumnWidths,
  createRow,
  clearCellValue,
  onEnrich,
}: SpreadsheetProviderProps<TData>) {
  const [data, setData] = useState<TData[]>(() => initialData ?? []);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{
    rowIndex: number;
    columnId: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartCell, setDragStartCell] = useState<{
    rowIndex: number;
    columnId: string;
  } | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const initialWidths: Record<string, number> = {};
    columns.forEach((column) => {
      const id = getColumnId(column);
      if (id) {
        initialWidths[id] = initialColumnWidths?.[id] ?? 150;
      }
    });
    return initialWidths;
  });
  const [dragLineVisible, setDragLineVisible] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const canEnrich = Boolean(onEnrich);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const dragLineRef = useRef<HTMLDivElement>(null);

  const updateData = useCallback(
    (rowIndex: number, columnId: string, value: any) => {
      setData((old) =>
        old.map((row, index) => {
          if (index === rowIndex) {
            return {
              ...row,
              [columnId]: value,
            };
          }
          return row;
        }),
      );
    },
    [],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      updateData,
    },
  });

  const columnMeta = useMemo<ColumnInfo[]>(() => {
    return table.getAllLeafColumns().map((column) => ({
      id: column.id,
      accessorKey:
        typeof column.columnDef.accessorKey === "string"
          ? column.columnDef.accessorKey
          : column.id,
    }));
  }, [table]);

  useEffect(() => {
    setColumnWidths((prev) => {
      const next: Record<string, number> = {};
      columnMeta.forEach(({ id }) => {
        next[id] = prev[id] ?? initialColumnWidths?.[id] ?? 150;
      });
      return next;
    });
  }, [columnMeta, initialColumnWidths]);

  const addRow = useCallback(() => {
    setData((old) => {
      const nextRow = createRow?.(old.length) ?? ({} as TData);
      return [...old, nextRow];
    });
  }, [createRow]);

  const deleteRow = useCallback((rowIndex: number) => {
    setData((old) => old.filter((_, index) => index !== rowIndex));
  }, []);

  const clearSelectedCells = useCallback(() => {
    if (selectedCells.size === 0) return;

    setData((old) => {
      const newData = [...old];
      selectedCells.forEach((cellKey) => {
        const [rowIndexStr, columnId] = cellKey.split("-");
        const rowIndex = Number.parseInt(rowIndexStr, 10);

        if (rowIndex >= 0 && rowIndex < newData.length) {
          const currentRow = newData[rowIndex];
          newData[rowIndex] = {
            ...currentRow,
            [columnId]: clearCellValue
              ? clearCellValue({
                  row: currentRow,
                  columnId,
                  value: currentRow?.[columnId],
                })
              : "",
          };
        }
      });
      return newData;
    });
  }, [clearCellValue, selectedCells]);

  const startEnrichment = useCallback(() => {
    if (!onEnrich) return;

    setIsEnriching(true);
    Promise.resolve(
      onEnrich({
        data,
        updateData,
        selectedCells,
        setData,
      }),
    ).finally(() => setIsEnriching(false));
  }, [data, onEnrich, selectedCells, updateData]);

  const value: SpreadsheetContextType<TData> = {
    data,
    setData,
    table,
    columnMeta,
    selectedCells,
    setSelectedCells,
    editingCell,
    setEditingCell,
    isDragging,
    setIsDragging,
    dragStartCell,
    setDragStartCell,
    columnWidths,
    setColumnWidths,
    isEnriching,
    startEnrichment,
    canEnrich,
    addRow,
    deleteRow,
    updateData,
    clearSelectedCells,
    tableContainerRef,
    dragLineRef,
    dragLineVisible,
    setDragLineVisible,
  };

  return (
    <SpreadsheetContext.Provider value={value}>
      {children}
    </SpreadsheetContext.Provider>
  );
}

export const useSpreadsheet = <TData extends SpreadsheetRow>() => {
  const context = useContext(SpreadsheetContext);
  if (context === undefined) {
    throw new Error("useSpreadsheet must be used within a SpreadsheetProvider");
  }
  return context as SpreadsheetContextType<TData>;
};

export type {
  SpreadsheetRow,
  SpreadsheetProviderProps,
  SpreadsheetEnrichmentHandler,
  EnrichmentHandlerParams,
};
