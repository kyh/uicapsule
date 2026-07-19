"use client";

import type { ItemSlot, Look, LowerForm, ShoeForm, TopForm } from "./lookbook-data";

/**
 * Every card in the lookbook is this component: a hand-drawn figure assembled
 * from a small set of parameterised silhouettes and the look's own palette.
 *
 * It draws into a fixed 200x300 user-space box. The card renders the whole box;
 * the detail panel renders a crop of it (`CROPS`), so paging through a look's
 * three pieces is literally a camera move inside the same drawing.
 */

const VIEW_W = 200;
const VIEW_H = 300;
const CX = VIEW_W / 2;

const HEAD_CY = 30;
const HEAD_RX = 15;
const HEAD_RY = 17;
const NECK_TOP = 42;
const SHOULDER_Y = 56;
const NECK_HALF = 11;
const ANKLE_Y = 248;

/**
 * Slot -> the region of the drawing that piece occupies.
 *
 * `top` is not here: garment lengths differ by 48 user units between a shirt
 * and a coat, so a fixed box either crops the coat's hem off or floats the
 * shirt in dead space. It is derived per-garment by `topCrop` instead.
 */
const CROPS = {
  lower: "38 118 124 148",
  shoes: "50 216 100 50",
} as const satisfies Record<Exclude<ItemSlot, "top">, string>;

const TOP_CROP_X = 26;
const TOP_CROP_Y = 4;
const TOP_CROP_W = 148;

/** Head down to whichever falls lower: the hem or the hands, plus a margin. */
function topCrop(spec: TopSpec): string {
  const handsY = spec.sleeveEndY + 11;
  const bottom = Math.max(spec.hemY, handsY) + 6;
  return `${TOP_CROP_X} ${TOP_CROP_Y} ${TOP_CROP_W} ${bottom - TOP_CROP_Y}`;
}

const FULL_VIEW_BOX = `0 0 ${VIEW_W} ${VIEW_H}`;

type CollarKind = "notch" | "band" | "open" | "crew";

interface TopSpec {
  hemY: number;
  shoulderHalf: number;
  waistHalf: number;
  hemHalf: number;
  sleeveW: number;
  sleeveEndY: number;
  collar: CollarKind;
}

const TOP_SPECS = {
  coat: {
    hemY: 198,
    shoulderHalf: 39,
    waistHalf: 36,
    hemHalf: 38,
    sleeveW: 18,
    sleeveEndY: 178,
    collar: "notch",
  },
  blazer: {
    hemY: 160,
    shoulderHalf: 36,
    waistHalf: 30,
    hemHalf: 33,
    sleeveW: 16,
    sleeveEndY: 154,
    collar: "notch",
  },
  jacket: {
    hemY: 152,
    shoulderHalf: 37,
    waistHalf: 33,
    hemHalf: 34,
    sleeveW: 17,
    sleeveEndY: 148,
    collar: "band",
  },
  shirt: {
    hemY: 150,
    shoulderHalf: 33,
    waistHalf: 29,
    hemHalf: 31,
    sleeveW: 14,
    sleeveEndY: 142,
    collar: "open",
  },
  knit: {
    hemY: 154,
    shoulderHalf: 37,
    waistHalf: 34,
    hemHalf: 35,
    sleeveW: 19,
    sleeveEndY: 152,
    collar: "crew",
  },
} as const satisfies Record<TopForm, TopSpec>;

type LowerSpec =
  | { kind: "legs"; hipY: number; legW: number; hipDx: number; ankleDx: number }
  | { kind: "skirt"; hipY: number; hemY: number; hemHalf: number };

const LOWER_SPECS = {
  trouser: { kind: "legs", hipY: 138, legW: 20, hipDx: 11, ankleDx: 13 },
  wide: { kind: "legs", hipY: 136, legW: 30, hipDx: 13, ankleDx: 19 },
  skirt: { kind: "skirt", hipY: 138, hemY: 206, hemHalf: 44 },
} as const satisfies Record<LowerForm, LowerSpec>;

interface ShoeSpec {
  rise: number;
  len: number;
  post: boolean;
}

