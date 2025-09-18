"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { cn } from "@repo/ui/utils";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { MoreVerticalIcon } from "lucide-react";

import type { Person } from "./spreadsheet-provider";
import type { ColumnDef } from "@tanstack/react-table";
import { useSpreadsheet } from "./spreadsheet-provider";

const columnHelper = createColumnHelper<Person>();

interface EditableCellProps {
  getValue: () => any;
  row: any;
  column: any;
  table: any;
  isSelected: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
}

const EditableCell = ({
  getValue,
  row,
  column,
  table,
  isSelected,
  isEditing,
  onStartEdit,
  onStopEdit,
}: EditableCellProps) => {
  const initialValue = getValue();
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const onBlur = () => {
    onStopEdit();
    table.options.meta?.updateData(row.index, column.id, value);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onBlur();
    } else if (e.key === "Escape") {
      setValue(initialValue);
      onStopEdit();
    }
    e.stopPropagation();
  };

  const getStatusDot = () => {
    if (value === "Queued") {
      return (
        <div className="mr-2 h-2 w-2 flex-shrink-0 rounded-full bg-yellow-500" />
      );
    }
    if (value === "Researching...") {
      return (
        <div className="mr-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500" />
      );
    }
    return null;
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className="focus:ring-primary text-foreground h-8 w-full rounded-none border-0 bg-transparent p-1 text-sm focus:ring-1"
        style={{ minWidth: "120px" }}
      />
    );
  }

  return (
    <div className="hover:bg-muted/50 h-8 w-full p-1 transition-colors">
      <div className="flex items-center">
        {getStatusDot()}
        <span className="text-foreground block truncate text-sm" title={value}>
          {value}
        </span>
      </div>
    </div>
  );
};

