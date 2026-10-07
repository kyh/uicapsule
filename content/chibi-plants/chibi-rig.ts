/**
 * The chibi plant as a little soft body: position-based dynamics at a fixed 60 Hz with 8
 * substeps, after the XPBD plush-toy sims. A rigid pot (shape matching, rotation only), a squishy
 * body (affine shape matching, volume-normalised, so a pull stretches it thin and a press bulges
 * it out), and a stem and leaves on springs that flop with inertia. Grabbing pins particles to
 * the pointer; whatever the body can't follow becomes a local pinch (a Kelvinlet in the shader).
 *
 * The raymarcher never sees a particle. Each frame the rig fits transforms to them — the pot's
 * rigid frame, the body's affine frame with the gaze folded in, a rotation per leaf — and the SDF
 * is evaluated through those. The CPU picking SDF reads the same transforms, so a grab lands on
 * exactly what is drawn.
 */

export const POT_H = 0.36;
export const POT_R = 0.3;
/** The pot is filled to here; the plant grows out of the soil, inside the lip. */
export const SOIL_Y = POT_H - 0.03;
/** Below this band the body's base rides with the pot; above it, with the soft body. */
export const BLEND_LO = POT_H - 0.04;
export const BLEND_HI = POT_H + 0.16;
/** Bi-scale Kelvinlet radii: the pinch falls off as 1/r³ instead of a lone Kelvinlet's 1/r. */
export const PINCH_E1 = 0.14;
export const PINCH_E2 = 0.28;

export type Vec3 = [number, number, number];
/** A row-major 3×3 matrix. */
export type Mat3 = [number, number, number, number, number, number, number, number, number];
type Quat = [number, number, number, number];

export type PlantPart = "body" | "leaf0" | "leaf1" | "leaf2" | "pot" | "stem";
const LEAF_PARTS = ["leaf0", "leaf1", "leaf2"] as const;

export interface LeafPose {
  s: number;
  yaw: number;
  tilt: number;
  len: number;
  wid: number;
}

/** The plant's morphable proportions this frame, plus the head turn. */
export interface PlantPose {
  bodyR: number;
  squash: number;
  stemH: number;
  armS: number;
  leaves: readonly [LeafPose, LeafPose, LeafPose];
  /** Head turn in design space, about the body centre: RX(pitch)·RY(yaw). */
  gaze: Mat3;
}

/** What the shader and the picking SDF need, fitted to the particles. */
export interface RigFrame {
  /** World → plant space through the pot's rigid frame. */
  potM: Mat3;
  potK: Vec3;
  /** World → design space through the body's affine frame, gaze folded in. */
  bodyM: Mat3;
  bodyK: Vec3;
  /** Stem tip and leaf base, body-centred design space. */
  stemTip: Vec3;
  leafBase: Vec3;
  /** Per-leaf sample-point frames: rest yaw/tilt composed with the leaf's swing. */
  leafM: [Mat3, Mat3, Mat3];
  /** Pinch centre and displacement, design space. */
  pinchC: Vec3;
  pinchD: Vec3;
  /**
   * How much the warps can stretch space, for a safe raymarch step: the body frame's largest
   * stretch (≥ 1), and how far the body and pot frames disagree across the rim band.
   */
  warp: number;
  gap: number;
  /** Raymarch bounding sphere: centre, radius. */
  bound: [number, number, number, number];
  /** Contact shadow: x, z, and the pot's height off the floor. */
  shadow: Vec3;
  /** The body's centre, world space — where the face is. */
  head: Vec3;
}

export interface PlantHit {
  part: PlantPart;
  point: Vec3;
}

// ---- small linear algebra ------------------------------------------------

