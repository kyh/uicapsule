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
import { EditableCell } from "./components/editable-cell";
import { Spreadsheet } from "./components/spreadsheet";
import {
  StatusBar,
  StatusBarMessage,
  StatusBarSection,
  StatusBarSummary,
} from "./components/status-bar";
import { Toolbar, ToolbarButton } from "./components/toolbar";
import type { SpreadsheetRow } from "./lib/spreadsheet-store";
import { SpreadsheetProvider, useSpreadsheetStore } from "./lib/spreadsheet-store";
import { useAiEnrichment } from "./lib/use-ai-enrichment";

interface Person extends SpreadsheetRow {
  id: string;
  linkedinUrl: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  role: string;
}

const generateSamplePeople = (count: number): Person[] =>
  Array.from({ length: count }, (_, i) => ({
    company: "",
    email: "",
    firstName: "",
    id: `${i + 1}`,
    lastName: "",
    linkedinUrl: `https://linkedin.com/in/user-${i + 1}`,
    role: "",
  }));

const initialData = generateSamplePeople(30);
const initialColumnWidths = {
  company: 150,
  email: 180,
  firstName: 120,
  lastName: 120,
  linkedinUrl: 250,
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
            company: "",
            email: "",
            firstName: "",
            id: crypto.randomUUID(),
            lastName: "",
            linkedinUrl: "",
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
  { accessorKey: "linkedinUrl", cell: EditableCell, header: "LinkedIn URL" },
  { accessorKey: "firstName", cell: EditableCell, header: "First Name" },
  { accessorKey: "lastName", cell: EditableCell, header: "Last Name" },
  { accessorKey: "email", cell: EditableCell, header: "Email" },
  { accessorKey: "company", cell: EditableCell, header: "Company" },
  { accessorKey: "role", cell: EditableCell, header: "Role" },
];

const Preview = () => (
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

export default Preview;
