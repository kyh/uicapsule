import {
  Button,
  Checkbox,
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui";
import {
  Fragment,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementType as ReactElementType,
  type ReactElement,
} from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  ListFilterIcon,
  SparklesIcon,
} from "lucide-react";

import type {
  Column,
  ColumnDataType,
  DataTableFilterActions,
  FiltersState,
  FilterStrategy,
} from "../filter-package";
import { getColumn, bindFilter } from "../filter-package";
import { FilterValueController } from "./filter-value";

const renderColumnIcon = (icon: ReactElement | ReactElementType, className: string) => {
  if (isValidElement(icon)) return icon;
  const IconComp = icon;
  return <IconComp className={className} />;
};

interface FilterSelectorProps {
  filters: FiltersState;
  columns: Column[];
  actions: DataTableFilterActions;
  strategy: FilterStrategy;
  onAIFilterSubmit?: (prompt: string) => void;
  aiGenerating?: boolean;
}

export function FilterSelector({
  filters,
  columns,
  actions,
  strategy,
  onAIFilterSubmit,
  aiGenerating,
}: FilterSelectorProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [property, setProperty] = useState<string | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  const visibleColumns = useMemo(() => columns.filter((c) => !c.hidden), [columns]);

  const visibleFilters = useMemo(
    () => filters.filter((f) => visibleColumns.find((c) => c.id === f.columnId)),
    [filters, visibleColumns],
  );

  const column = property ? getColumn(visibleColumns, property) : undefined;
  const filter = property ? visibleFilters.find((f) => f.columnId === property) : undefined;

  useEffect(() => {
    if (!property) return;
    inputRef.current?.focus();
  }, [property]);

  useEffect(() => {
    if (open) return;

    const timeoutId = setTimeout(() => setValue(""), 150);
    return () => clearTimeout(timeoutId);
  }, [open]);

  const content = useMemo(
    () =>
      property && column && column.type !== "boolean" ? (
        <div className="flex flex-col">
          <div className="flex h-9 items-center gap-2 border-b px-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setProperty(undefined)}
              className="h-6 w-6 p-0"
            >
              <ArrowLeftIcon className="size-4" />
              <span className="sr-only">Back</span>
            </Button>
            <div className="flex items-center gap-1.5 text-sm">
              {column.icon && renderColumnIcon(column.icon, "size-4 stroke-[2.25px]")}
              <span className="font-medium">{column.displayName}</span>
            </div>
          </div>
          <FilterValueController
            binding={bindFilter(column, filter)}
            actions={actions}
            strategy={strategy}
          />
        </div>
      ) : (
        <Command
          loop
          filter={(value, search, keywords) => {
            const extendValue = `${value} ${keywords?.join(" ")}`;
            return extendValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput
            value={value}
            onValueChange={setValue}
            ref={inputRef}
            placeholder="Search or ask AI"
          />
          <CommandList className="max-h-fit">
            <CommandGroup>
              <CommandItem
                value={value}
                disabled={!onAIFilterSubmit || aiGenerating}
                onSelect={() => {
                  const prompt = value.trim();
                  if (!prompt || !onAIFilterSubmit) return;

                  onAIFilterSubmit(prompt);
                  setOpen(false);
                  setTimeout(() => {
                    setValue("");
                    setProperty(undefined);
                  }, 100);
                }}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="size-4" />
                    <span>Ask AI</span>
                  </div>
                  <span className="text-(--muted-foreground) truncate text-xs">
                    {value.trim().length > 0 ? `"${value.trim()}"` : "Type a prompt"}
                  </span>
                </div>
              </CommandItem>
              {visibleColumns.map((column) => (
                <FilterableColumn
                  key={column.id}
                  column={column}
                  setProperty={(value) => {
                    setValue("");
                    setProperty(value);
                  }}
                  actions={actions}
                  filters={visibleFilters}
                />
              ))}
              <QuickSearchFilters
                search={value}
                filters={visibleFilters}
                columns={visibleColumns}
                actions={actions}
              />
            </CommandGroup>
          </CommandList>
        </Command>
      ),
    [
      aiGenerating,
      property,
      column,
      filter,
      visibleFilters,
      visibleColumns,
      actions,
      value,
      strategy,
      onAIFilterSubmit,
    ],
  );

  return (
    <Popover
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) {
          setTimeout(() => setProperty(undefined), 100);
        }
      }}
    >
      <PopoverTrigger
        aria-label="Add filter"
        render={<Button variant="ghost" size="icon" className="size-7 p-0" />}
      >
        <ListFilterIcon className="size-4" />
      </PopoverTrigger>
      <PopoverContent align="start" side="bottom" className="w-fit origin-(--transform-origin) p-0">
        {content}
      </PopoverContent>
    </Popover>
  );
}

