import * as z from "zod/mini";

const HEX_COLOR = /^#(?:[\da-f]{3}|[\da-f]{6})$/iu;

const RESERVED_PROP_NAMES = new Set([
  "key",
  "ref",
  ...Object.getOwnPropertyNames(Object.prototype),
]);

const label = z.optional(z.string());
const hexColorSchema = z.string().check(z.regex(HEX_COLOR, "expected a #rgb or #rrggbb color"));

const selectOptionSchema = z.union([
  z.string(),
  z.strictObject({ label: z.string(), value: z.string() }),
]);

const optionValuesSchema = z.array(
  z.union([
    z.string(),
    z.pipe(
      z.object({ value: z.string() }),
      z.transform((option) => option.value),
    ),
  ]),
);

const optionValues = (options: readonly z.output<typeof selectOptionSchema>[]) =>
  optionValuesSchema.safeParse(options).data ?? [];

const numberControlSchema = z
  .strictObject({
    default: z.number(),
    label,
    max: z.number(),
    min: z.number(),
    step: z.optional(z.number().check(z.positive())),
    type: z.literal("number"),
  })
  .check(
    z.refine((control) => control.min <= control.default && control.default <= control.max, {
      message: "a number control needs min <= default <= max",
    }),
  );

const selectControlSchema = z
  .strictObject({
    default: z.string(),
    label,
    options: z.readonly(z.array(selectOptionSchema).check(z.minLength(1))),
    type: z.literal("select"),
  })
  .check(
    z.refine(
      (control) => {
        const values = optionValues(control.options);

        return new Set(values).size === values.length;
      },
      { message: "a select control's option values must be unique" },
    ),
    z.refine((control) => optionValues(control.options).includes(control.default), {
      message: "a select control's default must be one of its option values",
    }),
  );

const previewControlSchema = z.discriminatedUnion("type", [
  numberControlSchema,
  z.strictObject({ default: z.boolean(), label, type: z.literal("boolean") }),
  selectControlSchema,
  z.strictObject({ default: hexColorSchema, label, type: z.literal("color") }),
  z.strictObject({
    default: z.string(),
    label,
    placeholder: z.optional(z.string()),
    type: z.literal("text"),
  }),
]);

/**
 * Every control a preview's `controls` export may declare, keyed by the `Preview` prop it
 * feeds. `key` and `ref` are refused because React would swallow them, and every
 * `Object.prototype` name (`constructor`, `toString`, `__proto__`, …) because a plain props
 * object already answers to it.
 */
export const previewControlsSchema = z.readonly(
  z.record(
    z.string().check(
      z.refine((name) => !RESERVED_PROP_NAMES.has(name), {
        message: "key, ref and Object.prototype names cannot be control names",
      }),
    ),
    previewControlSchema,
  ),
);

/** One control descriptor: number, boolean, select, color or text. */
export type PreviewControl = z.output<typeof previewControlSchema>;

/** A preview's `controls` export: prop name → descriptor. Accepts an `as const` literal. */
export type PreviewControls = z.output<typeof previewControlsSchema>;

/** The value one control holds; structured-clone-able so it crosses `postMessage`. */
export type ControlValue = number | boolean | string;

/**
 * Control values as they arrive over `postMessage`: any value per key, so one bad value never
 * drops the rest. `mergeControlValues` validates each against its control.
 */
export const controlValuesPayloadSchema = z.record(z.string(), z.unknown());

/** Unvalidated control values, keyed by prop name. */
export type ControlValuesPayload = z.output<typeof controlValuesPayloadSchema>;

type SelectOptionValue<Option> = Option extends string
  ? Option
  : Option extends { readonly value: infer Value extends string }
    ? Value
    : never;

type ValueOfControl<Control> = Control extends { readonly type: "number" }
  ? number
  : Control extends { readonly type: "boolean" }
    ? boolean
    : Control extends { readonly type: "select"; readonly options: readonly (infer Option)[] }
      ? SelectOptionValue<Option>
      : string;

/** The props `Preview` receives for a `controls` export: one value per key, selects narrowed to their options. */
export type ControlValues<T extends PreviewControls> = {
  [Key in keyof T]: ValueOfControl<T[Key]>;
};

type InheritedName =
  | "constructor"
  | "hasOwnProperty"
  | "isPrototypeOf"
  | "propertyIsEnumerable"
  | "toLocaleString"
  | "toString"
  | "valueOf";

type CheckedControl<Key, Control> = Key extends "key" | "ref" | InheritedName
  ? never
  : Control extends { readonly type: "select"; readonly options: readonly (infer Option)[] }
    ? Omit<Control, "default"> & { readonly default: SelectOptionValue<Option> }
    : Control extends { readonly type: "color" }
      ? Omit<Control, "default"> & { readonly default: `#${string}` }
      : Control;

/**
 * The compile-time half of `previewControlsSchema` for an `as const` literal: a select's
 * default must be one of its options, a color's starts with `#`, and neither `key`/`ref` nor
 * an `Object.prototype` member is a control name.
 */
export type CheckedPreviewControls<T extends PreviewControls> = {
  readonly [Key in keyof T]: CheckedControl<Key, T[Key]>;
};

/** Each control's declared default, keyed like the controls. */
export const defaultControlValues = (controls: PreviewControls) =>
  Object.fromEntries(
    Object.entries(controls).map(([name, control]) => [name, control.default]),
  ) satisfies Record<string, ControlValue>;

const valueSchema = (control: PreviewControl) => {
  switch (control.type) {
    case "number": {
      return z.pipe(
        z.number(),
        z.transform((value) => Math.min(control.max, Math.max(control.min, value))),
      );
    }

    case "boolean": {
      return z.boolean();
    }

    case "select": {
      const values = new Set(optionValues(control.options));

      return z.string().check(z.refine((value) => values.has(value)));
    }

    case "color": {
      return hexColorSchema;
    }

    case "text": {
      return z.string();
    }

    default: {
      return z.never();
    }
  }
};

/**
 * `current` updated with every value in `incoming` its control accepts: numbers clamp to
 * `[min, max]`, selects must name an option, colors must be hex. Unknown keys and values of
 * the wrong type are ignored, so the result always holds exactly one value per control.
 */
export const mergeControlValues = (
  controls: PreviewControls,
  current: Readonly<Record<string, ControlValue>>,
  incoming: Readonly<ControlValuesPayload>,
) =>
  Object.fromEntries(
    Object.entries(controls).map(([name, control]) => [
      name,
      (Object.hasOwn(incoming, name)
        ? valueSchema(control).safeParse(incoming[name]).data
        : undefined) ??
        (Object.hasOwn(current, name) ? current[name] : undefined) ??
        control.default,
    ]),
  ) satisfies Record<string, ControlValue>;
