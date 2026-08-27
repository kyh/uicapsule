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
  cos,
  sqrt,
} from "three/tsl";

/**
 * Chibi plants raymarched from signed distance fields — the same technique as
 * tobis.vision's "critters": every part (pot, body, leaves, arms) is an SDF
 * primitive smooth-blended into one continuous soft-vinyl surface, rendered
 * with three.js TSL on the WebGPU renderer (transparent WebGL2 fallback).
 * The face is painted in the shader; the whole plant turns toward your cursor,
 * its eyes lead the head, it blinks, and switching characters morphs the
 * surface rather than swapping models.
 */

export const CHIBI_VARIANTS = ["pip", "momo", "fifi", "kiki"] as const;
export type ChibiVariant = (typeof CHIBI_VARIANTS)[number];

export type ChibiPlantsProps = {
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
  /** Raymarch step count (read once at mount). Lower on weak GPUs. @default 80 */
  raySteps?: number;
  className?: string;
};

/** Morphable SDF + face parameters. Every key is spring-lerped, so any two
 * variants (or user tweaks) blend as one continuous surface deformation. */
type PlantParams = {
  bodyR: number;
  squash: number;
  stemH: number;
  l0s: number;
  l0yaw: number;
  l0tilt: number;
  l0len: number;
  l0wid: number;
  l1s: number;
  l1yaw: number;
  l1tilt: number;
  l1len: number;
  l1wid: number;
  l2s: number;
  l2yaw: number;
  l2tilt: number;
  l2len: number;
  l2wid: number;
  armS: number;
  eyeR: number;
  eyeSep: number;
  eyeY: number;
  mouthW: number;
  cheek: number;
};

type Palette = { body: string; leaf: string; pot: string };
type VariantDef = { label: string; params: PlantParams; palette: Palette };

export const VARIANTS = {
  pip: {
    label: "Pip",
    params: {
      bodyR: 0.34,
      squash: 0.96,
      stemH: 0.3,
      l0s: 1,
      l0yaw: 1.57,
      l0tilt: 0.95,
      l0len: 0.17,
      l0wid: 0.1,
      l1s: 1,
      l1yaw: -1.57,
      l1tilt: 0.95,
      l1len: 0.17,
      l1wid: 0.1,
      l2s: 0.001,
      l2yaw: 0,
      l2tilt: 0.5,
      l2len: 0.12,
      l2wid: 0.08,
      armS: 0.001,
      eyeR: 0.155,
      eyeSep: 0.27,
      eyeY: 0.06,
      mouthW: 0.8,
      cheek: 0.8,
    },
    palette: { body: "#9fd6a3", leaf: "#67b26f", pot: "#d98b71" },
  },
  momo: {
    label: "Momo",
    params: {
      bodyR: 0.43,
      squash: 0.78,
      stemH: 0.04,
      l0s: 0.85,
      l0yaw: 0.3,
      l0tilt: 0.55,
      l0len: 0.15,
      l0wid: 0.09,
      l1s: 0.001,
      l1yaw: -1.57,
      l1tilt: 0.9,
      l1len: 0.12,
      l1wid: 0.08,
      l2s: 0.001,
      l2yaw: 1.57,
      l2tilt: 0.9,
      l2len: 0.12,
      l2wid: 0.08,
      armS: 0.001,
      eyeR: 0.185,
      eyeSep: 0.3,
      eyeY: 0.02,
      mouthW: 0.55,
      cheek: 1,
    },
    palette: { body: "#f2a7bb", leaf: "#7cbf80", pot: "#ead9c8" },
  },
  fifi: {
    label: "Fifi",
    params: {
      bodyR: 0.34,
      squash: 1.12,
      stemH: 0.12,
      l0s: 1,
      l0yaw: 0,
      l0tilt: 0.85,
      l0len: 0.24,
      l0wid: 0.12,
      l1s: 1,
      l1yaw: 2.1,
      l1tilt: 1.1,
      l1len: 0.22,
      l1wid: 0.11,
      l2s: 1,
      l2yaw: -2.1,
      l2tilt: 1.1,
      l2len: 0.22,
      l2wid: 0.11,
      armS: 0.001,
      eyeR: 0.15,
      eyeSep: 0.33,
      eyeY: 0.22,
      mouthW: 1,
      cheek: 0.55,
    },
    palette: { body: "#7cc487", leaf: "#4e9e63", pot: "#e8e3da" },
  },
  kiki: {
    label: "Kiki",
    params: {
      bodyR: 0.32,
      squash: 1.5,
      stemH: 0.03,
      l0s: 0.7,
      l0yaw: 0,
      l0tilt: 0.15,
      l0len: 0.12,
      l0wid: 0.08,
      l1s: 0.001,
      l1yaw: -1.57,
      l1tilt: 0.9,
      l1len: 0.1,
      l1wid: 0.07,
      l2s: 0.001,
      l2yaw: 1.57,
      l2tilt: 0.9,
      l2len: 0.1,
      l2wid: 0.07,
      armS: 1,
      eyeR: 0.17,
      eyeSep: 0.27,
      eyeY: 0.12,
      mouthW: 0.7,
      cheek: 0.7,
    },
    palette: { body: "#7fae72", leaf: "#f193b4", pot: "#e2986a" },
  },
} satisfies Record<ChibiVariant, VariantDef>;

