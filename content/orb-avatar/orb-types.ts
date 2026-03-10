/**
 * The visual style of the orb.
 * - "geometric": Animated latitude lines flowing across a 3D sphere with
 *   depth-based opacity fading and configurable squiggle displacement.
 * - "wireframe": Curl-noise-displaced particle grid rendered as a continuous
 *   LINE_STRIP with pulsing alpha and a bloom post-processing glow.
 * - "gradient": A fullscreen shader orb with 3D simplex-noise color mixing,
 *   hue rotation, breathing pulse, and constant rotation.
 */
export type OrbType = "geometric" | "wireframe" | "gradient"

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
export type OrbConfig = {
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

export const defaultConfig: Required<OrbConfig> = {
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

export function resolveConfig(config?: OrbConfig): Required<OrbConfig> {
  return { ...defaultConfig, ...config }
}