const IDENTITY: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smoothstep = (e0: number, e1: number, v: number) => {
  const t = clamp((v - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const addScaled = (a: Vec3, b: Vec3, s: number): Vec3 => [
  a[0] + b[0] * s,
  a[1] + b[1] * s,
  a[2] + b[2] * s,
];
const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const length = (a: Vec3) => Math.hypot(a[0], a[1], a[2]);
const normalize = (a: Vec3): Vec3 => {
  const l = length(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const clampLength = (a: Vec3, max: number): Vec3 => {
  const l = length(a);
  return l > max ? [(a[0] / l) * max, (a[1] / l) * max, (a[2] / l) * max] : a;
};
const mulMV = (m: Mat3, v: Vec3): Vec3 => {
  const [a, b, c, d, e, f, g, h, i] = m;
  const [x, y, z] = v;
  return [a * x + b * y + c * z, d * x + e * y + f * z, g * x + h * y + i * z];
};
const mulMM = (m: Mat3, n: Mat3): Mat3 => {
  const [a, b, c, d, e, f, g, h, i] = m;
  const [j, k, l, o, p, q, r, s, t] = n;
  return [
    a * j + b * o + c * r,
    a * k + b * p + c * s,
    a * l + b * q + c * t,
    d * j + e * o + f * r,
    d * k + e * p + f * s,
    d * l + e * q + f * t,
    g * j + h * o + i * r,
    g * k + h * p + i * s,
    g * l + h * q + i * t,
  ];
};
const transpose = (m: Mat3): Mat3 => {
  const [a, b, c, d, e, f, g, h, i] = m;
  return [a, d, g, b, e, h, c, f, i];
};
const det3 = (m: Mat3) => {
  const [a, b, c, d, e, f, g, h, i] = m;
  return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
};
const inverse3 = (m: Mat3): Mat3 | null => {
  const [a, b, c, d, e, f, g, h, i] = m;
  const k0 = e * i - f * h;
  const k1 = f * g - d * i;
  const k2 = d * h - e * g;
  const det = a * k0 + b * k1 + c * k2;
  if (Math.abs(det) < 1e-9) {
    return null;
  }
  const s = 1 / det;
  return [
    k0 * s,
    (c * h - b * i) * s,
    (b * f - c * e) * s,
    k1 * s,
    (a * i - c * g) * s,
    (c * d - a * f) * s,
    k2 * s,
    (b * g - a * h) * s,
    (a * e - b * d) * s,
  ];
};
const lerpM = (m: Mat3, n: Mat3, t: number): Mat3 => [
  m[0] + (n[0] - m[0]) * t,
  m[1] + (n[1] - m[1]) * t,
  m[2] + (n[2] - m[2]) * t,
  m[3] + (n[3] - m[3]) * t,
  m[4] + (n[4] - m[4]) * t,
  m[5] + (n[5] - m[5]) * t,
  m[6] + (n[6] - m[6]) * t,
  m[7] + (n[7] - m[7]) * t,
  m[8] + (n[8] - m[8]) * t,
];
const scaleM = (m: Mat3, s: number): Mat3 => lerpM([0, 0, 0, 0, 0, 0, 0, 0, 0], m, s);

/** Rotations of a sample point, matching the shader's rotY/rotX. */
export const rotY = (a: number): Mat3 => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [c, 0, s, 0, 1, 0, -s, 0, c];
};
export const rotX = (a: number): Mat3 => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [1, 0, 0, 0, c, -s, 0, s, c];
};
/** The head turn as the shader used to apply it: RY(yaw) to the sample point, then RX(pitch). */
export const gazeMatrix = (yaw: number, pitch: number) => mulMM(rotX(pitch), rotY(yaw));
const rotAxis = (axis: Vec3, angle: number): Mat3 => {
  const [x, y, z] = axis;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const t = 1 - c;
  return [
    t * x * x + c,
    t * x * y - s * z,
    t * x * z + s * y,
    t * x * y + s * z,
    t * y * y + c,
    t * y * z - s * x,
    t * x * z - s * y,
    t * y * z + s * x,
    t * z * z + c,
  ];
};
/**
 * `r` with its heading (turn about world up) taken out. The face is painted on the body, so the
 * plant always turns back to face the viewer; looking around is the gaze's job, not the body's.
 */
const faceForward = (r: Mat3): Mat3 => {
  const [fx, fy, fz] = mulMV(r, [0, 0, 1]);
  if (Math.abs(fy) > 0.9) {
    return r;
  }
  return mulMM(rotAxis([0, 1, 0], -Math.atan2(fx, fz)), r);
};

/** The shortest rotation taking unit vector `a` onto unit vector `b`. */
const rotBetween = (a: Vec3, b: Vec3): Mat3 => {
  const axis = cross(a, b);
  const s = length(axis);
  const c = dot(a, b);
  if (s < 1e-6) {
    return c > 0 ? IDENTITY : rotAxis(normalize(cross(a, [0.3, 0.1, 0.9])), Math.PI);
  }
  return rotAxis([axis[0] / s, axis[1] / s, axis[2] / s], Math.atan2(s, c));
};
const quatToMat = (q: Quat): Mat3 => {
  const [x, y, z, w] = q;
  return [
    1 - 2 * (y * y + z * z),
    2 * (x * y - w * z),
    2 * (x * z + w * y),
    2 * (x * y + w * z),
    1 - 2 * (x * x + z * z),
    2 * (y * z - w * x),
    2 * (x * z - w * y),
    2 * (y * z + w * x),
    1 - 2 * (x * x + y * y),
  ];
};
/**
 * The rotational part of `a`, warm-started from `q` (Müller et al., "A Robust Method to Extract
 * the Rotational Part of Deformations", 2016). Updates `q` in place; stable through inversion.
 */
const extractRotation = (a: Mat3, q: Quat, iterations: number): Mat3 => {
  const [a0, a1, a2, a3, a4, a5, a6, a7, a8] = a;
  for (let it = 0; it < iterations; it += 1) {
    const [r0, r1, r2, r3, r4, r5, r6, r7, r8] = quatToMat(q);
    // Σ over columns of R × A, over |Σ R·A|: the axis-angle that turns R toward A.
    const ox = r3 * a6 - r6 * a3 + (r4 * a7 - r7 * a4) + (r5 * a8 - r8 * a5);
    const oy = r6 * a0 - r0 * a6 + (r7 * a1 - r1 * a7) + (r8 * a2 - r2 * a8);
    const oz = r0 * a3 - r3 * a0 + (r1 * a4 - r4 * a1) + (r2 * a5 - r5 * a2);
    const dd =
      r0 * a0 + r3 * a3 + r6 * a6 + (r1 * a1 + r4 * a4 + r7 * a7) + (r2 * a2 + r5 * a5 + r8 * a8);
    const mag = Math.hypot(ox, oy, oz);
    const w = mag / (Math.abs(dd) + 1e-9);
    if (w < 1e-9) {
      break;
    }
    const s = Math.sin(w / 2) / mag;
    const [ax, ay, az, aw] = [ox * s, oy * s, oz * s, Math.cos(w / 2)];
    const [qx, qy, qz, qw] = q;
    const nx = aw * qx + ax * qw + ay * qz - az * qy;
    const ny = aw * qy - ax * qz + ay * qw + az * qx;
    const nz = aw * qz + ax * qy - ay * qx + az * qw;
    const nw = aw * qw - ax * qx - ay * qy - az * qz;
    const nl = 1 / Math.hypot(nx, ny, nz, nw);
    q[0] = nx * nl;
    q[1] = ny * nl;
    q[2] = nz * nl;
    q[3] = nw * nl;
  }
  return quatToMat(q);
};
/** Largest singular value of `m` (power iteration on mᵀm). */
const spectralNorm = (m: Mat3) => {
  const mtm = mulMM(transpose(m), m);
  let v: Vec3 = [0.6, 0.7, 0.4];
  for (let it = 0; it < 6; it += 1) {
    v = normalize(mulMV(mtm, v));
  }
  return Math.sqrt(Math.max(dot(v, mulMV(mtm, v)), 0));
};

// ---- the SDF, mirrored from the shader for picking ---------------------------

const smin = (a: number, b: number, k: number) => {
  const h = clamp((b - a) * (0.5 / k) + 0.5, 0, 1);
  return b + (a - b) * h - h * (1 - h) * k;
};
const sdEllipsoid = (p: Vec3, r: Vec3) => {
  const k0 = Math.hypot(p[0] / r[0], p[1] / r[1], p[2] / r[2]);
  const k1 = Math.hypot(p[0] / (r[0] * r[0]), p[1] / (r[1] * r[1]), p[2] / (r[2] * r[2]));
  return (k0 * (k0 - 1)) / (k1 + 1e-6);
};
const sdCapsule = (p: Vec3, a: Vec3, b: Vec3, r: number) => {
  const pa = sub(p, a);
  const ba = sub(b, a);
  const h = clamp(dot(pa, ba) / Math.max(dot(ba, ba), 1e-8), 0, 1);
  return length(addScaled(pa, ba, -h)) - r;
};
export const sdPot = (p: Vec3) => {
  const ra = POT_R * ((p[1] / POT_H - 0.5) * 0.3 + 1);
  const rr = Math.hypot(p[0], p[2]);
  const dx = rr - ra + 0.03;
  const dy = Math.abs(p[1] - POT_H * 0.5) - (POT_H * 0.5 - 0.02);
  const rounded = Math.min(Math.max(dx, dy), 0) + Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
  const tub = Math.max(rounded - 0.03, p[1] - SOIL_Y);
  const rim = Math.hypot(rr - POT_R * 1.1, p[1] - POT_H) - 0.038;
  return smin(tub, rim, 0.02);
};
const bodyCentreY = (pose: PlantPose) => POT_H + pose.bodyR * pose.squash * 0.55;
const bodyTop = (pose: PlantPose) => pose.bodyR * pose.squash - 0.03;
/** Rest yaw/tilt of a leaf as a sample-point frame, matching the shader's rotX(rotY(·)). */
const leafRestFrame = (leaf: LeafPose) => mulMM(rotX(-leaf.tilt), rotY(leaf.yaw));
const leafReach = (leaf: LeafPose) => leaf.len * leaf.s * 1.15 + 0.02;

// ---- particles ---------------------------------------------------------------

interface Particle {
  x: number;
  y: number;
  z: number;
  /** Position at the start of the substep. */
  px: number;
  py: number;
  pz: number;
  vx: number;
  vy: number;
  vz: number;
  /** Vertical speed coming into the substep, for the landing bounce. */
  ivy: number;
  /** Rest position, design space. */
  rx: number;
  ry: number;
  rz: number;
  m: number;
  w: number;
  /** Floor clearance and how much gravity it feels. */
  rad: number;
  grav: number;
}

const particle = (m: number, rad: number, grav: number): Particle => ({
  grav,
  ivy: 0,
  m,
  px: 0,
  py: 0,
  pz: 0,
  rad,
  rx: 0,
  ry: 0,
  rz: 0,
  vx: 0,
  vy: 0,
  vz: 0,
  w: 1 / m,
  x: 0,
  y: 0,
  z: 0,
});

const pos = (p: Particle): Vec3 => [p.x, p.y, p.z];
const restPos = (p: Particle): Vec3 => [p.rx, p.ry, p.rz];
const setRest = (p: Particle, v: Vec3) => {
  [p.rx, p.ry, p.rz] = v;
};
const nudge = (p: Particle, d: Vec3, f: number) => {
  p.x += d[0] * f;
  p.y += d[1] * f;
  p.z += d[2] * f;
};
const kick = (p: Particle, d: Vec3, s: number) => {
  p.vx += d[0] * s;
  p.vy += d[1] * s;
  p.vz += d[2] * s;
};

const centroid = (ps: readonly Particle[]): Vec3 => {
  let m = 0;
  let x = 0;
  let y = 0;
  let z = 0;
  for (const p of ps) {
    m += p.m;
    x += p.x * p.m;
    y += p.y * p.m;
    z += p.z * p.m;
  }
  return [x / m, y / m, z / m];
};
/**
 * A shape-matching cluster: its particles, each with a rest offset from the cluster's rest
 * centroid (one particle can sit in several clusters), and a warm start for the rotation.
 */
interface Cluster {
  members: { p: Particle; q: Vec3 }[];
  restC: Vec3;
  aqqInv: Mat3;
  turn: Quat;
}
const cluster = (ps: readonly Particle[]): Cluster => ({
  aqqInv: IDENTITY,
  members: ps.map((p) => ({ p, q: [0, 0, 0] })),
  restC: [0, 0, 0],
  turn: [0, 0, 0, 1],
});
/** Re-derive rest offsets (and Σ m q qᵀ) after the rest pose changed. */
const restCluster = (cl: Cluster) => {
  let m = 0;
  let c: Vec3 = [0, 0, 0];
  for (const { p } of cl.members) {
    m += p.m;
    c = addScaled(c, restPos(p), p.m);
  }
  cl.restC = scale(c, 1 / m);
  const a: Mat3 = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (const member of cl.members) {
    const { p } = member;
    const q = sub(restPos(p), cl.restC);
    member.q = q;
    a[0] += p.m * q[0] * q[0];
    a[1] += p.m * q[0] * q[1];
    a[2] += p.m * q[0] * q[2];
    a[4] += p.m * q[1] * q[1];
    a[5] += p.m * q[1] * q[2];
    a[8] += p.m * q[2] * q[2];
  }
  [a[3], a[6], a[7]] = [a[1], a[2], a[5]];
  cl.aqqInv = inverse3(a) ?? IDENTITY;
};
/** The cluster's centroid now and Σ m (x − c) qᵀ, its deformation unnormalised. */
const measure = (cl: Cluster) => {
  let m = 0;
  let sum: Vec3 = [0, 0, 0];
  for (const { p } of cl.members) {
    m += p.m;
    sum = addScaled(sum, pos(p), p.m);
  }
  const c = scale(sum, 1 / m);
  const a: Mat3 = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (const { p, q } of cl.members) {
    const [x, y, z] = scale(sub(pos(p), c), p.m);
    a[0] += x * q[0];
    a[1] += x * q[1];
    a[2] += x * q[2];
    a[3] += y * q[0];
    a[4] += y * q[1];
    a[5] += y * q[2];
    a[6] += z * q[0];
    a[7] += z * q[1];
    a[8] += z * q[2];
  }
  return { apq: a, c };
};

/** Distance constraint (XPBD, one iteration). `slack` lets it go only when stretched past rest. */
const solveDistance = (
  a: Particle,
  b: Particle,
  rest: number,
  compliance: number,
  slack: boolean,
) => {
  const d: Vec3 = [b.x - a.x, b.y - a.y, b.z - a.z];
  const len = length(d);
  const c = len - rest;
  if (len < 1e-9 || (slack && c <= 0)) {
    return;
  }
  const corr = c / (a.w + b.w + compliance) / len;
  nudge(a, d, corr * a.w);
  nudge(b, d, -corr * b.w);
};

/** Keep each particle's share of the group's rigid motion; scale the rest by `keep`. */
const dampDeformation = (ps: readonly Particle[], keep: number) => {
  let m = 0;
  const c: Vec3 = [0, 0, 0];
  const v: Vec3 = [0, 0, 0];
  for (const p of ps) {
    m += p.m;
    [c[0], c[1], c[2]] = [c[0] + p.x * p.m, c[1] + p.y * p.m, c[2] + p.z * p.m];
    [v[0], v[1], v[2]] = [v[0] + p.vx * p.m, v[1] + p.vy * p.m, v[2] + p.vz * p.m];
  }
  const cm: Vec3 = [c[0] / m, c[1] / m, c[2] / m];
  const vm: Vec3 = [v[0] / m, v[1] / m, v[2] / m];
  let ang: Vec3 = [0, 0, 0];
  const inertia: Mat3 = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (const p of ps) {
    const r = sub(pos(p), cm);
    const u = sub([p.vx, p.vy, p.vz], vm);
    ang = addScaled(ang, cross(r, u), p.m);
    const r2 = dot(r, r);
    inertia[0] += p.m * (r2 - r[0] * r[0]);
    inertia[4] += p.m * (r2 - r[1] * r[1]);
    inertia[8] += p.m * (r2 - r[2] * r[2]);
    inertia[1] -= p.m * r[0] * r[1];
    inertia[2] -= p.m * r[0] * r[2];
    inertia[5] -= p.m * r[1] * r[2];
  }
  [inertia[3], inertia[6], inertia[7]] = [inertia[1], inertia[2], inertia[5]];
  const omega = mulMV(inverse3(inertia) ?? [0, 0, 0, 0, 0, 0, 0, 0, 0], ang);
  for (const p of ps) {
    const rigid = addScaled(vm, cross(omega, sub(pos(p), cm)), 1);
    p.vx = rigid[0] + (p.vx - rigid[0]) * keep;
    p.vy = rigid[1] + (p.vy - rigid[1]) * keep;
    p.vz = rigid[2] + (p.vz - rigid[2]) * keep;
  }
};

/** Scale `p`'s velocity relative to `anchor`'s by `keep`. */
const dampToward = (p: Particle, anchor: Particle, keep: number) => {
  p.vx = anchor.vx + (p.vx - anchor.vx) * keep;
  p.vy = anchor.vy + (p.vy - anchor.vy) * keep;
  p.vz = anchor.vz + (p.vz - anchor.vz) * keep;
};

// ---- the rig -----------------------------------------------------------------

const STEP = 1 / 60;
const SUBSTEPS = 8;
const GRAVITY = 9.81;
const BASE_R = 0.24;
const RIM_R = 0.33;
const PINCH_MAX = 0.13;
/**
 * Grab attachment compliance (inverse stiffness). The body's is soft, so a hard pull stretches it
 * before the pot comes along; the pot is held like the solid thing it is.
 */
const GRAB_COMPLIANCE = { body: 1.5e-3, green: 1.5e-3, pot: 1e-4 };
/** How quickly the hand catches up with the pointer (rad/s; ~0.1 s to arrive). */
const HAND_OMEGA = 28;
const JOINT_COMPLIANCE = 2e-4;
/**
 * The rim joints are near-vertical struts, so on their own they let the body slide sideways over
 * the pot like a parallelogram, with no first-order resistance — a shove would slosh the face down
 * into the rim. Diagonals to the neighbouring rim points triangulate it.
 */
const BRACE_COMPLIANCE = 1.4e-2;
/**
 * Spokes from the body's centre to its surface particles. Shape matching alone pulls each particle
 * with a force proportional to its own (small) mass, so a one-particle grab could stretch the body
 * forever without lifting anything; the spokes give it an absolute stiffness, which is what lets
 * a hard enough pull lift the pot.
 */
const SPOKE_COMPLIANCE = 9e-3;
const FRICTION_STATIC = 0.8;
const FRICTION_KINETIC = 0.6;
const RESTITUTION = 0.28;
const MAX_SPEED = 12;
/** How far the plant may roam toward the camera and away from it. */
const Z_NEAR = 0.5;
const Z_FAR = -0.7;

interface Grip {
  p: Particle;
  weight: number;
  offset: Vec3;
  compliance: number;
}

export class PlantRig {
  /** 0 (mochi) … 1 (vinyl). */
  firmness = 0.5;
  /** Extra damping for prefers-reduced-motion. */
  calm = false;
  /** Half-width of the visible table at the plant's depth; the screen edges are walls. */
  halfWidth = 1.4;

  private readonly base: Particle[];
  /** Rim particles: +x, +z, −x, −z. */
  private readonly rim: Particle[];
  private readonly socket: Particle;
  private readonly pot: Particle[];
  /** Body particles: centre, then +x, −x, +y, −y, +z, −z. */
  private readonly body: Particle[];
  private readonly centre: Particle;
  private readonly top: Particle;
  private readonly stem: Particle;
  private readonly leaves: [Particle, Particle, Particle];
  private readonly plant: Particle[];
  private readonly all: Particle[];
  private readonly joints: [Particle, Particle][];
  private readonly braces: [Particle, Particle][];

  /** The rigid pot; the body alone (fitted for drawing); body and rim together (simulated). */
  private readonly potCl: Cluster;
  private readonly bodyCl: Cluster;
  private readonly fleshCl: Cluster;

  private pose: PlantPose;
  private potRot: Mat3 = IDENTITY;
  private potC: Vec3 = [0, 0, 0];
  private bodyA: Mat3 = IDENTITY;
  private bodyRot: Mat3 = IDENTITY;
  private bodyC: Vec3 = [0, 0, 0];

  private grips: Grip[] = [];
  /**
   * The hand: it chases the pointer (`aim`) on a critically damped spring at the physics rate, so
   * pointer events arriving in bursts — a slow device, a flick — can't land as impulses.
   */
  private target: Vec3 | null = null;
  private aim: Vec3 = [0, 0, 0];
  private handV: Vec3 = [0, 0, 0];
  /** From the dragged point out to the surface that was actually touched. */
  private surface: Vec3 = [0, 0, 0];
  private held: PlantPart | null = null;
  private pinchC: Vec3 = [0, 0, 0];
  private pinchD: Vec3 = [0, 0, 0];
  private pinchV: Vec3 = [0, 0, 0];
  private acc = 0;
  private airTime = 0;
  private fallSpeed = 0;
  private landed = 0;

  constructor(pose: PlantPose) {
    this.pose = pose;
    this.base = Array.from({ length: 8 }, () => particle(0.3, 0, 1));
    const rimPx = particle(0.1, 0.04, 1);
    const rimPz = particle(0.1, 0.04, 1);
    const rimNx = particle(0.1, 0.04, 1);
    const rimNz = particle(0.1, 0.04, 1);
    this.rim = [rimPx, rimPz, rimNx, rimNz];
    this.socket = particle(0.2, 0, 1);
    this.pot = [...this.base, ...this.rim, this.socket];
    const centre = particle(0.12, 0.07, 0.6);
    const px = particle(0.06, 0.05, 0.6);
    const nx = particle(0.06, 0.05, 0.6);
    const py = particle(0.06, 0.05, 0.6);
    const ny = particle(0.06, 0.05, 0.6);
    const pz = particle(0.06, 0.05, 0.6);
    const nz = particle(0.06, 0.05, 0.6);
    this.body = [centre, px, nx, py, ny, pz, nz];
    this.centre = centre;
    this.top = py;
    this.stem = particle(0.03, 0.04, 0);
    this.leaves = [particle(0.012, 0.03, 0), particle(0.012, 0.03, 0), particle(0.012, 0.03, 0)];
    this.plant = [...this.pot, ...this.body];
    this.all = [...this.plant, this.stem, ...this.leaves];
    this.potCl = cluster(this.pot);
    this.bodyCl = cluster(this.body);
    // Sharing the rim makes bending the body against its pot a deformation like any other: it
    // is resisted by the same stiffness, and the reaction tips the pot.
    this.fleshCl = cluster([...this.body, ...this.rim]);
    // The body is planted: its sides hang off the rim, its base and centre off a socket inside.
    this.joints = [
      [px, rimPx],
      [pz, rimPz],
      [nx, rimNx],
      [nz, rimNz],
      [ny, this.socket],
      [centre, this.socket],
    ];
    this.braces = [
      [px, rimPz],
      [px, rimNz],
      [pz, rimPx],
      [pz, rimNx],
      [nx, rimPz],
      [nx, rimNz],
      [nz, rimPx],
      [nz, rimNx],
    ];
    this.setPose(pose);
    this.reset();
  }

  /** Put every particle back at rest, still. */
  reset() {
    for (const p of this.all) {
      [p.x, p.y, p.z] = restPos(p);
      [p.px, p.py, p.pz] = restPos(p);
      p.vx = 0;
      p.vy = 0;
      p.vz = 0;
    }
    for (const cl of [this.potCl, this.bodyCl, this.fleshCl]) {
      cl.turn = [0, 0, 0, 1];
    }
    this.release();
    this.pinchD = [0, 0, 0];
    this.pinchV = [0, 0, 0];
    this.fitPot();
    this.fitBody(4);
  }

  /** Rest proportions follow the morph; the particles catch up through the physics. */
  setPose(pose: PlantPose) {
    this.pose = pose;
    const { bodyR, squash, stemH, leaves } = pose;
    for (const [i, p] of this.base.entries()) {
      const a = (i / this.base.length) * Math.PI * 2;
      setRest(p, [Math.cos(a) * BASE_R, 0, Math.sin(a) * BASE_R]);
    }
    for (const [i, p] of this.rim.entries()) {
      const a = (i / this.rim.length) * Math.PI * 2;
      setRest(p, [Math.cos(a) * RIM_R, POT_H, Math.sin(a) * RIM_R]);
    }
    setRest(this.socket, [0, POT_H * 0.65, 0]);
    const cy = bodyCentreY(pose);
    const r: Vec3 = [bodyR * 0.8, bodyR * squash * 0.8, bodyR * 0.8];
    const offsets: Vec3[] = [
      [0, 0, 0],
      [r[0], 0, 0],
      [-r[0], 0, 0],
      [0, r[1], 0],
      [0, -r[1], 0],
      [0, 0, r[2]],
      [0, 0, -r[2]],
    ];
    for (const [i, p] of this.body.entries()) {
      const o = offsets[i] ?? [0, 0, 0];
      setRest(p, [o[0], cy + o[1], o[2]]);
    }
    const top = bodyTop(pose);
    setRest(this.stem, [0, cy + top + stemH, 0]);
    const base: Vec3 = [0, cy + top - 0.02 + stemH * 0.92, 0];
    for (const [i, p] of this.leaves.entries()) {
      const leaf = leaves[i];
      if (leaf) {
        setRest(
          p,
          addScaled(base, mulMV(transpose(leafRestFrame(leaf)), [0, 1, 0]), leafReach(leaf)),
        );
      }
    }
    restCluster(this.potCl);
    restCluster(this.bodyCl);
    restCluster(this.fleshCl);
  }

  /** Off the floor for more than a beat. */
  get airborne() {
    return this.airTime > 0.12;
  }

  /** How hard the last landing was (0–1); reading it clears it. */
  takeLanding() {
    const v = this.landed;
    this.landed = 0;
    return v;
  }

  /** How far the grabbed spot is being pulled out of shape, ~0–1. */
  get strain() {
    return clamp(length(this.pinchD) / PINCH_MAX, 0, 1);
  }

  /**
   * Take hold of `part` where the pointer hit it, and return the point to drag. For the pot and
   * body that is the hit pushed back to the part's own depth: the plant is only ever seen from
   * the front, so a pull in the screen plane shouldn't also swing it toward the camera.
   */
  grab(part: PlantPart, hit: Vec3): Vec3 {
    this.release();
    this.held = part;
    this.target = hit;
    this.aim = hit;
    this.handV = [0, 0, 0];
    this.surface = [0, 0, 0];
    const single = this.leafOrStem(part);
    if (single) {
      const compliance = GRAB_COMPLIANCE.green;
      this.grips = [{ compliance, offset: sub(pos(single), hit), p: single, weight: 1 }];
      return hit;
    }
    const group = part === "pot" ? this.pot : this.body;
    const radius = part === "pot" ? 0.45 : 0.32;
    const compliance = part === "pot" ? GRAB_COMPLIANCE.pot : GRAB_COMPLIANCE.body;
    const anchor: Vec3 = [hit[0], hit[1], centroid(group)[2]];
    this.target = anchor;
    this.aim = anchor;
    this.surface = sub(hit, anchor);
    let nearest: Grip | null = null;
    let best = Infinity;
    for (const p of group) {
      const offset = sub(pos(p), anchor);
      const d = length(sub(pos(p), hit));
      const grip = { compliance, offset, p, weight: smoothstep(radius, 0, d) };
      if (grip.weight > 0) {
        this.grips.push(grip);
      }
      if (d < best) {
        best = d;
        nearest = grip;
      }
    }
    if (nearest) {
      nearest.weight = 1;
      if (!this.grips.includes(nearest)) {
        this.grips.push(nearest);
      }
    }
    if (part === "body") {
      this.pinchC = this.toDesign(hit);
    }
    return anchor;
  }

  drag(target: Vec3) {
    this.aim = [target[0], Math.max(target[1], 0.03), target[2]];
  }

  release() {
    this.grips = [];
    this.target = null;
    this.held = null;
  }

  /** A tap: push in where it was touched, and let it wobble back. */
  boop(part: PlantPart, hit: Vec3, dir: Vec3) {
    const single = this.leafOrStem(part);
    if (single) {
      kick(single, dir, 3);
      return;
    }
    const group = part === "pot" ? this.pot : this.body;
    for (const p of group) {
      kick(p, dir, (part === "pot" ? 0.9 : 1.6) * smoothstep(0.5, 0, length(sub(pos(p), hit))));
    }
    if (part === "body") {
      this.pinchC = this.toDesign(hit);
      this.pinchV = addScaled(this.pinchV, mulMV(this.bodyLinear(), dir), 2.4);
      for (const leaf of this.leaves) {
        kick(leaf, [0, 1, 0], 1.2);
      }
    }
  }

  /** A little jump with a twist — for switching characters. */
  hop(strength: number) {
    const c = centroid(this.all);
    const spin = (Math.random() < 0.5 ? -1 : 1) * strength * 0.5;
    for (const p of this.all) {
      p.vy += strength;
      p.vx -= spin * (p.y - c[1]);
      p.vy += spin * (p.x - c[0]);
    }
  }

  step(dt: number) {
    this.acc = Math.min(this.acc + dt, STEP * 3);
    while (this.acc >= STEP) {
      this.acc -= STEP;
      const h = STEP / SUBSTEPS;
      for (let s = 0; s < SUBSTEPS; s += 1) {
        this.substep(h);
      }
      this.damp(STEP);
      this.track(STEP);
    }
    this.stepPinch(dt);
    if (!this.all.every((p) => Number.isFinite(p.x + p.y + p.z))) {
      this.reset();
    }
  }

  /** Fit the render transforms to the particles. */
  frame(): RigFrame {
    const { pose } = this;
    const potM = transpose(this.potRot);
    const bodyM = this.bodyLinear();
    const cy = bodyCentreY(pose);
    const bc: Vec3 = [0, cy, 0];
    const ainv = inverse3(this.bodyA) ?? IDENTITY;
    const bodyK = addScaled(
      mulMV(pose.gaze, sub(sub(this.bodyCl.restC, mulMV(ainv, this.bodyC)), bc)),
      bc,
      1,
    );
    const toQ = (p: Particle) => sub(addScaled(mulMV(bodyM, pos(p)), bodyK, 1), bc);
    const top = bodyTop(pose);
    const stemTip = toQ(this.stem);
    const leafBase = addScaled([0, top - 0.02, 0], sub(stemTip, [0, top, 0]), 0.92);
    const leafM = this.leaves.map((p, i) => {
      const leaf = pose.leaves[i];
      if (!leaf) {
        return IDENTITY;
      }
      const rest = leafRestFrame(leaf);
      const swing = rotBetween([rest[3], rest[4], rest[5]], normalize(sub(toQ(p), leafBase)));
      return mulMM(rest, transpose(swing));
    });
    const [l0 = IDENTITY, l1 = IDENTITY, l2 = IDENTITY] = leafM;
    return {
      bodyK,
      bodyM,
      bound: this.bound(),
      gap: this.gap(bodyM, bodyK, potM),
      head: this.bodyC,
      leafBase,
      leafM: [l0, l1, l2],
      pinchC: this.pinchC,
      pinchD: this.pinchD,
      potK: sub(this.potCl.restC, mulMV(potM, this.potC)),
      potM,
      shadow: [this.potC[0], this.potC[2], Math.min(...this.base.map((p) => p.y))],
      stemTip,
      warp: Math.max(1, spectralNorm(bodyM)),
    };
  }

  /** Raymarch the CPU copy of the SDF; the nearest part at the hit is what gets grabbed. */
  pick(ro: Vec3, rd: Vec3, frame: RigFrame): PlantHit | null {
    const [bx, by, bz, br] = frame.bound;
    const oc = sub(ro, [bx, by, bz]);
    const b = dot(oc, rd);
    const disc = b * b - (dot(oc, oc) - br * br);
    if (disc <= 0) {
      return null;
    }
    let t = Math.max(-b - Math.sqrt(disc), 0);
    const tEnd = -b + Math.sqrt(disc);
    for (let i = 0; i < 128 && t < tEnd; i += 1) {
      const p = addScaled(ro, rd, t);
      const { d, part } = this.sample(p, frame);
      if (d < 0.002) {
        return { part, point: p };
      }
      t += d * 0.9;
    }
    return null;
  }

  // ---- solver -----------------------------------------------------------------

  private substep(h: number) {
    for (const p of this.all) {
      p.ivy = p.vy;
      p.vy -= GRAVITY * p.grav * h;
      p.px = p.x;
      p.py = p.y;
      p.pz = p.z;
      p.x += p.vx * h;
      p.y += p.vy * h;
      p.z += p.vz * h;
    }
    this.solveGrips(h);
    this.solveBody(h);
    const spoke = (SPOKE_COMPLIANCE * (1.6 - this.firmness)) / (h * h);
    for (const p of this.body) {
      if (p !== this.centre) {
        solveDistance(this.centre, p, length(sub(restPos(p), restPos(this.centre))), spoke, false);
      }
    }
    const joint = JOINT_COMPLIANCE / (h * h);
    for (const [a, b] of this.joints) {
      solveDistance(a, b, length(sub(restPos(a), restPos(b))), joint, false);
    }
    const brace = (BRACE_COMPLIANCE * (1.6 - this.firmness)) / (h * h);
    for (const [a, b] of this.braces) {
      solveDistance(a, b, length(sub(restPos(a), restPos(b))), brace, false);
    }
    this.solveGreen(h);
    this.solvePot(h);
    for (const p of this.all) {
      this.collide(p);
    }
    for (const p of this.all) {
      this.settle(p, h);
    }
  }

  private solveGrips(h: number) {
    if (!this.target) {
      return;
    }
    const toAim = sub(this.aim, this.target);
    this.handV = addScaled(scale(this.handV, 1 - 2 * HAND_OMEGA * h), toAim, HAND_OMEGA ** 2 * h);
    const target = addScaled(this.target, this.handV, h);
    this.target = target;
    for (const { p, weight, offset, compliance } of this.grips) {
      const goal = addScaled(target, offset, 1);
      goal[1] = Math.max(goal[1], p.rad);
      nudge(p, sub(goal, pos(p)), (weight * p.w) / (p.w + compliance / (h * h)));
    }
  }

  /**
   * Affine shape matching of body + rim, volume-normalised: stretch it one way and it thins the
   * others, press it and it bulges. Then refit the body alone, which is what gets drawn.
   */
  private solveBody(h: number) {
    const { apq, c } = measure(this.fleshCl);
    const r = faceForward(extractRotation(apq, this.fleshCl.turn, 2));
    const a = mulMM(apq, this.fleshCl.aqqInv);
    const det = det3(a);
    const vol = det > 0.05 ? scaleM(a, 1 / Math.cbrt(det)) : r;
    const g = lerpM(r, vol, 0.5 - this.firmness * 0.3);
    const k = Math.min(1, 120 * 9 ** this.firmness * h * h);
    for (const { p, q } of this.fleshCl.members) {
      nudge(p, sub(addScaled(mulMV(g, q), c, 1), pos(p)), k);
    }
    this.fitBody(2);
  }

  /**
   * Stem and leaves chase their posed spots on springs. Each spot hangs off the particle it grows
   * from by its rest offset — turned with the body and gaze, never stretched — so a lean or a
   * stretch can't swing the goal further than the body itself moved (that loop gain above 1 is
   * what used to launch the plant). Held by a leaf, the held chain goes limp and ropes carry the
   * pull down the stem: a spring there would be an engine hauling the plant up its own rope.
   */
  private solveGreen(h: number) {
    const { pose } = this;
    const held = this.held === null ? null : this.leafOrStem(this.held);
    const base: Vec3 = [0, bodyCentreY(pose) + bodyTop(pose), 0];
    const turn = mulMM(this.bodyRot, transpose(pose.gaze));
    const hang = (anchor: Vec3, from: Vec3, s: Vec3) =>
      addScaled(anchor, mulMV(turn, sub(s, from)), 1);
    const stemRest = restPos(this.stem);
    if (held === null) {
      const stemGoal = hang(this.headPoint(base), base, stemRest);
      nudge(this.stem, sub(stemGoal, pos(this.stem)), Math.min(1, 700 * h * h));
    }
    for (const leaf of this.leaves) {
      if (leaf !== held) {
        const goal = hang(pos(this.stem), stemRest, restPos(leaf));
        nudge(leaf, sub(goal, pos(leaf)), Math.min(1, 260 * h * h));
      }
    }
    if (held === null) {
      return;
    }
    if (held !== this.stem) {
      solveDistance(this.stem, held, length(sub(restPos(held), stemRest)) * 1.1 + 0.01, 0, true);
    }
    solveDistance(this.top, this.stem, length(sub(stemRest, restPos(this.top))) * 1.35, 0, true);
  }

  /** The pot is rigid; left tipped over, it slowly rights itself like a weighted toy. */
  private solvePot(h: number) {
    const { apq, c } = measure(this.potCl);
    let r = faceForward(extractRotation(apq, this.potCl.turn, 3));
    const up: Vec3 = [r[1], r[4], r[7]];
    const tilt = Math.acos(clamp(up[1], -1, 1));
    if (this.held === null && tilt > 0.5) {
      const axis: Vec3 = [-up[2], 0, up[0]];
      const turn = Math.min(tilt - 0.5, 40 * tilt * h * h);
      r = mulMM(rotAxis(normalize(axis), turn), r);
    }
    for (const { p, q } of this.potCl.members) {
      [p.x, p.y, p.z] = addScaled(mulMV(r, q), c, 1);
    }
    this.potRot = r;
    this.potC = c;
  }

  private collide(p: Particle) {
    if (p.y < p.rad) {
      const pen = p.rad - p.y;
      p.y = p.rad;
      const dx = p.x - p.px;
      const dz = p.z - p.pz;
      const slide = Math.hypot(dx, dz);
      const keep =
        slide < FRICTION_STATIC * pen ? 0 : Math.max(0, 1 - (FRICTION_KINETIC * pen) / slide);
      p.x = p.px + dx * keep;
      p.z = p.pz + dz * keep;
    }
    p.x = clamp(p.x, -this.halfWidth, this.halfWidth);
    p.z = clamp(p.z, Z_FAR, Z_NEAR);
  }

  private settle(p: Particle, h: number) {
    let vx = (p.x - p.px) / h;
    let vy = (p.y - p.py) / h;
    let vz = (p.z - p.pz) / h;
    const speed = Math.hypot(vx, vy, vz);
    if (speed > MAX_SPEED) {
      const s = MAX_SPEED / speed;
      vx *= s;
      vy *= s;
      vz *= s;
    }
    if (p.ivy < -1.5 && p.y <= p.rad + 1e-4 && this.held === null) {
      vy = Math.max(vy, -p.ivy * RESTITUTION);
    }
    p.vx = vx;
    p.vy = vy;
    p.vz = vz;
  }

  /**
   * Bleed the body's deformation (velocity minus its best rigid motion) so wobbles settle, and
   * the stem and leaves relative to what they hang from. Falling, swinging and sliding are left
   * alone.
   */
  private damp(dt: number) {
    const calm = this.calm ? 2.2 : 1;
    const air = Math.exp(-0.25 * dt);
    for (const p of this.all) {
      p.vx *= air;
      p.vy *= air;
      p.vz *= air;
    }
    dampDeformation(this.body, Math.exp(-4.5 * calm * dt));
    // The body rocking on its joints is a rigid motion of the body alone, so it is damped as
    // deformation of pot + body together.
    dampDeformation(this.plant, Math.exp(-2.2 * calm * dt));
    dampToward(this.stem, this.centre, Math.exp(-3 * calm * dt));
    for (const leaf of this.leaves) {
      dampToward(leaf, this.stem, Math.exp(-2.6 * calm * dt));
    }
    if (this.calm) {
      dampDeformation(this.all, Math.exp(-3 * dt));
    }
  }

  private track(dt: number) {
    const low = Math.min(...this.base.map((p) => p.y));
    const vy = this.base.reduce((s, p) => s + p.vy, 0) / this.base.length;
    if (low > 0.004) {
      this.airTime += dt;
      this.fallSpeed = Math.max(this.fallSpeed, -vy);
      return;
    }
    if (this.airTime > 0.12) {
      this.landed = Math.max(this.landed, clamp(this.fallSpeed / 4, 0, 1));
    }
    this.airTime = 0;
    this.fallSpeed = 0;
  }

  /** The pinch chases whatever offset the body itself couldn't follow, on a springy return. */
  private stepPinch(dt: number) {
    let goal: Vec3 = [0, 0, 0];
    if (this.held === "body" && this.target) {
      const spot = this.headPoint(this.pinchC);
      const reach = addScaled(this.target, this.surface, 1);
      goal = clampLength(mulMV(this.bodyLinear(), sub(reach, spot)), PINCH_MAX);
    }
    const omega = 24;
    const zeta = this.calm ? 0.9 : 0.3;
    const n = Math.ceil(dt / (1 / 240));
    const h = dt / n;
    for (let i = 0; i < n; i += 1) {
      const acc = addScaled(
        scale(sub(goal, this.pinchD), omega * omega),
        this.pinchV,
        -2 * zeta * omega,
      );
      this.pinchV = addScaled(this.pinchV, acc, h);
      this.pinchD = clampLength(addScaled(this.pinchD, this.pinchV, h), PINCH_MAX * 1.4);
    }
  }

  // ---- frames -------------------------------------------------------------------

  private fitPot() {
    const { apq, c } = measure(this.potCl);
    this.potC = c;
    this.potRot = extractRotation(apq, this.potCl.turn, 4);
  }

  private fitBody(iterations: number) {
    const { apq, c } = measure(this.bodyCl);
    this.bodyC = c;
    this.bodyA = mulMM(apq, this.bodyCl.aqqInv);
    this.bodyRot = extractRotation(apq, this.bodyCl.turn, iterations);
  }

  /** World → design space, linear part: the body's inverse affine, then the gaze. */
  private bodyLinear() {
    return mulMM(this.pose.gaze, inverse3(this.bodyA) ?? IDENTITY);
  }

  /** A design-space point (stem, leaves, the pinched spot) carried out into the world. */
  private headPoint(s: Vec3): Vec3 {
    const bc: Vec3 = [0, bodyCentreY(this.pose), 0];
    const rest = addScaled(mulMV(transpose(this.pose.gaze), sub(s, bc)), bc, 1);
    return addScaled(mulMV(this.bodyA, sub(rest, this.bodyCl.restC)), this.bodyC, 1);
  }

  private toDesign(p: Vec3): Vec3 {
    const bc: Vec3 = [0, bodyCentreY(this.pose), 0];
    const ainv = inverse3(this.bodyA) ?? IDENTITY;
    const rest = addScaled(mulMV(ainv, sub(p, this.bodyC)), this.bodyCl.restC, 1);
    return addScaled(mulMV(this.pose.gaze, sub(rest, bc)), bc, 1);
  }

  private leafOrStem(part: PlantPart) {
    switch (part) {
      case "stem": {
        return this.stem;
      }
      case "leaf0": {
        return this.leaves[0];
      }
      case "leaf1": {
        return this.leaves[1];
      }
      case "leaf2": {
        return this.leaves[2];
      }
      default: {
        return null;
      }
    }
  }

  /** How far the body's frame and the pot's disagree at the rim, design space. */
  private gap(bodyM: Mat3, bodyK: Vec3, potM: Mat3) {
    const potK = sub(this.potCl.restC, mulMV(potM, this.potC));
    let gap = 0;
    for (const p of this.rim) {
      const viaBody = addScaled(mulMV(bodyM, pos(p)), bodyK, 1);
      const viaPot = addScaled(mulMV(potM, pos(p)), potK, 1);
      gap = Math.max(gap, length(sub(viaBody, viaPot)));
    }
    return gap;
  }

  private bound(): [number, number, number, number] {
    const span = (axis: (p: Particle) => number) => {
      const vs = this.all.map(axis);
      return [Math.min(...vs), Math.max(...vs)] as const;
    };
    const [x0, x1] = span((p) => p.x);
    const [y0, y1] = span((p) => p.y);
    const [z0, z1] = span((p) => p.z);
    const reach = Math.hypot(x1 - x0, y1 - y0, z1 - z0) / 2;
    return [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, reach + 0.34 + length(this.pinchD)];
  }

  /** The scene SDF on the CPU, mirroring the shader (minus breathing and the pinch). */
  private sample(p: Vec3, frame: RigFrame) {
    const { pose } = this;
    const xp = addScaled(mulMV(frame.potM, p), frame.potK, 1);
    const xb = addScaled(mulMV(frame.bodyM, p), frame.bodyK, 1);
    const t = clamp((xp[1] - BLEND_LO) / (BLEND_HI - BLEND_LO), 0, 1);
    const q = sub(addScaled(xp, sub(xb, xp), t * t * (3 - 2 * t)), [0, bodyCentreY(pose), 0]);
    const k = 1 / (frame.warp * (1 + (6 * t * (1 - t) * frame.gap) / (BLEND_HI - BLEND_LO)));
    const rb = pose.bodyR;
    const top = bodyTop(pose);
    const pot = sdPot(xp);
    const body = sdEllipsoid(q, [rb, rb * pose.squash, rb]) * k;
    const parts: [PlantPart, number][] = [
      ["pot", pot],
      ["body", body],
    ];
    const stem = sdCapsule(q, [0, top, 0], frame.stemTip, 0.035);
    const knob = length(sub(q, frame.stemTip)) - clamp(pose.stemH * 10, 0, 1) * 0.05;
    let green = smin(stem, knob, 0.03) * k;
    parts.push(["stem", green]);
    for (const [i, leaf] of pose.leaves.entries()) {
      const lq = mulMV(frame.leafM[i] ?? IDENTITY, sub(q, frame.leafBase));
      const ll = leaf.len * leaf.s;
      const ww = leaf.wid * leaf.s;
      const r: Vec3 = [ww, ll * 0.6, ww * 0.45];
      const d = sdEllipsoid([lq[0], lq[1] - (ll * 0.55 + 0.02), lq[2]], r) * k;
      green = Math.min(green, d);
      parts.push([LEAF_PARTS[i] ?? "stem", d]);
    }
    const aq: Vec3 = [Math.abs(q[0]) - rb * 0.92, q[1] + rb * pose.squash * 0.05, q[2]];
    const armS = Math.max(pose.armS, 0.001);
    const arm = sdCapsule(aq, [0, 0, 0], [0, armS * 0.26, 0], armS * 0.095) * k;
    parts.push(["body", arm]);
    const d = Math.min(pot, smin(smin(body, green, 0.045), arm, 0.07));
    let best: [PlantPart, number] = ["pot", Infinity];
    for (const part of parts) {
      if (part[1] < best[1]) {
        best = part;
      }
    }
    return { d, part: best[0] };
  }
}
