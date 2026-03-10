"use client"

import { useRef, useMemo } from "react"
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { EffectComposer, Bloom } from "@react-three/postprocessing"
import * as THREE from "three"
import { Line2 } from "three/examples/jsm/lines/Line2.js"
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js"
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js"

extend({ Line2, LineMaterial, LineGeometry })

/**
 * The visual style of the orb.
 * - "geometric": Animated latitude lines flowing across a 3D sphere with
 *   depth-based opacity fading and configurable squiggle displacement.
 * - "wireframe": Curl-noise-displaced particle grid rendered as a continuous
 *   LINE_STRIP with pulsing alpha and a bloom post-processing glow.
 * - "gradient": A fullscreen shader orb with 3D simplex-noise color mixing,
 *   hue rotation, breathing pulse, and constant rotation.
 */
type OrbType = "geometric" | "wireframe" | "gradient"

/**
 * Configuration options for the orb's appearance and behavior.
 * All fields are optional and fall back to sensible defaults.
 *
 * @example
 * ```tsx
 * <OrbAvatar
 *   type="geometric"
 *   config={{
 *     color: "#ff6600",
 *     numLines: 30,
 *     speed: 10,
 *     squiggleAmount: 0.1,
 *   }}
 * />
 * ```
 */
type OrbConfig = {
  /** Number of latitude lines rendered on the sphere. @default 20 */
  numLines?: number
  /** Radius of the sphere in world units. @default 1.5 */
  radius?: number
  /** Duration in seconds for a full pole-to-pole animation cycle. @default 20 */
  speed?: number
  /** Thickness of each line in pixels. @default 3.5 */
  lineWidth?: number
  /** CSS color string for the lines. @default "#eeeeee" */
  color?: string
  /** CSS color string for the canvas background. @default "#0a0a0a" */
  background?: string
  /** Intensity of the squiggle displacement on each line. @default 0.06 */
  squiggleAmount?: number
  /** Wave frequency of the squiggle effect. Higher = more waves. @default 6 */
  squiggleFrequency?: number
  /** Animation speed of the squiggle oscillation. @default 3 */
  squiggleSpeed?: number
  /** Number of arc segments per line. Higher = finer depth-fade granularity. @default 32 */
  segmentGroups?: number
  /** Number of points per arc segment. Higher = smoother curves. @default 3 */
  segmentsPerGroup?: number
  /** Whether scroll-to-zoom is enabled. @default true */
  enableZoom?: boolean
  /** Whether click-and-drag panning is enabled. @default false */
  enablePan?: boolean
  /** Minimum camera distance (closest zoom). @default 2 */
  minDistance?: number
  /** Maximum camera distance (farthest zoom). @default 8 */
  maxDistance?: number

  // --- Wireframe-specific options ---

  /** Grid resolution per side for the wireframe particle grid. Total vertices = gridSize^2. @default 300 */
  gridSize?: number
  /** Curl noise density — higher values produce tighter, more detailed noise. @default 0.7 */
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

  // --- Gradient-specific options ---

  /** Hue rotation in degrees applied to all gradient colors. @default 0 */
  hue?: number
  /** Constant rotation speed of the gradient orb (radians/sec). @default 0.3 */
  rotationSpeed?: number
  /** Scale of the noise pattern inside the gradient orb. @default 0.65 */
  gradientNoiseScale?: number
  /** Inner radius of the gradient orb glow (0–1). @default 0.1 */
  innerRadius?: number
}

