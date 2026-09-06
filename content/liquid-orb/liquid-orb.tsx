"use client";

import { useEffect, useRef } from "react";

// The flow fields and glass shell are ported from LerSent001/orb (MIT),
// rewritten from WebGPU/WGSL to WebGL2/GLSL so they run everywhere, with a
// morph pipeline added on top: every material parameter tweens between
// presets while the two flow fields crossfade, so the orb transforms
// instead of cutting.

export type LiquidOrbPreset =
  | "siri"
  | "chrome"
  | "aurora"
  | "violetEmber"
  | "blueDrop"
  | "opal"
  | "plasma";

/** Display names for each preset, for captions and controls. */
export const presetLabel: Record<LiquidOrbPreset, string> = {
  siri: "Siri",
  chrome: "Chrome",
  aurora: "Aurora",
  violetEmber: "Violet Ember",
  blueDrop: "Blue Drop",
  opal: "Opal",
  plasma: "Plasma",
};

/** Cycle order — adjacent presets are chosen for maximum material contrast. */
export const presetOrder: readonly LiquidOrbPreset[] = [
  "siri",
  "chrome",
  "aurora",
  "violetEmber",
  "blueDrop",
  "opal",
  "plasma",
];

/**
 * Configuration options for the liquid orb.
 * All fields are optional and fall back to sensible defaults.
 */
export type LiquidOrbConfig = {
  /** Preset to start on. @default "siri" */
  preset?: LiquidOrbPreset;
  /** Continuously morph through every preset. @default true */
  cycle?: boolean;
  /** Seconds each preset holds before morphing. @default 1.8 */
  holdDuration?: number;
  /** Seconds a morph between presets takes. @default 1.25 */
  morphDuration?: number;
  /** Global time multiplier on top of each preset's own speed. @default 1 */
  speed?: number;
  /** Refractive glass shell with chromatic edge dispersion. @default true */
  glass?: boolean;
  /** Halo strength past the orb's limb, in the preset's glow color. @default 0.55 */
  glow?: number;
  /** Fired when a morph toward a new preset begins. */
  onPresetChange?: (preset: LiquidOrbPreset) => void;
};

const defaults = {
  preset: "siri" as LiquidOrbPreset,
  cycle: true,
  holdDuration: 1.8,
  morphDuration: 1.25,
  speed: 1,
  glass: true,
  glow: 0.55,
};

type PresetSpec = {
  speed: number;
  radius: number;
  contourDeform: number;
  zoom: number;
  warp: number;
  ridgeAmt: number;
  sharp: number;
  shade: number;
  sheen: number;
  gloss: number;
  glassOpacity: number;
  shellMidAlpha: number;
  shellEdgeAlpha: number;
  exposure: number;
  colorA: string;
  colorB: string;
  colorC: string;
  colorD: string;
  highlight: string;
  shellInner: string;
  shellMid: string;
  shellEdge: string;
  sheenColor: string;
  specColor: string;
  canvasColor: string;
  glowColor: string;
};

// Preset values carried over verbatim from the source editor's style bank.
const base = {
  radius: 0.72,
  contourDeform: 0,
  highlight: "#FFFFFF",
  shellInner: "#FFFFFF",
  sheenColor: "#EAF4FF",
  specColor: "#DCEAFF",
};

