"use client";

import React, { useEffect, useRef, useState } from "react";
import { Input } from "@repo/ui/input";

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

export const EditableCell = ({
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
        className="h-8 w-full rounded-none border-0 bg-transparent p-1 text-sm focus-visible:ring-blue-600/20"
        style={{ minWidth: "120px" }}
      />
    );
  }

  return (
    <div className="h-8 w-full p-1">
      <div className="flex items-center">
        {getStatusDot()}
        <span className="text-foreground block truncate text-sm" title={value}>
          {value}
        </span>
      </div>
    </div>
  );
};
