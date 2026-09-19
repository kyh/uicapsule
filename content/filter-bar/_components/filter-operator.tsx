import { useState } from "react";
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui";
import type {
  ColumnDataType,
  DataTableFilterActions,
  FilterModel,
  FilterOperatorDetails,
  FilterOperators,
  FilterOperatorUpdate,
} from "../filter-package";
import { filterTypeOperatorDetails } from "../filter-package";

const operatorDetails = <K extends ColumnDataType>(
  type: K,
  operator: FilterOperators[K],
): { key: string; target: "single" | "multiple" } => filterTypeOperatorDetails[type][operator];

const relatedOperators = <K extends ColumnDataType>(type: K, operator: FilterOperators[K]) => {
  const current = operatorDetails(type, operator);
  const details: FilterOperatorDetails<FilterOperators[K], K>[] = Object.values(
    filterTypeOperatorDetails[type],
  );
  return details.filter((detail) => detail.target === current.target);
};

const operatorChoices = (
  filter: FilterModel,
): { label: string; update: FilterOperatorUpdate }[] => {
  const { columnId } = filter;
  switch (filter.type) {
    case "text": {
      return relatedOperators("text", filter.operator).map((detail) => ({
        label: detail.key,
        update: { columnId, operator: detail.value, type: "text" },
      }));
    }
    case "number": {
      return relatedOperators("number", filter.operator).map((detail) => ({
        label: detail.key,
        update: { columnId, operator: detail.value, type: "number" },
      }));
    }
    case "date": {
      return relatedOperators("date", filter.operator).map((detail) => ({
        label: detail.key,
        update: { columnId, operator: detail.value, type: "date" },
      }));
    }
    case "boolean": {
      return relatedOperators("boolean", filter.operator).map((detail) => ({
        label: detail.key,
        update: { columnId, operator: detail.value, type: "boolean" },
      }));
    }
    case "option": {
      return relatedOperators("option", filter.operator).map((detail) => ({
        label: detail.key,
        update: { columnId, operator: detail.value, type: "option" },
      }));
    }
    case "multiOption": {
      return relatedOperators("multiOption", filter.operator).map((detail) => ({
        label: detail.key,
        update: { columnId, operator: detail.value, type: "multiOption" },
      }));
    }
    default: {
      return [];
    }
  }
};

export const FilterOperator = ({
  filter,
  actions,
}: {
  filter: FilterModel;
  actions: DataTableFilterActions;
}) => {
  const [open, setOpen] = useState(false);
  const current = operatorDetails(filter.type, filter.operator);
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (filter.type !== "boolean") {
          setOpen(next);
        }
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            className="m-0 h-full w-fit rounded-none p-0 px-2 text-xs whitespace-nowrap"
            onClick={() => {
              if (filter.type !== "boolean") {
                return;
              }
              actions.setFilterOperator({
                columnId: filter.columnId,
                operator: filter.operator === "is" ? "is not" : "is",
                type: "boolean",
              });
            }}
          />
        }
      >
        <span className="text-(--muted-foreground)">{current.key}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-fit origin-(--transform-origin) p-0">
        <Command loop>
          <CommandInput placeholder="search" />
          <CommandEmpty>No results</CommandEmpty>
          <CommandList className="max-h-fit">
            <CommandGroup heading={filter.type === "date" ? undefined : "operators"}>
              {operatorChoices(filter).map(({ label, update }) => (
                <CommandItem
                  key={update.operator}
                  value={update.operator}
                  onSelect={() => {
                    actions.setFilterOperator(update);
                    setOpen(false);
                  }}
                >
                  {label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
