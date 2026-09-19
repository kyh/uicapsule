import type { ElementType, ReactElement, Dispatch, SetStateAction } from "react";

export interface ColumnOption {
  label: string;
  value: string;
  icon?: ReactElement | ElementType;
  count?: number;
}

export interface ColumnOptionExtended extends ColumnOption {
  selected?: boolean;
}

export type ColumnDataType = "text" | "number" | "date" | "boolean" | "option" | "multiOption";
export type OptionBasedColumnDataType = "option" | "multiOption";
export type FilterStrategy = "client" | "server";

interface ColumnBase {
  id: string;
  displayName: string;
  icon?: ReactElement | ElementType;
  hidden?: boolean;
}

interface ColumnValues {
  text: string[];
  number: number[];
  date: Date[];
  boolean: boolean[];
  option: string[];
  multiOption: string[];
}

interface ColumnDetails {
  text: object;
  number: { min: number; max: number };
  date: object;
  boolean: { toggledStateName?: string };
  option: { options: ColumnOption[] };
  multiOption: { options: ColumnOption[] };
}

export type Column<K extends ColumnDataType = ColumnDataType> = {
  [Type in K]: ColumnBase & { type: Type; values: ColumnValues[Type] } & ColumnDetails[Type];
}[K];

type OptionValue = string | ColumnOption;

interface ColumnInputs<Row> {
  text: { accessor: (row: Row) => string | null | undefined };
  number: { accessor: (row: Row) => number | null | undefined; min?: number; max?: number };
  date: { accessor: (row: Row) => Date | null | undefined };
  boolean: { accessor: (row: Row) => boolean | null | undefined; toggledStateName?: string };
  option: { accessor: (row: Row) => OptionValue | null | undefined; options?: ColumnOption[] };
  multiOption: {
    accessor: (row: Row) => readonly OptionValue[] | null | undefined;
    options?: ColumnOption[];
  };
}

export type ColumnConfig<Row> = {
  [Type in ColumnDataType]: ColumnBase & { type: Type } & ColumnInputs<Row>[Type];
}[ColumnDataType];

export type TextFilterOperator = "contains" | "does not contain";

export type NumberFilterOperator =
  | "is"
  | "is not"
  | "is less than"
  | "is greater than or equal to"
  | "is greater than"
  | "is less than or equal to"
  | "is between"
  | "is not between";

export type DateFilterOperator =
  | "is"
  | "is not"
  | "is before"
  | "is on or after"
  | "is after"
  | "is on or before"
  | "is between"
  | "is not between";

export type BooleanFilterOperator = "is" | "is not";

export type OptionFilterOperator = "is" | "is not" | "is any of" | "is none of";

export type MultiOptionFilterOperator =
  | "include"
  | "exclude"
  | "include any of"
  | "include all of"
  | "exclude if any of"
  | "exclude if all";

export interface FilterOperators {
  text: TextFilterOperator;
  number: NumberFilterOperator;
  date: DateFilterOperator;
  boolean: BooleanFilterOperator;
  option: OptionFilterOperator;
  multiOption: MultiOptionFilterOperator;
}

export type FilterValues<K extends ColumnDataType> = ColumnValues[K];

export type FilterModel<K extends ColumnDataType = ColumnDataType> = {
  [Type in K]: {
    columnId: string;
    type: Type;
    operator: FilterOperators[Type];
    values: FilterValues<Type>;
  };
}[K];

export type FiltersState = FilterModel[];

export type FilterValueUpdate = {
  [Type in ColumnDataType]: Pick<FilterModel<Type>, "columnId" | "type" | "values">;
}[ColumnDataType];

export type FilterOperatorUpdate = {
  [Type in ColumnDataType]: Pick<FilterModel<Type>, "columnId" | "type" | "operator">;
}[ColumnDataType];

export interface DataTableFilterActions {
  setFilterValue: (update: FilterValueUpdate) => void;
  setFilterOperator: (update: FilterOperatorUpdate) => void;
  addFilterValue: (column: Column<OptionBasedColumnDataType>, values: string[]) => void;
  removeFilterValue: (column: Column<OptionBasedColumnDataType>, values: string[]) => void;
  removeFilter: (columnId: string) => void;
  removeAllFilters: () => void;
}

export type FilterOperatorTarget = "single" | "multiple";
export interface FilterOperatorDetails<Operator, K extends ColumnDataType> {
  key: string;
  value: Operator;
  target: FilterOperatorTarget;
  multiple?: FilterOperators[K];
  single?: FilterOperators[K];
}

export type FilterDetails<K extends ColumnDataType> = {
  [Operator in FilterOperators[K]]: FilterOperatorDetails<Operator, K>;
};
export type FilterTypeOperatorDetails = { [K in ColumnDataType]: FilterDetails<K> };

export type DataTableFiltersOptions<Row> = {
  data: Row[];
  columnsConfig: readonly ColumnConfig<Row>[];
  strategy?: FilterStrategy;
  entityName?: string;
} & (
  | {
      filters: FiltersState;
      onFiltersChange: Dispatch<SetStateAction<FiltersState>>;
      defaultFilters?: never;
    }
  | { filters?: never; onFiltersChange?: never; defaultFilters?: FiltersState }
);

export type FilterBinding = {
  [K in ColumnDataType]: { type: K; column: Column<K>; filter?: FilterModel<K> };
}[ColumnDataType];