const defaultConfig: Required<OrbConfig> = {
  numLines: 20,
  radius: 1.5,
  speed: 20,
  lineWidth: 3.5,
  color: "#eeeeee",
  background: "#0a0a0a",
  squiggleAmount: 0.06,
  squiggleFrequency: 6,
  squiggleSpeed: 3,
  segmentGroups: 32,
  segmentsPerGroup: 3,
  enableZoom: true,
  enablePan: false,
  minDistance: 2,
  maxDistance: 8,
  gridSize: 300,
  noiseDensity: 0.7,
  noiseScale: 3.0,
  minAlpha: 0.01,
  maxAlpha: 0.45,
  bloomIntensity: 1.5,
  bloomThreshold: 0.0,
  bloomRadius: 0.85,
  hue: 0,
  rotationSpeed: 0.3,
  gradientNoiseScale: 0.65,
  innerRadius: 0.1,
}

function resolveConfig(config?: OrbConfig): Required<OrbConfig> {
  return { ...defaultConfig, ...config }
}

/**
 * A single animated latitude line that travels pole-to-pole on the sphere.
 * Each line is split into arc segments with independent opacity based on
 * camera-facing depth, creating a 3D wireframe illusion without a mesh.
 */
function LatitudeLine({
  index,
  config,
}: {
  index: number
  config: Required<OrbConfig>
}) {
  const groupRef = useRef<THREE.Group>(null)
  const longitudeRotation = (index / config.numLines) * Math.PI
  const timeOffset = (index / config.numLines) * config.speed

  const colorInt = useMemo(() => new THREE.Color(config.color).getHex(), [config.color])

  const materials = useMemo(() => {
    return Array.from({ length: config.segmentGroups }, () =>
      new LineMaterial({
        color: colorInt,
        linewidth: config.lineWidth,
        transparent: true,
        opacity: 1,
        resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
      })
    )
  }, [colorInt, config.segmentGroups, config.lineWidth])

  const geometries = useMemo(() => {
    return Array.from({ length: config.segmentGroups }, () => new LineGeometry())
  }, [config.segmentGroups])

  useFrame((state) => {
    if (!groupRef.current) return

    const time = state.clock.elapsedTime
    const progress = ((time + timeOffset) % config.speed) / config.speed
    const latitude = progress * Math.PI
    const circleRadius = Math.sin(latitude) * config.radius
    const yPosition = Math.cos(latitude) * config.radius

    for (let g = 0; g < config.segmentGroups; g++) {
      const positions: number[] = []
      const startAngle = (g / config.segmentGroups) * Math.PI * 2
      const endAngle = ((g + 1) / config.segmentGroups) * Math.PI * 2
      let avgZ = 0

      for (let i = 0; i <= config.segmentsPerGroup; i++) {
        const angle = startAngle + (i / config.segmentsPerGroup) * (endAngle - startAngle)
        const squiggle = Math.sin(angle * config.squiggleFrequency + time * config.squiggleSpeed + index * 0.5) * config.squiggleAmount
        const radiusSquiggle = Math.cos(angle * config.squiggleFrequency * 1.3 + time * config.squiggleSpeed * 0.8) * config.squiggleAmount * 0.5
        const displacedRadius = circleRadius + (squiggle + radiusSquiggle) * circleRadius
        const ySquiggle = Math.sin(angle * config.squiggleFrequency * 0.7 + time * config.squiggleSpeed * 1.2) * config.squiggleAmount * 0.4

        positions.push(
          Math.cos(angle) * displacedRadius,
          yPosition + ySquiggle * circleRadius,
          Math.sin(angle) * displacedRadius,
        )
        avgZ += Math.sin(angle) * displacedRadius
      }

      avgZ /= config.segmentsPerGroup + 1

      const rotatedZ = avgZ * Math.cos(longitudeRotation) +
        (positions[0] || 0) * Math.sin(longitudeRotation)
      const depthFactor = (rotatedZ / config.radius + 1) / 2
      const opacity = Math.pow(depthFactor, 1.5) * 0.95 + 0.05

      geometries[g].setPositions(positions)
      materials[g].opacity = opacity
      materials[g].resolution.set(window.innerWidth, window.innerHeight)
    }

    groupRef.current.rotation.y = longitudeRotation
  })

  return (
    <group ref={groupRef}>
      {geometries.map((geo, i) => (
        <line2 key={i}>
          <primitive object={geo} attach="geometry" />
          <primitive object={materials[i]} attach="material" />
        </line2>
      ))}
    </group>
  )
}

