"use client";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { cn } from "@repo/ui/utils";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";

import type { SpreadsheetRow } from "../lib/spreadsheet-store";
import type { ColumnInfo } from "../lib/spreadsheet-utils";
import type { ColumnDef } from "@tanstack/react-table";
import { useSpreadsheetStore } from "../lib/spreadsheet-store";
import {
  createNavigationMap,
  getColumnSizeVars,
  getRowCells,
} from "../lib/spreadsheet-utils";
import { useSpreadsheetHandlers } from "../lib/use-spreadsheet-handlers";
import { MemoizedTableBody } from "./memoized-table-body";
import { ResizeHandle } from "./resize-handle";

interface SpreadsheetProps<TRow extends SpreadsheetRow, TValue = unknown>
  extends React.HTMLAttributes<HTMLDivElement> {
  columns: ColumnDef<TRow, TValue>[];
  showRowNumbers?: boolean;
  renderRowNumber?: (rowIndex: number) => React.ReactNode;
  renderRowActions?: (row: TRow, rowIndex: number) => React.ReactNode;
}

function SpreadsheetInner<TRow extends SpreadsheetRow, TValue = unknown>(
  {
    className,
    style,
    columns,
    showRowNumbers = true,
    renderRowNumber,
    renderRowActions,
    ...props
  }: SpreadsheetProps<TRow, TValue>,
  ref: React.Ref<HTMLDivElement>,
) {
  const data = useSpreadsheetStore((state) => state.data);
  const selectedCells = useSpreadsheetStore((state) => state.selectedCells);
  const isDragging = useSpreadsheetStore((state) => state.isDragging);
  const columnWidths = useSpreadsheetStore((state) => state.columnWidths);
  const setColumnWidths = useSpreadsheetStore((state) => state.setColumnWidths);
  const deleteRow = useSpreadsheetStore((state) => state.deleteRow);
  const dragLineVisible = useSpreadsheetStore((state) => state.dragLineVisible);
  const setDragLineVisible = useSpreadsheetStore(
    (state) => state.setDragLineVisible,
  );

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const dragLineRef = useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data: data as TRow[],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Compute column meta locally - no need to store in Zustand
  const columnMeta = useMemo<ColumnInfo[]>(() => {
    return table.getAllLeafColumns().map((column) => ({
      id: column.id,
      accessorKey:
        typeof (column.columnDef as any).accessorKey === "string"
          ? (column.columnDef as any).accessorKey
          : column.id,
    }));
  }, [table]);

  // Compute navigation map locally - no need to store in Zustand
  const navigationMap = useMemo(() => {
    if (columnMeta.length > 0) {
      return createNavigationMap(data, columnMeta);
    }
    return new Map();
  }, [data, columnMeta]);

  const columnSizeVars = useMemo(
    () => getColumnSizeVars(columnWidths),
    [columnWidths],
  );

  const { handleMouseDown, handleMouseMove, handleMouseUp, handleKeyDown } =
    useSpreadsheetHandlers({
      columns: columnMeta,
      navigationMap,
    });

  const handleColumnResize = useCallback(
    (columnId: string, width: number) => {
      setColumnWidths((prev) => ({
        ...prev,
        [columnId]: Math.max(60, width),
      }));
    },
    [setColumnWidths],
  );

  const getRowCellsHelper = useCallback(
    (rowId: string) => {
      return getRowCells(rowId, columnMeta);
    },
    [columnMeta],
  );

  // Mouseup should be global to handle drag ending outside the spreadsheet
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      handleMouseUp();
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [handleMouseUp]);

  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 36,
    overscan: 10,
  });

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex flex-col",
        isDragging && "select-none",
        className,
      )}
      style={{ ...columnSizeVars, ...style }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      {...props}
    >
      <div
        ref={dragLineRef}
        className={cn(
          "bg-primary pointer-events-none absolute top-0 bottom-0 z-50 w-0.5 transition-opacity",
          dragLineVisible ? "opacity-100" : "opacity-0",
        )}
      />

      <div className="bg-muted border-border sticky top-0 z-1 flex border-y">
        {showRowNumbers && (
          <div className="border-border bg-muted text-muted-foreground flex h-10 w-12 shrink-0 items-center justify-center border-r text-xs font-medium">
            #
          </div>
        )}
        {table.getHeaderGroups()[0].headers.map((header) => (
          <div
            key={header.id}
            data-column-id={header.column.id}
            data-column-header
            className="border-border bg-muted text-muted-foreground relative flex h-10 shrink-0 cursor-default items-center border-r pl-1 text-left text-xs font-medium transition-colors"
            style={{
              width: `calc(var(--col-${header.column.id}-size) * 1px)`,
            }}
            onMouseDown={(e) => handleMouseDown(e, "", header.column.id)}
            onMouseMove={(e) => handleMouseMove(e, "", header.column.id)}
          >
            {header.isPlaceholder
              ? null
              : flexRender(header.column.columnDef.header, header.getContext())}
            <ResizeHandle
              columnId={header.column.id}
              columnWidths={columnWidths}
              handleColumnResize={handleColumnResize}
              tableContainerRef={tableContainerRef}
              dragLineRef={dragLineRef}
              setDragLineVisible={setDragLineVisible}
            />
          </div>
        ))}
        {showRowNumbers && (
          <div className="border-border bg-muted text-muted-foreground flex h-10 w-12 shrink-0 items-center justify-center border-r text-xs font-medium" />
        )}
      </div>

      <div ref={tableContainerRef} className="flex-1">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: "relative",
          }}
        >
          <MemoizedTableBody
            virtualItems={rowVirtualizer.getVirtualItems()}
            table={table}
            selectedCells={selectedCells}
            getRowCells={getRowCellsHelper}
            handleMouseDown={handleMouseDown}
            handleMouseMove={handleMouseMove}
            showRowNumbers={showRowNumbers}
            renderRowNumber={renderRowNumber}
            renderRowActions={renderRowActions}
          />
        </div>
      </div>
    </div>
  );
}

SpreadsheetInner.displayName = "SpreadsheetInner";

export const Spreadsheet = React.forwardRef(SpreadsheetInner) as <
  TRow extends SpreadsheetRow,
  TValue = unknown,
>(
  props: SpreadsheetProps<TRow, TValue> & { ref?: React.Ref<HTMLDivElement> },
) => React.ReactElement;

(Spreadsheet as unknown as { displayName: string }).displayName = "Spreadsheet";
