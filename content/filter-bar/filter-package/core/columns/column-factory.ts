import type { Column, ColumnConfig, ColumnOption, FilterStrategy } from "../types";

function prepareOptions(
  values: (string | ColumnOption)[],
  configured: ColumnOption[] | undefined,
  strategy: FilterStrategy,
) {
  if (strategy === "server" && !configured) {
    throw new Error("Server filters require explicit column options");
  }
  const entries = values.map((value) =>
    // eslint-disable-next-line anti-slop/no-runtime-typeof -- Discriminates the typed string | ColumnOption config union.
    typeof value === "string" ? { value, label: value } : value,
  );
  const unique = new Map<string, ColumnOption>();
  for (const option of configured ?? entries) {
    if (!unique.has(option.value)) unique.set(option.value, option);
  }
  const counts = new Map<string, number>();
  for (const entry of entries) {
    counts.set(entry.value, (counts.get(entry.value) ?? 0) + 1);
  }
  return {
    values: entries.filter((entry) => unique.has(entry.value)).map((entry) => entry.value),
    options: Array.from(unique.values(), (option) => ({
      ...option,
      count: strategy === "server" ? option.count : (counts.get(option.value) ?? 0),
    })),
  };
}

export function createColumns<Row>(
  data: Row[],
  configs: readonly ColumnConfig<Row>[],
  strategy: FilterStrategy,
): Column[] {
  return configs.map((config): Column => {
    const common = {
      id: config.id,
      displayName: config.displayName,
      icon: config.icon,
      hidden: config.hidden,
    };
    switch (config.type) {
      case "text":
        return {
          ...common,
          type: "text",
          values: data.map(config.accessor).filter((value) => value != null),
        };
      case "date":
        return {
          ...common,
          type: "date",
          values: data.map(config.accessor).filter((value) => value != null),
        };
      case "boolean":
        return {
          ...common,
          type: "boolean",
          toggledStateName: config.toggledStateName,
          values: data.map(config.accessor).filter((value) => value != null),
        };
      case "number": {
        const values = data
          .map(config.accessor)
          .filter((value) => value != null)
          .filter(Number.isFinite);
        let min = values[0] ?? 0;
        let max = min;
        for (const value of values) {
          min = Math.min(min, value);
          max = Math.max(max, value);
        }
        return {
          ...common,
          type: "number",
          values,
          min: config.min ?? min,
          max: config.max ?? max,
        };
      }
      case "option":
        return {
          ...common,
          type: "option",
          ...prepareOptions(
            data.map(config.accessor).filter((value) => value != null),
            config.options,
            strategy,
          ),
        };
      case "multiOption":
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
  });
}