// SAFETY: Object.keys over the PlantParams literal yields exactly its own keys.
const PARAM_KEYS = Object.keys(VARIANTS.pip.params) as (keyof PlantParams)[];

const DEFAULT_BG: [string, string] = ["#2e2a33", "#0b0a0e"];

const POT_H = 0.36;
const POT_R = 0.3;

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
  raySteps = 80,
  className,
}: ChibiPlantsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Live tuning values, read every frame by the render loop.
  const tuningRef = useRef({
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
  });
  tuningRef.current = {
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
  };
  const stepsRef = useRef(raySteps);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    let raf = 0;

    const renderer = new THREE.WebGPURenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    // ---- uniforms ----------------------------------------------------------
    const uTime = uniform(0);
    const uLook = uniform(new THREE.Vector2(0, 0));
    const uBlink = uniform(0);
    const uExcite = uniform(0);
    const uGaze = uniform(1);
    const uWobble = uniform(1);
    const uRes = uniform(new THREE.Vector2(1, 1));
    const uBg1 = uniform(new THREE.Color(background[0]));
    const uBg2 = uniform(new THREE.Color(background[1]));
    const uBodyC = uniform(new THREE.Color(VARIANTS.pip.palette.body));
    const uLeafC = uniform(new THREE.Color(VARIANTS.pip.palette.leaf));
    const uPotC = uniform(new THREE.Color(VARIANTS.pip.palette.pot));
    const uCheekC = uniform(new THREE.Color(cheekColor));

    // SAFETY: built from PARAM_KEYS, so every PlantParams key is present.
    const uParams = Object.fromEntries(
      PARAM_KEYS.map((k) => [k, uniform(VARIANTS.pip.params[k])]),
    ) as Record<keyof PlantParams, ReturnType<typeof uniform>>;

    // ---- TSL node helpers --------------------------------------------------
    type N = ReturnType<typeof float>;
    const smin = (a: N, b: N, k: number) => {
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
    const sdEllipsoid = (p: N, r: N) => {
      const k0 = length(p.div(r));
      const k1 = length(p.div(r.mul(r)));
      return k0.mul(k0.sub(1)).div(k1.add(1e-6));
    };
    const sdVCapsule = (p: N, h: N, r: N) =>
      length(vec3(p.x, p.y.sub(clamp(p.y, 0, h)), p.z)).sub(r);
    // Rotate about Y / X by angle a (applied to sample points; negate a to
    // rotate the object by +a).
    const rotY = (p: N, a: N) => {
      const c = cos(a);
      const s = sin(a);
      return vec3(p.x.mul(c).add(p.z.mul(s)), p.y, p.x.negate().mul(s).add(p.z.mul(c)));
    };
    const rotX = (p: N, a: N) => {
      const c = cos(a);
      const s = sin(a);
      return vec3(p.x, p.y.mul(c).sub(p.z.mul(s)), p.y.mul(s).add(p.z.mul(c)));
    };

    // Breathing + idle sway, all driven by uTime so the plant is alive at rest.
    const breathe = () => sin(uTime.mul(2.1)).mul(uWobble).toVar();

    // Head orientation: cursor follow + idle sway.
    const headAngles = () => {
      const yaw = uLook.x.mul(uGaze.mul(-0.55)).add(sin(uTime.mul(0.6)).mul(0.07).mul(uWobble));
      const pitch = uLook.y
        .mul(uGaze.mul(0.38))
        .add(sin(uTime.mul(0.83).add(1.7)).mul(0.05).mul(uWobble));
      return { yaw: yaw.toVar(), pitch: pitch.toVar() };
    };

    // Transform a world point into the plant's head-local space (body center
    // at origin, un-rotated). Face painting and every above-pot SDF use this.
    const bodyCenterY = () => uParams.bodyR.mul(uParams.squash).mul(0.55).add(POT_H).toVar();

    const toPlantLocal = (p: N, yaw: N, pitch: N) => {
      const q = vec3(p.x, p.y.sub(bodyCenterY()), p.z).toVar();
      return rotX(rotY(q, yaw), pitch).toVar();
    };

    const sdPot = (p: N) => {
      const py = p.y.sub(POT_H * 0.5);
      const ra = float(POT_R).mul(p.y.div(POT_H).sub(0.5).mul(0.3).add(1));
      const dx = length(vec2(p.x, p.z)).sub(ra).add(0.03);
      const dy = abs(py).sub(POT_H * 0.5 - 0.02);
      const d2 = vec2(dx, dy).toVar();
      const body = min(max(d2.x, d2.y), 0)
        .add(length(max(d2, vec2(0, 0))))
        .sub(0.03);
      const rim = length(vec2(length(vec2(p.x, p.z)).sub(POT_R * 1.1), p.y.sub(POT_H))).sub(0.038);
      return smin(body, rim, 0.02).toVar();
    };

    // One leaf slot: yaw around the stem, tilt outward, ellipsoid blade.
    const sdLeaf = (q: N, baseY: N, s: N, lyaw: N, tilt: N, len: N, wid: N) => {
      const ll = len.mul(s).toVar();
      const ww = wid.mul(s).toVar();
      const lq = rotX(rotY(vec3(q.x, q.y.sub(baseY), q.z), lyaw), tilt.negate()).toVar();
      return sdEllipsoid(
        vec3(lq.x, lq.y.sub(ll.mul(0.55).add(0.02)), lq.z),
        vec3(ww, ll.mul(0.6), ww.mul(0.45)),
      );
    };

    // Part distances in plant-local space; combined by map(), re-queried at the
    // hit point for smooth part-color weights (the "one continuous surface" look).
    const plantParts = (q: N) => {
      const br = breathe();
      const rB = uParams.bodyR.mul(br.mul(-0.012).add(1)).toVar();
      const sq = uParams.squash.mul(br.mul(0.02).add(1)).toVar();
      const dBody = sdEllipsoid(q, vec3(rB, rB.mul(sq), rB)).toVar();

      const bodyTop = rB.mul(sq).sub(0.03).toVar();
      const dStem = sdVCapsule(
        vec3(q.x, q.y.sub(bodyTop), q.z),
        uParams.stemH,
        float(0.035),
      ).toVar();
      const knobR = clamp(uParams.stemH.mul(10), 0, 1).mul(0.05);
      const dKnob = length(vec3(q.x, q.y.sub(bodyTop).sub(uParams.stemH), q.z)).sub(knobR);
      const leafBase = bodyTop.sub(0.02).add(uParams.stemH.mul(0.92)).toVar();
      const dL0 = sdLeaf(
        q,
        leafBase,
        uParams.l0s,
        uParams.l0yaw,
        uParams.l0tilt,
        uParams.l0len,
        uParams.l0wid,
      );
      const dL1 = sdLeaf(
        q,
        leafBase,
        uParams.l1s,
        uParams.l1yaw,
        uParams.l1tilt,
        uParams.l1len,
        uParams.l1wid,
      );
      const dL2 = sdLeaf(
        q,
        leafBase,
        uParams.l2s,
        uParams.l2yaw,
        uParams.l2tilt,
        uParams.l2len,
        uParams.l2wid,
      );
      const dGreen = min(min(smin(dStem, dKnob, 0.03), dL0), min(dL1, dL2)).toVar();

      const aq = vec3(abs(q.x), q.y, q.z).toVar();
      const armR = uParams.armS.mul(0.095).toVar();
      const armH = uParams.armS.mul(0.26).toVar();
      const dArm = sdVCapsule(
        vec3(aq.x.sub(rB.mul(0.92)), aq.y.add(rB.mul(sq).mul(0.05)), aq.z),
        armH,
        armR,
      ).toVar();

      return { dBody, dGreen, dArm };
    };

    const sceneSdf = (p: N, yaw: N, pitch: N) => {
      const dPot = sdPot(p);
      const q = toPlantLocal(p, yaw, pitch);
      const { dBody, dGreen, dArm } = plantParts(q);
      let d = smin(dPot, dBody, 0.09);
      d = smin(d, dGreen, 0.045);
      d = smin(d, dArm, 0.07);
      return d.toVar();
    };

    const mapFn = Fn(([p]: [N]) => {
      const { yaw, pitch } = headAngles();
      return sceneSdf(p, yaw, pitch);
    });

    const calcNormal = (p: N) => {
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
    const RO = new THREE.Vector3(0, 0.62, 2.35);
    const TA = new THREE.Vector3(0, 0.52, 0);
    const fw = TA.clone().sub(RO).normalize();
    const ri = fw
      .clone()
      .cross(new THREE.Vector3(0, 1, 0))
      .normalize();
    const up = ri.clone().cross(fw);
    const FOV_S = 0.36;

    const fragment = Fn(() => {
      const aspect = uRes.x.div(uRes.y);
      const ndc = uv().mul(2).sub(1).toVar();
      const nx = ndc.x.mul(aspect).toVar();
      const ro = vec3(RO.x, RO.y, RO.z);
      const rd = normalize(
        vec3(ri.x, ri.y, ri.z)
          .mul(nx.mul(FOV_S))
          .add(vec3(up.x, up.y, up.z).mul(ndc.y.mul(FOV_S)))
          .add(vec3(fw.x, fw.y, fw.z)),
      ).toVar();

      // Background: radial dusk gradient + soft contact shadow on the floor.
      const bgT = smoothstep(0.05, 1.25, length(vec2(nx, ndc.y.mul(1.15).add(0.12))));
      const col = mix(vec3(uBg1), vec3(uBg2), bgT).toVar();
      const tg = ro.y.sub(0.001).div(max(rd.y.negate(), 1e-4)).toVar();
      const gp = ro.add(rd.mul(tg)).toVar();
      const shadowR = length(vec2(gp.x, gp.z.mul(1.35)));
      const shadow = exp(shadowR.mul(shadowR).mul(-6))
        .mul(0.42)
        .mul(smoothstep(0, 0.02, rd.y.negate()));
      col.assign(col.mul(shadow.oneMinus()));

      // Bounding-sphere pre-test so empty pixels stay cheap.
      const bc = vec3(0, 0.58, 0);
      const oc = ro.sub(bc).toVar();
      const bq = dot(oc, rd).toVar();
      const bh = bq
        .mul(bq)
        .sub(dot(oc, oc).sub(1.32 * 1.32))
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
          const { yaw, pitch } = headAngles();
          const q = toPlantLocal(p, yaw, pitch);
          const { dBody, dGreen, dArm } = plantParts(q);
          const dPot = sdPot(p);

          // Soft part weights — colors bleed across the smin creases.
          const wPot = exp(dPot.div(-0.028)).toVar();
          const wBody = exp(dBody.div(-0.028)).toVar();
          const wGreen = exp(dGreen.div(-0.028)).toVar();
          const wArm = exp(dArm.div(-0.028)).toVar();
          const wSum = wPot.add(wBody).add(wGreen).add(wArm).toVar();
          const albedo = vec3(uPotC)
            .mul(wPot)
            .add(vec3(uBodyC).mul(wBody))
            .add(vec3(uLeafC).mul(wGreen))
            .add(vec3(uBodyC).mul(0.92).mul(wArm))
            .div(wSum)
            .toVar();
          const bodyW = wBody.div(wSum).toVar();

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

          const eyeRr = uParams.eyeR
            .mul(uExcite.mul(0.3).add(1))
            .mul(uBlink.mul(0.3).oneMinus())
            .toVar();
          const blinkK = float(1).div(uBlink.mul(0.94).oneMinus()).toVar();
          const eyeMask = float(0).toVar();
          const hlMask = float(0).toVar();
          for (const sign of [-1, 1]) {
            const c = vec2(uParams.eyeSep.mul(sign).add(leadX), uParams.eyeY.add(leadY)).toVar();
            const dv = vec2(fu.sub(c.x), fv.sub(c.y).mul(blinkK)).toVar();
            eyeMask.assign(max(eyeMask, smoothstep(eyeRr, eyeRr.sub(0.015), length(dv))));
            const h1 = vec2(fu.sub(c.x).add(eyeRr.mul(0.3)), fv.sub(c.y).sub(eyeRr.mul(0.34)));
            hlMask.assign(
              max(hlMask, smoothstep(eyeRr.mul(0.3), eyeRr.mul(0.3).sub(0.012), length(h1))),
            );
            const h2 = vec2(fu.sub(c.x).sub(eyeRr.mul(0.28)), fv.sub(c.y).add(eyeRr.mul(0.3)));
            hlMask.assign(
              max(hlMask, smoothstep(eyeRr.mul(0.14), eyeRr.mul(0.14).sub(0.012), length(h2))),
            );
          }
          hlMask.assign(hlMask.mul(eyeMask).mul(uBlink.oneMinus()));

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

          albedo.assign(
            mix(albedo, vec3(uCheekC), cheekMask.mul(uParams.cheek).mul(0.5).mul(front)),
          );
          albedo.assign(mix(albedo, vec3(0.16, 0.11, 0.09), eyeMask.mul(front)));
          albedo.assign(mix(albedo, vec3(0.28, 0.13, 0.11), mouthMask.mul(front)));
          albedo.assign(mix(albedo, vec3(0.95, 0.95, 0.97), hlMask.mul(front)));

          // ---- soft vinyl shading ----
          const ld = normalize(vec3(0.55, 0.75, 0.5));
          const dif = clamp(dot(n, ld).mul(0.5).add(0.5), 0, 1).toVar();
          const skyT = n.y.mul(0.5).add(0.5);
          const amb = mix(vec3(0.3, 0.27, 0.33), vec3(0.56, 0.58, 0.67), skyT).toVar();
          const ao1 = clamp(mapFn(p.add(n.mul(0.05))).div(0.05), 0, 1);
          const ao2 = clamp(mapFn(p.add(n.mul(0.16))).div(0.16), 0, 1);
          const ao = ao1.mul(0.55).add(ao2.mul(0.45)).mul(0.7).add(0.3).toVar();
          const lit = albedo.mul(amb.add(dif.mul(vec3(0.98, 0.9, 0.8)).mul(1.05)).mul(ao)).toVar();
          const hv = normalize(ld.sub(rd));
          const spec = pow(clamp(dot(n, hv), 0, 1), 50)
            .mul(0.55)
            .mul(ao);
          const fres = pow(clamp(dot(n, rd.negate()), 0, 1).oneMinus(), 3.5).mul(0.3);
          lit.assign(
            lit
              .add(vec3(1, 0.98, 0.95).mul(spec))
              .add(mix(vec3(uBg1), vec3(0.6, 0.62, 0.7), 0.5).mul(fres)),
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
    const cur: Record<string, number> = {};
    const vel: Record<string, number> = {};
    const target: Record<string, number> = {};
    for (const k of PARAM_KEYS) {
      cur[k] = VARIANTS.pip.params[k];
      vel[k] = 0;
      target[k] = cur[k];
    }
    const curCol = {
      body: new THREE.Color(VARIANTS.pip.palette.body),
      leaf: new THREE.Color(VARIANTS.pip.palette.leaf),
      pot: new THREE.Color(VARIANTS.pip.palette.pot),
    };
    const tgtCol = { body: new THREE.Color(), leaf: new THREE.Color(), pot: new THREE.Color() };

    const look = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0.1 };
    let lastPointer = -1e4;
    let nextWander = 0;
    let blink = 0;
    let blinkTarget = 0;
    let nextBlink = 1.2;
    let excite = 0;
    let elapsed = 0;

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      const speedMag = Math.hypot(e.movementX ?? 0, e.movementY ?? 0);
      excite = Math.min(1, excite + speedMag * 0.004);
      look.tx = THREE.MathUtils.clamp(nx * 1.1, -1, 1);
      look.ty = THREE.MathUtils.clamp(ny * 1.1, -1, 1);
      lastPointer = elapsed;
    };
    window.addEventListener("pointermove", onPointerMove);

    const resize = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      renderer.setSize(w, h, false);
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      uRes.value.set(w * dpr, h * dpr);
    };
    const ro2 = new ResizeObserver(resize);
    ro2.observe(container);

    let prev = performance.now();
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const now = performance.now();
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const tuning = tuningRef.current;
      elapsed += dt * tuning.speed;
      uTime.value = elapsed;
      uGaze.value = tuning.gaze;
      uWobble.value = tuning.wobble;

      // Variant + prop overrides drive the morph targets.
      const v = VARIANTS[tuning.variant] ?? VARIANTS.pip;
      for (const k of PARAM_KEYS) target[k] = v.params[k];
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

      // Idle wander when the cursor has gone quiet.
      if (elapsed - lastPointer > 2.4 && elapsed > nextWander) {
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

      // Blinks: quick close, softer open, occasional double.
      if (elapsed > nextBlink && blinkTarget === 0) {
        blinkTarget = 1;
        nextBlink = elapsed + 2 + Math.random() * 3.2 + (Math.random() < 0.18 ? -1.75 : 0);
      }
      blink += (blinkTarget - blink) * Math.min(1, dt * (blinkTarget === 1 ? 26 : 13));
      if (blink > 0.93) blinkTarget = 0;
      uBlink.value = blink;

      excite = Math.max(0, excite - dt * 1.4);
      uExcite.value = excite;

      renderer.render(scene, camera);
    };

    container.appendChild(renderer.domElement);
    void (async () => {
      try {
        await renderer.init();
      } catch (err) {
        console.error("chibi-plants: renderer init failed", err);
        return;
      }
      if (disposed) return;
      resize();
      prev = performance.now();
      raf = requestAnimationFrame(frame);
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro2.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.remove();
      quad.geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
    // The shader graph is built once; live values flow through uniforms/refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className={className ?? "h-full w-full"} />;
};
