"use client";

import { useState } from "react";

import type { Person } from "./types";
import type { FiltersState } from "./filter-package/core/types";
import { DataTableFilter } from "./_components/data-table-filter";
import { useDataTableFilters } from "./filter-package";
import { columnsConfig } from "./filters";

export const controls = {
  accent: { default: "#f66b2c", label: "Accent", type: "color" },
  chipRadius: { default: 16, label: "Chip radius", max: 16, min: 0, step: 1, type: "number" },
  entityName: { default: "Person", label: "Entity name", placeholder: "Person", type: "text" },
  placeholder: {
    default: "Search or ask AI",
    label: "Placeholder",
    placeholder: "Search or ask AI",
    type: "text",
  },
  ai: { default: true, label: "Ask AI", type: "boolean" },
  aiDelay: {
    default: 1000,
    label: "AI stream delay",
    max: 2000,
    min: 100,
    step: 50,
    type: "number",
  },
  startingFilters: {
    default: "none",
    label: "Starting filters",
    options: [
      { label: "None", value: "none" },
      { label: "Sample", value: "sample" },
    ],
    type: "select",
  },
} as const;

type StartingFilters = (typeof controls.startingFilters.options)[number]["value"];

interface PreviewProps {
  accent: string;
  ai: boolean;
  aiDelay: number;
  chipRadius: number;
  entityName: string;
  placeholder: string;
  startingFilters: StartingFilters;
}

const people: Person[] = [];

const SAMPLE_FILTERS: FiltersState = [
  {
    columnId: "department",
    operator: "is any of",
    type: "option",
    values: ["engineering", "design"],
  },
  { columnId: "salary", operator: "is greater than", type: "number", values: [100_000] },
  { columnId: "isActive", operator: "is", type: "boolean", values: [true] },
];

const STARTING_FILTERS = {
  none: [],
  sample: SAMPLE_FILTERS,
} satisfies Record<StartingFilters, FiltersState>;

const FilterBarDemo = ({
  accent,
  ai,
  aiDelay,
  chipRadius,
  entityName,
  placeholder,
  startingFilters,
}: PreviewProps) => {
  const [filtersState, setFiltersState] = useState<FiltersState>(STARTING_FILTERS[startingFilters]);

  const { columns, filters, actions, strategy } = useDataTableFilters({
    columnsConfig,
    data: people,
    entityName,
    filters: filtersState,
    onFiltersChange: setFiltersState,
    strategy: "client",
  });

  return (
    <DataTableFilter
      filters={filters}
      columns={columns}
      actions={actions}
      strategy={strategy}
      entityName={entityName}
      accent={accent}
      chipRadius={chipRadius}
      placeholder={placeholder}
      ai={ai}
      aiChunkDelayMs={[aiDelay * 0.6, aiDelay * 1.4]}
    />
  );
};

const Preview = ({
  accent = controls.accent.default,
  ai = controls.ai.default,
  aiDelay = controls.aiDelay.default,
  chipRadius = controls.chipRadius.default,
  entityName = controls.entityName.default,
  placeholder = controls.placeholder.default,
  startingFilters = controls.startingFilters.default,
}: Partial<PreviewProps>) => (
  <div className="flex h-screen items-center bg-stone-100 p-10 dark:bg-stone-900">
    <FilterBarDemo
      key={startingFilters}
      accent={accent}
      ai={ai}
      aiDelay={aiDelay}
      chipRadius={chipRadius}
      entityName={entityName}
      placeholder={placeholder}
      startingFilters={startingFilters}
    />
  </div>
);

export default Preview;
