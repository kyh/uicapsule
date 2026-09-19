"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { HTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "cn";
import { flexRender, useTable } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";

import type { SpreadsheetRow } from "../lib/spreadsheet-store";
import type { ColumnInfo, NavigationMap, SpreadsheetFeatures } from "../lib/spreadsheet-utils";
import type { ColumnDef } from "@tanstack/react-table";
import { useSpreadsheetStore } from "../lib/spreadsheet-store";
import {
  createNavigationMap,
  getColumnSizeVars,
  getRowCells,
  MIN_COLUMN_WIDTH,
  spreadsheetFeatures,
} from "../lib/spreadsheet-utils";
import { useSpreadsheetHandlers } from "../lib/use-spreadsheet-handlers";
import { TableBody } from "./table-body";
import { ResizeHandle } from "./resize-handle";

export interface SpreadsheetProps extends HTMLAttributes<HTMLDivElement> {
  columns: ColumnDef<SpreadsheetFeatures, SpreadsheetRow>[];
  showRowNumbers?: boolean;
  renderRowNumber?: (rowIndex: number) => ReactNode;
  renderRowActions?: (row: SpreadsheetRow, rowIndex: number) => ReactNode;
  ref?: Ref<HTMLDivElement>;
}

export const Spreadsheet = ({
  className,
  style,
  columns,
  showRowNumbers = true,
  renderRowNumber,
  renderRowActions,
  ref,
  ...props
}: SpreadsheetProps) => {
  "use no memo";

  // TanStack Virtual exposes mutable measurements that React Compiler cannot memoize.
  const data = useSpreadsheetStore((state) => state.data);
  const selectedCells = useSpreadsheetStore((state) => state.selectedCells);
  const isDragging = useSpreadsheetStore((state) => state.dragStartCell !== null);
  const columnWidths = useSpreadsheetStore((state) => state.columnWidths);
  const setColumnWidths = useSpreadsheetStore((state) => state.setColumnWidths);
  const dragLineVisible = useSpreadsheetStore((state) => state.dragLineVisible);
  const setDragLineVisible = useSpreadsheetStore((state) => state.setDragLineVisible);

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const dragLineRef = useRef<HTMLDivElement>(null);

  const table = useTable({
    columns,
    data,
    features: spreadsheetFeatures,
  });

  const leafColumns = table.getAllLeafColumns();
  const columnMeta = useMemo<ColumnInfo[]>(
    () => leafColumns.map((column) => ({ id: column.id })),
    [leafColumns],
  );

  const navigationMap = useMemo<Map<string, NavigationMap>>(
    () => createNavigationMap(data, columnMeta),
    [data, columnMeta],
  );

  const columnSizeVars = useMemo(() => getColumnSizeVars(columnWidths), [columnWidths]);

  const { handleMouseDown, handleMouseMove, handleMouseUp, handleKeyDown } = useSpreadsheetHandlers(
    {
      columns: columnMeta,
      navigationMap,
    },
  );

  const handleColumnResize = useCallback(
    (columnId: string, width: number) => {
      setColumnWidths((prev) => ({
        ...prev,
        [columnId]: Math.max(MIN_COLUMN_WIDTH, width),
      }));
    },
    [setColumnWidths],
  );

  const getRowCellsHelper = useCallback(
    (rowId: string) => getRowCells(rowId, columnMeta),
    [columnMeta],
  );

  // Mouseup should be global to handle drag ending outside the spreadsheet
  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseUp]);

  // oxlint-disable-next-line react/incompatible-library -- This component and its table body opt out of memoization for mutable virtualizer measurements.
  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    estimateSize: () => 36,
    getScrollElement: () => tableContainerRef.current,
    overscan: 10,
  });

  return (
    <div
      ref={ref}
      role="grid"
      className={cn("relative flex flex-col", isDragging && "select-none", className)}
      style={{ ...columnSizeVars, ...style }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      {...props}
    >
      <div
        ref={dragLineRef}
        className={cn(
          "bg-(--primary) pointer-events-none absolute top-0 bottom-0 z-50 w-0.5 transition-opacity",
          dragLineVisible ? "opacity-100" : "opacity-0",
        )}
      />

      <div className="bg-(--muted) border-(--border) sticky top-0 z-1 flex border-y">
        {showRowNumbers && (
          <div className="border-(--border) bg-(--muted) text-(--muted-foreground) flex h-10 w-12 shrink-0 items-center justify-center border-r text-xs font-medium">
            #
          </div>
        )}
        {(table.getHeaderGroups()[0]?.headers ?? []).map((header) => (
          <div
            key={header.id}
            role="presentation"
            data-column-id={header.column.id}
            data-column-header
            className="border-(--border) bg-(--muted) text-(--muted-foreground) relative flex h-10 shrink-0 cursor-default items-center border-r pl-1 text-left text-xs font-medium transition-colors"
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
              width={columnWidths[header.column.id] ?? 0}
              handleColumnResize={handleColumnResize}
              tableContainerRef={tableContainerRef}
              dragLineRef={dragLineRef}
              setDragLineVisible={setDragLineVisible}
            />
          </div>
        ))}
        {showRowNumbers && (
          <div className="border-(--border) bg-(--muted) text-(--muted-foreground) flex h-10 w-12 shrink-0 items-center justify-center border-r text-xs font-medium" />
        )}
      </div>

      <div ref={tableContainerRef} className="flex-1">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: "relative",
          }}
        >
          <TableBody
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
};