/** Renders all latitude lines distributed evenly around the sphere's longitude. */
function GeometricOrb({ config }: { config: Required<OrbConfig> }) {
  return (
    <group>
      {Array.from({ length: config.numLines }, (_, i) => (
        <LatitudeLine key={i} index={i} config={config} />
      ))}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Wireframe type: curl-noise-displaced LINE_STRIP with pulsing alpha + bloom
// ---------------------------------------------------------------------------

/**
 * GLSL vertex shader for the wireframe orb.
 *
 * Takes a 2D UV grid attribute (`aUv`) and displaces each vertex in 3D space
 * using curl noise derived from simplex noise. The result is an organic,
 * continuously flowing cloud of connected line segments.
 *
 * Varyings passed to the fragment shader:
 * - `vUv`        — original grid UV for alpha animation
 * - `vPositionZ` — z-component of the noise vector, used for depth-based alpha
 *
 * Uniforms:
 * - `time`         — elapsed time in seconds (drives animation)
 * - `uSpeed`       — rate at which the noise field scrolls
 * - `uDensity`     — frequency multiplier for the curl noise input
 * - `uScale`       — world-space scale of the displaced positions
 */
const wireframeVertexShader = /* glsl */ `
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

    // Spread UVs into [-1, 1] range, scroll with time for animation
    vec3 pos = vec3(aUv * 2.0 - 1.0, 0.0) + time * uSpeed;

    // Displace via curl noise
    vec3 noise = curlNoise(pos * uDensity);
    pos = noise * uScale;

    vPositionZ = noise.z;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

/**
 * GLSL fragment shader for the wireframe orb.
 *
 * Produces a pulsing alpha effect by mixing between `uMinAlpha` and `uMaxAlpha`
 * using a sine wave driven by the horizontal UV coordinate and time.
 * The alpha is further modulated by `vPositionZ` (curl noise depth) so that
 * lines closer to the viewer appear slightly brighter.
 *
 * Uniforms:
 * - `time`      — elapsed time in seconds
 * - `uColor`    — RGB line color
 * - `uMinAlpha` — floor alpha value
 * - `uMaxAlpha` — ceiling alpha value
 * - `uAlphaSpeed` — speed of the alpha oscillation
 */
const wireframeFragmentShader = /* glsl */ `
  uniform float time;
  uniform vec3 uColor;
  uniform float uMinAlpha;
  uniform float uMaxAlpha;
  uniform float uAlphaSpeed;

  varying vec2 vUv;
  varying float vPositionZ;

  const float PI2 = 6.2831853;

  void main() {
    // Pulsing alpha driven by horizontal UV position + time
    float cAlpha = mix(uMinAlpha, uMaxAlpha, (sin(vUv.x * PI2 + time * uAlphaSpeed) + 1.0) * 0.5);

    // Depth modulation: lines with higher noise-z appear brighter
    cAlpha *= mix(0.8, 1.0, vPositionZ);

    gl_FragColor = vec4(uColor, cAlpha);
  }
`

/**
 * Wireframe orb rendered as a single LINE_STRIP through a curl-noise-displaced grid.
 *
 * The geometry is a flat UV grid (gridSize x gridSize) where each vertex is
 * displaced in 3D by curl noise in the vertex shader. The continuous line strip
 * snakes row-by-row through the grid, creating an organic wireframe cloud.
 *
 * A bloom post-processing pass is applied via `<EffectComposer>` in the parent.
 */
function WireframeOrb({ config }: { config: Required<OrbConfig> }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { size } = useThree()

  const geometry = useMemo(() => {
    const n = config.gridSize
    const maxI = n - 1
    const uvs: number[] = []
    const positions: number[] = []

    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        uvs.push(i / maxI, 1 - j / maxI)
        // Placeholder positions — the vertex shader computes real positions
        positions.push(0, 0, 0)
      }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute("aUv", new THREE.Float32BufferAttribute(uvs, 2))
    return geo
  }, [config.gridSize])

  const uniforms = useMemo(() => {
    const col = new THREE.Color(config.color)
    return {
      time: { value: 0 },
      uSpeed: { value: config.speed * 0.005 },
      uDensity: { value: config.noiseDensity },
      uScale: { value: config.noiseScale },
      uColor: { value: new THREE.Vector3(col.r, col.g, col.b) },
      uMinAlpha: { value: config.minAlpha },
      uMaxAlpha: { value: config.maxAlpha },
      uAlphaSpeed: { value: config.speed * 0.025 },
    }
  }, [config])

  useFrame((state) => {
    if (!materialRef.current) return
    materialRef.current.uniforms.time.value = state.clock.elapsedTime

    // Keep resolution in sync on resize
    if (size.width !== 0 && size.height !== 0) {
      materialRef.current.uniforms.uScale.value = config.noiseScale
    }
  })

  return (
    <line geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={wireframeVertexShader}
        fragmentShader={wireframeFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </line>
  )
}

// ---------------------------------------------------------------------------
// Gradient type: fullscreen shader orb with noise-based color mixing + rotation
// ---------------------------------------------------------------------------

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
function GradientOrb({ config }: { config: Required<OrbConfig> }) {
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

/**
 * A 3D animated orb avatar built with react-three-fiber.
 *
 * The orb is composed of animated lines that flow across a sphere surface,
 * with depth-based opacity fading to create a sense of volume. Lines include
 * a subtle squiggle displacement for organic movement.
 *
 * @param type - The orb visual style: "geometric" (default), "wireframe", or "gradient".
 * @param config - Optional overrides for the orb's appearance and behavior.
 * @param className - Additional CSS classes for the container div.
 *
 * @example
 * ```tsx
 * // Default geometric orb
 * <OrbAvatar />
 *
 * // Customized geometric orb
 * <OrbAvatar
 *   type="geometric"
 *   config={{ color: "#4af", numLines: 30, speed: 10 }}
 *   className="rounded-full overflow-hidden"
 * />
 *
 * // Wireframe orb with bloom
 * <OrbAvatar
 *   type="wireframe"
 *   config={{
 *     color: "#c0ebfc",
 *     background: "#000000",
 *     gridSize: 400,
 *     bloomIntensity: 2.0,
 *   }}
 * />
 *
 * // Gradient orb with hue shift
 * <OrbAvatar
 *   type="gradient"
 *   config={{
 *     hue: 120,
 *     rotationSpeed: 0.5,
 *     background: "#000000",
 *   }}
 * />
 * ```
 */
export function OrbAvatar({
  type = "geometric",
  config: configOverrides,
  className = "",
}: {
  type?: OrbType
  config?: OrbConfig
  className?: string
}) {
  const config = resolveConfig(configOverrides)

  return (
    <div className={`w-full h-full bg-[${config.background}] ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={[config.background]} />
        {type === "geometric" && <GeometricOrb config={config} />}
        {type === "wireframe" && <WireframeOrb config={config} />}
        {type === "gradient" && <GradientOrb config={config} />}
        {type === "wireframe" && config.bloomIntensity > 0 && (
          <EffectComposer>
            <Bloom
              intensity={config.bloomIntensity}
              luminanceThreshold={config.bloomThreshold}
              radius={config.bloomRadius}
            />
          </EffectComposer>
        )}
        {type !== "gradient" && (
          <OrbitControls
            enablePan={config.enablePan}
            enableZoom={config.enableZoom}
            minDistance={config.minDistance}
            maxDistance={config.maxDistance}
          />
        )}
      </Canvas>
    </div>
  )
}