export function FilterableColumn<TType extends ColumnDataType>({
  column,
  setProperty,
  actions,
  filters,
}: {
  column: Column<TType>;
  setProperty: (value: string) => void;
  actions: DataTableFilterActions;
  filters: FiltersState;
}) {
  const { icon: Icon } = column;
  const isFiltered = filters.some(
    (filter) => filter.columnId === column.id && filter.values.length > 0,
  );

  function handleSelect() {
    if (column.type === "boolean") {
      actions.setFilterValue({ type: "boolean", columnId: column.id, values: [true] });
      return;
    }

    setProperty(column.id);
  }

  return (
    <CommandItem
      value={column.id}
      keywords={[column.displayName]}
      onSelect={handleSelect}
      className="group"
    >
      <div className="flex w-full items-center justify-between">
        <div className="inline-flex items-center gap-1.5">
          {Icon && (
            <div className="relative">
              {renderColumnIcon(Icon, "size-4 stroke-[2.25px]")}
              {isFiltered && (
                <div className="absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full bg-green-500" />
              )}
            </div>
          )}
          {!Icon && isFiltered && <div className="h-2 w-2 rounded-full bg-green-500" />}
          <span>{column.displayName}</span>
        </div>
        {column.type !== "boolean" && (
          <ArrowRightIcon className="size-4 opacity-0 group-aria-selected:opacity-100" />
        )}
      </div>
    </CommandItem>
  );
}

interface QuickSearchFiltersProps {
  search?: string;
  filters: FiltersState;
  columns: Column[];
  actions: DataTableFilterActions;
}

export function QuickSearchFilters({ search, filters, columns, actions }: QuickSearchFiltersProps) {
  const cols = useMemo(
    () => columns.filter((column) => column.type === "option" || column.type === "multiOption"),
    [columns],
  );

  if (!search || search.trim().length < 2) return null;

  return (
    <>
      {cols.map((column) => {
        const filter = filters.find((f) => f.columnId === column.id);
        const options = column.options;

        function handleOptionSelect(value: string, check: boolean) {
          if (check) actions.addFilterValue(column, [value]);
          else actions.removeFilterValue(column, [value]);
        }

        return (
          <Fragment key={column.id}>
            {options.map((v) => {
              const checked =
                (filter?.type === "option" || filter?.type === "multiOption") &&
                filter.values.includes(v.value);

              return (
                <CommandItem
                  key={v.value}
                  value={v.value}
                  keywords={[v.label, v.value]}
                  onSelect={() => {
                    handleOptionSelect(v.value, !checked);
                  }}
                  className="group"
                >
                  <div className="group flex items-center gap-1.5">
                    <Checkbox
                      checked={checked}
                      className="dark:border-(--ring) mr-1 opacity-0 group-data-[selected=true]:opacity-100 data-checked:opacity-100"
                    />
                    <div className="flex w-4 items-center justify-center">
                      {v.icon && renderColumnIcon(v.icon, "text-(--primary) size-4")}
                    </div>
                    <div className="flex items-center gap-0.5">
                      <span className="text-(--muted-foreground)">{column.displayName}</span>
                      <ChevronRightIcon className="text-(--muted-foreground)/75 size-3.5" />
                      <span>{v.label}</span>
                    </div>
                  </div>
                </CommandItem>
              );
            })}
          </Fragment>
        );
      })}
    </>
  );
}
