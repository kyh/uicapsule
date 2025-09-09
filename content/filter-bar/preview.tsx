"use client";

import React, { useState } from "react";

import type { FiltersState } from "./filter-package/core/types";
import { DataTableFilter } from "./components/data-table-filter";
import { createTypedDataTableFilters } from "./filter-package";
import { columnsConfig } from "./filters";

const usePeopleTableFilters = createTypedDataTableFilters();

export default function Preview() {
  const [filtersState, setFiltersState] = useState<FiltersState>([]);

  const { columns, filters, actions, strategy, entityName } =
    usePeopleTableFilters({
      strategy: "client",
      data: [],
      entityName: "Person",
      columnsConfig,
      filters: filtersState,
      onFiltersChange: setFiltersState,
    });

  return (
    <div className="h-screen p-10">
      <DataTableFilter
        filters={filters}
        columns={columns}
        actions={actions}
        strategy={strategy}
        entityName={entityName}
      />
    </div>
  );
}