const SHOE_SPECS = {
  boot: { rise: 26, len: 25, post: false },
  sneaker: { rise: 13, len: 28, post: false },
  loafer: { rise: 10, len: 27, post: false },
  heel: { rise: 12, len: 23, post: true },
} as const satisfies Record<ShoeForm, ShoeSpec>;

const SHADE = "rgba(0,0,0,0.13)";
const SHADE_SOFT = "rgba(0,0,0,0.07)";
const LINING = "rgba(255,255,255,0.6)";

/**
 * A skirt hides the hips, so its bare legs get a fixed splay instead of one
 * from `LOWER_SPECS`. `Shoes` has to splay by the SAME amount or the shoes
 * detach from the ankles they are drawn onto.
 */
const SKIRT_ANKLE_DX = 11;

/** Ankle x positions, splayed asymmetrically by the look's stance. */
function ankleXs(ankleDx: number, stance: number): { left: number; right: number } {
  return {
    left: CX - ankleDx * (1 + stance * 0.35),
    right: CX + ankleDx * (1 - stance * 0.35),
  };
}

function torsoPath(spec: TopSpec): string {
  const { shoulderHalf: sh, waistHalf: wh, hemHalf: hh, hemY } = spec;
  return [
    `M ${CX - NECK_HALF} 48`,
    `L ${CX - sh} ${SHOULDER_Y}`,
    `C ${CX - sh + 1} ${SHOULDER_Y + 34} ${CX - wh - 2} ${hemY - 40} ${CX - hh} ${hemY}`,
    `L ${CX + hh} ${hemY}`,
    `C ${CX + wh + 2} ${hemY - 40} ${CX + sh - 1} ${SHOULDER_Y + 34} ${CX + sh} ${SHOULDER_Y}`,
    `L ${CX + NECK_HALF} 48`,
    "Z",
  ].join(" ");
}

function sleevePath(spec: TopSpec, dir: -1 | 1): string {
  const sx = CX + dir * (spec.shoulderHalf - 4);
  const bulge = CX + dir * (spec.shoulderHalf + 1);
  const ex = CX + dir * (spec.shoulderHalf + 2);
  return [
    `M ${sx} ${SHOULDER_Y + 6}`,
    `C ${bulge} ${SHOULDER_Y + 34} ${bulge + dir * 1} ${SHOULDER_Y + 64} ${ex} ${spec.sleeveEndY}`,
  ].join(" ");
}

function shoePath(x: number, dir: -1 | 1, spec: ShoeSpec): string {
  const top = ANKLE_Y - spec.rise;
  const bot = ANKLE_Y + (spec.post ? 2 : 8);
  const heelX = x - dir * 8;
  const toeX = x + dir * (spec.len - 8);
  return [
    `M ${heelX} ${top}`,
    `L ${x + dir * 7} ${top}`,
    `L ${x + dir * 7} ${bot - 7}`,
    `L ${toeX} ${bot - 6}`,
    `Q ${toeX + dir * 3} ${bot} ${toeX - dir * 2} ${bot}`,
    `L ${heelX} ${bot}`,
    "Z",
  ].join(" ");
}

function heelPostPath(x: number, dir: -1 | 1): string {
  const heelX = x - dir * 8;
  return [
    `M ${heelX} ${ANKLE_Y - 2}`,
    `L ${heelX + dir * 1} ${ANKLE_Y + 10}`,
    `L ${heelX + dir * 4.5} ${ANKLE_Y + 10}`,
    `L ${heelX + dir * 5} ${ANKLE_Y - 2}`,
    "Z",
  ].join(" ");
}

