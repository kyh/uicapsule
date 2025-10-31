"use client";

import React, { useCallback, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { StaticChatTransport } from "@loremllm/transport";
import { Button } from "@repo/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { createColumnHelper } from "@tanstack/react-table";
import {
  Download,
  MoreVerticalIcon,
  Plus,
  Sparkles,
  TrashIcon,
  Upload,
} from "lucide-react";

import type { UpdateCellTool } from "./lib/fake-generator";
import type { UIMessage } from "@ai-sdk/react";
import { EditableCell } from "./components/editable-cell";
import { Spreadsheet } from "./components/spreadsheet";
import {
  StatusBar,
  StatusBarMessage,
  StatusBarSection,
  StatusBarSummary,
} from "./components/status-bar";
import { Toolbar, ToolbarButton } from "./components/toolbar";
import { generateFakeToolCalls } from "./lib/fake-generator";
import { useSpreadsheetStore } from "./lib/spreadsheet-store";

type Person = {
  id: string;
  linkedinUrl: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  role: string;
};

const columnHelper = createColumnHelper<Person>();

const generateSamplePeople = (count: number): Person[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `${i + 1}`,
    linkedinUrl: `https://linkedin.com/in/user-${i + 1}`,
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    role: "",
  }));
};

// Initialize store outside React
const initializeStore = () => {
  const store = useSpreadsheetStore.getState();
  if (store.data.length === 0) {
    store.setData(generateSamplePeople(30));
  }
  if (Object.keys(store.columnWidths).length === 0) {
    store.setColumnWidths({
      linkedinUrl: 250,
      firstName: 120,
      lastName: 120,
      email: 180,
      company: 150,
      role: 150,
    });
  }
};

// Row actions component that uses the spreadsheet context
const RowActions = ({ row }: { row: Person }) => {
  const deleteRow = useSpreadsheetStore((state) => state.deleteRow);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8">
          <MoreVerticalIcon className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => deleteRow(row.id)}
          className="text-destructive"
        >
          <TrashIcon className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const transport = new StaticChatTransport({
  async resolveMessages({
    messages,
  }: {
    messages: UIMessage<UpdateCellTool>[];
  }) {
    // Get current values directly from zustand store at call time
    const store = useSpreadsheetStore.getState();
    const currentSelectedCells = store.selectedCells;
    const currentData = store.data;
    const currentSetData = store.setData;

    // Set all selected cells to "Generating..." immediately when enrichment starts
    const cellsToGenerate = new Set<string>();
    currentSelectedCells.forEach((cellKey) => {
      const [rowId, columnId] = cellKey.split(":");
      if (rowId && columnId && columnId !== "linkedinUrl") {
        cellsToGenerate.add(cellKey);
      }
    });

    // Batch all "Generating..." updates in a single state update
    if (cellsToGenerate.size > 0) {
      const rowUpdatesMap = new Map<string, Set<string>>();
      cellsToGenerate.forEach((cellKey) => {
        const [rowId, columnId] = cellKey.split(":");
        if (rowId && columnId) {
          if (!rowUpdatesMap.has(rowId)) {
            rowUpdatesMap.set(rowId, new Set());
          }
          rowUpdatesMap.get(rowId)!.add(columnId);
        }
      });

      currentSetData((oldData) => {
        if (!oldData || oldData.length === 0) {
          return oldData;
        }

        return oldData.map((row) => {
          const columnsToUpdate = rowUpdatesMap.get(row.id);
          if (!columnsToUpdate || columnsToUpdate.size === 0) {
            return row;
          }

          const updates: Record<string, string> = {};
          columnsToUpdate.forEach((columnId) => {
            updates[columnId] = "Generating...";
          });

          return { ...row, ...updates };
        });
      });
    }

    return [
      ...messages,
      generateFakeToolCalls(currentSelectedCells, currentData),
    ];
  },
  chunkDelayMs: 200,
});

const ToolbarButtons = () => {
  const addRow = useCallback(() => {
    useSpreadsheetStore.getState().addRow((index) => ({
      id: `${Date.now()}-${index}`,
      linkedinUrl: "",
      firstName: "",
      lastName: "",
      email: "",
      company: "",
      role: "",
    }));
  }, []);

  const { sendMessage } = useChat({
    transport,
    onToolCall: ({ toolCall }) => {
      const store = useSpreadsheetStore.getState();

      const toolPart = toolCall as unknown as {
        type: string;
        toolCallId: string;
        input?: {
          rowId: string;
          columnId: string;
          value?: string;
        };
        output?: {
          rowId?: string;
          columnId?: string;
          value?: string;
        };
      };

      // Extract rowId and columnId from either input or output
      const rowId = toolPart.input?.rowId || toolPart.output?.rowId;
      const columnId = toolPart.input?.columnId || toolPart.output?.columnId;

      if (!rowId || !columnId) {
        return;
      }

      // Handle tool-input-available - tool call is starting
      if (toolPart.type === "tool-input-available" && toolPart.input) {
        // Skip if we've already processed this tool call
        if (store.processedToolCalls.has(toolPart.toolCallId)) {
          return;
        }

        // If the input already contains the value, use it
        if (toolPart.input.value) {
          store.addProcessedToolCall(toolPart.toolCallId);
          store.updateData(rowId, columnId, toolPart.input.value);
        }
      }

      // Handle tool-output-available - tool call completed
      if (toolPart.type === "tool-output-available") {
        const value = toolPart.output?.value || toolPart.input?.value;

        if (value && !store.processedToolCalls.has(toolPart.toolCallId)) {
          store.addProcessedToolCall(toolPart.toolCallId);
          store.updateData(rowId, columnId, value);
        }
      }
    },
  });

  return (
    <>
      <ToolbarButton onClick={() => addRow()}>
        <Plus className="size-4" />
        Add Row
      </ToolbarButton>
      <ToolbarButton
        onClick={() => {
          void sendMessage({ text: "enrich" });
        }}
      >
        <Sparkles className="size-4" />
        Enrich
      </ToolbarButton>
      <ToolbarButton onClick={() => alert("Import")}>
        <Upload className="size-4" />
        Import
      </ToolbarButton>
      <ToolbarButton onClick={() => alert("Export")}>
        <Download className="size-4" />
        Export
      </ToolbarButton>
    </>
  );
};

const Preview = () => {
  const columns = useMemo(
    () => [
      columnHelper.accessor("linkedinUrl", {
        header: "LinkedIn URL",
        cell: EditableCell,
      }),
      columnHelper.accessor("firstName", {
        header: "First Name",
        cell: EditableCell,
      }),
      columnHelper.accessor("lastName", {
        header: "Last Name",
        cell: EditableCell,
      }),
      columnHelper.accessor("email", {
        header: "Email",
        cell: EditableCell,
      }),
      columnHelper.accessor("company", {
        header: "Company",
        cell: EditableCell,
      }),
      columnHelper.accessor("role", {
        header: "Role",
        cell: EditableCell,
      }),
    ],
    [],
  );

  return (
    <>
      <Toolbar>
        <ToolbarButtons />
      </Toolbar>
      <Spreadsheet
        columns={columns}
        showRowNumbers
        renderRowActions={(row) => <RowActions row={row} />}
      />
      <StatusBar>
        <StatusBarSection>
          <StatusBarMessage />
        </StatusBarSection>
        <StatusBarSection className="justify-end">
          <StatusBarSummary />
        </StatusBarSection>
      </StatusBar>
    </>
  );
};

initializeStore();

export default Preview;
