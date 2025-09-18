"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import { cn } from "@repo/ui/utils";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";

import type { Person } from "./spreadsheet-provider";
import { EditableCell } from "./editable-cell";
import { MemoizedTableBody } from "./memoized-table-body";
import { ResizeHandle } from "./resize-handle";
import { useSpreadsheetHandlers } from "./spreadsheet-handlers";
import { useSpreadsheet } from "./spreadsheet-provider";
import { getColumnSizeVars, getRowCells } from "./spreadsheet-utils";

const columnHelper = createColumnHelper<Person>();

export const Spreadsheet: React.FC = () => {
  const {
    data,
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
    updateData,
    deleteRow,
    tableContainerRef,
    dragLineRef,
    dragLineVisible,
    setDragLineVisible,
  } = useSpreadsheet();

  const columnSizeVars = useMemo(
    () => getColumnSizeVars(columnWidths),
    [columnWidths],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("linkedinUrl", {
        header: "LinkedIn URL",
        cell: (props) => (
          <EditableCell
            {...props}
            isSelected={selectedCells.has(
              `${props.row.index}-${props.column.id}`,
            )}
            isEditing={
              editingCell?.rowIndex === props.row.index &&
              editingCell?.columnId === props.column.id
            }
            onStartEdit={() =>
              setEditingCell({
                rowIndex: props.row.index,
                columnId: props.column.id,
              })
            }
            onStopEdit={() => setEditingCell(null)}
          />
        ),
      }),
      columnHelper.accessor("firstName", {
        header: "First Name",
        cell: (props) => (
          <EditableCell
            {...props}
            isSelected={selectedCells.has(
              `${props.row.index}-${props.column.id}`,
            )}
            isEditing={
              editingCell?.rowIndex === props.row.index &&
              editingCell?.columnId === props.column.id
            }
            onStartEdit={() =>
              setEditingCell({
                rowIndex: props.row.index,
                columnId: props.column.id,
              })
            }
            onStopEdit={() => setEditingCell(null)}
          />
        ),
      }),
      columnHelper.accessor("lastName", {
        header: "Last Name",
        cell: (props) => (
          <EditableCell
            {...props}
            isSelected={selectedCells.has(
              `${props.row.index}-${props.column.id}`,
            )}
            isEditing={
              editingCell?.rowIndex === props.row.index &&
              editingCell?.columnId === props.column.id
            }
            onStartEdit={() =>
              setEditingCell({
                rowIndex: props.row.index,
                columnId: props.column.id,
              })
            }
            onStopEdit={() => setEditingCell(null)}
          />
        ),
      }),
      columnHelper.accessor("email", {
        header: "Email",
        cell: (props) => (
          <EditableCell
            {...props}
            isSelected={selectedCells.has(
              `${props.row.index}-${props.column.id}`,
            )}
            isEditing={
              editingCell?.rowIndex === props.row.index &&
              editingCell?.columnId === props.column.id
            }
            onStartEdit={() =>
              setEditingCell({
                rowIndex: props.row.index,
                columnId: props.column.id,
              })
            }
            onStopEdit={() => setEditingCell(null)}
          />
        ),
      }),
      columnHelper.accessor("company", {
        header: "Company",
        cell: (props) => (
          <EditableCell
            {...props}
            isSelected={selectedCells.has(
              `${props.row.index}-${props.column.id}`,
            )}
            isEditing={
              editingCell?.rowIndex === props.row.index &&
              editingCell?.columnId === props.column.id
            }
            onStartEdit={() =>
              setEditingCell({
                rowIndex: props.row.index,
                columnId: props.column.id,
              })
            }
            onStopEdit={() => setEditingCell(null)}
          />
        ),
      }),
      columnHelper.accessor("role", {
        header: "Role",
        cell: (props) => (
          <EditableCell
            {...props}
            isSelected={selectedCells.has(
              `${props.row.index}-${props.column.id}`,
            )}
            isEditing={
              editingCell?.rowIndex === props.row.index &&
              editingCell?.columnId === props.column.id
            }
            onStartEdit={() =>
              setEditingCell({
                rowIndex: props.row.index,
                columnId: props.column.id,
              })
            }
            onStopEdit={() => setEditingCell(null)}
          />
        ),
      }),
    ],
    [selectedCells, editingCell],
  );

  // Get event handlers
  const { handleMouseDown, handleMouseMove, handleMouseUp, handleKeyDown } =
    useSpreadsheetHandlers({
      data,
      columns,
      selectedCells,
      setSelectedCells,
      editingCell,
      setEditingCell,
      isDragging,
      setIsDragging,
      setDragStartCell,
      dragStartCell,
    });

  const handleColumnResize = useCallback(
    (columnId: string, width: number) => {
      setColumnWidths((prev) => ({
        ...prev,
        [columnId]: Math.max(60, width), // Minimum width of 60px
      }));
    },
    [setColumnWidths],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      updateData,
    },
  });

  // Helper function to get all cells in a row
  const getRowCellsHelper = useCallback(
    (rowIndex: number) => {
      return getRowCells(rowIndex, columns);
    },
    [columns],
  );

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      handleKeyDown(e as any);
    };

    const handleGlobalMouseUp = () => {
      handleMouseUp();
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    document.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [handleKeyDown, handleMouseUp]);

  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 36, // 36px row height (h-9 = 36px)
    overscan: 10,
  });

  return (
    <div
      className={cn("flex flex-col", isDragging && "select-none")}
      style={columnSizeVars}
    >
      <div
        ref={dragLineRef}
        className={cn(
          "bg-primary pointer-events-none absolute top-0 bottom-0 z-50 w-0.5 transition-opacity",
          dragLineVisible ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Fixed Header */}
      <div className="bg-muted/50 border-border sticky top-0 z-1 flex border-y">
        {/* Row number header */}
        <div className="border-border bg-muted text-muted-foreground flex h-10 w-12 items-center justify-center border-r text-xs font-medium">
          #
        </div>
        {table.getHeaderGroups()[0].headers.map((header) => (
          <div
            key={header.id}
            data-column-id={header.column.id}
            data-column-header
            className="border-border bg-muted text-muted-foreground hover:bg-muted/80 relative flex h-10 cursor-default items-center border-r pl-1 text-left text-xs font-medium transition-colors"
            style={{
              width: `calc(var(--col-${header.column.id}-size) * 1px)`,
            }}
            onMouseDown={(e) => handleMouseDown(e, 0, header.column.id)}
            onMouseMove={(e) => handleMouseMove(e, 0, header.column.id)}
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
      </div>

      {/* Virtualized Rows */}
      <div ref={tableContainerRef} className="flex-1 overflow-auto">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: "relative",
          }}
        >
          <MemoizedTableBody
            virtualItems={rowVirtualizer.getVirtualItems()}
            table={table}
            data={data}
            selectedCells={selectedCells}
            getRowCells={getRowCellsHelper}
            handleMouseDown={handleMouseDown}
            handleMouseMove={handleMouseMove}
            deleteRow={deleteRow}
          />
        </div>
      </div>
    </div>
  );
};
