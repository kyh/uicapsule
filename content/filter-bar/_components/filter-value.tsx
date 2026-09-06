import {
  Button,
  Calendar,
  Checkbox,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Slider,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui";
import {
  cloneElement,
  isValidElement,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ElementType as ReactElementType,
  type InputHTMLAttributes,
  type Key,
  type ReactElement,
} from "react";
import type { DateRange } from "react-day-picker";
import { cn } from "cn";
import { format, isEqual } from "date-fns";
import { Ellipsis } from "lucide-react";

import type {
  Column,
  FilterBinding,
  ColumnDataType,
  ColumnOptionExtended,
  DataTableFilterActions,
  FilterModel,
  FilterStrategy,
} from "../filter-package";
import { createNumberRange, numberFilterOperators } from "../filter-package";
import { useDebouncedCallback } from "./use-debounced-callback";

type IconProps = { className?: string; key?: Key };
type IconLike = ReactElement | ReactElementType;

const renderIcon = (icon: IconLike, props: IconProps = {}) => {
  if (isValidElement(icon)) return cloneElement(icon, props);
  const IconComp = icon;
  const { key, ...iconProps } = props;
  return <IconComp key={key} {...iconProps} />;
};

export function DebouncedInput({
  value: initialValue,
  onChange,
  debounceMs = 500,
  onBlur,
  onKeyDown,
  ...props
}: {
  value: string | number;
  onChange: (value: string | number) => void;
  debounceMs?: number;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  const [value, setValue] = useState(initialValue);
  const [prevInitialValue, setPrevInitialValue] = useState(initialValue);

  if (prevInitialValue !== initialValue) {
    setPrevInitialValue(initialValue);
    setValue(initialValue);
  }

  const { schedule: debouncedOnChange, cancel, flush } = useDebouncedCallback(onChange, debounceMs);
  useEffect(cancel, [initialValue, cancel]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    debouncedOnChange(newValue);
  };

  return (
    <Input
      {...props}
      value={value}
      onChange={handleChange}
      onBlur={(event) => {
        flush();
        onBlur?.(event);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented && (event.key === "Enter" || event.key === "Escape")) flush();
      }}
    />
  );
}

interface FilterValueProps {
  binding: FilterBinding;
  actions: DataTableFilterActions;
  strategy: FilterStrategy;
  entityName?: string;
}

export function FilterValue({ binding, actions, strategy, entityName }: FilterValueProps) {
  const [open, setOpen] = useState(false);
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (binding.type !== "boolean") setOpen(next);
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            className={cn(
              "m-0 h-full w-fit rounded-none p-0 px-2 text-xs whitespace-nowrap",
              binding.type === "boolean" && "hover:bg-inherit",
            )}
          />
        }
      >
        <FilterValueDisplay binding={binding} actions={actions} entityName={entityName} />
      </PopoverTrigger>
      <PopoverContent align="start" side="bottom" className="w-fit origin-(--transform-origin) p-0">
        <FilterValueController binding={binding} actions={actions} strategy={strategy} />
      </PopoverContent>
    </Popover>
  );
}

interface FilterValueDisplayProps<K extends ColumnDataType> {
  filter: FilterModel<K>;
  column: Column<K>;
  actions: DataTableFilterActions;
  entityName?: string;
}

export function FilterValueDisplay({
  binding,
  actions,
  entityName,
}: Omit<FilterValueProps, "strategy">) {
  switch (binding.type) {
    case "option":
      return (
        binding.filter && (
          <FilterValueOptionDisplay
            filter={binding.filter}
            column={binding.column}
            actions={actions}
            entityName={entityName}
          />
        )
      );
    case "multiOption":
      return (
        binding.filter && (
          <FilterValueMultiOptionDisplay
            filter={binding.filter}
            column={binding.column}
            actions={actions}
            entityName={entityName}
          />
        )
      );
    case "date":
      return (
        binding.filter && (
          <FilterValueDateDisplay
            filter={binding.filter}
            column={binding.column}
            actions={actions}
            entityName={entityName}
          />
        )
      );
    case "text":
      return (
        binding.filter && (
          <FilterValueTextDisplay
            filter={binding.filter}
            column={binding.column}
            actions={actions}
            entityName={entityName}
          />
        )
      );
    case "number":
      return (
        binding.filter && (
          <FilterValueNumberDisplay
            filter={binding.filter}
            column={binding.column}
            actions={actions}
            entityName={entityName}
          />
        )
      );
    case "boolean":
      return (
        binding.filter && (
          <FilterValueBooleanDisplay
            filter={binding.filter}
            column={binding.column}
            actions={actions}
            entityName={entityName}
          />
        )
      );
  }
}

