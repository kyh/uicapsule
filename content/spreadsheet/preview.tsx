import React, { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";

import type { Person } from "./lib/use-enrichment";
import { EditableCell } from "./components/editable-cell";
import { Spreadsheet } from "./components/spreadsheet";
import { SpreadsheetProvider } from "./components/spreadsheet-provider";
import {
  StatusBar,
  StatusBarMessage,
  StatusBarSection,
  StatusBarSummary,
} from "./components/status-bar";
import {
  Toolbar,
  ToolbarAddRowButton,
  ToolbarEnrichButton,
  ToolbarExportButton,
  ToolbarImportButton,
} from "./components/toolbar";
import {
  generateSamplePeople,
  sampleEnrichmentHandler,
} from "./lib/use-enrichment";

const columnHelper = createColumnHelper<Person>();

const Preview = () => {
  const columns = useMemo(
    () => [
      columnHelper.accessor("linkedinUrl", {
        header: "LinkedIn URL",
        cell: (props) => <EditableCell {...props} />,
      }),
      columnHelper.accessor("firstName", {
        header: "First Name",
        cell: (props) => <EditableCell {...props} />,
      }),
      columnHelper.accessor("lastName", {
        header: "Last Name",
        cell: (props) => <EditableCell {...props} />,
      }),
      columnHelper.accessor("email", {
        header: "Email",
        cell: (props) => <EditableCell {...props} />,
      }),
      columnHelper.accessor("company", {
        header: "Company",
        cell: (props) => <EditableCell {...props} />,
      }),
      columnHelper.accessor("role", {
        header: "Role",
        cell: (props) => <EditableCell {...props} />,
      }),
    ],
    [columnHelper],
  );

  return (
    <SpreadsheetProvider
      columns={columns}
      initialData={generateSamplePeople(30)}
      initialColumnWidths={{
        linkedinUrl: 250,
        firstName: 120,
        lastName: 120,
        email: 180,
        company: 150,
        role: 150,
      }}
      createRow={(index) => ({
        id: `${index + 1}`,
        linkedinUrl: "",
        firstName: "",
        lastName: "",
        email: "",
        company: "",
        role: "",
      })}
      onEnrich={sampleEnrichmentHandler}
    >
      <Toolbar>
        <ToolbarEnrichButton />
        <ToolbarAddRowButton />
        <ToolbarImportButton />
        <ToolbarExportButton />
      </Toolbar>
      <Spreadsheet />
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
