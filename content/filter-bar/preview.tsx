"use client";

import { useState } from "react";

import type { Person } from "./types";
import type { FiltersState } from "./filter-package/core/types";
import { DataTableFilter } from "./_components/data-table-filter";
import { useDataTableFilters } from "./filter-package";
import { columnsConfig } from "./filters";

const people: Person[] = [];

export default function Preview() {
  const [filtersState, setFiltersState] = useState<FiltersState>([]);

  const { columns, filters, actions, strategy, entityName } = useDataTableFilters({
    strategy: "client",
    data: people,
    entityName: "Person",
    columnsConfig,
    filters: filtersState,
    onFiltersChange: setFiltersState,
  });

  return (
    <div className="flex h-screen items-center bg-stone-100 p-10 dark:bg-stone-900">
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
