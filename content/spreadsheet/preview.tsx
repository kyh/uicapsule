"use client";

import React, { useCallback, useMemo } from "react";
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

import { EditableCell } from "./components/editable-cell";
import { Spreadsheet } from "./components/spreadsheet";
import {
  StatusBar,
  StatusBarMessage,
  StatusBarSection,
  StatusBarSummary,
} from "./components/status-bar";
import { Toolbar, ToolbarButton } from "./components/toolbar";
import { useSpreadsheetStore } from "./lib/spreadsheet-store";
import { useAiEnrichment } from "./lib/use-ai-enrichment";

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

  const { handleEnrich } = useAiEnrichment();

  return (
    <>
      <ToolbarButton onClick={() => addRow()}>
        <Plus className="size-4" />
        Add Row
      </ToolbarButton>
      <ToolbarButton onClick={handleEnrich}>
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
