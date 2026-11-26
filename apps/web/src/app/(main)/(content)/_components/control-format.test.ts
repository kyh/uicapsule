import assert from "node:assert/strict";
import { test } from "node:test";

import {
  atDefaults,
  controlEntries,
  controlLabel,
  fullHex,
  humanizeName,
  numberFormat,
  numberLargeStep,
  numberStep,
  parseHexInput,
  selectOptions,
  stepDecimals,
} from "./control-format";

test("prop names humanize into sentence case, keeping acronyms", () => {
  assert.equal(humanizeName("rotationSpeed"), "Rotation speed");
  assert.equal(humanizeName("rotation_speed"), "Rotation speed");
  assert.equal(humanizeName("rotation-speed"), "Rotation speed");
  assert.equal(humanizeName("size"), "Size");
  assert.equal(humanizeName("maxURLLength"), "Max URL length");
  assert.equal(humanizeName("blur2x"), "Blur2x");
});

test("a declared label wins over the humanized name", () => {
  assert.equal(controlLabel("hue", { default: true, label: "Tint", type: "boolean" }), "Tint");
  assert.equal(controlLabel("showGrid", { default: true, type: "boolean" }), "Show grid");
});

const number = (min: number, max: number, value: number, step?: number) => ({
  default: value,
  max,
  min,
  step,
  type: "number" as const,
});

test("a declared step is kept", () => {
  assert.equal(numberStep(number(0, 10, 5, 0.25)), 0.25);
});

test("steps are inferred two orders of magnitude below the range", () => {
  assert.equal(numberStep(number(0, 1, 0.5)), 0.01);
  assert.equal(numberStep(number(0, 5, 2.5)), 0.01);
  assert.equal(numberStep(number(-1, 1, 0)), 0.01);
  assert.equal(numberStep(number(0, 20, 2.5)), 0.1);
  assert.equal(numberStep(number(0, 0.1, 0.05)), 0.001);
});

test("integral ranges of ten or more step by whole numbers", () => {
  assert.equal(numberStep(number(0, 10, 3)), 1);
  assert.equal(numberStep(number(0, 360, 90)), 1);
  assert.equal(numberStep(number(0, 1000, 250)), 10);
  assert.equal(numberStep(number(0, 1, 0)), 0.01);
});

test("an empty range steps by one", () => {
  assert.equal(numberStep(number(4, 4, 4)), 1);
});

test("large steps jump about a tenth of the range in whole steps", () => {
  assert.equal(numberLargeStep(number(0, 1, 0.5)), 0.1);
  assert.equal(numberLargeStep(number(0, 5, 2.5)), 0.5);
  assert.equal(numberLargeStep(number(0, 360, 90)), 36);
  assert.equal(numberLargeStep(number(0, 1000, 250)), 100);
  assert.equal(numberLargeStep(number(0, 3, 1, 0.1)), 0.3);
  assert.equal(numberLargeStep(number(0, 10, 5, 0.25)), 1);
});

test("a large step is never smaller than one step", () => {
  assert.equal(numberLargeStep(number(0, 1, 0.5, 0.25)), 0.25);
  assert.equal(numberLargeStep(number(0, 4, 2, 1)), 1);
  assert.equal(numberLargeStep(number(4, 4, 4)), 1);
});

test("readouts print as many decimals as the step needs", () => {
  assert.equal(stepDecimals(1), 0);
  assert.equal(stepDecimals(10), 0);
  assert.equal(stepDecimals(0.1), 1);
  assert.equal(stepDecimals(0.25), 2);
  assert.equal(stepDecimals(0.001), 3);
  assert.equal(stepDecimals(1.5e-7), 8);
  assert.equal(new Intl.NumberFormat("en-US", numberFormat(0.01)).format(0.5), "0.50");
  assert.equal(new Intl.NumberFormat("en-US", numberFormat(1)).format(90), "90");
});

test("hex input accepts 3 or 6 digits with or without #, and nothing else", () => {
  assert.equal(parseHexInput("#FF8800"), "#ff8800");
  assert.equal(parseHexInput(" f80 "), "#f80");
  assert.equal(parseHexInput("#ff880"), null);
  assert.equal(parseHexInput("#ggg"), null);
  assert.equal(parseHexInput("red"), null);
  assert.equal(parseHexInput(""), null);
});

test("swatches get the six-digit form the color input needs", () => {
  assert.equal(fullHex("#F80"), "#ff8800");
  assert.equal(fullHex("#Ff8800"), "#ff8800");
});

test("select options normalize to value and label", () => {
  assert.deepEqual(
    selectOptions({
      default: "a",
      options: ["a", { label: "Bee", value: "b" }],
      type: "select",
    }),
    [
      { label: "a", value: "a" },
      { label: "Bee", value: "b" },
    ],
  );
});

test("values sit at defaults when every one matches or is missing", () => {
  const controls = {
    on: { default: true, type: "boolean" },
    size: number(0, 10, 3),
  } as const;

  assert.ok(atDefaults(controls, {}));
  assert.ok(atDefaults(controls, { on: true, size: 3, stale: "x" }));
  assert.ok(!atDefaults(controls, { size: 4 }));
});

test("colors sit at their default whatever their case or length", () => {
  const controls = { accent: { default: "#FF8800", type: "color" } } as const;

  assert.ok(atDefaults(controls, { accent: "#ff8800" }));
  assert.ok(atDefaults(controls, { accent: "#f80" }));
  assert.ok(!atDefaults(controls, { accent: "#ff8801" }));
});

test("entries pair each control with a value of its own type, else its default", () => {
  const controls = {
    accent: { default: "#f80", type: "color" },
    on: { default: false, label: "Enabled", type: "boolean" },
    size: number(0, 10, 3),
  } as const;

  assert.deepEqual(
    controlEntries(controls, { on: "yes", size: 7 }).map(({ label, name, type, value }) => ({
      label,
      name,
      type,
      value,
    })),
    [
      { label: "Accent", name: "accent", type: "color", value: "#f80" },
      { label: "Enabled", name: "on", type: "boolean", value: false },
      { label: "Size", name: "size", type: "number", value: 7 },
    ],
  );
});
