"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three/webgpu";
import {
  Fn,
  If,
  Break,
  Loop,
  uniform,
  uv,
  float,
  vec2,
  vec3,
  mix,
  clamp,
  smoothstep,
  length,
  normalize,
  dot,
  pow,
  exp,
  abs,
  min,
  max,
  sin,
  sqrt,
} from "three/tsl";

import type { Mat3, PlantHit, PlantPart, RigFrame, Vec3 } from "./chibi-rig";
import {
  BLEND_HI,
  BLEND_LO,
  PINCH_E1,
  PINCH_E2,
  POT_H,
  POT_R,
  PlantRig,
  SOIL_Y,
  gazeMatrix,
} from "./chibi-rig";

/**
 * Chibi plants raymarched from signed distance fields — the same technique as
 * tobis.vision's "critters": every part (pot, body, leaves, arms) is an SDF
 * primitive smooth-blended into one continuous soft-vinyl surface, rendered
 * with three.js TSL on the WebGPU renderer (transparent WebGL2 fallback).
 * The face is painted in the shader; the whole plant turns toward your cursor,
 * its eyes lead the head, it blinks, and switching characters morphs the
 * surface rather than swapping models.
 *
 * It is also a soft toy you can handle: a small position-based soft body
 * (`chibi-rig.ts`) carries a rigid pot, a squishy body and springy leaves, and
 * the shader evaluates the SDF through the transforms fitted to it. Pinch and
 * pull the body, drag it by the pot, lift it by a leaf, toss it, tap it.
 */

export const CHIBI_VARIANTS = ["pip", "momo", "fifi", "kiki"] as const;
export type ChibiVariant = (typeof CHIBI_VARIANTS)[number];

export interface ChibiPlantsProps {
  /** Which plant character to show. Switching morphs the SDF surface. @default "pip" */
  variant?: ChibiVariant;
  /** Override the pot color (CSS hex). Defaults to the variant's palette. */
  potColor?: string;
  /** Override the body color (CSS hex). Defaults to the variant's palette. */
  bodyColor?: string;
  /** Override the leaf/sprout color (CSS hex). Defaults to the variant's palette. */
  leafColor?: string;
  /** Blush color. @default "#e8798f" */
  cheekColor?: string;
  /** Background radial-gradient stops [inner, outer]. @default ["#2e2a33", "#0b0a0e"] */
  background?: [string, string];
  /** Eye size multiplier. @default 1 */
  eyeScale?: number;
  /** How strongly the head + eyes follow the cursor, 0–1.5. @default 1 */
  gaze?: number;
  /** Idle sway/breathing amount, 0–2. @default 1 */
  wobble?: number;
  /** Idle animation speed multiplier. @default 1 */
  speed?: number;
  /** Grab, pull, toss and tap the plant. @default true */
  interactive?: boolean;
  /** How firm the body is, 0 (mochi) – 1 (vinyl). @default 0.5 */
  firmness?: number;
  /** Raymarch step count (read once at mount). Lower on weak GPUs. @default 96 */
  raySteps?: number;
  className?: string;
}

/** Morphable SDF + face parameters. Every key is spring-lerped, so any two
 * variants (or user tweaks) blend as one continuous surface deformation.
 * The key list is the single source of truth: PlantParams derives from it. */
const PARAM_KEYS = [
  "bodyR",
  "squash",
  "stemH",
  "l0s",
  "l0yaw",
  "l0tilt",
  "l0len",
  "l0wid",
  "l1s",
  "l1yaw",
  "l1tilt",
  "l1len",
  "l1wid",
  "l2s",
  "l2yaw",
  "l2tilt",
  "l2len",
  "l2wid",
  "armS",
  "eyeR",
  "eyeSep",
  "eyeY",
  "mouthW",
  "cheek",
] as const;
type PlantParams = Record<(typeof PARAM_KEYS)[number], number>;

interface Palette {
  body: string;
  leaf: string;
  pot: string;
}
interface VariantDef {
  label: string;
  params: PlantParams;
  palette: Palette;
}

export const VARIANTS = {
  fifi: {
    label: "Fifi",
    palette: { body: "#7cc487", leaf: "#4e9e63", pot: "#e8e3da" },
    params: {
      armS: 0.001,
      bodyR: 0.34,
      cheek: 0.55,
      eyeR: 0.15,
      eyeSep: 0.33,
      eyeY: 0.22,
      l0len: 0.24,
      l0s: 1,
      l0tilt: 0.85,
      l0wid: 0.12,
      l0yaw: 0,
      l1len: 0.22,
      l1s: 1,
      l1tilt: 1.1,
      l1wid: 0.11,
      l1yaw: 2.1,
      l2len: 0.22,
      l2s: 1,
      l2tilt: 1.1,
      l2wid: 0.11,
      l2yaw: -2.1,
      mouthW: 1,
      squash: 1.12,
      stemH: 0.12,
    },
  },
  kiki: {
    label: "Kiki",
    palette: { body: "#7fae72", leaf: "#f193b4", pot: "#e2986a" },
    params: {
      armS: 1,
      bodyR: 0.32,
      cheek: 0.7,
      eyeR: 0.17,
      eyeSep: 0.27,
      eyeY: 0.12,
      l0len: 0.12,
      l0s: 0.7,
      l0tilt: 0.15,
      l0wid: 0.08,
      l0yaw: 0,
      l1len: 0.1,
      l1s: 0.001,
      l1tilt: 0.9,
      l1wid: 0.07,
      l1yaw: -1.57,
      l2len: 0.1,
      l2s: 0.001,
      l2tilt: 0.9,
      l2wid: 0.07,
      l2yaw: 1.57,
      mouthW: 0.7,
      squash: 1.5,
      stemH: 0.03,
    },
  },
  momo: {
    label: "Momo",
    palette: { body: "#f2a7bb", leaf: "#7cbf80", pot: "#ead9c8" },
    params: {
      armS: 0.001,
      bodyR: 0.43,
      cheek: 1,
      eyeR: 0.185,
      eyeSep: 0.3,
      eyeY: 0.02,
      l0len: 0.15,
      l0s: 0.85,
      l0tilt: 0.55,
      l0wid: 0.09,
      l0yaw: 0.3,
      l1len: 0.12,
      l1s: 0.001,
      l1tilt: 0.9,
      l1wid: 0.08,
      l1yaw: -1.57,
      l2len: 0.12,
      l2s: 0.001,
      l2tilt: 0.9,
      l2wid: 0.08,
      l2yaw: 1.57,
      mouthW: 0.55,
      squash: 0.78,
      stemH: 0.04,
    },
  },
  pip: {
    label: "Pip",
    palette: { body: "#9fd6a3", leaf: "#67b26f", pot: "#d98b71" },
    params: {
      armS: 0.001,
      bodyR: 0.34,
      cheek: 0.8,
      eyeR: 0.155,
      eyeSep: 0.27,
      eyeY: 0.06,
      l0len: 0.17,
      l0s: 1,
      l0tilt: 0.95,
      l0wid: 0.1,
      l0yaw: 1.57,
      l1len: 0.17,
      l1s: 1,
      l1tilt: 0.95,
      l1wid: 0.1,
      l1yaw: -1.57,
      l2len: 0.12,
      l2s: 0.001,
      l2tilt: 0.5,
      l2wid: 0.08,
      l2yaw: 0,
      mouthW: 0.8,
      squash: 0.96,
      stemH: 0.3,
    },
  },
} satisfies Record<ChibiVariant, VariantDef>;

