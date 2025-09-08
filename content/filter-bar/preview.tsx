"use client";

import React, { useState } from "react";

import type { FiltersState } from "./filter-bar/core/types";
import { IssuesTable } from "./_/issues-table";

export default function SSRPage() {
  const [filters, setFilters] = useState<FiltersState>([]);

  return (
    <div className="flex h-full flex-col">
      <IssuesTable state={{ filters, setFilters }} />
    </div>
  );
}
