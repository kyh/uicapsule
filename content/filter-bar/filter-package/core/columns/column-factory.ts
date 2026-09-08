import type { Column, ColumnConfig, ColumnOption, FilterStrategy } from "../types";

const isPresent = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

const prepareOptions = (
  values: (string | ColumnOption)[],
  configured: ColumnOption[] | undefined,
  strategy: FilterStrategy,
) => {
  if (strategy === "server" && !configured) {
    throw new Error("Server filters require explicit column options");
  }
  const entries = values.map((value) =>
    // eslint-disable-next-line anti-slop/no-runtime-typeof -- Discriminates the typed string | ColumnOption config union.
    typeof value === "string" ? { label: value, value } : value,
  );
  const unique = new Map<string, ColumnOption>();
  for (const option of configured ?? entries) {
    if (!unique.has(option.value)) {
      unique.set(option.value, option);
    }
  }
  const counts = new Map<string, number>();
  for (const entry of entries) {
    counts.set(entry.value, (counts.get(entry.value) ?? 0) + 1);
  }
  return {
    options: Array.from(unique.values(), (option) => ({
      ...option,
      count: strategy === "server" ? option.count : (counts.get(option.value) ?? 0),
    })),
    values: entries.filter((entry) => unique.has(entry.value)).map((entry) => entry.value),
  };
};

const createColumn = <Row>(
  data: Row[],
  config: ColumnConfig<Row>,
  strategy: FilterStrategy,
): Column => {
  const common = {
    displayName: config.displayName,
    hidden: config.hidden,
    icon: config.icon,
    id: config.id,
  };
  switch (config.type) {
    case "text": {
      return {
        ...common,
        type: "text",
        values: data.map(config.accessor).filter(isPresent),
      };
    }
    case "date": {
      return {
        ...common,
        type: "date",
        values: data.map(config.accessor).filter(isPresent),
      };
    }
    case "boolean": {
      return {
        ...common,
        toggledStateName: config.toggledStateName,
        type: "boolean",
        values: data.map(config.accessor).filter(isPresent),
      };
    }
    case "number": {
      const values = data.map(config.accessor).filter(isPresent).filter(Number.isFinite);
      let min = values[0] ?? 0;
      let max = min;
      for (const value of values) {
        min = Math.min(min, value);
        max = Math.max(max, value);
      }
      return {
        ...common,
        max: config.max ?? max,
        min: config.min ?? min,
        type: "number",
        values,
      };
    }
    case "option": {
      return {
        ...common,
        type: "option",
        ...prepareOptions(data.map(config.accessor).filter(isPresent), config.options, strategy),
      };
    }
    case "multiOption": {
      return {
        ...common,
        type: "multiOption",
        ...prepareOptions(
          data.flatMap((row) => config.accessor(row) ?? []),
          config.options,
          strategy,
        ),
      };
    }
    default: {
      throw new Error(`Unsupported column type: ${String(config satisfies never)}`);
    }
  }
};

export const createColumns = <Row>(
  data: Row[],
  configs: readonly ColumnConfig<Row>[],
  strategy: FilterStrategy,
): Column[] => configs.map((config) => createColumn(data, config, strategy));