export function FilterValueOptionDisplay({ filter, column }: FilterValueDisplayProps<"option">) {
  const options = column.options;
  const selected = options.filter((o) => filter?.values.includes(o.value));

  if (selected.length === 1 && selected[0]) {
    const { label, icon: Icon } = selected[0];
    const hasIcon = !!Icon;
    return (
      <span className="inline-flex items-center gap-1">
        {hasIcon && renderIcon(Icon, { className: "text-(--primary) size-4" })}
        <span>{label}</span>
      </span>
    );
  }
  const name = column.displayName.toLowerCase();
  const pluralName = name.endsWith("s") ? `${name}es` : `${name}s`;

  const hasOptionIcons = !options?.some((o) => !o.icon);

  return (
    <div className="inline-flex items-center gap-0.5">
      {hasOptionIcons &&
        selected.slice(0, 3).map(({ value, icon }) => {
          const Icon = icon;
          if (!Icon) return null;
          return renderIcon(Icon, { key: value, className: "size-4" });
        })}
      <span className={cn(hasOptionIcons && "ml-1.5")}>
        {selected.length} {pluralName}
      </span>
    </div>
  );
}

export function FilterValueMultiOptionDisplay({
  filter,
  column,
}: FilterValueDisplayProps<"multiOption">) {
  const options = column.options;
  const selected = options.filter((o) => filter.values.includes(o.value));

  if (selected.length === 1 && selected[0]) {
    const { label, icon: Icon } = selected[0];
    const hasIcon = !!Icon;
    return (
      <span className="inline-flex items-center gap-1.5">
        {hasIcon && renderIcon(Icon, { className: "text-(--primary) size-4" })}

        <span>{label}</span>
      </span>
    );
  }

  const name = column.displayName.toLowerCase();

  const hasOptionIcons = !options?.some((o) => !o.icon);

  return (
    <div className="inline-flex items-center gap-1.5">
      {hasOptionIcons && (
        <div key="icons" className="inline-flex items-center gap-0.5">
          {selected.slice(0, 3).map(({ value, icon }) => {
            const Icon = icon;
            if (!Icon) return null;
            return isValidElement<IconProps>(Icon)
              ? cloneElement(Icon, { key: value })
              : renderIcon(Icon, { key: value, className: "size-4" });
          })}
        </div>
      )}
      <span>
        {selected.length} {name}
      </span>
    </div>
  );
}

function formatDateRange(start: Date, end: Date) {
  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();

  if (sameMonth && sameYear) {
    return `${format(start, "MMM d")} - ${format(end, "d, yyyy")}`;
  }

  if (sameYear) {
    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
  }

  return `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`;
}

export function FilterValueDateDisplay({ filter }: FilterValueDisplayProps<"date">) {
  if (!filter) return null;
  if (filter.values.length === 0) return <Ellipsis className="size-4" />;
  if (filter.values.length === 1 && filter.values[0]) {
    const value = filter.values[0];

    const formattedDateStr = format(value, "MMM d, yyyy");

    return <span>{formattedDateStr}</span>;
  }
  if (filter.values.length === 2 && filter.values[0] && filter.values[1]) {
    const formattedRangeStr = formatDateRange(filter.values[0], filter.values[1]);

    return <span>{formattedRangeStr}</span>;
  }

  return null;
}

export function FilterValueTextDisplay({ filter }: FilterValueDisplayProps<"text">) {
  if (!filter) return null;
  if (filter.values.length === 0 || (filter.values[0] && filter.values[0].trim() === ""))
    return <Ellipsis className="size-4" />;

  const value = filter.values[0];

  return <span>{value}</span>;
}

export function FilterValueNumberDisplay({ filter }: FilterValueDisplayProps<"number">) {
  if (!filter || !filter.values || filter.values.length === 0) return null;

  if (filter.operator === "is between" || filter.operator === "is not between") {
    const minValue = filter.values[0];
    const maxValue = filter.values[1];

    return (
      <span className="tracking-tight tabular-nums">
        {minValue} and {maxValue}
      </span>
    );
  }

  const value = filter.values[0];
  return <span className="tracking-tight tabular-nums">{value}</span>;
}

export function FilterValueBooleanDisplay({ filter, column }: FilterValueDisplayProps<"boolean">) {
  if (!filter || filter.values.length === 0) return null;
  return <span>{column.toggledStateName}</span>;
}

interface FilterValueControllerProps<K extends ColumnDataType> {
  filter?: FilterModel<K>;
  column: Column<K>;
  actions: DataTableFilterActions;
  strategy: FilterStrategy;
}

