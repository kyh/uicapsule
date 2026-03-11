"use client"

import { useRef, useMemo, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { EffectComposer, Bloom } from "@react-three/postprocessing"
import * as THREE from "three"

/**
 * Configuration options for the wireframe orb.
 * All fields are optional and fall back to sensible defaults.
 */
export type WireframeOrbConfig = {
  /** CSS color string for the lines. @default "#c0ebfc" */
  color?: string
  /** CSS color string for the canvas background. @default "#0a0a0a" */
  background?: string
  /** Animation speed multiplier. @default 20 */
  speed?: number
  /** Grid resolution per side. Total vertices = gridSize². Consider 150–200 on mobile. @default 200 */
  gridSize?: number
  /** Curl noise density — higher values produce tighter noise. @default 0.7 */
  noiseDensity?: number
  /** Scale of the noise displacement in world units. @default 3.0 */
  noiseScale?: number
  /** Minimum line alpha in the pulsing animation. @default 0.01 */
  minAlpha?: number
  /** Maximum line alpha in the pulsing animation. @default 0.45 */
  maxAlpha?: number
  /** Bloom post-processing intensity. Set to 0 to disable. @default 1.5 */
  bloomIntensity?: number
  /** Bloom luminance threshold — pixels brighter than this glow. @default 0.0 */
  bloomThreshold?: number
  /** Bloom blur radius in pixels. @default 0.85 */
  bloomRadius?: number
  /** Whether scroll-to-zoom is enabled. @default true */
  enableZoom?: boolean
  /** Whether click-and-drag panning is enabled. @default false */
  enablePan?: boolean
  /** Minimum camera distance (closest zoom). @default 2 */
  minDistance?: number
  /** Maximum camera distance (farthest zoom). @default 8 */
  maxDistance?: number
}

const defaults: Required<WireframeOrbConfig> = {
  color: "#c0ebfc",
  background: "#0a0a0a",
  speed: 20,
  gridSize: 200,
  noiseDensity: 0.7,
  noiseScale: 3.0,
  minAlpha: 0.01,
  maxAlpha: 0.45,
  bloomIntensity: 1.5,
  bloomThreshold: 0.0,
  bloomRadius: 0.85,
  enableZoom: true,
  enablePan: false,
  minDistance: 2,
  maxDistance: 20,
}

/**
 * GLSL vertex shader for the wireframe orb.
 *
 * Takes a 2D UV grid attribute (`aUv`) and displaces each vertex in 3D space
 * using curl noise derived from simplex noise. The result is an organic,
 * continuously flowing cloud of connected line segments.
 */
const vertexShader = /* glsl */ `
  attribute vec2 aUv;

  uniform float time;
  uniform float uSpeed;
  uniform float uDensity;
  uniform float uScale;

  varying vec2 vUv;
  varying float vPositionZ;

  // --- Simplex noise (Ashima Arts, MIT License) ---
  // https://github.com/ashima/webgl-noise

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  // --- Curl noise (derived from simplex noise) ---
  // https://www.npmjs.com/package/glsl-curl-noise

  vec3 snoiseVec3(vec3 x) {
    return vec3(
      snoise(vec3(x)),
      snoise(vec3(x.y - 19.1, x.z + 33.4, x.x + 47.2)),
      snoise(vec3(x.z + 74.2, x.x - 124.5, x.y + 99.4))
    );
  }

  vec3 curlNoise(vec3 p) {
    const float e = 0.1;
    vec3 dx = vec3(e, 0.0, 0.0);
    vec3 dy = vec3(0.0, e, 0.0);
    vec3 dz = vec3(0.0, 0.0, e);

    vec3 p_x0 = snoiseVec3(p - dx);
    vec3 p_x1 = snoiseVec3(p + dx);
    vec3 p_y0 = snoiseVec3(p - dy);
    vec3 p_y1 = snoiseVec3(p + dy);
    vec3 p_z0 = snoiseVec3(p - dz);
    vec3 p_z1 = snoiseVec3(p + dz);

    float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
    float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
    float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;

    const float divisor = 1.0 / (2.0 * e);
    return normalize(vec3(x, y, z) * divisor);
  }

  void main() {
    vUv = aUv;
    vec3 pos = vec3(aUv * 2.0 - 1.0, 0.0) + time * uSpeed;
    vec3 noise = curlNoise(pos * uDensity);
    pos = noise * uScale;
    vPositionZ = noise.z;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

/**
 * GLSL fragment shader for the wireframe orb.
 *
 * Produces a pulsing alpha effect modulated by depth (curl noise z-component).
 */
const fragmentShader = /* glsl */ `
  uniform float time;
  uniform vec3 uColor;
  uniform float uMinAlpha;
  uniform float uMaxAlpha;
  uniform float uAlphaSpeed;

  varying vec2 vUv;
  varying float vPositionZ;

  const float PI2 = 6.2831853;

  void main() {
    float cAlpha = mix(uMinAlpha, uMaxAlpha, (sin(vUv.x * PI2 + time * uAlphaSpeed) + 1.0) * 0.5);
    cAlpha *= mix(0.8, 1.0, vPositionZ);
    gl_FragColor = vec4(uColor, cAlpha);
  }
`

/** Detect low-end devices for adaptive grid sizing. */
function getAdaptiveGridSize(requested: number): number {
  if (typeof navigator === "undefined") return requested
  const cores = navigator.hardwareConcurrency ?? 4
  if (cores <= 4 || window.devicePixelRatio >= 3) {
    return Math.min(requested, 150)
  }
  return requested
}

/** Internal scene component for the wireframe line strip. */
function WireframeScene({ config }: { config: Required<WireframeOrbConfig> }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const geometry = useMemo(() => {
    const n = getAdaptiveGridSize(config.gridSize)
    const maxI = n - 1
    const uvs: number[] = []
    const positions: number[] = []

    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        uvs.push(i / maxI, 1 - j / maxI)
        positions.push(0, 0, 0)
      }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute("aUv", new THREE.Float32BufferAttribute(uvs, 2))
    return geo
  }, [config.gridSize])

  useEffect(() => {
    return () => geometry.dispose()
  }, [geometry])

  const uniforms = useMemo(() => {
    const col = new THREE.Color(config.color)
    return {
      time: { value: 0 },
      uSpeed: { value: config.speed * 0.005 },
      uDensity: { value: config.noiseDensity },
      uScale: { value: config.noiseScale },
      uColor: { value: col },
      uMinAlpha: { value: config.minAlpha },
      uMaxAlpha: { value: config.maxAlpha },
      uAlphaSpeed: { value: config.speed * 0.025 },
    }
  }, [config])

  useFrame((state) => {
    if (!materialRef.current) return
    materialRef.current.uniforms.time.value = state.clock.elapsedTime
  })

  return (
    <line geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </line>
  )
}

/**
 * Curl-noise-displaced particle cloud rendered as a continuous line strip
 * with pulsing alpha and a bloom post-processing glow.
 *
 * @example
 * ```tsx
 * <WireframeOrb />
 * <WireframeOrb config={{ color: "#ff66aa", bloomIntensity: 2.0 }} />
 * ```
 */
export function WireframeOrb({
  config: configOverrides,
  className = "",
}: {
  config?: WireframeOrbConfig
  className?: string
}) {
  const configKey = JSON.stringify(configOverrides)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const config = useMemo(() => ({ ...defaults, ...configOverrides }), [configKey])

  return (
    <div className={`w-full h-full ${className}`} style={{ background: config.background }}>
      <Canvas
        camera={{ position: [0, 0, 12], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={[config.background]} />
        <WireframeScene config={config} />
        {config.bloomIntensity > 0 && (
          <EffectComposer>
            <Bloom
              intensity={config.bloomIntensity}
              luminanceThreshold={config.bloomThreshold}
              radius={config.bloomRadius}
            />
          </EffectComposer>
        )}
        <OrbitControls
          enablePan={config.enablePan}
          enableZoom={config.enableZoom}
          minDistance={config.minDistance}
          maxDistance={config.maxDistance}
        />
      </Canvas>
    </div>
  )
}
