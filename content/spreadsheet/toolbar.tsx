"use client";

import React from "react";
import { Button } from "@repo/ui/button";
import { Download, Plus, Upload } from "lucide-react";

import { useSpreadsheet } from "./spreadsheet-provider";

export const Toolbar = () => {
  const { isEnriching, startEnrichment } = useSpreadsheet();

  return (
    <div className="flex items-center gap-2 p-2">
      <Button
        onClick={startEnrichment}
        size="sm"
        variant="default"
        disabled={isEnriching}
        className="bg-primary hover:bg-primary/90"
      >
        {isEnriching ? "Enriching..." : "Enrich"}
      </Button>
      <Button size="sm" variant="outline">
        <Plus />
        Add Row
      </Button>
      <Button size="sm" variant="outline">
        <Upload />
        Import
      </Button>
      <Button size="sm" variant="outline">
        <Download />
        Export
      </Button>
    </div>
  );
};