const DEFAULT_BG: [string, string] = ["#2e2a33", "#0b0a0e"];

// Camera: a fixed pinhole looking slightly down at the plant.
const RO = new THREE.Vector3(0, 0.62, 2.35);
const TA = new THREE.Vector3(0, 0.52, 0);
const FW = TA.clone().sub(RO).normalize();
const RI = FW.clone()
  .cross(new THREE.Vector3(0, 1, 0))
  .normalize();
const UP = RI.clone().cross(FW);
const FOV_S = 0.36;
/**
 * Narrow (portrait) viewports widen the field of view until this much of the table is visible
 * either side of the plant, so it fits a phone instead of spilling off both edges.
 */
const FIT_HALF_WIDTH = 0.58;
const fovFor = (aspect: number) => Math.max(FOV_S, FIT_HALF_WIDTH / (RO.z * aspect));
/** A tap shorter and stiller than this is a boop, not a grab. */
const TAP_MS = 280;
const TAP_PX = 6;

const posePlant = (p: PlantParams, gaze: Mat3) => ({
  armS: p.armS,
  bodyR: p.bodyR,
  gaze,
  leaves: [
    { len: p.l0len, s: p.l0s, tilt: p.l0tilt, wid: p.l0wid, yaw: p.l0yaw },
    { len: p.l1len, s: p.l1s, tilt: p.l1tilt, wid: p.l1wid, yaw: p.l1yaw },
    { len: p.l2len, s: p.l2s, tilt: p.l2tilt, wid: p.l2wid, yaw: p.l2yaw },
  ] as const,
  squash: p.squash,
  stemH: p.stemH,
});

/** The camera ray through a viewport point, as the fragment shader builds it. */
const rayThrough = (ndcX: number, ndcY: number, aspect: number) => {
  const fov = fovFor(aspect);
  const rd = FW.clone()
    .addScaledVector(RI, ndcX * aspect * fov)
    .addScaledVector(UP, ndcY * fov)
    .normalize();
  return { rd: [rd.x, rd.y, rd.z] satisfies Vec3, ro: [RO.x, RO.y, RO.z] satisfies Vec3 };
};

/** Where a world point lands in the viewport, ndc. */
const project = (p: Vec3, aspect: number) => {
  const v = new THREE.Vector3(...p).sub(RO);
  const depth = Math.max(v.dot(FW), 1e-3);
  const fov = fovFor(aspect);
  return [v.dot(RI) / depth / fov / aspect, v.dot(UP) / depth / fov] as const;
};