function Collar({ kind }: { kind: CollarKind }) {
  if (kind === "crew") {
    return (
      <path
        d={`M ${CX - NECK_HALF - 2} 49 Q ${CX} 62 ${CX + NECK_HALF + 2} 49`}
        fill="none"
        stroke={SHADE}
        strokeWidth={4}
        strokeLinecap="round"
      />
    );
  }
  if (kind === "band") {
    return (
      <path
        d={`M ${CX - NECK_HALF - 1} 47 L ${CX + NECK_HALF + 1} 47 L ${CX + NECK_HALF + 1} 54 L ${CX - NECK_HALF - 1} 54 Z`}
        fill={SHADE}
      />
    );
  }
  const depth = kind === "notch" ? 84 : 72;
  return (
    <>
      <path d={`M ${CX - NECK_HALF} 48 L ${CX} ${depth} L ${CX + NECK_HALF} 48 Z`} fill={LINING} />
      <path
        d={`M ${CX - NECK_HALF} 48 L ${CX} ${depth}`}
        fill="none"
        stroke={SHADE}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d={`M ${CX + NECK_HALF} 48 L ${CX} ${depth}`}
        fill="none"
        stroke={SHADE}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </>
  );
}

function Lower({ look }: { look: Look }) {
  const spec = LOWER_SPECS[look.forms.lower];
  const { palette, stance } = look;

  if (spec.kind === "skirt") {
    const legs = ankleXs(SKIRT_ANKLE_DX, stance);
    return (
      <>
        <path
          d={`M ${CX - 8} ${spec.hipY} L ${legs.left} ${ANKLE_Y}`}
          fill="none"
          stroke={palette.skin}
          strokeWidth={15}
          strokeLinecap="round"
        />
        <path
          d={`M ${CX + 8} ${spec.hipY} L ${legs.right} ${ANKLE_Y}`}
          fill="none"
          stroke={palette.skin}
          strokeWidth={15}
          strokeLinecap="round"
        />
        <path
          d={[
            `M ${CX - 25} ${spec.hipY}`,
            `L ${CX + 25} ${spec.hipY}`,
            `L ${CX + spec.hemHalf} ${spec.hemY}`,
            `Q ${CX} ${spec.hemY + 9} ${CX - spec.hemHalf} ${spec.hemY}`,
            "Z",
          ].join(" ")}
          fill={palette.lower}
        />
        <path
          d={`M ${CX + 6} ${spec.hipY} L ${CX + spec.hemHalf - 4} ${spec.hemY + 2}`}
          fill="none"
          stroke={SHADE_SOFT}
          strokeWidth={10}
          strokeLinecap="round"
        />
      </>
    );
  }

  const ankles = ankleXs(spec.ankleDx, stance);
  return (
    <>
      <path
        d={`M ${CX - spec.hipDx} ${spec.hipY} L ${ankles.left} ${ANKLE_Y}`}
        fill="none"
        stroke={palette.lower}
        strokeWidth={spec.legW}
        strokeLinecap="round"
      />
      <path
        d={`M ${CX + spec.hipDx} ${spec.hipY} L ${ankles.right} ${ANKLE_Y}`}
        fill="none"
        stroke={palette.lower}
        strokeWidth={spec.legW}
        strokeLinecap="round"
      />
      <path
        d={`M ${CX + spec.hipDx + 3} ${spec.hipY} L ${ankles.right + 3} ${ANKLE_Y}`}
        fill="none"
        stroke={SHADE_SOFT}
        strokeWidth={spec.legW * 0.4}
        strokeLinecap="round"
      />
      <path
        d={`M ${CX - spec.hipDx - 4} ${spec.hipY - 2} L ${CX + spec.hipDx + 4} ${spec.hipY - 2}`}
        fill="none"
        stroke={palette.lower}
        strokeWidth={spec.legW}
        strokeLinecap="round"
      />
    </>
  );
}

function Shoes({ look }: { look: Look }) {
  const spec = SHOE_SPECS[look.forms.shoes];
  const lower = LOWER_SPECS[look.forms.lower];
  const ankleDx = lower.kind === "skirt" ? SKIRT_ANKLE_DX : lower.ankleDx;
  const { left, right } = ankleXs(ankleDx, look.stance);
  return (
    <>
      <path d={shoePath(left, -1, spec)} fill={look.palette.shoes} />
      <path d={shoePath(right, 1, spec)} fill={look.palette.shoes} />
      {spec.post ? (
        <>
          <path d={heelPostPath(left, -1)} fill={look.palette.shoes} />
          <path d={heelPostPath(right, 1)} fill={look.palette.shoes} />
        </>
      ) : null}
      <path
        d={`M ${right + 2} ${ANKLE_Y - spec.rise + 2} L ${right + 2} ${ANKLE_Y + 1}`}
        fill="none"
        stroke={SHADE_SOFT}
        strokeWidth={6}
        strokeLinecap="round"
      />
    </>
  );
}

