"use client";

import * as React from "react";
import { ListFilter } from "lucide-react";

import { Button } from "./button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./command";
import Filters, {
  AnimateChangeInHeight,
  DueDate,
  Filter,
  FilterOperator,
  FilterOption,
  FilterType,
  filterViewOptions,
  filterViewToFilterOptions,
} from "./filter-bar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "./utils";

const nanoid = () => {
  return Math.random().toString(36).substring(2, 15);
};

const Preview = () => {
  const [open, setOpen] = React.useState(false);
  const [selectedView, setSelectedView] = React.useState<FilterType | null>(
    null,
  );
  const [commandInput, setCommandInput] = React.useState("");
  const commandInputRef = React.useRef<HTMLInputElement>(null);
  const [filters, setFilters] = React.useState<Filter[]>([]);

  return (
    <main className="grid h-dvh place-content-center">
      <div className="flex flex-wrap gap-2">
        <Filters filters={filters} setFilters={setFilters} />
        {filters.filter((filter) => filter.value?.length > 0).length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="group h-6 items-center rounded-sm text-xs transition"
            onClick={() => setFilters([])}
          >
            Clear
          </Button>
        )}
        <Popover
          open={open}
          onOpenChange={(open) => {
            setOpen(open);
            if (!open) {
              setTimeout(() => {
                setSelectedView(null);
                setCommandInput("");
              }, 200);
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              role="combobox"
              aria-expanded={open}
              size="sm"
              className={cn(
                "group flex h-6 items-center gap-1.5 rounded-sm text-xs transition",
                filters.length > 0 && "w-6",
              )}
            >
              <ListFilter className="size-3 shrink-0 text-gray-600 transition-all group-hover:text-gray-800" />
              {!filters.length && "Filter"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <AnimateChangeInHeight>
              <Command>
                <CommandInput
                  placeholder={selectedView ? selectedView : "Filter..."}
                  className="h-9"
                  value={commandInput}
                  onInputCapture={(e) => {
                    setCommandInput(e.currentTarget.value);
                  }}
                  ref={commandInputRef}
                />
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  {selectedView ? (
                    <CommandGroup>
                      {filterViewToFilterOptions[selectedView].map(
                        (filter: FilterOption) => (
                          <CommandItem
                            className="group flex items-center gap-2 text-gray-600"
                            key={filter.name}
                            value={filter.name}
                            onSelect={(currentValue) => {
                              setFilters((prev) => [
                                ...prev,
                                {
                                  id: nanoid(),
                                  type: selectedView,
                                  operator:
                                    selectedView === FilterType.DUE_DATE &&
                                    currentValue !== DueDate.IN_THE_PAST
                                      ? FilterOperator.BEFORE
                                      : FilterOperator.IS,
                                  value: [currentValue],
                                },
                              ]);
                              setTimeout(() => {
                                setSelectedView(null);
                                setCommandInput("");
                              }, 200);
                              setOpen(false);
                            }}
                          >
                            {filter.icon}
                            <span className="text-gray-900">{filter.name}</span>
                            {filter.label && (
                              <span className="ml-auto text-xs text-gray-600">
                                {filter.label}
                              </span>
                            )}
                          </CommandItem>
                        ),
                      )}
                    </CommandGroup>
                  ) : (
                    filterViewOptions.map(
                      (group: FilterOption[], index: number) => (
                        <React.Fragment key={index}>
                          <CommandGroup>
                            {group.map((filter: FilterOption) => (
                              <CommandItem
                                className="group flex items-center gap-2 text-gray-600"
                                key={filter.name}
                                value={filter.name}
                                onSelect={(currentValue) => {
                                  setSelectedView(currentValue as FilterType);
                                  setCommandInput("");
                                  commandInputRef.current?.focus();
                                }}
                              >
                                {filter.icon}
                                <span className="text-gray-900">
                                  {filter.name}
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                          {index < filterViewOptions.length - 1 && (
                            <CommandSeparator />
                          )}
                        </React.Fragment>
                      ),
                    )
                  )}
                </CommandList>
              </Command>
            </AnimateChangeInHeight>
          </PopoverContent>
        </Popover>
      </div>
    </main>
  );
};

export default Preview;
