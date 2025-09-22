import React, { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";

import { EditableCell } from "./editable-cell";
import { Spreadsheet } from "./spreadsheet";
import { SpreadsheetProvider } from "./spreadsheet-provider";
import {
  generateSamplePeople,
  sampleEnrichmentHandler,
  type Person,
} from "./use-enrichment";
import {
  StatusBar,
  StatusBarMessage,
  StatusBarSection,
  StatusBarSummary,
} from "./status-bar";
import {
  Toolbar,
  ToolbarAddRowButton,
  ToolbarEnrichButton,
  ToolbarExportButton,
  ToolbarImportButton,
} from "./toolbar";

const Preview = () => {
  const columnHelper = useMemo(() => createColumnHelper<Person>(), []);
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
    <SpreadsheetProvider<Person>
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