export function FilterValueController({
  binding,
  actions,
  strategy,
}: Omit<FilterValueProps, "entityName">) {
  switch (binding.type) {
    case "option":
      return (
        <FilterValueOptionController
          filter={binding.filter}
          column={binding.column}
          actions={actions}
          strategy={strategy}
        />
      );
    case "multiOption":
      return (
        <FilterValueOptionController
          filter={binding.filter}
          column={binding.column}
          actions={actions}
          strategy={strategy}
        />
      );
    case "date":
      return (
        <FilterValueDateController
          filter={binding.filter}
          column={binding.column}
          actions={actions}
          strategy={strategy}
        />
      );
    case "text":
      return (
        <FilterValueTextController
          filter={binding.filter}
          column={binding.column}
          actions={actions}
          strategy={strategy}
        />
      );
    case "number":
      return (
        <FilterValueNumberController
          filter={binding.filter}
          column={binding.column}
          actions={actions}
          strategy={strategy}
        />
      );
    case "boolean":
      return null;
  }
}

interface OptionItemProps {
  option: ColumnOptionExtended;
  onToggle: (value: string, checked: boolean) => void;
}

const OptionItem = memo(function OptionItem({ option, onToggle }: OptionItemProps) {
  const { value, label, icon: Icon, selected } = option;
  const handleSelect = useCallback(() => {
    onToggle(value, !selected);
  }, [onToggle, value, selected]);

  return (
    <CommandItem
      key={value}
      onSelect={handleSelect}
      className="group flex items-center justify-between gap-4"
    >
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <Checkbox
          checked={selected}
          className="dark:border-(--ring) mr-1 shrink-0 opacity-0 group-data-[selected=true]:opacity-100 data-checked:opacity-100"
        />
        <div className="shrink-0">
          {Icon && renderIcon(Icon, { className: "text-(--primary) size-4" })}
        </div>
        <span className="overflow-x-hidden overflow-ellipsis whitespace-nowrap">{label}</span>
      </div>
    </CommandItem>
  );
});

