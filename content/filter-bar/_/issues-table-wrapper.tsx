"use client";

import React, { useState } from "react";

import type { FiltersState } from "../filter-bar";
import { IssuesTable } from "./issues-table";

export function IssuesTableWrapper() {
  const [filters, setFilters] = useState<FiltersState>([]);

  return <IssuesTable state={{ filters, setFilters }} />;
}
