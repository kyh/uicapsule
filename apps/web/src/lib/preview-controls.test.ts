import assert from "node:assert/strict";
import { test } from "node:test";
import type { ComponentType } from "react";

import {
  defaultControlValues,
  mergeControlValues,
  previewControlsSchema,
} from "./preview-controls";
import type { CheckedPreviewControls, ControlValues, PreviewControls } from "./preview-controls";

type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

const orbControls = {
  background: { default: "#0a0a0a", type: "color" },
  caption: { default: "", placeholder: "Overlay text", type: "text" },
  grain: { default: false, type: "boolean" },
  hue: { default: 0, label: "Hue rotation", max: 360, min: 0, step: 1, type: "number" },
  quality: {
    default: "high",
    options: ["low", { label: "High", value: "high" }],
    type: "select",
  },
  rotationSpeed: { default: 0.3, max: 2, min: 0, step: 0.05, type: "number" },
} as const;

interface OrbPreviewProps {
  background: string;
  caption: string;
  grain: boolean;
  hue: number;
  quality: "low" | "high";
  rotationSpeed: number;
}

const OrbPreview = (props: OrbPreviewProps) => (props.grain ? null : null);
const NeedsUnsuppliedProp = (props: { missing: string }) => props.missing;
const NarrowerSelect = (props: { quality: "low" }) => props.quality;

const sparseSelect = { size: { default: "xl", options: ["sm", "md"], type: "select" } } as const;
const namedColor = { tint: { default: "red", type: "color" } } as const;
const reservedName = { key: { default: 1, max: 2, min: 0, type: "number" } } as const;
const inheritedName = { constructor: { default: true, type: "boolean" } } as const;

test("an as-const controls literal types the props Preview receives", () => {
  const typed: PreviewControls = orbControls;
  const checked: CheckedPreviewControls<typeof orbControls> = orbControls;
  const preview: ComponentType<ControlValues<typeof orbControls>> = OrbPreview;

  const propsMatch: Equal<
    ControlValues<typeof orbControls>,
    {
      readonly background: string;
      readonly caption: string;
      readonly grain: boolean;
      readonly hue: number;
      readonly quality: "low" | "high";
      readonly rotationSpeed: number;
    }
  > = true;

  // @ts-expect-error a Preview that needs a prop no control supplies
  const needsMore: ComponentType<ControlValues<typeof orbControls>> = NeedsUnsuppliedProp;

  // @ts-expect-error a select's values are its options, not any string
  const narrower: ComponentType<ControlValues<typeof orbControls>> = NarrowerSelect;

  // @ts-expect-error a select default outside its options
  const badSelect: CheckedPreviewControls<typeof sparseSelect> = sparseSelect;

  // @ts-expect-error a color default that is not hex
  const badColor: CheckedPreviewControls<typeof namedColor> = namedColor;

  // @ts-expect-error key is swallowed by React
  const badName: CheckedPreviewControls<typeof reservedName> = reservedName;

  // @ts-expect-error constructor is already a member of every props object
  const badInherited: CheckedPreviewControls<typeof inheritedName> = inheritedName;

  assert.ok(propsMatch);
  assert.ok(
    [
      typed,
      checked,
      preview,
      needsMore,
      narrower,
      badSelect,
      badColor,
      badName,
      badInherited,
    ].every(Boolean),
  );
});

test("the schema accepts every descriptor kind as authored", () => {
  assert.deepEqual(previewControlsSchema.safeParse(orbControls).data, orbControls);
  assert.deepEqual(previewControlsSchema.safeParse({}).data, {});
});

