import React from "react";

import { Spreadsheet } from "./spreadsheet";
import { SpreadsheetProvider } from "./spreadsheet-provider";
import { StatusBar } from "./status-bar";
import { Toolbar } from "./toolbar";

const Preview = () => {
  return (
    <SpreadsheetProvider>
      <Toolbar />
      <Spreadsheet />
      <StatusBar />
    </SpreadsheetProvider>
  );
};

export default Preview;
