"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./components/ui";

import { useMemo } from "react";
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

const generateSamplePeople = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    company: "",
    email: "",
    firstName: "",
    id: `${i + 1}`,
    lastName: "",
    linkedinUrl: `https://linkedin.com/in/user-${i + 1}`,
    role: "",
  })) satisfies Person[];

export const controls = {
  rows: { default: 30, group: "Table", label: "Rows", max: 200, min: 1, step: 1, type: "number" },
  rowNumbers: { default: true, group: "Table", label: "Row numbers", type: "boolean" },
  rowActions: { default: true, group: "Table", label: "Row actions", type: "boolean" },
  statusBar: { default: true, group: "Table", label: "Status bar", type: "boolean" },
  enrichDelay: {
    default: 900,
    group: "Enrich",
    label: "Enrich delay (ms)",
    max: 3000,
    min: 100,
    step: 50,
    type: "number",
  },
  placeholder: { default: "Generating...", group: "Enrich", label: "Placeholder", type: "text" },
  enrichLabel: { default: "Enrich", group: "Enrich", label: "Enrich label", type: "text" },
  selectionColor: { default: "#3b82f6", group: "Color", label: "Selection", type: "color" },
  accentColor: { default: "#f66b2c", group: "Color", label: "Resize guide", type: "color" },
} as const;

interface PreviewProps {
  accentColor: string;
  enrichDelay: number;
  enrichLabel: string;
  placeholder: string;
  rowActions: boolean;
  rowNumbers: boolean;
  rows: number;
  selectionColor: string;
  statusBar: boolean;
}

const ENRICH_JITTER_MS = 500;

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
        <DropdownMenuItem
          onClick={() => {
            deleteRow(row.id);
          }}
          className="text-(--destructive)"
        >
          <TrashIcon className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const ToolbarButtons = ({
  delayMs,
  enrichLabel,
  placeholder,
}: {
  delayMs: readonly [number, number];
  enrichLabel: string;
  placeholder: string;
}) => {
  const { handleEnrich } = useAiEnrichment({ delayMs, placeholder });
  const addRow = useSpreadsheetStore((state) => state.addRow);

  return (
    <>
      <ToolbarButton
        onClick={() => {
          addRow(() => ({
            company: "",
            email: "",
            firstName: "",
            id: crypto.randomUUID(),
            lastName: "",
            linkedinUrl: "",
            role: "",
          }));
        }}
      >
        <Plus className="size-4" />
        Add Row
      </ToolbarButton>
      <ToolbarButton onClick={handleEnrich}>
        <Sparkles className="size-4" />
        {enrichLabel}
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

const Preview = ({
  accentColor = controls.accentColor.default,
  enrichDelay = controls.enrichDelay.default,
  enrichLabel = controls.enrichLabel.default,
  placeholder = controls.placeholder.default,
  rowActions = controls.rowActions.default,
  rowNumbers = controls.rowNumbers.default,
  rows = controls.rows.default,
  selectionColor = controls.selectionColor.default,
  statusBar = controls.statusBar.default,
}: Partial<PreviewProps>) => {
  const initialData = useMemo(() => generateSamplePeople(rows), [rows]);

  const delayMs = [
    Math.max(0, enrichDelay - ENRICH_JITTER_MS),
    enrichDelay + ENRICH_JITTER_MS,
  ] as const;

  return (
    <SpreadsheetProvider
      key={rows}
      initialData={initialData}
      initialColumnWidths={initialColumnWidths}
      accentColor={accentColor}
      selectionColor={selectionColor}
    >
      <Toolbar>
        <ToolbarButtons delayMs={delayMs} enrichLabel={enrichLabel} placeholder={placeholder} />
      </Toolbar>
      <Spreadsheet
        columns={columns}
        showRowNumbers={rowNumbers}
        renderRowActions={rowActions ? (row) => <RowActions row={row} /> : undefined}
      />
      {statusBar && (
        <StatusBar>
          <StatusBarSection>
            <StatusBarMessage />
          </StatusBarSection>
          <StatusBarSection className="justify-end">
            <StatusBarSummary />
          </StatusBarSection>
        </StatusBar>
      )}
    </SpreadsheetProvider>
  );
};

export default Preview;
