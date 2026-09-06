"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./components/ui";

import { MoreVerticalIcon, Plus, Sparkles, TrashIcon } from "lucide-react";

import type { SpreadsheetProps } from "./components/spreadsheet";
import type { SpreadsheetRow } from "./lib/spreadsheet-store";
import { EditableCell } from "./components/editable-cell";
import { Spreadsheet } from "./components/spreadsheet";
import {
  StatusBar,
  StatusBarMessage,
  StatusBarSection,
  StatusBarSummary,
} from "./components/status-bar";
import { Toolbar, ToolbarButton } from "./components/toolbar";
import { SpreadsheetProvider, useSpreadsheetStore } from "./lib/spreadsheet-store";
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

const initialData = generateSamplePeople(30);
const initialColumnWidths = {
  linkedinUrl: 250,
  firstName: 120,
  lastName: 120,
  email: 180,
  company: 150,
  role: 150,
};

const RowActions = ({ row }: { row: SpreadsheetRow }) => {
  const deleteRow = useSpreadsheetStore((state) => state.deleteRow);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Row actions"
        render={<Button size="icon" variant="ghost" className="h-8 w-8" />}
      >
        <MoreVerticalIcon className="h-3 w-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => deleteRow(row.id)} className="text-(--destructive)">
          <TrashIcon className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const ToolbarButtons = () => {
  const { handleEnrich } = useAiEnrichment();
  const addRow = useSpreadsheetStore((state) => state.addRow);

  return (
    <>
      <ToolbarButton
        onClick={() =>
          addRow(() => ({
            id: crypto.randomUUID(),
            linkedinUrl: "",
            firstName: "",
            lastName: "",
            email: "",
            company: "",
            role: "",
          }))
        }
      >
        <Plus className="size-4" />
        Add Row
      </ToolbarButton>
      <ToolbarButton onClick={handleEnrich}>
        <Sparkles className="size-4" />
        Enrich
      </ToolbarButton>
    </>
  );
};

const columns: SpreadsheetProps["columns"] = [
  { accessorKey: "linkedinUrl", header: "LinkedIn URL", cell: EditableCell },
  { accessorKey: "firstName", header: "First Name", cell: EditableCell },
  { accessorKey: "lastName", header: "Last Name", cell: EditableCell },
  { accessorKey: "email", header: "Email", cell: EditableCell },
  { accessorKey: "company", header: "Company", cell: EditableCell },
  { accessorKey: "role", header: "Role", cell: EditableCell },
];

const Preview = () => {
  return (
    <SpreadsheetProvider initialData={initialData} initialColumnWidths={initialColumnWidths}>
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
    </SpreadsheetProvider>
  );
};

export default Preview;
