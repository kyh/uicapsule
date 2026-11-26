import assert from "node:assert/strict";
import { test } from "node:test";

import {
  atDefaults,
  clickedNumber,
  controlEntries,
  controlLabel,
  draggedNumber,
  fitsSegmented,
  formatNumber,
  fullHex,
  handleCrowdsText,
  hashmarkRatios,
  humanizeName,
  keyedNumber,
  numberLargeStep,
  numberRatio,
  numberStep,
  parseHexInput,
  parseNumberInput,
  rubberStretch,
  selectOptions,
  snapNumber,
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
  assert.equal(formatNumber(0.5, number(0, 1, 0.5)), "0.50");
  assert.equal(formatNumber(90, number(0, 360, 90)), "90");
  assert.equal(formatNumber(1000, number(0, 1000, 250)), "1000");
  assert.equal(formatNumber(1.25, number(0.2, 4, 1.25, 0.05)), "1.25");
});

test("values snap to the step grid counted from min, keeping both bounds reachable", () => {
  assert.equal(snapNumber(0.46, number(0.3, 6, 1.8, 0.1)), 0.5);
  assert.equal(snapNumber(4.2, number(3, 9, 5, 2)), 5);
  assert.equal(snapNumber(0.97, number(0, 1, 0, 0.3)), 1);
  assert.equal(snapNumber(0.8, number(0, 1, 0, 0.3)), 0.9);
  assert.equal(snapNumber(-4, number(0, 1, 0.5)), 0);
  assert.equal(snapNumber(12, number(0, 10, 5)), 10);
});

test("ratios place a value along its range", () => {
  assert.equal(numberRatio(5, number(0, 10, 5)), 0.5);
  assert.equal(numberRatio(0.3, number(0.3, 6, 1.8, 0.1)), 0);
  assert.equal(numberRatio(12, number(0, 10, 5)), 1);
  assert.equal(numberRatio(4, number(4, 4, 4)), 0);
});

test("a drag lands on the nearest step", () => {
  assert.equal(draggedNumber(0.333, number(0, 1, 0.5)), 0.33);
  assert.equal(draggedNumber(0.5, number(3, 9, 5, 2)), 7);
  assert.equal(draggedNumber(1, number(0, 360, 90)), 360);
});

test("a click snaps to nearby tenths on fine controls and to steps on coarse ones", () => {
  assert.equal(clickedNumber(0.52, number(0, 1, 0.5)), 0.5);
  assert.equal(clickedNumber(0.56, number(0, 1, 0.5)), 0.56);
  assert.equal(clickedNumber(0.31, number(0, 360, 90)), 108);
  assert.equal(clickedNumber(0.4, number(3, 9, 5, 2)), 5);
  assert.equal(clickedNumber(0.45, number(0, 3, 1, 0.25)), 1.25);
});

test("hash marks fall on each step of a coarse control and each tenth of a fine one", () => {
  assert.deepEqual(hashmarkRatios(number(3, 9, 5, 2)), [0.33333333333333, 0.66666666666667]);
  assert.deepEqual(hashmarkRatios(number(0, 1, 0, 0.25)), [0.25, 0.5, 0.75]);
  assert.deepEqual(hashmarkRatios(number(0, 1, 0, 0.3)), [0.3, 0.6, 0.9]);
  assert.deepEqual(
    hashmarkRatios(number(0, 1, 0.5)),
    [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9],
  );
  assert.deepEqual(
    hashmarkRatios(number(0.25, 3, 1, 0.25)).map((ratio) =>
      Number((0.25 + ratio * 2.75).toFixed(9)),
    ),
    [0.75, 1.25, 1.75, 2.25, 2.75],
  );
  assert.deepEqual(hashmarkRatios(number(4, 4, 4)), []);
});

test("arrows move one step, Shift and Page keys a large step, Home and End to the bounds", () => {
  const hue = number(0, 360, 90);

  assert.equal(keyedNumber("ArrowRight", false, 90, hue), 91);
  assert.equal(keyedNumber("ArrowDown", false, 90, hue), 89);
  assert.equal(keyedNumber("ArrowUp", true, 90, hue), 126);
  assert.equal(keyedNumber("PageDown", false, 90, hue), 54);
  assert.equal(keyedNumber("Home", false, 90, hue), 0);
  assert.equal(keyedNumber("End", false, 90, hue), 360);
  assert.equal(keyedNumber("PageUp", false, 350, hue), 360);
  assert.equal(keyedNumber("Enter", false, 90, hue), null);
});

test("keys move an off-grid value to the grid line it heads for, never past it", () => {
  const coarse = number(0, 1, 0, 0.3);

  assert.equal(keyedNumber("ArrowRight", false, 0.45, coarse), 0.6);
  assert.equal(keyedNumber("ArrowLeft", false, 0.45, coarse), 0.3);
  assert.equal(keyedNumber("ArrowLeft", false, 1, coarse), 0.9);
  assert.equal(keyedNumber("ArrowRight", false, 0.3, number(0.3, 6, 1.8, 0.1)), 0.4);
});

test("typed numbers are clamped and snapped, and anything else is refused", () => {
  const size = number(4, 20, 10, 1);

  assert.equal(parseNumberInput(" 12.4 ", size), 12);
  assert.equal(parseNumberInput("99", size), 20);
  assert.equal(parseNumberInput("-3", size), 4);
  assert.equal(parseNumberInput("", size), null);
  assert.equal(parseNumberInput("abc", size), null);
  assert.equal(parseNumberInput("1.2.3", size), null);
});

test("the track stretches only past a dead zone, easing out to 8px either way", () => {
  assert.equal(rubberStretch(0), 0);
  assert.equal(rubberStretch(32), 0);
  assert.equal(rubberStretch(82), 4);
  assert.equal(rubberStretch(-232), -8);
  assert.equal(rubberStretch(900), 8);
});

test("the handle trails the fill edge and gives way to the label and value", () => {
  const track = { labelEnd: 60, valueStart: 160, width: 200 };

  assert.ok(handleCrowdsText(0, track));
  assert.ok(handleCrowdsText(0.3, track));
  assert.ok(!handleCrowdsText(0.5, track));
  assert.ok(handleCrowdsText(0.8, track));
});

const options = (...labels: string[]) => labels.map((label) => ({ label }));

test("a few short options sit side by side when they fit beside the label", () => {
  assert.ok(fitsSegmented("Type", options("Time", "Physics"), 208));
  assert.ok(fitsSegmented("Grab & toss", options("Off", "On"), 208));
  assert.ok(!fitsSegmented("Dot shape", options("Square", "Circle"), 208));
  assert.ok(fitsSegmented("Dot shape", options("Square", "Circle"), 248));
  assert.ok(!fitsSegmented("Cell entrance", options("Pop", "Fade", "None"), 208));
  assert.ok(!fitsSegmented("Placement", options("top", "right", "bottom", "left"), 448));
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
      { label: "A", value: "a" },
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
  assert.ok(atDefaults(controls, { on: "yes", size: false }));
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
