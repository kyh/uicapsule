"use client";

import { useId, useState } from "react";
import { ChevronDownIcon, RotateCcwIcon } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/ui/components/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { cn } from "cn";

import type { ControlValue, PreviewControls } from "@/lib/preview-controls";
import {
  atDefaults,
  controlEntries,
  fitsSegmented,
  fullHex,
  groupEntries,
  parseHexInput,
  selectOptions,
} from "./control-format";
import type { ControlEntry, ControlGroup } from "./control-format";
import { PANEL_BOUNDS } from "./panel-layout";
import { FIELD_ROW, ROW_INPUT, ROW_LABEL, ROW_SURFACE, TRAVEL_EASE } from "./control-row";
import { ScrubSlider } from "./scrub-slider";
import { SegmentedControl } from "./segmented-control";

const PANEL_PADDING_X = 16;

const NARROWEST_ROW = PANEL_BOUNDS.props.min - 2 * PANEL_PADDING_X;

const BOOLEAN_OPTIONS = [
  { label: "Off", value: "off" },
  { label: "On", value: "on" },
] as const;

type FieldProps<Type extends ControlEntry["type"]> = Extract<ControlEntry, { type: Type }> & {
  onChange: (value: ControlValue) => void;
};

const SegmentedRow = ({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { readonly label: string; readonly value: string }[];
  value: string;
  onChange: (value: string) => void;
}) => {
  const labelId = useId();

  return (
    <div className={cn(ROW_SURFACE, "flex items-center justify-between gap-3 py-0.5 pr-0.5 pl-3")}>
      <span id={labelId} className={cn(ROW_LABEL, "truncate")}>
        {label}
      </span>
      <SegmentedControl labelId={labelId} options={options} value={value} onChange={onChange} />
    </div>
  );
};

const BooleanField = ({ label, value, onChange }: FieldProps<"boolean">) => (
  <SegmentedRow
    label={label}
    options={BOOLEAN_OPTIONS}
    value={value ? "on" : "off"}
    onChange={(next) => {
      onChange(next === "on");
    }}
  />
);