const presets: Record<LiquidOrbPreset, PresetSpec> = {
  siri: {
    ...base,
    speed: 0.82,
    zoom: 0.36,
    warp: 3.2,
    ridgeAmt: 0.5,
    sharp: 2.2,
    shade: 0.12,
    sheen: 0.28,
    gloss: 0.24,
    glassOpacity: 0.44,
    shellMidAlpha: 0.18,
    shellEdgeAlpha: 0.18,
    exposure: 2,
    colorA: "#FFD86B",
    colorB: "#82F4FF",
    colorC: "#FF7BD5",
    colorD: "#8E6CFF",
    shellMid: "#9BF4FF",
    shellEdge: "#C5A9FF",
    canvasColor: "#030409",
    glowColor: "#956CFF",
  },
  chrome: {
    ...base,
    speed: 2,
    zoom: 0.36,
    warp: 3.8,
    ridgeAmt: 0.44,
    sharp: 5.2,
    shade: 0.58,
    sheen: 0.36,
    gloss: 0.28,
    glassOpacity: 0.42,
    shellMidAlpha: 0.2,
    shellEdgeAlpha: 0.22,
    exposure: 1.08,
    colorA: "#FFFFFF",
    colorB: "#B9C0CA",
    colorC: "#343A43",
    colorD: "#030405",
    shellMid: "#B9C0CA",
    shellEdge: "#FFFFFF",
    canvasColor: "#050608",
    glowColor: "#FFFFFF",
  },
  aurora: {
    ...base,
    speed: 3,
    contourDeform: 0.08,
    zoom: 0.4,
    warp: 4.2,
    ridgeAmt: 0.62,
    sharp: 2.1,
    shade: 0.18,
    sheen: 0.36,
    gloss: 0.28,
    glassOpacity: 0.42,
    shellMidAlpha: 0.2,
    shellEdgeAlpha: 0.22,
    exposure: 1.18,
    colorA: "#030816",
    colorB: "#20F0B6",
    colorC: "#32A8FF",
    colorD: "#A34BFF",
    shellMid: "#32A8FF",
    shellEdge: "#20F0B6",
    canvasColor: "#010207",
    glowColor: "#20F0B6",
  },
  violetEmber: {
    ...base,
    speed: 1.12,
    contourDeform: 0.04,
    zoom: 0.58,
    warp: 4.7,
    ridgeAmt: 0.73,
    sharp: 3.3,
    shade: 0.18,
    sheen: 0.2,
    gloss: 0.34,
    glassOpacity: 0.62,
    shellMidAlpha: 0.28,
    shellEdgeAlpha: 0.24,
    exposure: 1.28,
    colorA: "#100016",
    colorB: "#4A0E8F",
    colorC: "#A52EFF",
    colorD: "#F1A7FF",
    highlight: "#FFD6FF",
    shellInner: "#FCF5FF",
    shellMid: "#C257FF",
    shellEdge: "#6C2DFF",
    sheenColor: "#F8E6FF",
    specColor: "#D4B7FF",
    canvasColor: "#030006",
    glowColor: "#A52EFF",
  },
  blueDrop: {
    ...base,
    speed: 0.9,
    radius: 0.74,
    contourDeform: 0.08,
    zoom: 0.48,
    warp: 2.65,
    ridgeAmt: 0.42,
    sharp: 2.4,
    shade: 0.16,
    sheen: 0.22,
    gloss: 0.42,
    glassOpacity: 0.66,
    shellMidAlpha: 0.32,
    shellEdgeAlpha: 0.24,
    exposure: 1.24,
    colorA: "#020B1D",
    colorB: "#0756B8",
    colorC: "#1EC8FF",
    colorD: "#DDFBFF",
    highlight: "#EAFBFF",
    shellInner: "#F6FDFF",
    shellMid: "#4FD7FF",
    shellEdge: "#466DFF",
    sheenColor: "#DDFBFF",
    specColor: "#A8D9FF",
    canvasColor: "#010207",
    glowColor: "#168DFF",
  },
  opal: {
    ...base,
    speed: 1.5,
    zoom: 0.3,
    warp: 2.8,
    ridgeAmt: 0.36,
    sharp: 2,
    shade: 0.1,
    sheen: 0.3,
    gloss: 0.26,
    glassOpacity: 0.38,
    shellMidAlpha: 0.2,
    shellEdgeAlpha: 0.2,
    exposure: 1.12,
    colorA: "#FFF6E8",
    colorB: "#6EF2CF",
    colorC: "#FF91D8",
    colorD: "#756BFF",
    shellMid: "#CDE5FF",
    shellEdge: "#D9C8FF",
    canvasColor: "#07080D",
    glowColor: "#9E8CFF",
  },
  plasma: {
    ...base,
    speed: 1.32,
    contourDeform: 0.05,
    zoom: 0.55,
    warp: 5.4,
    ridgeAmt: 0.78,
    sharp: 4.2,
    shade: 0.16,
    sheen: 0.36,
    gloss: 0.28,
    glassOpacity: 0.42,
    shellMidAlpha: 0.2,
    shellEdgeAlpha: 0.22,
    exposure: 1.25,
    colorA: "#06020E",
    colorB: "#0099FF",
    colorC: "#258BFF",
    colorD: "#1375FF",
    shellInner: "#FFFFFF",
    shellMid: "#1951C2",
    shellEdge: "#00E9FF",
    canvasColor: "#020105",
    glowColor: "#0099FF",
  },
};

// Style indices the shader dispatches on — must match presetFluid() below.
const styleIndex: Record<LiquidOrbPreset, number> = {
  siri: 0,
  aurora: 1,
  plasma: 2,
  chrome: 3,
  opal: 4,
  blueDrop: 5,
  violetEmber: 6,
};

const scalarKeys = [
  "speed",
  "radius",
  "contourDeform",
  "zoom",
  "warp",
  "ridgeAmt",
  "sharp",
  "shade",
  "sheen",
  "gloss",
  "glassOpacity",
  "shellMidAlpha",
  "shellEdgeAlpha",
  "exposure",
] as const;

const colorKeys = [
  "colorA",
  "colorB",
  "colorC",
  "colorD",
  "highlight",
  "shellInner",
  "shellMid",
  "shellEdge",
  "sheenColor",
  "specColor",
  "canvasColor",
  "glowColor",
] as const;

// Uniform names aligned with scalarKeys[1..] (speed stays CPU-side).
const scalarUniforms = [
  "uRadius",
  "uContourDeform",
  "uZoom",
  "uWarp",
  "uRidgeAmt",
  "uSharp",
  "uShade",
  "uSheen",
  "uGloss",
  "uGlassOpacity",
  "uShellMidAlpha",
  "uShellEdgeAlpha",
  "uExposure",
] as const;

const colorUniforms = [
  "uColorA",
  "uColorB",
  "uColorC",
  "uColorD",
  "uHighlight",
  "uShellInner",
  "uShellMid",
  "uShellEdge",
  "uSheenColor",
  "uSpecColor",
  "uCanvasColor",
  "uGlowColor",
] as const;

const COLOR_BASE = scalarKeys.length;
const VEC_SIZE = COLOR_BASE + colorKeys.length * 3;

const hexToRgb = (hex: string): [number, number, number] => {
  const v = hex.slice(1);
  return [
    Number.parseInt(v.slice(0, 2), 16) / 255,
    Number.parseInt(v.slice(2, 4), 16) / 255,
    Number.parseInt(v.slice(4, 6), 16) / 255,
  ];
};

const presetVec = (spec: PresetSpec): Float32Array => {
  const out = new Float32Array(VEC_SIZE);
  scalarKeys.forEach((key, i) => {
    out[i] = spec[key];
  });
  colorKeys.forEach((key, i) => {
    out.set(hexToRgb(spec[key]), COLOR_BASE + i * 3);
  });
  return out;
};

const presetVecs = Object.fromEntries(
  (Object.keys(presets) as LiquidOrbPreset[]).map((name) => [name, presetVec(presets[name])]),
) as Record<LiquidOrbPreset, Float32Array>;

const vertexSrc = `#version 300 es
void main() {
  vec2 v = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(v * 2.0 - 1.0, 0.0, 1.0);
}
`;

