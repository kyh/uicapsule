"use client"

import { useRef, useMemo } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

import type { OrbConfig } from "./orb-types"

/**
 * GLSL vertex shader for the gradient orb.
 *
 * A simple pass-through that outputs clip-space positions directly from the
 * geometry attribute (a single fullscreen triangle in NDC). Passes UV to the
 * fragment shader for resolution-independent coordinate mapping.
 */
const gradientVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

/**
 * GLSL fragment shader for the gradient orb.
 *
 * Renders a glowing orb with three noise-mixed colors, hue rotation, a subtle
 * breathing pulse, and constant rotation. The orb has a soft radial falloff
 * with light attenuation functions for the glow.
 *
 * Uniforms:
 * - `iTime`       — elapsed time in seconds
 * - `iResolution` — vec3(width, height, aspect)
 * - `hue`         — hue rotation in degrees
 * - `rot`         — current rotation angle in radians
 * - `noiseScale`  — frequency of the interior noise pattern
 * - `innerRadius` — inner radius of the orb glow
 */
const gradientFragmentShader = /* glsl */ `
  precision highp float;

  uniform float iTime;
  uniform vec3 iResolution;
  uniform float hue;
  uniform float rot;
  uniform float noiseScale;
  uniform float innerRadius;

  varying vec2 vUv;

  // --- YIQ color space hue rotation ---

  vec3 rgb2yiq(vec3 c) {
    return vec3(
      dot(c, vec3(0.299, 0.587, 0.114)),
      dot(c, vec3(0.596, -0.274, -0.322)),
      dot(c, vec3(0.211, -0.523, 0.312))
    );
  }

  vec3 yiq2rgb(vec3 c) {
    return vec3(
      c.x + 0.956 * c.y + 0.621 * c.z,
      c.x - 0.272 * c.y - 0.647 * c.z,
      c.x - 1.106 * c.y + 1.703 * c.z
    );
  }

  vec3 adjustHue(vec3 color, float hueDeg) {
    float hueRad = hueDeg * 3.14159265 / 180.0;
    vec3 yiq = rgb2yiq(color);
    float cosA = cos(hueRad);
    float sinA = sin(hueRad);
    yiq.yz = vec2(yiq.y * cosA - yiq.z * sinA, yiq.y * sinA + yiq.z * cosA);
    return yiq2rgb(yiq);
  }

  // --- 3D simplex noise (hash-based) ---

  vec3 hash33(vec3 p3) {
    p3 = fract(p3 * vec3(0.1031, 0.11369, 0.13787));
    p3 += dot(p3, p3.yxz + 19.19);
    return -1.0 + 2.0 * fract(vec3(p3.x + p3.y, p3.x + p3.z, p3.y + p3.z) * p3.zyx);
  }

  float snoise3(vec3 p) {
    const float K1 = 0.333333333;
    const float K2 = 0.166666667;
    vec3 i = floor(p + (p.x + p.y + p.z) * K1);
    vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
    vec3 e = step(vec3(0.0), d0 - d0.yzx);
    vec3 i1 = e * (1.0 - e.zxy);
    vec3 i2 = 1.0 - e.zxy * (1.0 - e);
    vec3 d1 = d0 - (i1 - K2);
    vec3 d2 = d0 - (i2 - K1);
    vec3 d3 = d0 - 0.5;
    vec4 h = max(0.6 - vec4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);
    vec4 n = h * h * h * h * vec4(
      dot(d0, hash33(i)),
      dot(d1, hash33(i + i1)),
      dot(d2, hash33(i + i2)),
      dot(d3, hash33(i + 1.0))
    );
    return dot(vec4(31.316), n);
  }

  // --- Orb rendering ---

  vec4 extractAlpha(vec3 colorIn) {
    float a = max(max(colorIn.r, colorIn.g), colorIn.b);
    return vec4(colorIn.rgb / (a + 1e-5), a);
  }

  const vec3 baseColor0 = vec3(0.239, 0.353, 1.0);   // blue
  const vec3 baseColor1 = vec3(0.616, 0.0, 1.0);     // purple
  const vec3 baseColor2 = vec3(1.0, 0.373, 0.122);   // orange
  const vec3 baseColor3 = vec3(0.0, 0.0, 0.0);       // black

  float light1(float intensity, float attenuation, float dist) {
    return intensity / (1.0 + dist * attenuation);
  }

  float light2(float intensity, float attenuation, float dist) {
    return intensity / (1.0 + dist * dist * attenuation);
  }

  vec4 draw(vec2 uv) {
    vec3 color0 = adjustHue(baseColor0, hue);
    vec3 color1 = adjustHue(baseColor1, hue);
    vec3 color2 = adjustHue(baseColor2, hue);
    vec3 color3 = adjustHue(baseColor3, hue);

    float len = length(uv);
    float invLen = len > 0.0 ? 1.0 / len : 0.0;

    // Subtle breathing pulse
    float pulse = sin(iTime * 1.5) * 0.02;

    float n0 = snoise3(vec3(uv * noiseScale, iTime * 0.5)) * 0.5 + 0.5;

    float r0 = mix(mix(innerRadius + pulse, 1.0, 0.4), mix(innerRadius + pulse, 1.0, 0.6), n0);

    float d0 = distance(uv, (r0 * invLen) * uv);
    float v0 = light1(1.0, 10.0, d0);
    v0 *= smoothstep(r0 * 1.05, r0, len);
    float cl = cos(atan(uv.y, uv.x) + iTime * 2.0) * 0.5 + 0.5;

    float a = iTime * -1.0;
    vec2 pos = vec2(cos(a), sin(a)) * r0;
    float d = distance(uv, pos);
    float v1 = light2(1.5, 5.0, d);
    v1 *= light1(1.0, 50.0, d0);

    float v2 = smoothstep(1.0, mix(innerRadius, 1.0, n0 * 0.5), len);
    float v3 = smoothstep(innerRadius, mix(innerRadius, 1.0, 0.5), len);

    vec3 col = mix(color1, color2, cl);
    col = mix(col, color0, n0);
    col = mix(color3, col, v0);
    col = (col + v1) * v2 * v3;
    col = clamp(col, 0.0, 1.0);

    return extractAlpha(col);
  }

  void main() {
    vec2 center = iResolution.xy * 0.5;
    float size = min(iResolution.x, iResolution.y);
    vec2 uv = (vUv * iResolution.xy - center) / size * 2.0;

    // Apply rotation
    float s = sin(rot);
    float c = cos(rot);
    uv = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);

    vec4 col = draw(uv);
    gl_FragColor = vec4(col.rgb * col.a, col.a);
  }
`