export function FilterValueOptionController({
  filter,
  column,
  actions,
}: FilterValueControllerProps<"option" | "multiOption">) {
  const [initialSelectedValues] = useState(() => new Set(filter?.values || []));

  const { selectedOptions, unselectedOptions } = useMemo(() => {
    const allOptions = column.options.map((o) => {
      const currentlySelected = filter?.values.includes(o.value) ?? false;
      return {
        label: o.label,
        value: o.value,
        icon: o.icon,
        selected: currentlySelected,
        count: o.count ?? 0,
      };
    });

    const selected = allOptions.filter((o) => initialSelectedValues.has(o.value));
    const unselected = allOptions.filter((o) => !initialSelectedValues.has(o.value));
    return { selectedOptions: selected, unselectedOptions: unselected };
  }, [column, filter?.values, initialSelectedValues]);

  const handleToggle = useCallback(
    (value: string, checked: boolean) => {
      if (checked) actions.addFilterValue(column, [value]);
      else actions.removeFilterValue(column, [value]);
    },
    [actions, column],
  );

  return (
    <Command className="max-w-[300px]" loop>
      <CommandInput autoFocus placeholder="search" />
      <CommandEmpty>No results</CommandEmpty>
      <CommandList>
        <CommandGroup className={cn(selectedOptions.length === 0 && "hidden")}>
          {selectedOptions.map((option) => (
            <OptionItem key={option.value} option={option} onToggle={handleToggle} />
          ))}
        </CommandGroup>
        <CommandSeparator
          className={cn(
            (unselectedOptions.length === 0 || selectedOptions.length === 0) && "hidden",
          )}
        />
        <CommandGroup className={cn(unselectedOptions.length === 0 && "hidden")}>
          {unselectedOptions.map((option) => (
            <OptionItem key={option.value} option={option} onToggle={handleToggle} />
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

export function FilterValueDateController({
  filter,
  column,
  actions,
}: FilterValueControllerProps<"date">) {
  const start = filter?.values[0];
  const date: DateRange | undefined = start ? { from: start, to: filter?.values[1] } : undefined;

  function changeDateRange(value: DateRange | undefined) {
    const start = value?.from;
    const end = start && value && value.to && !isEqual(start, value.to) ? value.to : undefined;

    const isRange = start && end;
    const newValues = isRange ? [start, end] : start ? [start] : [];

    actions.setFilterValue({ type: column.type, columnId: column.id, values: newValues });
  }

  return (
    <Command>
      <CommandList className="max-h-fit">
        <CommandGroup>
          <div>
            <Calendar
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={changeDateRange}
              numberOfMonths={1}
            />
          </div>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

export function FilterValueTextController({
  filter,
  column,
  actions,
}: FilterValueControllerProps<"text">) {
  const changeText = (value: string | number) => {
    actions.setFilterValue({ type: "text", columnId: column.id, values: [String(value)] });
  };

  return (
    <Command>
      <CommandList className="max-h-fit">
        <CommandGroup>
          <CommandItem>
            <DebouncedInput
              placeholder="search"
              autoFocus
              value={filter?.values[0] ?? ""}
              onChange={changeText}
            />
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

export function FilterValueNumberController({
  filter,
  column,
  actions,
}: FilterValueControllerProps<"number">) {
  const minMax = useMemo<[number, number]>(
    () => [column.min, column.max],
    [column.min, column.max],
  );
  const [sliderMin, sliderMax] = [minMax ? minMax[0] : 0, minMax ? minMax[1] : 0];

  const [values, setValues] = useState(filter?.values ?? [0, 0]);
  const [previousFilterValues, setPreviousFilterValues] = useState(filter?.values);

  if (previousFilterValues !== filter?.values) {
    setPreviousFilterValues(filter?.values);
    setValues(filter?.values ?? [0, 0]);
  }

  const isNumberRange = filter && numberFilterOperators[filter.operator].target === "multiple";

  const setNumberFilterValue = useCallback(
    (newValues: number[]) =>
      actions.setFilterValue({ type: "number", columnId: column.id, values: newValues }),
    [actions, column],
  );
  const {
    schedule: setFilterValueDebounced,
    cancel: cancelFilterValueUpdate,
    flush: flushFilterValueUpdate,
  } = useDebouncedCallback(setNumberFilterValue, 500);
  useEffect(cancelFilterValueUpdate, [filter?.values, cancelFilterValueUpdate]);

  const changeNumber = (value: number[]) => {
    cancelFilterValueUpdate();
    setValues(value);
    setNumberFilterValue(value);
  };

  const changeSlider = (value: number | readonly number[]) => {
    const nextValues = Array.isArray(value) ? [...value] : [value];
    setValues(nextValues);
    setFilterValueDebounced(nextValues);
  };

  const changeMinNumber = (value: number) => {
    const newValues = createNumberRange([value, values[1] ?? 0]);
    changeNumber(newValues);
  };

  const changeMaxNumber = (value: number) => {
    const newValues = createNumberRange([values[0] ?? 0, value]);
    changeNumber(newValues);
  };

  const changeType = useCallback(
    (type: "single" | "range") => {
      let newValues: number[] = [];
      if (type === "single") newValues = [values[0] ?? 0];
      else if (!minMax) newValues = createNumberRange([values[0] ?? 0, values[1] ?? 0]);
      else {
        const value = values[0] ?? 0;
        newValues =
          value - minMax[0] < minMax[1] - value
            ? createNumberRange([value, minMax[1]])
            : createNumberRange([minMax[0], value]);
      }

      const newOperator = type === "single" ? "is" : "is between";

      setValues(newValues);

      // Cancel the old value before changing operators.
      cancelFilterValueUpdate();

      actions.setFilterOperator({ type: "number", columnId: column.id, operator: newOperator });
      actions.setFilterValue({ type: column.type, columnId: column.id, values: newValues });
    },
    [values, column, actions, minMax, cancelFilterValueUpdate],
  );

  return (
    <Command
      onBlur={flushFilterValueUpdate}
      onKeyDown={(event) => {
        if (event.key === "Escape") flushFilterValueUpdate();
      }}
    >
      <CommandList className="w-[300px] px-2 py-2">
        <CommandGroup>
          <div className="flex w-full flex-col">
            <Tabs
              value={isNumberRange ? "range" : "single"}
              onValueChange={(v) => changeType(v === "range" ? "range" : "single")}
            >
              <TabsList className="w-full *:text-xs">
                <TabsTrigger value="single">single</TabsTrigger>
                <TabsTrigger value="range">range</TabsTrigger>
              </TabsList>
              <TabsContent value="single" className="mt-4 flex flex-col gap-4">
                {minMax && (
                  <Slider
                    value={[values[0] ?? 0]}
                    onValueChange={changeSlider}
                    onValueCommitted={flushFilterValueUpdate}
                    min={sliderMin}
                    max={sliderMax}
                    step={1}
                    aria-orientation="horizontal"
                  />
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">value</span>
                  <DebouncedInput
                    id="single"
                    type="number"
                    value={(values[0] ?? 0).toString()}
                    onChange={(v) => changeNumber([Number(v)])}
                  />
                </div>
              </TabsContent>
              <TabsContent value="range" className="mt-4 flex flex-col gap-4">
                {minMax && (
                  <Slider
                    value={values}
                    onValueChange={changeSlider}
                    onValueCommitted={flushFilterValueUpdate}
                    min={sliderMin}
                    max={sliderMax}
                    step={1}
                    aria-orientation="horizontal"
                  />
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">min</span>
                    <DebouncedInput
                      type="number"
                      value={values[0] ?? 0}
                      onChange={(v) => changeMinNumber(Number(v))}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">max</span>
                    <DebouncedInput
                      type="number"
                      value={values[1] ?? 0}
                      onChange={(v) => changeMaxNumber(Number(v))}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