// The style pair is compiled in via STYLE_A/STYLE_B defines rather than
// dispatched on uniforms: software rasterizers (SwiftShader) execute every
// branch of a uniform if-chain per pixel, which made one style cost as much
// as all seven. Specialized programs are compiled lazily per cycle segment
// and cached.
const fragmentBody = `precision highp float;

uniform vec2 uSize;
uniform float uTime;
uniform float uStyleMix;
uniform float uGlass;
uniform float uGlow;

uniform float uRadius;
uniform float uContourDeform;
uniform float uZoom;
uniform float uWarp;
uniform float uRidgeAmt;
uniform float uSharp;
uniform float uShade;
uniform float uSheen;
uniform float uGloss;
uniform float uGlassOpacity;
uniform float uShellMidAlpha;
uniform float uShellEdgeAlpha;
uniform float uExposure;

uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform vec3 uColorD;
uniform vec3 uHighlight;
uniform vec3 uShellInner;
uniform vec3 uShellMid;
uniform vec3 uShellEdge;
uniform vec3 uSheenColor;
uniform vec3 uSpecColor;
uniform vec3 uCanvasColor;
uniform vec3 uGlowColor;

out vec4 outColor;

const float GL_KA = 6.0;
const float GL_KG = 4.1209;
const float GL_KR = 0.32;
const float GL_GH = 1.73205081;
const float GL_CLEAR_EA = 0.995;
const float GL_CLEAR_EB = 1.04;

// ── liquid noise bank ───────────────────────────────────────────────────────
float lqHash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float lqNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(lqHash(i), lqHash(i + vec2(1.0, 0.0)), f.x),
             mix(lqHash(i + vec2(0.0, 1.0)), lqHash(i + vec2(1.0, 1.0)), f.x), f.y);
}

// Pre-blurred fbm: .x the attenuated value, .y the standard deviation of the
// detail the attenuation removed, for nonlinearities to integrate back out.
vec2 lqFbm(vec2 p, float bs) {
  float s = 0.0;
  float a = 0.5;
  float m = 0.0;
  float vr = 0.0;
  float e = -GL_KA * bs * bs;
  float g = 1.0;
  for (int i = 0; i < 5; i++) {
    float b = exp(e * g);
    s += a * (0.5 + b * (lqNoise(p) - 0.5));
    vr += a * a * (1.0 - b * b);
    m += a;
    a *= 0.5;
    g *= GL_KG;
    p = vec2(0.8 * p.x - 0.6 * p.y, 0.6 * p.x + 0.8 * p.y) * 2.03;
  }
  return vec2(s / m, GL_KR * sqrt(vr) / m);
}

float lqRidge(float v, float k) {
  return pow(clamp(1.0 - abs(v * 2.0 - 1.0), 0.0, 1.0), k);
}

// Three-point Gauss-Hermite over the removed detail, so ridged filaments
// spread as they dim instead of just dimming.
float lqRidgeS(vec2 vs, float k) {
  float d = GL_GH * vs.y;
  return (lqRidge(vs.x - d, k) + 4.0 * lqRidge(vs.x, k) + lqRidge(vs.x + d, k)) / 6.0;
}

vec3 lqRamp(float v, vec3 cA, vec3 cB, vec3 cC, vec3 cD) {
  vec3 c = mix(cA, cB, smoothstep(0.0, 0.45, v));
  c = mix(c, cC, smoothstep(0.38, 0.72, v));
  c = mix(c, cD, smoothstep(0.68, 1.0, v));
  return c;
}

vec2 rot2(vec2 p, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}

vec3 finishPreset(vec3 colorIn, vec2 p) {
  vec3 color = colorIn;
  color = mix(color, uHighlight, uShade * 0.22 * smoothstep(0.15, 1.15, dot(p, vec2(-0.32, 0.78))));
  color *= 1.0 - uShade * 0.34 * smoothstep(-0.1, 1.2, dot(p, vec2(0.45, -0.62)));
  color *= 1.0 - uShade * 0.22 * smoothstep(0.72, 1.08, length(p));
  return clamp(color, 0.0, 1.0);
}

vec3 finishEmission(vec3 colorIn, vec2 p) {
  vec3 color = colorIn;
  if (uGlass > 0.5) {
    color = mix(color, uHighlight, uShade * 0.22 * smoothstep(0.15, 1.15, dot(p, vec2(-0.32, 0.78))));
  }
  color *= 1.0 - uShade * 0.34 * smoothstep(-0.1, 1.2, dot(p, vec2(0.45, -0.62)));
  color *= 1.0 - uShade * 0.22 * smoothstep(0.72, 1.08, length(p));
  return clamp(color, 0.0, 1.0);
}

// ── preset flow fields ──────────────────────────────────────────────────────
vec2 siriBand(vec2 q, float drift, float phaseOffset, float amplitude,
              float mainY, float envelope, float softness) {
  float y = amplitude * envelope * sin(q.x + drift + phaseOffset);
  float distanceToLine = abs(q.y - y);
  float line = 0.018 / (sqrt(distanceToLine * distanceToLine + softness * softness) + 0.026);
  float bandDistance = max(0.0, max(q.y - max(mainY, y), min(mainY, y) - q.y));
  float band = 0.018 / (bandDistance + 0.075);
  return vec2(line, band);
}

vec3 siriFluid(vec2 p, float t) {
  float scale = 0.74 + uZoom * 0.34;
  vec2 q = p / scale;
  float envelopeBase = cos(1.57079633 * min(abs(0.9 * q.x), 1.0));
  float envelope = envelopeBase * envelopeBase;
  float low = 0.5 + 0.5 * cos(t * 0.37);
  float mid = 0.5 + 0.5 * sin(t * 0.51 + 1.2);
  float high = 0.5 + 0.5 * cos(t * 0.73 + 2.1);
  float drift = t * 2.4;
  float mainAmplitude = 0.25 + uRidgeAmt * 0.075 + low * 0.018;
  float bandAmplitude = mainAmplitude + mid * 0.025 + high * 0.018;
  float mainY = mainAmplitude * envelope * sin(q.x * 1.1 + drift);
  float separation = 1.85 + uWarp * 0.2 + mid * 0.28;
  float softness = 0.035 + (1.0 - uRidgeAmt) * 0.018 + mid * 0.006;
  vec2 band0 = siriBand(q, drift, -separation, bandAmplitude, mainY, envelope, softness);
  vec2 band1 = siriBand(q, drift, -separation * 0.34, bandAmplitude, mainY, envelope, softness);
  vec2 band2 = siriBand(q, drift, separation * 0.34, bandAmplitude, mainY, envelope, softness);
  vec2 band3 = siriBand(q, drift, separation, bandAmplitude, mainY, envelope, softness);
  float w0 = band0.x + band0.y;
  float w1 = band1.x + band1.y;
  float w2 = band2.x + band2.y;
  float w3 = band3.x + band3.y;
  float total = w0 + w1 + w2 + w3;
  float d0 = w0 * w0;
  float d1 = w1 * w1;
  float d2 = w2 * w2;
  float d3 = w3 * w3;
  float dTotal = d0 + d1 + d2 + d3;
  vec3 spectral = (uColorA * d0 + uColorC * d1 + uColorB * d2 + uColorD * d3) / max(dTotal, 0.0001);
  float energy = (1.0 - exp(-total * 0.58)) * envelope;
  float mainDistance = abs(q.y - mainY);
  float whiteCore = exp(-mainDistance * mainDistance / 0.0028) * envelope;
  float glassFill = uGlass > 0.5 ? 1.0 : 0.0;
  vec3 atmosphere = mix(uColorD, uColorB, smoothstep(-0.7, 0.7, q.y)) * 0.018 * glassFill;
  vec3 color = atmosphere + spectral * energy * 1.14;
  color += uHighlight * whiteCore * (0.18 + 0.1 * low);
  float emissionMask = mix(smoothstep(0.08, 0.25, energy + whiteCore * 0.12), 1.0, glassFill);
  color *= emissionMask;
  color = color / (vec3(1.0) + color * 0.18);
  return finishEmission(color, p);
}

float auroraLayer(vec2 p, float t, float off) {
  float drift = t * 0.18 + off * 2.5;
  float wave1 = sin(p.x * (2.0 + uWarp * 0.13) + drift + off * 6.0) * 0.25;
  float wave2 = sin(p.x * 3.7 + drift * 1.3 + off * 4.0) * 0.12;
  float wave3 = sin(p.x * 7.2 + drift * 0.7 + off * 8.0) * 0.055;
  float noiseValue = lqFbm(vec2(p.x * 1.6 + drift * 0.35, p.y * 0.8 + off * 3.0), 0.018).x;
  float center = off * 0.46 + wave1 + wave2 + wave3 + (noiseValue - 0.5) * 0.28;
  float dist = abs(p.y - center);
  float curtain = exp(-dist * dist * (13.0 - 5.0 * uRidgeAmt));
  float shimmer = lqFbm(vec2(p.x * 4.0 + t * 0.22, p.y * 7.0 + off * 5.0), 0.012).x;
  return curtain * (0.64 + 0.36 * shimmer);
}

vec3 auroraFluid(vec2 p, float t) {
  vec2 q = p * (0.82 + uZoom * 0.58);
  float l0 = auroraLayer(q, t, -0.72);
  float l1 = auroraLayer(q, t, 0.0);
  float l2 = auroraLayer(q, t, 0.72);
  vec3 color = uColorA * (0.46 + 0.18 * (q.y + 1.0));
  color += uColorB * l0 * 1.3;
  color += uColorC * l1 * 1.15;
  color += uColorD * l2 * 1.2;
  color += mix(uColorB, uColorD, 0.5) * min(l0 * l2, l1) * 0.65;
  vec2 starUv = (q + vec2(1.0)) * 18.0;
  float starHash = lqHash(floor(starUv));
  vec2 starF = fract(starUv) - vec2(0.5);
  float starPoint = exp(-dot(starF, starF) * 90.0);
  float stars = step(0.965, starHash) * starPoint
              * (0.55 + 0.45 * sin(t * (1.0 + starHash * 2.0) + starHash * 6.28));
  color += uHighlight * stars * (1.0 - clamp(l0 + l1 + l2, 0.0, 1.0));
  color = color / (vec3(1.0) + color * 0.28);
  return finishPreset(color, p);
}

float neuroShape(vec2 pIn, float t) {
  vec2 p = pIn * (0.34 + 0.08 * uZoom);
  vec2 sineAccum = vec2(0.0);
  vec2 result = vec2(0.0);
  float scale = 8.0;
  for (int j = 0; j < 11; j++) {
    p = rot2(p, 1.0);
    sineAccum = rot2(sineAccum, 1.0);
    vec2 layer = p * scale + vec2(float(j)) + sineAccum - vec2(t * 0.34);
    sineAccum += sin(layer);
    result += (vec2(0.5) + 0.5 * cos(layer)) / scale;
    scale *= 1.16;
  }
  return result.x + result.y;
}

vec3 plasmaFluid(vec2 p, float t) {
  float shape = neuroShape(p, t);
  float phase = shape * (10.0 + uWarp) + p.x * 1.7 - p.y * 1.3 - t * 0.52;
  float ridgeWidth = 0.62 - 0.24 * uRidgeAmt;
  float primary = pow(abs(cos(phase)), max(1.3, uSharp * ridgeWidth));
  float secondary = pow(abs(cos(phase * 0.53 + atan(p.y, p.x) * 2.0 + t * 0.21)),
                        max(1.6, uSharp * (ridgeWidth + 0.1)));
  float filaments = max(primary, secondary * 0.64);
  float core = pow(primary, 4.0);
  float polarity = 0.5 + 0.5 * sin(phase * 0.37 + shape * 3.0);
  vec3 color = mix(uColorA * 0.42, uColorD * 0.48, polarity * 0.46);
  color = mix(color, uColorB, filaments * 0.72);
  color = mix(color, uColorC, core * 0.68);
  color += uHighlight * pow(core, 3.0) * 0.16;
  color = color / (vec3(1.0) + color * 0.34);
  return finishPreset(color, p);
}

vec3 chromeFluid(vec2 p, float t) {
  vec2 q = p * (1.0 + uZoom * 0.35);
  float amplitude = 0.028 * uWarp;
  for (int i = 1; i <= 9; i++) {
    float fi = float(i);
    q.x += amplitude / fi * cos(fi * 2.7 * q.y + t * 0.46);
    q.y += amplitude / fi * cos(fi * 3.1 * q.x - t * 0.4);
  }
  float denominator = max(abs(sin(t * 0.24 - q.y - q.x)), 0.045);
  float flare = clamp(1.0 / denominator, 0.0, 18.0);
  float metal = smoothstep(1.15, 7.5, flare);
  float fold = 0.5 + 0.5 * cos((q.x - q.y) * (3.2 + uSharp * 0.28) + t * 0.32);
  float value = clamp(metal * 0.74 + fold * 0.36, 0.0, 1.0);
  vec3 color = lqRamp(value, uColorD, uColorC, uColorB, uColorA);
  color = mix(color, uColorA, pow(metal, 5.0) * 0.62);
  return finishPreset(color, p);
}

vec3 opalFluid(vec2 p, float t) {
  vec2 q = p * (0.8 + uZoom * 0.64);
  float complexity = 0.76 + uWarp * 0.085;
  float d = -t * 0.42;
  float a = 0.0;
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    a += cos(fi - d - a * q.x * complexity);
    d += sin(q.y * fi * complexity + a);
  }
  d += t * 0.42;
  vec2 c1 = cos(q * vec2(d, a)) * 0.6 + vec2(0.4);
  float c2 = cos(a + d) * 0.5 + 0.5;
  vec3 interference = 0.5 + 0.5 * cos(vec3(c1, c2) * cos(vec3(d, a, 2.5)) * 0.5 + vec3(0.5));
  float tone = fract(interference.r * 0.37 + interference.g * 0.51
                     + interference.b * 0.73 + c1.x * 0.22 - c1.y * 0.15);
  vec3 color = lqRamp(tone, uColorB, uColorC, uColorD, uColorA);
  color = mix(color, uColorA, 0.16 + 0.1 * interference.b);
  color = color / (vec3(1.0) + color * 0.16);
  return finishPreset(color, p);
}

vec3 blueDropFluid(vec2 p, float t) {
  float depth = sqrt(max(1.0 - clamp(dot(p, p), 0.0, 1.0), 0.0));
  vec2 q = p * mix(0.72, 1.0, depth * 0.62 + 0.38);
  q = rot2(q, -0.24 + 0.06 * sin(t * 0.17));
  float scale = 1.0 + uZoom * 1.12;
  float blur = 0.012 + 0.006 * uZoom;
  vec2 driftA = lqFbm(q * 1.28 + vec2(t * 0.095, -t * 0.034), blur * 1.28);
  vec2 driftB = lqFbm(rot2(q, 1.08) * 1.62 + vec2(-t * 0.042, t * 0.078), blur * 1.62);
  vec2 flowed = q + vec2(driftA.x - 0.5, driftB.x - 0.5) * (0.24 + uWarp * 0.1);
  flowed.x += sin(flowed.y * 2.15 + t * 0.24) * (0.035 + uWarp * 0.012);
  flowed.y += sin(flowed.x * 1.38 - t * 0.18) * (0.045 + uWarp * 0.01);
  vec2 body = lqFbm(flowed * scale + vec2(t * 0.025, -t * 0.018), blur * scale);
  float marble = lqRidgeS(lqFbm(flowed * (1.72 + uZoom * 0.9) + vec2(2.7, -t * 0.035),
                                blur * (1.72 + uZoom * 0.9)),
                          0.8 + uSharp * 0.46);
  float value = clamp(mix(body.x, body.x * 0.62 + marble * 0.58, uRidgeAmt), 0.0, 1.0);
  vec3 color = lqRamp(value, uColorA, uColorB, uColorC, uColorD);
  float light = pow(max(dot(normalize(vec3(p, depth)), normalize(vec3(-0.48, 0.62, 0.92))), 0.0), 3.2);
  color = mix(color, uHighlight, light * (0.035 + 0.05 * uShade));
  color *= 0.74 + 0.26 * depth;
  return finishPreset(color, p);
}

vec3 violetEmberFluid(vec2 p, float t) {
  float scale = 1.08 + uZoom * 1.18;
  float blur = 0.011 + 0.005 * uZoom;
  float radius = length(p);
  float twist = t * 0.055 + radius * (0.72 + uWarp * 0.11) + 0.08 * sin(t * 0.31 + radius * 4.0);
  vec2 q = rot2(p * scale, twist);
  vec2 low = lqFbm(q * 1.18 + vec2(t * 0.068, -t * 0.105), blur * 1.18);
  vec2 crossFlow = lqFbm(rot2(q, -1.12) * 1.52 + vec2(-t * 0.094, t * 0.042)
                         + vec2(low.x * 1.35, -low.x * 0.72), blur * 1.52);
  vec2 warped = q + vec2(low.x - 0.5, crossFlow.x - 0.5) * (0.3 + uWarp * 0.12);
  vec2 melt = lqFbm(warped * 1.34 + vec2(crossFlow.x * 1.48, low.x * 1.12), blur * 1.34);
  float veins = lqRidgeS(lqFbm(warped * (2.05 + uZoom * 0.72) + vec2(-2.1, t * 0.052),
                               blur * (2.05 + uZoom * 0.72)),
                         0.82 + uSharp * 0.58);
  float heat = smoothstep(0.18, 0.92,
                          melt.x * (0.72 - uRidgeAmt * 0.16) + veins * (0.32 + uRidgeAmt * 0.5));
  vec3 color = lqRamp(heat, uColorA, uColorB, uColorC, uColorD);
  float pulse = 0.94 + 0.06 * sin(t * 0.44 + melt.x * 5.0);
  color *= pulse;
  color = mix(color, uHighlight, pow(veins, 4.0) * 0.045);
  return finishPreset(color, p);
}

vec3 presetFluidA(vec2 p, float t) {
#if STYLE_A == 0
  return siriFluid(p, t);
#elif STYLE_A == 1
  return auroraFluid(p, t);
#elif STYLE_A == 2
  return plasmaFluid(p, t);
#elif STYLE_A == 3
  return chromeFluid(p, t);
#elif STYLE_A == 4
  return opalFluid(p, t);
#elif STYLE_A == 5
  return blueDropFluid(p, t);
#else
  return violetEmberFluid(p, t);
#endif
}

vec3 presetFluidB(vec2 p, float t) {
#if STYLE_B == 0
  return siriFluid(p, t);
#elif STYLE_B == 1
  return auroraFluid(p, t);
#elif STYLE_B == 2
  return plasmaFluid(p, t);
#elif STYLE_B == 3
  return chromeFluid(p, t);
#elif STYLE_B == 4
  return opalFluid(p, t);
#elif STYLE_B == 5
  return blueDropFluid(p, t);
#else
  return violetEmberFluid(p, t);
#endif
}

// Crossfade of the two flow fields; a solo (A == B) program pays for one.
vec3 fluidMix(vec2 p, float t) {
#if STYLE_A == STYLE_B
  return presetFluidA(p, t);
#else
  return mix(presetFluidA(p, t), presetFluidB(p, t), uStyleMix);
#endif
}

// ── glass shell ─────────────────────────────────────────────────────────────
vec3 over(vec3 dst, vec3 src, float a) {
  float k = clamp(a, 0.0, 1.0);
  return src * k + dst * (1.0 - k);
}

float refractionProfile(float t) {
  float depth = clamp(t, 0.0, 1.0);
  float circular = sqrt(max(1.0 - (1.0 - depth) * (1.0 - depth), 0.0));
  return 1.0 - circular;
}

float highlightLobe(vec2 n, vec2 direction, float cut, float strength) {
  float angular = clamp((dot(n, direction) - cut) / max(1.0 - cut, 0.001), 0.0, 1.0);
  return pow(angular, strength);
}

vec2 contourWave(float angle, float t) {
  float wave = sin(angle * 3.0 + t * 0.62) * 0.52
             + sin(angle * 5.0 - t * 0.41 + 1.7) * 0.31
             + sin(angle * 2.0 + t * 0.23 + 3.1) * 0.17;
  float slope = cos(angle * 3.0 + t * 0.62) * 1.56
              + cos(angle * 5.0 - t * 0.41 + 1.7) * 1.55
              + cos(angle * 2.0 + t * 0.23 + 3.1) * 0.34;
  return vec2(wave, slope);
}

float contourStrengthMixed() {
  return mix(STYLE_A >= 5 ? 0.11 : 0.09, STYLE_B >= 5 ? 0.11 : 0.09, uStyleMix);
}

float contourScale(vec2 uv, float t, float amount) {
  if (amount <= 0.0) { return 1.0; }
  vec2 c = contourWave(atan(uv.y, uv.x), t);
  return 1.0 + clamp(amount, 0.0, 1.0) * contourStrengthMixed() * c.x;
}

vec2 contourNormal(vec2 uv, float rad, float t, float amount) {
  float dist = length(uv);
  if (dist <= 0.0001) { return vec2(0.0); }
  vec2 radial = uv / dist;
  vec2 c = contourWave(atan(uv.y, uv.x), t);
  float slope = clamp(amount, 0.0, 1.0) * contourStrengthMixed() * c.y;
  vec2 tangent = vec2(-radial.y, radial.x);
  return normalize(radial - tangent * (rad * slope / dist));
}

// Additive halo past the limb, fenced to the outside of the boundary.
vec3 edgeGlowAdd(vec3 col, vec2 uv, float rad) {
  if (uGlow <= 0.0) { return col; }
  float r = length(uv);
  float outside = smoothstep(rad - 0.005, rad + 0.005, r);
  return col + uGlowColor * (uGlow * exp(-max(r - rad, 0.0) * 11.0) * outside);
}

void main() {
  vec2 uv = (2.0 * gl_FragCoord.xy - uSize) / max(min(uSize.x, uSize.y), 1.0);
  float rad = max(uRadius, 0.05);
  float t = uTime;
  float contourRad = rad * contourScale(uv, t, uContourDeform);

  // Off the ball entirely — only the halo lives out here.
  if (length(uv) > contourRad * 1.01) {
    vec3 halo = clamp(edgeGlowAdd(vec3(0.0), uv, contourRad), 0.0, 1.0);
    float haloAlpha = max(halo.r, max(halo.g, halo.b));
    outColor = vec4(halo, haloAlpha);
    return;
  }

  vec2 p = uv / contourRad;
  float pd = length(p);

  float clearFa = 1.0 - smoothstep(GL_CLEAR_EA, GL_CLEAR_EB, pd);
  vec2 normal = contourNormal(uv, rad, t, uContourDeform);
  float edgeDepth = max(1.0 - pd, 0.0);
  float refractionWidth = 0.015 + 0.95 * clamp(uShellMidAlpha, 0.0, 1.0);
  float refractionT = edgeDepth / max(refractionWidth, 0.001);
  float refractionProf = pow(refractionProfile(refractionT), 0.68);
  float refractionAmount = 1.6 * clamp(uGlassOpacity, 0.0, 1.0) * refractionProf;
  vec2 refractedP = p - normal * refractionAmount;

  vec3 fcol = vec3(0.0);
  if (clearFa > 0.0) {
    if (uGlass > 0.5) {
      // Three fluid evaluations produce optical dispersion at the limb; the
      // channels converge continuously at the inner edge of the band.
      // refractionProf is exactly 0 inward of the band, so the interior skips
      // two of the three evaluations with no visual change.
      float channelSplit = 0.14 * clamp(uGloss, 0.0, 2.0)
                         * clamp(uGlassOpacity, 0.0, 1.0) * refractionProf;
      if (channelSplit > 0.0008) {
        vec3 redSample = fluidMix(refractedP - normal * channelSplit, t);
        vec3 greenSample = fluidMix(refractedP, t);
        vec3 blueSample = fluidMix(refractedP + normal * channelSplit, t);
        fcol = vec3(redSample.r, greenSample.g, blueSample.b);
      } else {
        fcol = fluidMix(refractedP, t);
      }
    } else {
      fcol = fluidMix(p, t);
    }
  }

  float lum = dot(fcol, vec3(0.213, 0.715, 0.072));
  vec3 clearSat = clamp(vec3(lum) + (fcol - vec3(lum)) * 1.22, 0.0, 1.0);

  // With glass off, the siri field is a true emissive layer instead of a disc.
  float emissionW = 0.0;
  if (uGlass <= 0.5) {
#if STYLE_A == 0
    emissionW += 1.0 - uStyleMix;
#endif
#if STYLE_B == 0
    emissionW += uStyleMix;
#endif
  }
  float signal = max(clearSat.r, max(clearSat.g, clearSat.b));
  vec3 col = mix(over(uCanvasColor, clearSat, 0.99 * clearFa),
                 clearSat * smoothstep(0.025, 0.16, signal),
                 emissionW);

  if (uGlass > 0.5) {
    float surfaceWidth = 0.026 + 0.055 * clamp(uShellEdgeAlpha, 0.0, 1.0);
    float surfaceBand = (1.0 - smoothstep(0.0, surfaceWidth, edgeDepth)) * clearFa;
    float opticalRim = pow(surfaceBand, 1.8);
    col = over(col, uShellInner, opticalRim * uGlassOpacity * 0.45);

    vec2 coolDirection = normalize(vec2(0.84, 0.54));
    vec2 warmDirection = normalize(vec2(-0.62, -0.78));
    float coolSplit = highlightLobe(normal, coolDirection, -0.32, 1.8);
    float warmSplit = highlightLobe(normal, warmDirection, -0.28, 2.0);
    float dispersion = opticalRim * clamp(uGloss, 0.0, 2.0) * (0.8 + 0.8 * uShellEdgeAlpha);
    col = over(col, uShellMid, dispersion * coolSplit);
    col = over(col, uShellEdge, dispersion * warmSplit);

    float edgeShadow = opticalRim * (0.015 + 0.15 * uShellEdgeAlpha)
                     * (0.15 + 0.85 * max(dot(normal, vec2(0.45, -0.89)), 0.0));
    col *= 1.0 - edgeShadow;

    vec2 keyDirection = normalize(vec2(-0.68, 0.73));
    vec2 fillDirection = normalize(vec2(0.74, -0.67));
    float key = opticalRim * highlightLobe(normal, keyDirection, 0.2, 2.8)
              * clamp(uSheen, 0.0, 2.0) * 1.4;
    float fill = opticalRim * highlightLobe(normal, fillDirection, 0.4, 3.6)
              * clamp(uSheen, 0.0, 2.0);
    col = over(col, uSheenColor, key);
    col = over(col, uSpecColor, fill);
  }

  float ballA = 1.0 - smoothstep(0.99, 1.01, pd);
  col = clamp(col * max(uExposure, 0.0), 0.0, 1.0) * ballA;
  vec3 finalColor = clamp(edgeGlowAdd(col, uv, contourRad), 0.0, 1.0);
  float emissionAlpha = max(finalColor.r, max(finalColor.g, finalColor.b));
  float sphereAlpha = clamp(max(ballA, emissionAlpha), 0.0, 1.0);
  float finalAlpha = mix(sphereAlpha, emissionAlpha, clamp(emissionW, 0.0, 1.0));
  outColor = vec4(finalColor, finalAlpha);
}
`;

