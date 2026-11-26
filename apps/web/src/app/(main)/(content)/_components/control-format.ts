import * as z from "zod/mini";

import type { ControlValue, PreviewControl, PreviewControls } from "@/lib/preview-controls";

type ControlOf<Type extends PreviewControl["type"]> = Extract<PreviewControl, { type: Type }>;

/** A `number` control descriptor. */
export type NumberControl = ControlOf<"number">;

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

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const selectOptionsSchema = z.array(
  z.union([
    z.pipe(
      z.string(),
      z.transform((value) => ({ label: capitalize(value), value })),
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

  return capitalize(words.join(" "));
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

/** A number control's value as it reads: fixed to its step's precision, never grouped. */
export const formatNumber = (value: number, control: NumberControl) =>
  value.toFixed(stepDecimals(numberStep(control)));

const clampNumber = (value: number, control: NumberControl) =>
  Math.min(control.max, Math.max(control.min, value));

/**
 * `value` clamped to the control's range and snapped to its step grid, counted from `min`. `max`
 * stays reachable when the grid does not land on it: it wins whenever it is the nearer stop.
 */
export const snapNumber = (value: number, control: NumberControl) => {
  const clamped = clampNumber(value, control);

  if (clamped === control.min || clamped === control.max) {
    return clamped;
  }

  const step = numberStep(control);

  const snapped = clampNumber(
    Number((control.min + Math.round((clamped - control.min) / step) * step).toPrecision(14)),
    control,
  );

  return control.max - clamped < Math.abs(snapped - clamped) ? control.max : snapped;
};

/** Where `value` sits along the control's range, 0 at `min` and 1 at `max`. */
export const numberRatio = (value: number, control: NumberControl) => {
  const range = control.max - control.min;

  return range > 0 ? Math.min(1, Math.max(0, (value - control.min) / range)) : 0;
};

/** The value a drag lands on at `ratio` of the track: the nearest step. */
export const draggedNumber = (ratio: number, control: NumberControl) =>
  snapNumber(control.min + ratio * (control.max - control.min), control);

const DECILE_PULL = 1 / 32;

/**
 * The value a click lands on at `ratio` of the track. A control with ten steps or fewer snaps to
 * the nearest step; a finer one snaps to a tenth of its range when the click is within 1/32 of
 * it, so a click hits round values a drag would have to hunt for.
 */
export const clickedNumber = (ratio: number, control: NumberControl) => {
  if (control.max - control.min <= numberStep(control) * 10) {
    return draggedNumber(ratio, control);
  }

  const decile = Math.round(ratio * 10) / 10;

  return draggedNumber(Math.abs(ratio - decile) <= DECILE_PULL ? decile : ratio, control);
};

/**
 * Where the track's hash marks sit, as ratios: on values the control can hold, every step when
 * there are ten steps or fewer, otherwise every few steps so at most nine marks show.
 */
export const hashmarkRatios = (control: NumberControl) => {
  const range = control.max - control.min;

  if (range <= 0) {
    return [];
  }

  const steps = range / numberStep(control);
  const stride = Math.max(1, Math.ceil(steps / 10 - 1e-9));
  const count = Math.ceil(steps / stride - 1e-9) - 1;
  const gap = stride / steps;

  return Array.from({ length: count }, (_, index) => Number(((index + 1) * gap).toPrecision(14)));
};

const KEY_DIRECTIONS = new Map([
  ["ArrowDown", -1],
  ["ArrowLeft", -1],
  ["ArrowRight", 1],
  ["ArrowUp", 1],
  ["PageDown", -1],
  ["PageUp", 1],
]);

/**
 * The value a key moves a number control to, or null for a key that does not move it.
 * Arrows move one step; PageUp/PageDown, or an arrow with Shift, move `numberLargeStep`. A move
 * lands on the step grid, so an off-grid value first moves to the grid line it was heading for.
 */
export const keyedNumber = (key: string, shift: boolean, value: number, control: NumberControl) => {
  if (key === "Home") {
    return control.min;
  }

  if (key === "End") {
    return control.max;
  }

  const direction = KEY_DIRECTIONS.get(key);

  if (direction === undefined) {
    return null;
  }

  const step = numberStep(control);
  const large = key.startsWith("Page") || shift;
  const steps = large ? Math.round(numberLargeStep(control) / step) : 1;
  const position = (value - control.min) / step;

  const next =
    direction > 0 ? Math.floor(position + 1e-9) + steps : Math.ceil(position - 1e-9) - steps;

  return clampNumber(Number((control.min + next * step).toPrecision(14)), control);
};

/** A typed number clamped and snapped to the control; null when it is not a number. */
export const parseNumberInput = (input: string, control: NumberControl) => {
  const trimmed = input.trim();
  const parsed = trimmed === "" ? Number.NaN : Number(trimmed);

  return Number.isFinite(parsed) ? snapNumber(parsed, control) : null;
};

const STRETCH_DEAD_ZONE = 32;
const STRETCH_REACH = 200;
const STRETCH_MAX = 8;

/**
 * How far, in pixels, a slider's track stretches toward a pointer dragged `overshoot` pixels past
 * its end (negative past the start): nothing for the first 32px, then easing out to 8px.
 */
export const rubberStretch = (overshoot: number) => {
  const reach = Math.max(0, Math.abs(overshoot) - STRETCH_DEAD_ZONE) / STRETCH_REACH;

  return Math.sign(overshoot) * STRETCH_MAX * Math.sqrt(Math.min(reach, 1));
};

const HANDLE_INSET = 5;
const HANDLE_TRAIL = 9;
const HANDLE_WIDTH = 3;
const HANDLE_CLEARANCE = 8;

const handleOffset = (ratio: number, width: number) =>
  Math.max(HANDLE_INSET, ratio * width - HANDLE_TRAIL);

/**
 * Whether the slider handle at `ratio` would sit over (or within 8px of) the label ending at
 * `labelEnd` or the value starting at `valueStart`, all in px along a `width`px track.
 */
export const handleCrowdsText = (
  ratio: number,
  track: { readonly labelEnd: number; readonly valueStart: number; readonly width: number },
) => {
  const offset = handleOffset(ratio, track.width);

  return (
    offset < track.labelEnd + HANDLE_CLEARANCE ||
    offset + HANDLE_WIDTH > track.valueStart - HANDLE_CLEARANCE
  );
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

const SEGMENT_MAX_OPTIONS = 3;
const CHARACTER_PX = 7;
const SEGMENT_PADDING_PX = 16;
const SEGMENTED_ROW_CHROME_PX = 30;

/**
 * Whether a select's options sit side by side as a segmented control, not in a dropdown: at
 * most three, and the label plus equal-width segments fit a `rowWidth`px row without the label
 * truncating, estimating 7px per character of the panel's 13px text.
 */
export const fitsSegmented = (
  label: string,
  options: readonly { readonly label: string }[],
  rowWidth: number,
) => {
  const widest = Math.max(0, ...options.map((option) => option.label.length));
  const segments = options.length * (widest * CHARACTER_PX + SEGMENT_PADDING_PX);

  return (
    options.length <= SEGMENT_MAX_OPTIONS &&
    label.length * CHARACTER_PX + segments + SEGMENTED_ROW_CHROME_PX <= rowWidth
  );
};

const numberValue = z.number();
const booleanValue = z.boolean();
const stringValue = z.string();

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

const holdsDefault = (entry: ControlEntry) =>
  entry.type === "color"
    ? fullHex(entry.value) === fullHex(entry.control.default)
    : entry.value === entry.control.default;

/**
 * Whether every control shows its default: a missing or mistyped value counts as the default, as
 * its row shows it, and colors compare by the color they name, whatever their case or length.
 */
export const atDefaults = (
  controls: PreviewControls,
  values: Readonly<Record<string, ControlValue>>,
) => controlEntries(controls, values).every(holdsDefault);