const SelectField = ({ control, label, value, onChange }: FieldProps<"select">) => {
  const labelId = useId();
  const options = selectOptions(control);

  if (fitsSegmented(label, options, NARROWEST_ROW)) {
    return <SegmentedRow label={label} options={options} value={value} onChange={onChange} />;
  }

  return (
    <Select
      items={options}
      value={value}
      onValueChange={(next) => {
        if (next !== null) {
          onChange(next);
        }
      }}
    >
      <SelectTrigger
        aria-labelledby={labelId}
        className={cn(
          ROW_SURFACE,
          "hover:bg-foreground/10 focus-visible:bg-foreground/10 data-popup-open:bg-foreground/15 dark:bg-foreground/5 dark:hover:bg-foreground/10 dark:focus-visible:bg-foreground/10 focus-visible:ring-ring/50 w-full gap-2 border-0 py-0 pr-2 pl-3 text-[13px] font-medium shadow-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-inset [&>svg]:size-4 [&>svg]:opacity-60 [&>svg]:transition-transform [&>svg]:duration-200 data-popup-open:[&>svg]:rotate-180",
        )}
      >
        <span id={labelId} aria-hidden className={cn(ROW_LABEL, "mr-auto shrink-0")}>
          {label}
        </span>
        <SelectValue className="text-foreground/70 min-w-0 flex-none justify-end truncate text-right" />
      </SelectTrigger>
      <SelectContent
        alignItemWithTrigger={false}
        className="bg-popover ring-foreground/10 rounded-md p-1 shadow-lg"
      >
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="text-foreground/70 focus:bg-foreground/10 focus:text-foreground data-selected:bg-foreground/10 data-selected:text-foreground min-h-9 rounded-sm py-2 pr-8 pl-2 text-[13px] font-medium transition-colors duration-150"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const ColorField = ({ label, value, onChange }: FieldProps<"color">) => {
  const inputId = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const invalid = draft !== null && parseHexInput(draft) === null;

  const commit = () => {
    const parsed = draft === null ? null : parseHexInput(draft);

    if (parsed !== null) {
      onChange(parsed);
    }

    setDraft(null);
  };

  return (
    <div className={FIELD_ROW}>
      <label htmlFor={inputId} className={cn(ROW_LABEL, "min-w-0 truncate")}>
        {label}
      </label>
      <input
        id={inputId}
        value={draft ?? value}
        aria-invalid={invalid}
        autoComplete="off"
        spellCheck={false}
        maxLength={7}
        className={cn(
          ROW_INPUT,
          "aria-invalid:text-destructive ml-auto w-[7.5ch] flex-none font-mono",
        )}
        onChange={(event) => {
          setDraft(event.currentTarget.value);
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            commit();
          }

          if (event.key === "Escape") {
            setDraft(null);
          }
        }}
      />
      <input
        type="color"
        aria-label={`${label} picker`}
        value={fullHex(value)}
        className="border-foreground/15 focus-visible:ring-ring/50 size-5 shrink-0 cursor-pointer appearance-none rounded-[5px] border bg-transparent p-0 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] transition-transform duration-150 outline-none hover:scale-108 focus-visible:ring-2 [&::-moz-color-swatch]:rounded-[4px] [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-[4px] [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
        onChange={(event) => {
          setDraft(null);
          onChange(event.currentTarget.value);
        }}
      />
    </div>
  );
};

const TextField = ({ control, label, value, onChange }: FieldProps<"text">) => {
  const inputId = useId();

  return (
    <div className={FIELD_ROW}>
      <label htmlFor={inputId} className={cn(ROW_LABEL, "shrink-0")}>
        {label}
      </label>
      <input
        id={inputId}
        value={value}
        placeholder={control.placeholder}
        autoComplete="off"
        className={ROW_INPUT}
        onChange={(event) => {
          onChange(event.currentTarget.value);
        }}
      />
    </div>
  );
};

const ControlField = ({
  entry,
  onChange,
}: {
  entry: ControlEntry;
  onChange: (value: ControlValue) => void;
}) => {
  switch (entry.type) {
    case "number": {
      return <ScrubSlider {...entry} onChange={onChange} />;
    }

    case "boolean": {
      return <BooleanField {...entry} onChange={onChange} />;
    }

    case "select": {
      return <SelectField {...entry} onChange={onChange} />;
    }

    case "color": {
      return <ColorField {...entry} onChange={onChange} />;
    }

    case "text": {
      return <TextField {...entry} onChange={onChange} />;
    }

    default: {
      return entry satisfies never;
    }
  }
};

const ControlRows = ({
  entries,
  onChange,
}: {
  entries: readonly ControlEntry[];
  onChange: (name: string, value: ControlValue) => void;
}) =>
  entries.map((entry) => (
    <ControlField
      key={entry.name}
      entry={entry}
      onChange={(value) => {
        onChange(entry.name, value);
      }}
    />
  ));

const NamedGroup = ({
  group: { entries, name },
  onChange,
}: {
  group: ControlGroup & { readonly name: string };
  onChange: (name: string, value: ControlValue) => void;
}) => (
  <Collapsible defaultOpen className="flex flex-col">
    <CollapsibleTrigger className="group/trigger text-foreground/50 hover:text-foreground/80 focus-visible:text-foreground focus-visible:ring-ring/50 -mx-1 flex h-8 items-center justify-between rounded-sm px-1 text-[12px] font-medium transition-colors duration-150 outline-none focus-visible:ring-2">
      {name}
      <ChevronDownIcon
        aria-hidden
        className={cn(
          "size-3.5 -rotate-90 transition-transform duration-300 group-data-panel-open/trigger:rotate-0",
          TRAVEL_EASE,
        )}
      />
    </CollapsibleTrigger>
    <CollapsibleContent
      className={cn(
        "h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-300 data-ending-style:h-0 data-starting-style:h-0",
        TRAVEL_EASE,
      )}
    >
      <div className="flex flex-col gap-1.5 pb-2">
        <ControlRows entries={entries} onChange={onChange} />
      </div>
    </CollapsibleContent>
  </Collapsible>
);

const ControlGroupSection = ({
  group,
  onChange,
}: {
  group: ControlGroup;
  onChange: (name: string, value: ControlValue) => void;
}) =>
  group.name === null ? (
    <ControlRows entries={group.entries} onChange={onChange} />
  ) : (
    <NamedGroup group={{ ...group, name: group.name }} onChange={onChange} />
  );

interface PropControlsProps {
  controls: PreviewControls;
  values: Readonly<Record<string, ControlValue>>;
  onChange: (name: string, value: ControlValue) => void;
  onReset: () => void;
}

/**
 * The editable list for a preview's `controls`: one 36px row per control, in declaration order,
 * under a collapsible header per `group` when the controls declare groups,
 * fully controlled by `values` (a missing or mistyped value shows the control's default).
 * Reset is disabled while every value is already its default, yet stays focusable, so pressing it
 * from the keyboard keeps focus in the panel.
 */
export const PropControls = ({ controls, values, onChange, onReset }: PropControlsProps) => (
  <div className="flex flex-col gap-1.5 px-4 pb-4">
    {groupEntries(controlEntries(controls, values)).map((group) => (
      <ControlGroupSection key={group.name ?? ""} group={group} onChange={onChange} />
    ))}
    <Button
      variant="ghost"
      className={cn(
        ROW_SURFACE,
        "text-foreground/70 hover:bg-foreground/10 hover:text-foreground active:bg-foreground/15 data-disabled:text-foreground/35 focus-visible:ring-ring/50 w-full gap-1.5 text-[13px] font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-inset active:not-aria-[haspopup]:scale-100 data-disabled:pointer-events-none [&_svg:not([class*='size-'])]:size-3.5",
      )}
      disabled={atDefaults(controls, values)}
      focusableWhenDisabled
      onClick={onReset}
    >
      <RotateCcwIcon aria-hidden />
      Reset
    </Button>
  </div>
);