const compileShader = (gl: WebGL2RenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("liquid-orb shader compile failed:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
};

const easeInOut = (x: number) => x * x * (3 - 2 * x);

export const LiquidOrb = ({
  preset = defaults.preset,
  cycle = defaults.cycle,
  holdDuration = defaults.holdDuration,
  morphDuration = defaults.morphDuration,
  speed = defaults.speed,
  glass = defaults.glass,
  glow = defaults.glow,
  onPresetChange,
}: LiquidOrbConfig = {}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const onPresetChangeRef = useRef(onPresetChange);
  onPresetChangeRef.current = onPresetChange;

  useEffect(() => {
    const container = rootRef.current;
    if (!container) return;

    const canvas = document.createElement("canvas");
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    container.appendChild(canvas);

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
    });
    if (!gl) {
      container.removeChild(canvas);
      return;
    }

    const vs = compileShader(gl, gl.VERTEX_SHADER, vertexSrc);
    if (!vs) {
      container.removeChild(canvas);
      return;
    }
    gl.disable(gl.BLEND);

    type ProgramEntry = {
      program: WebGLProgram;
      uSize: WebGLUniformLocation | null;
      uTime: WebGLUniformLocation | null;
      uStyleMix: WebGLUniformLocation | null;
      scalars: (WebGLUniformLocation | null)[];
      colors: (WebGLUniformLocation | null)[];
    };
    const programs = new Map<string, ProgramEntry | null>();

    const getProgram = (a: number, b: number): ProgramEntry | null => {
      const key = `${a}:${b}`;
      const cached = programs.get(key);
      if (cached !== undefined) return cached;
      const src = `#version 300 es\n#define STYLE_A ${a}\n#define STYLE_B ${b}\n${fragmentBody}`;
      const fs = compileShader(gl, gl.FRAGMENT_SHADER, src);
      const program = gl.createProgram();
      let entry: ProgramEntry | null = null;
      if (fs && program) {
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        gl.deleteShader(fs);
        if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
          const loc = (name: string) => gl.getUniformLocation(program, name);
          gl.useProgram(program);
          gl.uniform1f(loc("uGlass"), glass ? 1 : 0);
          gl.uniform1f(loc("uGlow"), Math.max(glow, 0));
          entry = {
            program,
            uSize: loc("uSize"),
            uTime: loc("uTime"),
            uStyleMix: loc("uStyleMix"),
            scalars: scalarUniforms.map(loc),
            colors: colorUniforms.map(loc),
          };
        } else {
          console.error("liquid-orb program link failed:", gl.getProgramInfoLog(program));
          gl.deleteProgram(program);
        }
      }
      programs.set(key, entry);
      return entry;
    };

    // Adaptive render resolution: the canvas upscales via CSS, and the scale
    // seeks the largest value the machine sustains — discrete GPUs settle at
    // 1, software rasterizers sink toward the floor instead of dropping to
    // slideshow frame rates.
    const SCALE_MIN = 0.3;
    const SCALE_MAX = 1;
    let renderScale = 0.5;
    let frameCostMs = 33;
    let lastAdjust = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(container.clientWidth * dpr * renderScale));
      const height = Math.max(1, Math.round(container.clientHeight * dpr * renderScale));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    const order = presetOrder;
    let current = Math.max(order.indexOf(preset), 0);
    let next = (current + 1) % order.length;
    let morphing = false;
    let morphT = 0;
    let holdT = 0;
    let phase = 0;
    let last = performance.now();
    let frame = 0;

    const mixed = new Float32Array(VEC_SIZE);

    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      const elapsed = now - last;
      const dt = Math.min(elapsed / 1000, 0.25);
      last = now;

      frameCostMs += (Math.min(elapsed, 1000) - frameCostMs) * 0.2;
      if (now - lastAdjust > 700) {
        if (frameCostMs > 50 && renderScale > SCALE_MIN) {
          renderScale = Math.max(SCALE_MIN, renderScale * 0.8);
          lastAdjust = now;
          resize();
        } else if (frameCostMs < 25 && renderScale < SCALE_MAX) {
          renderScale = Math.min(SCALE_MAX, renderScale * 1.25);
          lastAdjust = now;
          resize();
        }
      }

      if (cycle) {
        if (!morphing) {
          holdT += dt;
          if (holdT >= holdDuration) {
            morphing = true;
            morphT = 0;
            onPresetChangeRef.current?.(order[next]!);
          }
        } else {
          morphT += dt / Math.max(morphDuration, 0.001);
          if (morphT >= 1) {
            current = next;
            next = (current + 1) % order.length;
            morphing = false;
            morphT = 0;
            holdT = 0;
          }
        }
      }

      const k = morphing ? easeInOut(Math.min(morphT, 1)) : 0;
      const a = presetVecs[order[current]!]!;
      const b = presetVecs[order[next]!]!;
      for (let i = 0; i < VEC_SIZE; i++) {
        mixed[i] = a[i]! + (b[i]! - a[i]!) * k;
      }

      phase += dt * mixed[0]! * speed;

      const styleA = styleIndex[order[current]!];
      const styleB = styleIndex[order[next]!];
      const entry = morphing ? getProgram(styleA, styleB) : getProgram(styleA, styleA);
      if (!entry) return;
      // Warm the next segment's program mid-segment so switches don't hitch.
      if (!morphing && holdT > 0.3) {
        getProgram(styleA, styleB);
      } else if (morphing && morphT > 0.5) {
        getProgram(styleB, styleB);
      }

      gl.useProgram(entry.program);
      gl.uniform2f(entry.uSize, canvas.width, canvas.height);
      gl.uniform1f(entry.uTime, phase);
      gl.uniform1f(entry.uStyleMix, k);
      for (let i = 0; i < entry.scalars.length; i++) {
        gl.uniform1f(entry.scalars[i]!, mixed[i + 1]!);
      }
      for (let i = 0; i < entry.colors.length; i++) {
        const o = COLOR_BASE + i * 3;
        gl.uniform3f(entry.colors[i]!, mixed[o]!, mixed[o + 1]!, mixed[o + 2]!);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      for (const entry of programs.values()) {
        if (entry) gl.deleteProgram(entry.program);
      }
      gl.deleteShader(vs);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      container.removeChild(canvas);
    };
  }, [preset, cycle, holdDuration, morphDuration, speed, glass, glow]);

  return <div ref={rootRef} className="h-full w-full" />;
};
