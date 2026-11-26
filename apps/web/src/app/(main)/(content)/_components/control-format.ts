import * as z from "zod/mini";

import type { ControlValue, PreviewControl, PreviewControls } from "@/lib/preview-controls";

type ControlOf<Type extends PreviewControl["type"]> = Extract<PreviewControl, { type: Type }>;

type NumberControl = ControlOf<"number">;

type SelectControl = ControlOf<"select">;

interface Entry<Type extends PreviewControl["type"], Value extends ControlValue> {
  readonly control: ControlOf<Type>;
  readonly label: string;
  readonly name: string;
  readonly type: Type;
  readonly value: Value;
}

/** One control ready to render: its descriptor, label and current value, typed together. */
export type ControlEntry =
  | Entry<"number", number>
  | Entry<"boolean", boolean>
  | Entry<"select", string>
  | Entry<"color", string>
  | Entry<"text", string>;

const ACRONYM = /^[A-Z\d]{2,}$/u;
const HEX_DIGITS = /^(?:[\da-f]{3}|[\da-f]{6})$/iu;

const selectOptionsSchema = z.array(
  z.union([
    z.pipe(
      z.string(),
      z.transform((value) => ({ label: value, value })),
    ),
    z.object({ label: z.string(), value: z.string() }),
  ]),
);

/** `rotationSpeed`, `rotation_speed` or `rotation-speed` → `Rotation speed`; acronyms keep their case. */
export const humanizeName = (name: string) => {
  const words = name
    .replaceAll(/(?<before>[a-z\d])(?<after>[A-Z])/gu, "$<before> $<after>")
    .replaceAll(/(?<acronym>[A-Z]+)(?<word>[A-Z][a-z])/gu, "$<acronym> $<word>")
    .split(/[\s_-]+/u)
    .filter((word) => word !== "")
    .map((word) => (ACRONYM.test(word) ? word : word.toLowerCase()));

  const sentence = words.join(" ");

  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
};

/** The label a control shows: its declared `label`, else its prop name humanized. */
export const controlLabel = (name: string, control: PreviewControl) =>
  control.label ?? humanizeName(name);

/**
 * A number control's slider step: the declared one, else two orders of magnitude below its
 * range, rounded up to whole numbers when the bounds and default are all integers and the range
 * spans at least ten (a count, an angle, a pixel size).
 */
export const numberStep = (control: NumberControl) => {
  if (control.step !== undefined) {
    return control.step;
  }

  const range = control.max - control.min;

  if (range <= 0) {
    return 1;
  }

  const step = 10 ** (Math.floor(Math.log10(range)) - 2);
  const integral = [control.min, control.max, control.default].every(Number.isInteger);

  return integral && range >= 10 ? Math.max(1, step) : step;
};

/**
 * A number control's PageUp/PageDown and Shift+Arrow jump: the whole number of steps closest to a
 * tenth of its range, never less than one step. Base UI's default is 10 value units, which is the
 * whole range of most controls.
 */
export const numberLargeStep = (control: NumberControl) => {
  const step = numberStep(control);
  const steps = Math.max(1, Math.round((control.max - control.min) / 10 / step));

  return Number((steps * step).toFixed(stepDecimals(step)));
};

/** How many fraction digits a value snapped to `step` needs. */
export const stepDecimals = (step: number) => {
  const [mantissa = "", exponent = "0"] = step.toExponential().split("e");
  const [, fraction = ""] = mantissa.split(".");

  return Math.max(0, fraction.length - Number(exponent));
};

/** `Intl.NumberFormat` options that print a number control's value at its step's precision. */
export const numberFormat = (step: number) => {
  const digits = stepDecimals(step);

  return {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  } satisfies Intl.NumberFormatOptions;
};

/** Typed hex → `#rgb` / `#rrggbb` in lowercase, with or without the `#`; null if it is not one. */
export const parseHexInput = (input: string) => {
  const digits = input.trim().replace(/^#/u, "");

  return HEX_DIGITS.test(digits) ? `#${digits.toLowerCase()}` : null;
};

/** A hex color as `#rrggbb`, the only form `<input type="color">` accepts. */
export const fullHex = (hex: string) => {
  const digits = hex.replace(/^#/u, "").toLowerCase();

  return `#${digits.length === 3 ? digits.replaceAll(/[\da-f]/gu, "$&$&") : digits}`;
};

/** A select control's options as `{ value, label }`, a bare string being both. */
export const selectOptions = (control: SelectControl) =>
  selectOptionsSchema.safeParse(control.options).data ?? [];

const numberValue = z.number();
const booleanValue = z.boolean();
const stringValue = z.string();

const holdsDefault = (control: PreviewControl, value: ControlValue | undefined) => {
  if (control.type !== "color") {
    return value === control.default;
  }

  const hex = stringValue.safeParse(value).data;

  return hex !== undefined && fullHex(hex) === fullHex(control.default);
};

/**
 * Whether every control holds its default, a missing value counting as the default and colors
 * comparing by the color they name, whatever their case or length.
 */
export const atDefaults = (
  controls: PreviewControls,
  values: Readonly<Record<string, ControlValue>>,
) =>
  Object.entries(controls).every(
    ([name, control]) => !Object.hasOwn(values, name) || holdsDefault(control, values[name]),
  );

const controlEntry = (name: string, control: PreviewControl, value: ControlValue | undefined) => {
  const base = { label: controlLabel(name, control), name };

  switch (control.type) {
    case "number": {
      return {
        ...base,
        control,
        type: control.type,
        value: numberValue.safeParse(value).data ?? control.default,
      } satisfies ControlEntry;
    }

    case "boolean": {
      return {
        ...base,
        control,
        type: control.type,
        value: booleanValue.safeParse(value).data ?? control.default,
      } satisfies ControlEntry;
    }

    case "select": {
      return {
        ...base,
        control,
        type: control.type,
        value: stringValue.safeParse(value).data ?? control.default,
      } satisfies ControlEntry;
    }

    case "color": {
      return {
        ...base,
        control,
        type: control.type,
        value: stringValue.safeParse(value).data ?? control.default,
      } satisfies ControlEntry;
    }

    case "text": {
      return {
        ...base,
        control,
        type: control.type,
        value: stringValue.safeParse(value).data ?? control.default,
      } satisfies ControlEntry;
    }

    default: {
      return control satisfies never;
    }
  }
};

/**
 * Each control paired with its label and value, in declaration order. A value missing from
 * `values`, or of the wrong type for its control, falls back to the control's default.
 */
export const controlEntries = (
  controls: PreviewControls,
  values: Readonly<Record<string, ControlValue>>,
) =>
  Object.entries(controls).map<ControlEntry>(([name, control]) =>
    controlEntry(name, control, values[name]),
  );
