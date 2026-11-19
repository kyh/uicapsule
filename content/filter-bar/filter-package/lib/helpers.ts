import type { Column, FilterModel, FilterBinding } from "../core/types";

export const getColumn = (columns: Column[], id: string) => {
  const column = columns.find((candidate) => candidate.id === id);

  if (!column) {
    throw new Error(`Column with id ${id} not found`);
  }

  return column;
};

export const createNumberRange = (values: number[]) => {
  const [a = 0, b = 0] = values;

  return a < b ? [a, b] : [b, a];
};

export const bindFilter = (column: Column, filter?: FilterModel) => {
  switch (column.type) {
    case "text": {
      return {
        column,
        filter: filter?.type === "text" ? filter : undefined,
        type: "text",
      } satisfies FilterBinding;
    }

    case "number": {
      return {
        column,
        filter: filter?.type === "number" ? filter : undefined,
        type: "number",
      } satisfies FilterBinding;
    }

    case "date": {
      return {
        column,
        filter: filter?.type === "date" ? filter : undefined,
        type: "date",
      } satisfies FilterBinding;
    }

    case "boolean": {
      return {
        column,
        filter: filter?.type === "boolean" ? filter : undefined,
        type: "boolean",
      } satisfies FilterBinding;
    }

    case "option": {
      return {
        column,
        filter: filter?.type === "option" ? filter : undefined,
        type: "option",
      } satisfies FilterBinding;
    }

    case "multiOption": {
      return {
        column,
        filter: filter?.type === "multiOption" ? filter : undefined,
        type: "multiOption",
      } satisfies FilterBinding;
    }

    default: {
      throw new Error(`Unsupported column type: ${String(column satisfies never)}`);
    }
  }
};
