"use client";

import { useId, useState } from "react";
import { RotateCcwIcon } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Slider } from "@repo/ui/components/slider";
import { Switch } from "@repo/ui/components/switch";

import type { ControlValue, PreviewControls } from "@/lib/preview-controls";
import {
  atDefaults,
  controlEntries,
  fullHex,
  numberFormat,
  numberLargeStep,
  numberStep,
  parseHexInput,
  selectOptions,
} from "./control-format";
import type { ControlEntry } from "./control-format";

const LABEL = "text-sm font-normal";
const ROW = "flex min-h-11 items-center justify-between gap-3 px-4 py-1.5";
const STACK = "flex flex-col gap-2.5 px-4 py-2.5";

type FieldProps<Type extends ControlEntry["type"]> = Extract<ControlEntry, { type: Type }> & {
  onChange: (value: ControlValue) => void;
};

const NumberField = ({ control, label, value, onChange }: FieldProps<"number">) => {
  const labelId = useId();
  const step = numberStep(control);
  const format = numberFormat(step);

  return (
    <div className={STACK}>
      <div className="flex items-center justify-between gap-3">
        <span id={labelId} className={LABEL}>
          {label}
        </span>
        <span aria-hidden className="text-muted-foreground text-xs tabular-nums">
          {new Intl.NumberFormat(undefined, format).format(value)}
        </span>
      </div>
      <Slider
        aria-labelledby={labelId}
        value={value}
        min={control.min}
        max={control.max}
        step={step}
        largeStep={numberLargeStep(control)}
        format={format}
        onValueChange={(next) => {
          const [first] = [next].flat();

          if (first !== undefined) {
            onChange(first);
          }
        }}
      />
    </div>
  );
};

const BooleanField = ({ label, value, onChange }: FieldProps<"boolean">) => (
  <Label className={`${ROW} ${LABEL}`}>
    {label}
    <Switch checked={value} onCheckedChange={onChange} />
  </Label>
);

const SelectField = ({ control, label, value, onChange }: FieldProps<"select">) => {
  const labelId = useId();
  const options = selectOptions(control);

  return (
    <div className={ROW}>
      <span id={labelId} className={LABEL}>
        {label}
      </span>
      <Select
        items={options}
        value={value}
        onValueChange={(next) => {
          if (next !== null) {
            onChange(next);
          }
        }}
      >
        <SelectTrigger size="sm" aria-labelledby={labelId} className="max-w-40 min-w-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
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
    <div className={ROW}>
      <Label htmlFor={inputId} className={LABEL}>
        {label}
      </Label>
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={fullHex(value)}
          className="border-input size-8 shrink-0 cursor-pointer appearance-none rounded-md border bg-transparent p-1 [&::-moz-color-swatch]:rounded-sm [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
          onChange={(event) => {
            setDraft(null);
            onChange(event.currentTarget.value);
          }}
        />
        <Input
          id={inputId}
          value={draft ?? value}
          aria-invalid={invalid}
          autoComplete="off"
          spellCheck={false}
          maxLength={7}
          className="h-8 w-22 text-xs tabular-nums md:text-xs"
          onValueChange={setDraft}
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
      </div>
    </div>
  );
};

const TextField = ({ control, label, value, onChange }: FieldProps<"text">) => {
  const inputId = useId();

  return (
    <div className={STACK}>
      <Label htmlFor={inputId} className={LABEL}>
        {label}
      </Label>
      <Input
        id={inputId}
        value={value}
        placeholder={control.placeholder}
        className="h-8"
        onValueChange={onChange}
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
      return <NumberField {...entry} onChange={onChange} />;
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

interface PropControlsProps {
  controls: PreviewControls;
  values: Readonly<Record<string, ControlValue>>;
  onChange: (name: string, value: ControlValue) => void;
  onReset: () => void;
}

/**
 * The editable list for a preview's `controls`: one field per control, in declaration order,
 * fully controlled by `values` (a missing or mistyped value shows the control's default).
 * Reset is disabled while every value is already its default.
 */
export const PropControls = ({ controls, values, onChange, onReset }: PropControlsProps) => (
  <div className="flex flex-col py-1.5">
    {controlEntries(controls, values).map((entry) => (
      <ControlField
        key={entry.name}
        entry={entry}
        onChange={(value) => {
          onChange(entry.name, value);
        }}
      />
    ))}
    <div className="flex justify-end px-4 pt-2 pb-1">
      <Button
        variant="ghost"
        size="xs"
        className="text-muted-foreground rounded-md"
        disabled={atDefaults(controls, values)}
        onClick={onReset}
      >
        <RotateCcwIcon data-icon="inline-start" />
        Reset
      </Button>
    </div>
  </div>
);