const ResizeHandle = ({
  columnId,
  columnWidths,
  handleColumnResize,
  tableContainerRef,
  dragLineRef,
  setDragLineVisible,
}: {
  columnId: string;
  columnWidths: Record<string, number>;
  handleColumnResize: (columnId: string, width: number) => void;
  tableContainerRef: React.RefObject<HTMLDivElement | null>;
  dragLineRef: React.RefObject<HTMLDivElement | null>;
  setDragLineVisible: (visible: boolean) => void;
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const columnStartXRef = useRef(0);
  const currentMouseXRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setDragLineVisible(true);
    startXRef.current = e.clientX;
    startWidthRef.current = columnWidths[columnId];

    const headerElement = e.currentTarget.closest(
      "[data-column-id]",
    ) as HTMLElement;
    if (headerElement) {
      const rect = headerElement.getBoundingClientRect();
      const tableRect = tableContainerRef.current?.getBoundingClientRect();
      if (tableRect) {
        columnStartXRef.current = rect.left - tableRect.left;
        const initialDragX =
          columnStartXRef.current + startWidthRef.current - 2; // -2px to center on the 4px wide handle
        if (dragLineRef.current) {
          dragLineRef.current.style.left = `${initialDragX}px`;
        }
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      currentMouseXRef.current = e.clientX;
      const deltaX = e.clientX - startXRef.current;
      const newWidth = Math.max(60, startWidthRef.current + deltaX);
      const dragX = columnStartXRef.current + newWidth - 2; // Keep drag line centered on resize handle position

      if (dragLineRef.current) {
        dragLineRef.current.style.left = `${dragX}px`;
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setDragLineVisible(false);
      const deltaX = currentMouseXRef.current - startXRef.current;
      const newWidth = Math.max(60, startWidthRef.current + deltaX);
      handleColumnResize(columnId, newWidth);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      className={cn(
        "hover:bg-primary/50 absolute top-0 right-0 h-full w-1 cursor-col-resize transition-colors",
        isResizing && "bg-primary",
      )}
      onMouseDown={handleMouseDown}
    />
  );
};

const MemoizedTableBody = React.memo(
  ({
    virtualItems,
    table,
    selectedCells,
    getRowCells,
    handleMouseDown,
    handleMouseMove,
    deleteRow,
  }: {
    virtualItems: any[];
    table: any;
    selectedCells: Set<string>;
    getRowCells: (rowIndex: number) => string[];
    handleMouseDown: (
      e: React.MouseEvent,
      rowIndex: number,
      columnId: string,
    ) => void;
    handleMouseMove: (
      e: React.MouseEvent,
      rowIndex: number,
      columnId: string,
    ) => void;
    deleteRow: (rowIndex: number) => void;
  }) => (
    <>
      {virtualItems.map((virtualRow) => {
        const row = table.getRowModel().rows[virtualRow.index];
        const rowIndex = virtualRow.index;
        const rowCells = getRowCells(rowIndex);
        const isRowSelected = rowCells.every((cell) => selectedCells.has(cell));

        return (
          <div
            key={row.id}
            className={cn(
              "hover:bg-muted/30 absolute top-0 left-0 w-full transition-colors",
              isRowSelected && "bg-muted/50",
            )}
            style={{
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <div className="flex h-full">
              {/* Row number */}
              <div
                data-row-number
                className={cn(
                  "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50 flex h-9 w-12 cursor-pointer items-center justify-center border-r border-b font-mono text-xs transition-colors",
                  isRowSelected && "bg-muted",
                )}
                onMouseDown={(e) => handleMouseDown(e, rowIndex, "")}
                onMouseMove={(e) => handleMouseMove(e, rowIndex, "")}
              >
                {rowIndex + 1}
              </div>
              {row.getVisibleCells().map((cell) => {
                const isCellSelected = selectedCells.has(
                  `${rowIndex}-${cell.column.id}`,
                );

                return (
                  <div
                    key={cell.id}
                    className={cn(
                      "border-border relative flex h-9 cursor-cell items-center border-r border-b",
                      isCellSelected &&
                        "bg-muted ring-border ring-1 ring-inset",
                    )}
                    style={{
                      width: `calc(var(--col-${cell.column.id}-size) * 1px)`,
                    }}
                    onMouseDown={(e) =>
                      handleMouseDown(e, rowIndex, cell.column.id)
                    }
                    onMouseMove={(e) =>
                      handleMouseMove(e, rowIndex, cell.column.id)
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                );
              })}
              {/* Delete button */}
              <div className="border-border flex h-9 w-12 items-center justify-center border-b">
                <Button size="icon" variant="ghost">
                  <MoreVerticalIcon className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </>
  ),
  (prevProps, nextProps) => {
    return (
      prevProps.virtualItems === nextProps.virtualItems &&
      prevProps.selectedCells === nextProps.selectedCells &&
      prevProps.getRowCells === nextProps.getRowCells &&
      prevProps.handleMouseDown === nextProps.handleMouseDown &&
      prevProps.handleMouseMove === nextProps.handleMouseMove
    );
  },
);

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
    dragEndCell,
    setDragEndCell,
    columnWidths,
    setColumnWidths,
    updateData,
    deleteRow,
    tableContainerRef,
    dragLineRef,
    dragLineVisible,
    setDragLineVisible,
  } = useSpreadsheet();

  const columnSizeVars = useMemo(() => {
    const colSizes: { [key: string]: number } = {};
    Object.entries(columnWidths).forEach(([columnId, width]) => {
      colSizes[`--col-${columnId}-size`] = width;
    });
    return colSizes;
  }, [columnWidths]);

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
  const getRowCells = useCallback(
    (rowIndex: number) => {
      return columns.map(
        (col) => `${rowIndex}-${(col as any).accessorKey || col.id}`,
      );
    },
    [columns],
  );

  // Helper function to get all cells in a column
  const getColumnCells = useCallback(
    (columnId: string) => {
      return Array.from({ length: data.length }, (_, i) => `${i}-${columnId}`);
    },
    [data.length],
  );

  // Helper function to get cells in a range
  const getRangeCells = useCallback(
    (startRow: number, startCol: string, endRow: number, endCol: string) => {
      const columnIds = columns.map(
        (col) => (col as any).accessorKey || col.id,
      );
      const startColIndex = columnIds.indexOf(startCol);
      const endColIndex = columnIds.indexOf(endCol);

      const minRow = Math.min(startRow, endRow);
      const maxRow = Math.max(startRow, endRow);
      const minColIndex = Math.min(startColIndex, endColIndex);
      const maxColIndex = Math.max(startColIndex, endColIndex);

      const cells: string[] = [];
      for (let row = minRow; row <= maxRow; row++) {
        for (let colIndex = minColIndex; colIndex <= maxColIndex; colIndex++) {
          cells.push(`${row}-${columnIds[colIndex]}`);
        }
      }
      return cells;
    },
    [columns, data.length],
  );

  // Mouse down handler for all interactions
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, rowIndex: number, columnId: string) => {
      if (e.button !== 0) return; // Only left mouse button

      const cellKey = `${rowIndex}-${columnId}`;

      // Handle row selection (click on row number)
      if (
        e.target instanceof HTMLElement &&
        e.target.closest("[data-row-number]")
      ) {
        const rowCells = getRowCells(rowIndex);

        if (e.ctrlKey || e.metaKey) {
          // Toggle row selection - check if all cells in row are selected
          setSelectedCells((currentSelectedCells) => {
            const isRowFullySelected = rowCells.every((cell) =>
              currentSelectedCells.has(cell),
            );

            if (isRowFullySelected) {
              // Deselect all cells in this row
              const newSelectedCells = new Set(currentSelectedCells);
              rowCells.forEach((cell) => newSelectedCells.delete(cell));
              return newSelectedCells;
            } else {
              // Select all cells in this row
              const newSelectedCells = new Set(currentSelectedCells);
              rowCells.forEach((cell) => newSelectedCells.add(cell));
              return newSelectedCells;
            }
          });
        } else {
          // Select entire row
          setSelectedCells(new Set(rowCells));
        }
        return;
      }

      // Handle column selection (click on column header)
      if (
        e.target instanceof HTMLElement &&
        e.target.closest("[data-column-header]")
      ) {
        const columnCells = getColumnCells(columnId);

        if (e.ctrlKey || e.metaKey) {
          // Toggle column selection - check if all cells in column are selected
          setSelectedCells((currentSelectedCells) => {
            const isColumnFullySelected = columnCells.every((cell) =>
              currentSelectedCells.has(cell),
            );

            if (isColumnFullySelected) {
              // Deselect all cells in this column
              const newSelectedCells = new Set(currentSelectedCells);
              columnCells.forEach((cell) => newSelectedCells.delete(cell));
              return newSelectedCells;
            } else {
              // Select all cells in this column
              const newSelectedCells = new Set(currentSelectedCells);
              columnCells.forEach((cell) => newSelectedCells.add(cell));
              return newSelectedCells;
            }
          });
        } else {
          // Select entire column
          setSelectedCells(new Set(columnCells));
        }
        return;
      }

      // Handle cell selection
      if (e.ctrlKey || e.metaKey) {
        // Toggle cell selection
        setSelectedCells((currentSelectedCells) => {
          const newSelectedCells = new Set(currentSelectedCells);
          if (newSelectedCells.has(cellKey)) {
            newSelectedCells.delete(cellKey);
          } else {
            newSelectedCells.add(cellKey);
          }
          return newSelectedCells;
        });
      } else if (e.shiftKey) {
        // Range selection
        setSelectedCells((currentSelectedCells) => {
          if (currentSelectedCells.size === 0) return new Set([cellKey]);

          const firstSelectedCell = Array.from(currentSelectedCells)[0];
          const [firstRowStr, firstCol] = firstSelectedCell.split("-");
          const firstRow = Number.parseInt(firstRowStr);
          const rangeCells = getRangeCells(
            firstRow,
            firstCol,
            rowIndex,
            columnId,
          );
          return new Set(rangeCells);
        });
      } else {
        // Single cell selection - check if this cell is the only selected cell
        // First check current state to decide what to do
        const shouldEnterEditMode =
          selectedCells.has(cellKey) && selectedCells.size === 1;

        if (shouldEnterEditMode) {
          // If this is the only selected cell, enter edit mode
          // Use setTimeout to ensure this runs after any other state updates
          setTimeout(() => {
            setEditingCell({ rowIndex, columnId });
          }, 0);
        } else {
          // Otherwise, select this cell (and deselect others)
          setSelectedCells(new Set([cellKey]));
        }
      }

      // Start drag selection for potential dragging
      setIsDragging(true);
      setDragStartCell({ rowIndex, columnId });
      setDragEndCell({ rowIndex, columnId });
    },
    [selectedCells, getRowCells, getColumnCells, getRangeCells],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent, rowIndex: number, columnId: string) => {
      if (!isDragging || !dragStartCell) return;

      setDragEndCell({ rowIndex, columnId });

      // Update selection based on drag range
      const rangeCells = getRangeCells(
        dragStartCell.rowIndex,
        dragStartCell.columnId,
        rowIndex,
        columnId,
      );
      setSelectedCells(new Set(rangeCells));
    },
    [isDragging, dragStartCell, getRangeCells],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStartCell(null);
    setDragEndCell(null);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const firstSelectedCell = Array.from(selectedCells)[0];
      if (!firstSelectedCell) return;

      const [rowIndexStr, columnId] = firstSelectedCell.split("-");
      const rowIndex = Number.parseInt(rowIndexStr);
      const columnIds = columns.map(
        (col) => (col as any).accessorKey || col.id,
      );
      const currentColumnIndex = columnIds.indexOf(columnId);

      const activeElement = document.activeElement;
      if (activeElement && activeElement.tagName === "INPUT") {
        return;
      }

      switch (e.key) {
        case "Enter":
          e.preventDefault();
          if (
            editingCell?.rowIndex === rowIndex &&
            editingCell?.columnId === columnId
          ) {
            setEditingCell(null);
          } else {
            setEditingCell({ rowIndex, columnId });
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (rowIndex > 0) {
            const newCellKey = `${rowIndex - 1}-${columnId}`;
            setSelectedCells(new Set([newCellKey]));
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (rowIndex < data.length - 1) {
            const newCellKey = `${rowIndex + 1}-${columnId}`;
            setSelectedCells(new Set([newCellKey]));
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (currentColumnIndex > 0) {
            const newCellKey = `${rowIndex}-${columnIds[currentColumnIndex - 1]}`;
            setSelectedCells(new Set([newCellKey]));
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (currentColumnIndex < columnIds.length - 1) {
            const newCellKey = `${rowIndex}-${columnIds[currentColumnIndex + 1]}`;
            setSelectedCells(new Set([newCellKey]));
          }
          break;
        case "Tab":
          e.preventDefault();
          if (currentColumnIndex < columnIds.length - 1) {
            const newCellKey = `${rowIndex}-${columnIds[currentColumnIndex + 1]}`;
            setSelectedCells(new Set([newCellKey]));
          } else if (rowIndex < data.length - 1) {
            const newCellKey = `${rowIndex + 1}-${columnIds[0]}`;
            setSelectedCells(new Set([newCellKey]));
          }
          break;
      }
    },
    [selectedCells, columns, data.length, editingCell],
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
            className="border-border bg-muted text-muted-foreground hover:bg-muted/80 relative flex h-10 cursor-pointer items-center border-r pl-1 text-left text-xs font-medium transition-colors"
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
            selectedCells={selectedCells}
            getRowCells={getRowCells}
            handleMouseDown={handleMouseDown}
            handleMouseMove={handleMouseMove}
            deleteRow={deleteRow}
          />
        </div>
      </div>
    </div>
  );
};