test("the schema rejects descriptors the panel could not render honestly", () => {
  const rejected: unknown[] = [
    sparseSelect,
    reservedName,
    { ref: { default: true, type: "boolean" } },
    inheritedName,
    { toString: { default: "", type: "text" } },
    { valueOf: { default: 1, max: 2, min: 0, type: "number" } },
    { hasOwnProperty: { default: false, type: "boolean" } },
    { size: { default: "sm", options: [], type: "select" } },
    { size: { default: "sm", options: ["sm", { label: "Small", value: "sm" }], type: "select" } },
    { speed: { default: 1, max: 2, min: 0, stepp: 0.1, type: "number" } },
    { size: { default: "sm", options: [{ label: "Small", vlaue: "sm" }], type: "select" } },
    { speed: { default: 1, max: 0, min: 2, type: "number" } },
    { speed: { default: 5, max: 2, min: 0, type: "number" } },
    { speed: { default: 1, max: 2, min: 0, step: 0, type: "number" } },
    { speed: { default: Number.POSITIVE_INFINITY, max: 2, min: 0, type: "number" } },
    { tint: { default: "red", type: "color" } },
    { tint: { default: "#12345", type: "color" } },
    { flag: { default: "yes", type: "boolean" } },
    { flag: { default: 1, type: "range" } },
    ["not", "a", "record"],
    null,
  ];

  for (const input of rejected) {
    assert.equal(previewControlsSchema.safeParse(input).success, false, JSON.stringify(input));
  }

  const ownProto = Object.fromEntries([["__proto__", { default: false, type: "boolean" }]]);
  assert.deepEqual(previewControlsSchema.safeParse(ownProto).data, {});

  assert.equal(
    previewControlsSchema.safeParse({ tint: { default: "#AbC", type: "color" } }).success,
    true,
  );
});

test("groups are all-or-none and declared as contiguous runs", () => {
  const hue = { default: 0, group: "Color", max: 360, min: 0, type: "number" } as const;
  const tint = { default: "#fff", group: "Color", type: "color" } as const;
  const loop = { default: true, group: "Motion", type: "boolean" } as const;

  assert.equal(previewControlsSchema.safeParse({ hue, loop, tint }).success, false);
  assert.equal(
    previewControlsSchema.safeParse({ hue, plain: { default: false, type: "boolean" } }).success,
    false,
  );
  assert.equal(
    previewControlsSchema.safeParse({ hue, tint: { ...tint, group: "" } }).success,
    false,
  );
  assert.equal(
    previewControlsSchema.safeParse({ hue, loop, tint: { ...tint, group: "Motion" } }).success,
    true,
  );
  assert.equal(previewControlsSchema.safeParse({ hue, tint, loop }).success, true);
});

test("defaults seed one value per control", () => {
  assert.deepEqual(defaultControlValues(orbControls), {
    background: "#0a0a0a",
    caption: "",
    grain: false,
    hue: 0,
    quality: "high",
    rotationSpeed: 0.3,
  });
});

test("merging accepts valid values, clamps numbers and ignores the rest", () => {
  const current = { ...defaultControlValues(orbControls), caption: "kept" };

  assert.deepEqual(
    mergeControlValues(orbControls, current, {
      background: "#ff0000",
      grain: true,
      hue: 720,
      quality: "low",
      rotationSpeed: -1,
      unknown: "dropped",
    }),
    {
      background: "#ff0000",
      caption: "kept",
      grain: true,
      hue: 360,
      quality: "low",
      rotationSpeed: 0,
    },
  );

  assert.deepEqual(
    mergeControlValues(orbControls, current, {
      background: "red",
      grain: "true",
      hue: "90",
      quality: "medium",
      rotationSpeed: Number.NaN,
    }),
    current,
  );
});

test("merging restores a control missing from the current values", () => {
  assert.deepEqual(mergeControlValues(orbControls, {}, { hue: 12 }), {
    ...defaultControlValues(orbControls),
    hue: 12,
  });
});

test("merging never reads a value inherited from Object.prototype", () => {
  const inheritedText = { toString: { default: "plain", type: "text" } } as const;

  assert.deepEqual(mergeControlValues(inheritedText, {}, {}), { toString: "plain" });
});