/**
 * Gradient orb rendered as a fullscreen shader quad.
 *
 * Uses a single oversized triangle in clip space so the fragment shader runs
 * on every pixel. The shader produces a glowing orb with three noise-mixed
 * colors, hue shifting, a breathing pulse, and constant rotation — all on GPU.
 *
 * No 3D geometry or camera interaction is needed; OrbitControls are disabled
 * for this type by the parent `OrbAvatar`.
 */
export function GradientOrb({ config }: { config: Required<OrbConfig> }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { size, viewport } = useThree()
  const rotRef = useRef(0)
  const lastTimeRef = useRef(0)

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    // Fullscreen triangle in NDC (covers [-1,1] quad with a single tri)
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3),
    )
    geo.setAttribute(
      "uv",
      new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2),
    )
    return geo
  }, [])

  const uniforms = useMemo(
    () => ({
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector3(size.width, size.height, 1) },
      hue: { value: config.hue },
      rot: { value: 0 },
      noiseScale: { value: config.gradientNoiseScale },
      innerRadius: { value: config.innerRadius },
    }),
    // Intentionally only depend on config — resolution is updated per-frame
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config],
  )

  useFrame((state) => {
    if (!materialRef.current) return

    const t = state.clock.elapsedTime
    const dt = t - lastTimeRef.current
    lastTimeRef.current = t

    // Accumulate rotation
    rotRef.current += dt * config.rotationSpeed

    const u = materialRef.current.uniforms
    u.iTime.value = t
    u.hue.value = config.hue
    u.rot.value = rotRef.current
    u.iResolution.value.set(
      size.width * viewport.dpr,
      size.height * viewport.dpr,
      size.width / size.height,
    )
  })

  return (
    <mesh geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={gradientVertexShader}
        fragmentShader={gradientFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  )
}