export interface LookFigureProps {
  look: Look;
  /** Omit for the whole figure; pass a slot to crop to that piece. */
  crop?: ItemSlot;
  /** "meet" fits the crop inside the box, "slice" fills it. */
  fit?: "meet" | "slice";
  className?: string;
}

export function LookFigure({ look, crop, fit = "meet", className }: LookFigureProps) {
  const spec = TOP_SPECS[look.forms.top];
  const { palette } = look;
  const viewBox = crop === undefined ? FULL_VIEW_BOX : crop === "top" ? topCrop(spec) : CROPS[crop];

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio={`xMidYMid ${fit}`}
      className={className}
      aria-hidden
      focusable="false"
    >
      {/* Ground contact — two stacked ellipses stand in for a blur so 72 of
          these never touch an SVG filter. */}
      <ellipse cx={CX} cy={ANKLE_Y + 14} rx={44} ry={5} fill="rgba(0,0,0,0.05)" />
      <ellipse cx={CX} cy={ANKLE_Y + 13} rx={28} ry={3.5} fill="rgba(0,0,0,0.07)" />

      {/* Head, hair, neck */}
      <rect x={CX - 8} y={NECK_TOP} width={16} height={18} rx={6} fill={palette.skin} />
      <ellipse cx={CX} cy={HEAD_CY} rx={HEAD_RX} ry={HEAD_RY} fill={palette.skin} />
      <path
        d={[
          `M ${CX - HEAD_RX - 1} ${HEAD_CY + 2}`,
          `Q ${CX - HEAD_RX - 1} ${HEAD_CY - HEAD_RY - 4} ${CX} ${HEAD_CY - HEAD_RY - 3}`,
          `Q ${CX + HEAD_RX + 1} ${HEAD_CY - HEAD_RY - 4} ${CX + HEAD_RX + 1} ${HEAD_CY + 2}`,
          `L ${CX + HEAD_RX - 2} ${HEAD_CY - 4}`,
          `Q ${CX} ${HEAD_CY - 12} ${CX - HEAD_RX + 2} ${HEAD_CY - 3}`,
          "Z",
        ].join(" ")}
        fill={palette.hair}
      />

      <Lower look={look} />
      <Shoes look={look} />

      {/* Top — drawn after the legs so hems overlap correctly */}
      <path d={torsoPath(spec)} fill={palette.top} />
      <path
        d={[
          `M ${CX + 4} 50`,
          `L ${CX + spec.shoulderHalf} ${SHOULDER_Y}`,
          `C ${CX + spec.waistHalf + 2} ${spec.hemY - 40} ${CX + spec.hemHalf} ${spec.hemY - 10} ${CX + spec.hemHalf} ${spec.hemY}`,
          `L ${CX + 4} ${spec.hemY}`,
          "Z",
        ].join(" ")}
        fill={SHADE_SOFT}
      />
      <path
        d={`M ${CX} 60 L ${CX} ${spec.hemY - 3}`}
        fill="none"
        stroke={SHADE}
        strokeWidth={1.8}
      />
      <Collar kind={spec.collar} />

      {/* Sleeves + hands */}
      <path
        d={sleevePath(spec, -1)}
        fill="none"
        stroke={palette.top}
        strokeWidth={spec.sleeveW}
        strokeLinecap="round"
      />
      <path
        d={sleevePath(spec, 1)}
        fill="none"
        stroke={palette.top}
        strokeWidth={spec.sleeveW}
        strokeLinecap="round"
      />
      <circle cx={CX - spec.shoulderHalf - 4} cy={spec.sleeveEndY + 6} r={5} fill={palette.skin} />
      <circle cx={CX + spec.shoulderHalf + 4} cy={spec.sleeveEndY + 6} r={5} fill={palette.skin} />
    </svg>
  );
}