export const ChibiPlants = ({
  variant = "pip",
  potColor,
  bodyColor,
  leafColor,
  cheekColor = "#e8798f",
  background = DEFAULT_BG,
  eyeScale = 1,
  gaze = 1,
  wobble = 1,
  speed = 1,
  interactive = true,
  firmness = 0.5,
  raySteps = 96,
  className,
}: ChibiPlantsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Live tuning values, read every frame by the render loop.
  const tuningRef = useRef({
    background,
    bodyColor,
    cheekColor,
    eyeScale,
    firmness,
    gaze,
    interactive,
    leafColor,
    potColor,
    speed,
    variant,
    wobble,
  });
  useEffect(() => {
    tuningRef.current = {
      background,
      bodyColor,
      cheekColor,
      eyeScale,
      firmness,
      gaze,
      interactive,
      leafColor,
      potColor,
      speed,
      variant,
      wobble,
    };
  }, [
    variant,
    potColor,
    bodyColor,
    leafColor,
    cheekColor,
    background,
    eyeScale,
    gaze,
    wobble,
    speed,
    interactive,
    firmness,
  ]);
  const stepsRef = useRef(raySteps);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    let disposed = false;
    let raf = 0;

    const renderer = new THREE.WebGPURenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    // The plant is dragged around; the page must not scroll or zoom under the finger.
    renderer.domElement.style.touchAction = "none";

    // Start from the requested variant and colors — the morph springs are for
    // later changes, not the initial mount.
    const initialTuning = tuningRef.current;
    const initialVariant = VARIANTS[initialTuning.variant] ?? VARIANTS.pip;
    const initialParams = {
      ...initialVariant.params,
      eyeR: initialVariant.params.eyeR * initialTuning.eyeScale,
    } satisfies PlantParams;
    const initialBody = initialTuning.bodyColor ?? initialVariant.palette.body;
    const initialLeaf = initialTuning.leafColor ?? initialVariant.palette.leaf;
    const initialPot = initialTuning.potColor ?? initialVariant.palette.pot;

    // ---- physics -------------------------------------------------------------
    const rig = new PlantRig(posePlant(initialParams, gazeMatrix(0, 0)));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame: RigFrame = rig.frame();

    // ---- uniforms ----------------------------------------------------------
    const uTime = uniform(0);
    const uLook = uniform(new THREE.Vector2(0, 0));
    const uBlink = uniform(0);
    const uExcite = uniform(0);
    const uSquint = uniform(0);
    const uGaze = uniform(1);
    const uWobble = uniform(1);
    const uRes = uniform(new THREE.Vector2(1, 1));
    const uFov = uniform(FOV_S);
    const uBg1 = uniform(new THREE.Color(initialTuning.background[0]));
    const uBg2 = uniform(new THREE.Color(initialTuning.background[1]));
    const uBodyC = uniform(new THREE.Color(initialBody));
    const uLeafC = uniform(new THREE.Color(initialLeaf));
    const uPotC = uniform(new THREE.Color(initialPot));
    const uCheekC = uniform(new THREE.Color(initialTuning.cheekColor));

    // Rig transforms (see RigFrame): world → plant space via the pot, world →
    // design space via the body, plus the stem, leaves and pinch.
    const uPotM = uniform(new THREE.Matrix3());
    const uPotK = uniform(new THREE.Vector3());
    const uBodyM = uniform(new THREE.Matrix3());
    const uBodyK = uniform(new THREE.Vector3());
    const uStemTip = uniform(new THREE.Vector3());
    const uLeafBase = uniform(new THREE.Vector3());
    const uLeafM = [
      uniform(new THREE.Matrix3()),
      uniform(new THREE.Matrix3()),
      uniform(new THREE.Matrix3()),
    ] as const;
    const uPinchC = uniform(new THREE.Vector3());
    const uPinchD = uniform(new THREE.Vector3());
    const uPinchOn = uniform(0);
    const uPinchL = uniform(0);
    const uWarp = uniform(1);
    const uGap = uniform(0);
    const uBound = uniform(new THREE.Vector4(0, 0.58, 0, 1.32));
    const uShadow = uniform(new THREE.Vector4(0, 0, 1, 1));

    const uParams = {
      armS: uniform(initialParams.armS),
      bodyR: uniform(initialParams.bodyR),
      cheek: uniform(initialParams.cheek),
      eyeR: uniform(initialParams.eyeR),
      eyeSep: uniform(initialParams.eyeSep),
      eyeY: uniform(initialParams.eyeY),
      l0len: uniform(initialParams.l0len),
      l0s: uniform(initialParams.l0s),
      l0tilt: uniform(initialParams.l0tilt),
      l0wid: uniform(initialParams.l0wid),
      l0yaw: uniform(initialParams.l0yaw),
      l1len: uniform(initialParams.l1len),
      l1s: uniform(initialParams.l1s),
      l1tilt: uniform(initialParams.l1tilt),
      l1wid: uniform(initialParams.l1wid),
      l1yaw: uniform(initialParams.l1yaw),
      l2len: uniform(initialParams.l2len),
      l2s: uniform(initialParams.l2s),
      l2tilt: uniform(initialParams.l2tilt),
      l2wid: uniform(initialParams.l2wid),
      l2yaw: uniform(initialParams.l2yaw),
      mouthW: uniform(initialParams.mouthW),
      squash: uniform(initialParams.squash),
      stemH: uniform(initialParams.stemH),
    };

    const upload = (f: RigFrame) => {
      uPotM.value.set(...f.potM);
      uPotK.value.set(...f.potK);
      uBodyM.value.set(...f.bodyM);
      uBodyK.value.set(...f.bodyK);
      uStemTip.value.set(...f.stemTip);
      uLeafBase.value.set(...f.leafBase);
      uLeafM[0].value.set(...f.leafM[0]);
      uLeafM[1].value.set(...f.leafM[1]);
      uLeafM[2].value.set(...f.leafM[2]);
      uPinchC.value.set(...f.pinchC);
      uPinchD.value.set(...f.pinchD);
      uPinchOn.value = Math.hypot(...f.pinchD) > 1e-4 ? 1 : 0;
      uPinchL.value = (1.3 * Math.hypot(...f.pinchD)) / PINCH_E1;
      uWarp.value = f.warp;
      uGap.value = f.gap;
      uBound.value.set(...f.bound);
      const [sx, sz, lift] = f.shadow;
      uShadow.value.set(sx, sz, 1 / (1 + lift * 5), 1 + lift * 1.4);
    };
    upload(frame);

    // ---- TSL node helpers --------------------------------------------------
    type Scalar = THREE.Node<"float">;
    type Point = THREE.Node<"vec3">;
    const smin = (a: Scalar, b: Scalar, k: number) => {
      const h = clamp(
        b
          .sub(a)
          .mul(0.5 / k)
          .add(0.5),
        0,
        1,
      );
      return mix(b, a, h).sub(h.mul(h.oneMinus()).mul(k));
    };
    const sdEllipsoid = (p: Point, r: Point) => {
      const k0 = length(p.div(r));
      const k1 = length(p.div(r.mul(r)));
      return k0.mul(k0.sub(1)).div(k1.add(1e-6));
    };
    const sdVCapsule = (p: Point, h: Scalar, r: Scalar) =>
      length(vec3(p.x, p.y.sub(clamp(p.y, 0, h)), p.z)).sub(r);
    const sdCapsule = (p: Point, a: Point, b: Point, r: number) => {
      const pa = p.sub(a).toVar();
      const ba = b.sub(a).toVar();
      const h = clamp(dot(pa, ba).div(max(dot(ba, ba), 1e-8)), 0, 1);
      return length(pa.sub(ba.mul(h))).sub(r);
    };

    // Breathing + idle sway, all driven by uTime so the plant is alive at rest.
    const breathe = () => sin(uTime.mul(2.1)).mul(uWobble).toVar();

    // The pinch: a bi-scale regularised Kelvinlet (de Goes & James 2017),
    // normalised so the grabbed spot moves by exactly uPinchD. Incompressible,
    // so pulling a cheek out draws the flesh around it in.
    const kelvinlet = (r: Point, eps: number) => {
      const re2 = dot(r, r)
        .add(eps * eps)
        .toVar();
      const re = sqrt(re2).toVar();
      const re3 = re2.mul(re).toVar();
      const a = float(1)
        .div(re)
        .add(float(eps * eps).div(re3));
      return uPinchD.mul(a.mul(0.5)).add(r.mul(dot(r, uPinchD).div(re3).mul(0.5)));
    };
    const pinch = (x: Point) => {
      const r = x.sub(uPinchC).toVar();
      return kelvinlet(r, PINCH_E1)
        .sub(kelvinlet(r, PINCH_E2))
        .mul(1 / (1 / PINCH_E1 - 1 / PINCH_E2));
    };

    // World → design space. Below the rim the body rides with the pot, above
    // it with the soft body; the pinch is undone last (first-order inverse).
    // `k` scales design-space distances back to a safe world-space step: the
    // body frame's stretch, the shear across the rim band where the two frames
    // disagree, and the pinch — the last two only where they actually are.
    const bodyCenterY = () => uParams.bodyR.mul(uParams.squash).mul(0.55).add(POT_H).toVar();
    const toDesign = (p: Point) => {
      const xp = uPotM.mul(p).add(uPotK).toVar();
      const xb = uBodyM.mul(p).add(uBodyK);
      const t = clamp(xp.y.sub(BLEND_LO).div(BLEND_HI - BLEND_LO), 0, 1).toVar();
      const x = mix(xp, xb, t.mul(t).mul(t.mul(-2).add(3))).toVar();
      const stretch = t
        .mul(t.oneMinus())
        .mul(uGap.mul(6 / (BLEND_HI - BLEND_LO)))
        .add(1)
        .mul(uWarp)
        .toVar();
      If(uPinchOn.greaterThan(0.5), () => {
        const r = x.sub(uPinchC);
        const e2 = PINCH_E1 * PINCH_E1;
        stretch.mulAssign(uPinchL.mul(float(e2).div(dot(r, r).add(e2))).add(1));
        x.subAssign(pinch(x));
      });
      return { k: float(1).div(stretch).toVar(), q: x.sub(vec3(0, bodyCenterY(), 0)).toVar(), xp };
    };

    // The pot is its own rigid thing: a rounded, tapered tub filled to the soil
    // line, with a lip standing proud of the soil that the plant grows out of.
    const sdPot = (p: Point) => {
      const py = p.y.sub(POT_H * 0.5);
      const ra = float(POT_R).mul(p.y.div(POT_H).sub(0.5).mul(0.3).add(1));
      const dx = length(vec2(p.x, p.z)).sub(ra).add(0.03);
      const dy = abs(py).sub(POT_H * 0.5 - 0.02);
      const d2 = vec2(dx, dy).toVar();
      const tub = max(
        min(max(d2.x, d2.y), 0)
          .add(length(max(d2, vec2(0, 0))))
          .sub(0.03),
        p.y.sub(SOIL_Y),
      );
      const rim = length(vec2(length(vec2(p.x, p.z)).sub(POT_R * 1.1), p.y.sub(POT_H))).sub(0.038);
      return smin(tub, rim, 0.02).toVar();
    };

    // One leaf, given the sample point already in its frame (rest yaw/tilt ×
    // swing, from the rig): an ellipsoid blade.
    const sdLeaf = (lq: Point, s: Scalar, len: Scalar, wid: Scalar) => {
      const ll = len.mul(s).toVar();
      const ww = wid.mul(s).toVar();
      return sdEllipsoid(
        vec3(lq.x, lq.y.sub(ll.mul(0.55).add(0.02)), lq.z),
        vec3(ww, ll.mul(0.6), ww.mul(0.45)),
      );
    };

    // Part distances in body-centred design space; combined by map(),
    // re-queried at the hit point for smooth part-color weights (the "one
    // continuous surface" look). Scaled by k so the warp stays a safe step.
    const plantParts = (q: Point, k: Scalar) => {
      const br = breathe();
      const rB = uParams.bodyR.mul(br.mul(-0.012).add(1)).toVar();
      const sq = uParams.squash.mul(br.mul(0.02).add(1)).toVar();
      const dBody = sdEllipsoid(q, vec3(rB, rB.mul(sq), rB)).toVar();

      const bodyTop = rB.mul(sq).sub(0.03).toVar();
      const dStem = sdCapsule(q, vec3(0, bodyTop, 0), uStemTip, 0.035).toVar();
      const knobR = clamp(uParams.stemH.mul(10), 0, 1).mul(0.05);
      const dKnob = length(q.sub(uStemTip)).sub(knobR);
      const lq = q.sub(uLeafBase).toVar();
      const dL0 = sdLeaf(uLeafM[0].mul(lq), uParams.l0s, uParams.l0len, uParams.l0wid);
      const dL1 = sdLeaf(uLeafM[1].mul(lq), uParams.l1s, uParams.l1len, uParams.l1wid);
      const dL2 = sdLeaf(uLeafM[2].mul(lq), uParams.l2s, uParams.l2len, uParams.l2wid);
      const dGreen = min(min(smin(dStem, dKnob, 0.03), dL0), min(dL1, dL2)).toVar();

      const aq = vec3(abs(q.x), q.y, q.z).toVar();
      const armR = uParams.armS.mul(0.095).toVar();
      const armH = uParams.armS.mul(0.26).toVar();
      const dArm = sdVCapsule(
        vec3(aq.x.sub(rB.mul(0.92)), aq.y.add(rB.mul(sq).mul(0.05)), aq.z),
        armH,
        armR,
      ).toVar();

      return {
        dArm: dArm.mul(k).toVar(),
        dBody: dBody.mul(k).toVar(),
        dGreen: dGreen.mul(k).toVar(),
      };
    };

    // The plant is one continuous soft surface; the pot is a separate solid it
    // is planted in, so the two meet in a hard crease, never a fillet.
    const plantSdf = (dBody: Scalar, dGreen: Scalar, dArm: Scalar) =>
      smin(smin(dBody, dGreen, 0.045), dArm, 0.07);
    const sceneSdf = (p: Point) => {
      const { k, q, xp } = toDesign(p);
      const { dBody, dGreen, dArm } = plantParts(q, k);
      return min(sdPot(xp), plantSdf(dBody, dGreen, dArm)).toVar();
    };

    const mapFn = Fn(([p]: [Point]) => sceneSdf(p));

    const calcNormal = (p: Point) => {
      const h = 0.0045;
      const e1 = vec3(1, -1, -1);
      const e2 = vec3(-1, -1, 1);
      const e3 = vec3(-1, 1, -1);
      const e4 = vec3(1, 1, 1);
      return normalize(
        e1
          .mul(mapFn(p.add(e1.mul(h))))
          .add(e2.mul(mapFn(p.add(e2.mul(h)))))
          .add(e3.mul(mapFn(p.add(e3.mul(h)))))
          .add(e4.mul(mapFn(p.add(e4.mul(h))))),
      ).toVar();
    };

    // ---- fragment ----------------------------------------------------------
    const fragment = Fn(() => {
      const aspect = uRes.x.div(uRes.y);
      const ndc = uv().mul(2).sub(1).toVar();
      const nx = ndc.x.mul(aspect).toVar();
      const ro = vec3(RO.x, RO.y, RO.z);
      const rd = normalize(
        vec3(RI.x, RI.y, RI.z)
          .mul(nx.mul(uFov))
          .add(vec3(UP.x, UP.y, UP.z).mul(ndc.y.mul(uFov)))
          .add(vec3(FW.x, FW.y, FW.z)),
      ).toVar();

      // Background: radial dusk gradient + soft contact shadow on the floor,
      // under the pot, fading and spreading as it is lifted.
      const bgT = smoothstep(0.05, 1.25, length(vec2(nx, ndc.y.mul(1.15).add(0.12))));
      const col = mix(uBg1.rgb, uBg2.rgb, bgT).toVar();
      const tg = ro.y.sub(0.001).div(max(rd.y.negate(), 1e-4)).toVar();
      const gp = ro.add(rd.mul(tg)).toVar();
      const shadowR = length(vec2(gp.x.sub(uShadow.x), gp.z.sub(uShadow.y).mul(1.35))).div(
        uShadow.w,
      );
      const shadow = exp(shadowR.mul(shadowR).mul(-6))
        .mul(0.42)
        .mul(uShadow.z)
        .mul(smoothstep(0, 0.02, rd.y.negate()));
      col.assign(col.mul(shadow.oneMinus()));

      // Bounding-sphere pre-test so empty pixels stay cheap; it follows the plant.
      const oc = ro.sub(uBound.xyz).toVar();
      const bq = dot(oc, rd).toVar();
      const bh = bq
        .mul(bq)
        .sub(dot(oc, oc).sub(uBound.w.mul(uBound.w)))
        .toVar();

      If(bh.greaterThan(0), () => {
        const tStart = max(bq.negate().sub(sqrt(bh)), 0).toVar();
        const tEnd = bq.negate().add(sqrt(bh)).toVar();
        const t = tStart.toVar();
        const hit = float(0).toVar();

        Loop(stepsRef.current, () => {
          const pos = ro.add(rd.mul(t));
          const d = mapFn(pos).toVar();
          If(d.lessThan(0.0013), () => {
            hit.assign(1);
            Break();
          });
          t.addAssign(d.mul(0.85));
          If(t.greaterThan(tEnd), () => {
            Break();
          });
        });

        If(hit.greaterThan(0.5), () => {
          const p = ro.add(rd.mul(t)).toVar();
          const n = calcNormal(p);
          const { k, q, xp } = toDesign(p);
          const { dBody, dGreen, dArm } = plantParts(q, k);
          const dPot = sdPot(xp);

          // Plant parts share soft weights — colors bleed across their smin
          // creases. The pot is a different object: a hard edge, no bleed, and
          // the soil is the top of its fill, inside the lip.
          const wBody = exp(dBody.div(-0.028)).toVar();
          const wGreen = exp(dGreen.div(-0.028)).toVar();
          const wArm = exp(dArm.div(-0.028)).toVar();
          const wSum = wBody.add(wGreen).add(wArm).toVar();
          const plantC = uBodyC.rgb
            .mul(wBody)
            .add(uLeafC.rgb.mul(wGreen))
            .add(uBodyC.rgb.mul(0.92).mul(wArm))
            .div(wSum);
          const onPot = smoothstep(-0.002, 0.002, plantSdf(dBody, dGreen, dArm).sub(dPot)).toVar();
          const onSoil = onPot
            .mul(smoothstep(0.292, 0.275, length(vec2(xp.x, xp.z))))
            .mul(smoothstep(0.014, 0.004, abs(xp.y.sub(SOIL_Y))))
            .toVar();
          const albedo = mix(
            plantC,
            mix(uPotC.rgb, vec3(0.12, 0.08, 0.055), onSoil),
            onPot,
          ).toVar();
          const bodyW = wBody.div(wSum).mul(onPot.oneMinus()).toVar();

          // ---- face, painted on the front of the body ----
          const sq = uParams.squash;
          const nd = normalize(q.div(vec3(1, sq, 1))).toVar();
          const front = smoothstep(0.05, 0.4, nd.z)
            .mul(smoothstep(0.55, 0.75, bodyW))
            .toVar();
          const fu = nd.x.toVar();
          const fv = nd.y.toVar();
          const leadX = uLook.x.mul(0.2).mul(uGaze).toVar();
          const leadY = uLook.y.mul(0.16).mul(uGaze).toVar();

          // A squint first shuts the eyes like a blink, then they scrunch into > <.
          const shut = max(uBlink, smoothstep(0, 0.55, uSquint)).toVar();
          const scrunch = smoothstep(0.45, 0.8, uSquint).toVar();
          const eyeRr = uParams.eyeR
            .mul(uExcite.mul(0.3).add(1))
            .mul(shut.mul(0.3).oneMinus())
            .toVar();
          const blinkK = float(1).div(shut.mul(0.94).oneMinus()).toVar();
          const eyeMask = float(0).toVar();
          const hlMask = float(0).toVar();
          for (const sign of [-1, 1]) {
            const c = vec2(uParams.eyeSep.mul(sign).add(leadX), uParams.eyeY.add(leadY)).toVar();
            const dv = vec2(fu.sub(c.x), fv.sub(c.y).mul(blinkK)).toVar();
            const disc = smoothstep(eyeRr, eyeRr.sub(0.015), length(dv)).mul(scrunch.oneMinus());
            // Squeezed shut: a chevron pointing at the nose, > <.
            const ex = fu.sub(c.x).mul(-sign);
            const ey = abs(fv.sub(c.y));
            const a = uParams.eyeR.mul(0.55);
            const tip = vec2(a, 0);
            const arm = vec2(a.negate(), uParams.eyeR.mul(0.6));
            const pa = vec2(ex, ey).sub(tip).toVar();
            const ba = arm.sub(tip).toVar();
            const hh = clamp(dot(pa, ba).div(dot(ba, ba)), 0, 1);
            const th = uParams.eyeR.mul(0.17);
            const chevron = smoothstep(th, th.sub(0.012), length(pa.sub(ba.mul(hh))));
            eyeMask.assign(max(eyeMask, max(disc, chevron.mul(scrunch))));
            const h1 = vec2(fu.sub(c.x).add(eyeRr.mul(0.3)), fv.sub(c.y).sub(eyeRr.mul(0.34)));
            hlMask.assign(
              max(hlMask, smoothstep(eyeRr.mul(0.3), eyeRr.mul(0.3).sub(0.012), length(h1))),
            );
            const h2 = vec2(fu.sub(c.x).sub(eyeRr.mul(0.28)), fv.sub(c.y).add(eyeRr.mul(0.3)));
            hlMask.assign(
              max(hlMask, smoothstep(eyeRr.mul(0.14), eyeRr.mul(0.14).sub(0.012), length(h2))),
            );
          }
          hlMask.assign(hlMask.mul(eyeMask).mul(shut.oneMinus()));

          const mw = uParams.mouthW.mul(uExcite.mul(0.5).add(1)).mul(0.058).toVar();
          const mdv = vec2(
            fu.sub(leadX.mul(0.6)),
            fv.sub(uParams.eyeY).add(0.14).sub(leadY.mul(0.5)).mul(1.4),
          ).toVar();
          const mouthMask = smoothstep(mw, mw.sub(0.012), length(mdv))
            .mul(eyeMask.oneMinus())
            .toVar();

          const cheekMask = float(0).toVar();
          for (const sign of [-1, 1]) {
            const cc = vec2(
              uParams.eyeSep.add(uParams.eyeR).add(0.09).mul(sign),
              uParams.eyeY.sub(0.1),
            );
            cheekMask.assign(
              max(cheekMask, smoothstep(0.085, 0.02, length(vec2(fu.sub(cc.x), fv.sub(cc.y))))),
            );
          }

          const blush = uParams.cheek.mul(uSquint.mul(0.6).add(1));
          albedo.assign(mix(albedo, uCheekC.rgb, cheekMask.mul(blush).mul(0.5).mul(front)));
          albedo.assign(mix(albedo, vec3(0.16, 0.11, 0.09), eyeMask.mul(front)));
          albedo.assign(mix(albedo, vec3(0.28, 0.13, 0.11), mouthMask.mul(front)));
          albedo.assign(mix(albedo, vec3(0.95, 0.95, 0.97), hlMask.mul(front)));

          // ---- shading: soft vinyl plant, glazed ceramic pot, matte soil ----
          const ld = normalize(vec3(0.55, 0.75, 0.5));
          const dif = clamp(dot(n, ld).mul(0.5).add(0.5), 0, 1).toVar();
          const skyT = n.y.mul(0.5).add(0.5);
          const amb = mix(vec3(0.3, 0.27, 0.33), vec3(0.56, 0.58, 0.67), skyT).toVar();
          const ao1 = clamp(mapFn(p.add(n.mul(0.05))).div(0.05), 0, 1);
          const ao2 = clamp(mapFn(p.add(n.mul(0.16))).div(0.16), 0, 1);
          const ao = ao1.mul(0.55).add(ao2.mul(0.45)).mul(0.7).add(0.3).toVar();
          const lit = albedo.mul(amb.add(dif.mul(vec3(0.98, 0.9, 0.8)).mul(1.05)).mul(ao)).toVar();
          const hv = normalize(ld.sub(rd));
          const gloss = onPot.mul(onSoil.oneMinus()).toVar();
          const spec = pow(clamp(dot(n, hv), 0, 1), mix(50, 140, gloss))
            .mul(mix(0.55, 0.9, gloss))
            .mul(onSoil.oneMinus())
            .mul(ao);
          const fres = pow(clamp(dot(n, rd.negate()), 0, 1).oneMinus(), 3.5)
            .mul(mix(0.3, 0.18, gloss))
            .mul(onSoil.oneMinus());
          lit.assign(
            lit
              .add(vec3(1, 0.98, 0.95).mul(spec))
              .add(mix(uBg1.rgb, vec3(0.6, 0.62, 0.7), 0.5).mul(fres)),
          );

          col.assign(lit);
        });
      });

      return vec3(col);
    });

    const material = new THREE.MeshBasicNodeMaterial();
    material.colorNode = fragment();
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    const scene = new THREE.Scene();
    scene.add(quad);
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // ---- animation state ---------------------------------------------------
    const cur = { ...initialParams };
    const vel = { ...initialParams };
    const target = { ...initialParams };
    for (const key of PARAM_KEYS) {
      vel[key] = 0;
    }
    const curCol = {
      body: new THREE.Color(initialBody),
      leaf: new THREE.Color(initialLeaf),
      pot: new THREE.Color(initialPot),
    };
    const tgtCol = { body: new THREE.Color(), leaf: new THREE.Color(), pot: new THREE.Color() };

    const look = { tx: 0, ty: 0.1, vx: 0, vy: 0, x: 0, y: 0 };
    let lastPointer = -1e4;
    let nextWander = 0;
    let blink = 0;
    let blinkTarget = 0;
    let nextBlink = 1.2;
    let excite = 0;
    let squint = 0;
    let squintHold = 0;
    let elapsed = 0;
    let lastVariant = initialTuning.variant;
    // Pointer in viewport ndc (null until it moves over the window), and the
    // head's own screen position, so the gaze stays aimed at the cursor
    // wherever the plant has been dragged.
    let pointer: readonly [number, number] | null = null;
    let head: readonly [number, number] = [0, 0];

    const aspectNow = () => {
      const rect = container.getBoundingClientRect();
      return rect.width / Math.max(rect.height, 1);
    };
    const ndcOf = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      return [
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -(((e.clientY - rect.top) / rect.height) * 2 - 1),
      ] as const;
    };

    const onPointerMove = (e: PointerEvent) => {
      pointer = ndcOf(e);
      const speedMag = Math.hypot(e.movementX ?? 0, e.movementY ?? 0);
      excite = Math.min(1, excite + speedMag * 0.004);
      lastPointer = elapsed;
    };
    window.addEventListener("pointermove", onPointerMove);

    // ---- handling ----------------------------------------------------------
    interface Hold {
      id: number;
      part: PlantPart;
      /** Where the pointer touched, and the point being dragged (see PlantRig.grab). */
      point: Vec3;
      anchor: Vec3;
      x: number;
      y: number;
      at: number;
      moved: boolean;
    }
    let hold: Hold | null = null;
    let hover = false;

    const pickAt = (ndc: readonly [number, number]): PlantHit | null => {
      const { ro, rd } = rayThrough(ndc[0], ndc[1], aspectNow());
      return rig.pick(ro, rd, frame);
    };
    const setCursor = () => {
      let cursor = "";
      if (hold) {
        cursor = "grabbing";
      } else if (hover) {
        cursor = "grab";
      }
      renderer.domElement.style.cursor = cursor;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!tuningRef.current.interactive || hold || e.button !== 0) {
        return;
      }
      const hit = pickAt(ndcOf(e));
      if (!hit) {
        return;
      }
      e.preventDefault();
      renderer.domElement.setPointerCapture(e.pointerId);
      hold = {
        anchor: rig.grab(hit.part, hit.point),
        at: performance.now(),
        id: e.pointerId,
        moved: false,
        part: hit.part,
        point: hit.point,
        x: e.clientX,
        y: e.clientY,
      };
      setCursor();
    };
    const onCanvasMove = (e: PointerEvent) => {
      if (!hold || e.pointerId !== hold.id) {
        return;
      }
      if (Math.hypot(e.clientX - hold.x, e.clientY - hold.y) > TAP_PX) {
        hold.moved = true;
      }
      // Drag in the plane through the grabbed point, facing the camera.
      const [nx, ny] = ndcOf(e);
      const { ro, rd } = rayThrough(nx, ny, aspectNow());
      const along = new THREE.Vector3(...rd);
      const t = new THREE.Vector3(...hold.anchor).sub(RO).dot(FW) / Math.max(along.dot(FW), 1e-3);
      rig.drag([ro[0] + rd[0] * t, ro[1] + rd[1] * t, ro[2] + rd[2] * t]);
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!hold || e.pointerId !== hold.id) {
        return;
      }
      rig.release();
      if (!hold.moved && performance.now() - hold.at < TAP_MS) {
        const { rd } = rayThrough(...ndcOf(e), aspectNow());
        rig.boop(hold.part, hold.point, rd);
        squintHold = 0.45;
      }
      hold = null;
      setCursor();
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onCanvasMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);
    renderer.domElement.addEventListener("lostpointercapture", onPointerUp);

    const resize = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      renderer.setSize(w, h, false);
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      uRes.value.set(w * dpr, h * dpr);
      // The screen edges are walls: keep the whole pot in view.
      uFov.value = fovFor(w / h);
      rig.halfWidth = Math.max(0.38, RO.z * uFov.value * (w / h) - 0.06);
    };
    const ro2 = new ResizeObserver(resize);
    ro2.observe(container);

    type Tuning = typeof tuningRef.current;

    // Variant + prop overrides drive the morph targets; a new character
    // arrives with a hop.
    const morph = (dt: number, tuning: Tuning) => {
      const v = VARIANTS[tuning.variant] ?? VARIANTS.pip;
      if (tuning.variant !== lastVariant) {
        lastVariant = tuning.variant;
        rig.hop(reducedMotion.matches ? 0 : 2);
      }
      for (const k of PARAM_KEYS) {
        target[k] = v.params[k];
      }
      target.eyeR = v.params.eyeR * tuning.eyeScale;
      tgtCol.body.set(tuning.bodyColor ?? v.palette.body);
      tgtCol.leaf.set(tuning.leafColor ?? v.palette.leaf);
      tgtCol.pot.set(tuning.potColor ?? v.palette.pot);
      uCheekC.value.set(tuning.cheekColor);
      uBg1.value.set(tuning.background[0]);
      uBg2.value.set(tuning.background[1]);

      // Slightly underdamped springs make morphs land with a squishy overshoot.
      const omega = 9;
      const zeta = 0.72;
      for (const k of PARAM_KEYS) {
        const x = cur[k] - target[k];
        const a = -omega * omega * x - 2 * zeta * omega * vel[k];
        vel[k] += a * dt;
        cur[k] += vel[k] * dt;
        uParams[k].value = cur[k];
      }
      const cf = 1 - Math.exp(-dt * 7);
      curCol.body.lerp(tgtCol.body, cf);
      curCol.leaf.lerp(tgtCol.leaf, cf);
      curCol.pot.lerp(tgtCol.pot, cf);
      uBodyC.value.copy(curCol.body);
      uLeafC.value.copy(curCol.leaf);
      uPotC.value.copy(curCol.pot);
    };

    // Gaze: at the cursor relative to the head, else an idle wander.
    const aim = (dt: number) => {
      if (pointer && elapsed - lastPointer <= 2.4) {
        look.tx = THREE.MathUtils.clamp((pointer[0] - head[0]) * 1.1, -1, 1);
        look.ty = THREE.MathUtils.clamp((pointer[1] - head[1]) * 1.1, -1, 1);
      } else if (elapsed > nextWander) {
        look.tx = (Math.random() * 2 - 1) * 0.85;
        look.ty = Math.random() * 0.9 - 0.35;
        nextWander = elapsed + 1.3 + Math.random() * 1.5;
      }
      const lo = 10;
      const lz = 0.85;
      const ax = -lo * lo * (look.x - look.tx) - 2 * lz * lo * look.vx;
      const ay = -lo * lo * (look.y - look.ty) - 2 * lz * lo * look.vy;
      look.vx += ax * dt;
      look.vy += ay * dt;
      look.x += look.vx * dt;
      look.y += look.vy * dt;
      uLook.value.set(look.x, look.y);
    };

    // The head turn (cursor follow + idle sway) is folded into the body's
    // frame on the CPU, so the leaves swing after it.
    const simulate = (dt: number, tuning: Tuning) => {
      const yaw = look.x * -0.55 * tuning.gaze + Math.sin(elapsed * 0.6) * 0.07 * tuning.wobble;
      const pitch =
        look.y * 0.38 * tuning.gaze + Math.sin(elapsed * 0.83 + 1.7) * 0.05 * tuning.wobble;
      rig.firmness = THREE.MathUtils.clamp(tuning.firmness, 0, 1);
      rig.calm = reducedMotion.matches;
      rig.setPose(posePlant(cur, gazeMatrix(yaw, pitch)));
      if (hold && !tuning.interactive) {
        rig.release();
        hold = null;
        setCursor();
      }
      rig.step(dt);
      frame = rig.frame();
      upload(frame);
      head = project(frame.head, aspectNow());
    };

    // Blinks, quick close and softer open with the odd double; wide eyes off
    // the ground; > < when squeezed, booped or landed hard.
    const emote = (dt: number) => {
      if (elapsed > nextBlink && blinkTarget === 0) {
        blinkTarget = 1;
        nextBlink = elapsed + 2 + Math.random() * 3.2 + (Math.random() < 0.18 ? -1.75 : 0);
      }
      blink += (blinkTarget - blink) * Math.min(1, dt * (blinkTarget === 1 ? 26 : 13));
      if (blink > 0.93) {
        blinkTarget = 0;
      }
      uBlink.value = blink;

      const landing = rig.takeLanding();
      if (landing > 0.2) {
        squintHold = Math.max(squintHold, 0.2 + landing * 0.35);
      }
      squintHold = Math.max(0, squintHold - dt);
      const squintTarget = squintHold > 0 || rig.strain > 0.55 ? 1 : 0;
      squint += (squintTarget - squint) * Math.min(1, dt * (squintTarget > squint ? 22 : 9));
      uSquint.value = squint;

      excite = rig.airborne ? 1 : Math.max(0, excite - dt * 1.4);
      uExcite.value = excite;
    };

    const checkHover = (tuning: Tuning) => {
      if (hold || !pointer || !tuning.interactive) {
        return;
      }
      const over = pickAt(pointer) !== null;
      if (over !== hover) {
        hover = over;
        setCursor();
      }
    };

    let prev = performance.now();
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const now = performance.now();
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const tuning = tuningRef.current;
      elapsed += dt * tuning.speed;
      uTime.value = elapsed;
      uGaze.value = tuning.gaze;
      uWobble.value = tuning.wobble;
      morph(dt, tuning);
      aim(dt);
      simulate(dt, tuning);
      emote(dt);
      checkHover(tuning);
      renderer.render(scene, camera);
    };

    container.append(renderer.domElement);
    void (async () => {
      try {
        await renderer.init();
      } catch (error) {
        console.error("chibi-plants: renderer init failed", error);
        return;
      }
      if (disposed) {
        return;
      }
      resize();
      prev = performance.now();
      raf = requestAnimationFrame(tick);
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro2.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onCanvasMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      renderer.domElement.removeEventListener("lostpointercapture", onPointerUp);
      renderer.domElement.remove();
      quad.geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
    // The shader graph is built once; live values flow through uniforms/refs.
  }, []);

  return <div ref={containerRef} className={className ?? "h-full w-full"} />;
};
