"use client"

import { useRef, useMemo, useEffect } from "react"
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"
import { Line2 } from "three/examples/jsm/lines/Line2.js"
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js"
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js"

extend({ Line2, LineMaterial, LineGeometry })

/**
 * Configuration options for the geometric orb.
 * All fields are optional and fall back to sensible defaults.
 */
export type GeometricOrbConfig = {
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
}

const defaults: Required<GeometricOrbConfig> = {
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
  config: Required<GeometricOrbConfig>
}) {
  const groupRef = useRef<THREE.Group>(null)
  const longitudeRotation = (index / config.numLines) * Math.PI
  const timeOffset = (index / config.numLines) * config.speed
  const { size } = useThree()

  const colorInt = useMemo(() => new THREE.Color(config.color).getHex(), [config.color])

  const materials = useMemo(() => {
    return Array.from({ length: config.segmentGroups }, () =>
      new LineMaterial({
        color: colorInt,
        linewidth: config.lineWidth,
        transparent: true,
        opacity: 1,
        resolution: new THREE.Vector2(1, 1),
      })
    )
  }, [colorInt, config.segmentGroups, config.lineWidth])

  const geometries = useMemo(() => {
    return Array.from({ length: config.segmentGroups }, () => new LineGeometry())
  }, [config.segmentGroups])

  useEffect(() => {
    return () => {
      for (const mat of materials) mat.dispose()
      for (const geo of geometries) geo.dispose()
    }
  }, [materials, geometries])

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
      let avgX = 0
      let avgZ = 0

      for (let i = 0; i <= config.segmentsPerGroup; i++) {
        const angle = startAngle + (i / config.segmentsPerGroup) * (endAngle - startAngle)
        const squiggle = Math.sin(angle * config.squiggleFrequency + time * config.squiggleSpeed + index * 0.5) * config.squiggleAmount
        const radiusSquiggle = Math.cos(angle * config.squiggleFrequency * 1.3 + time * config.squiggleSpeed * 0.8) * config.squiggleAmount * 0.5
        const displacedRadius = circleRadius + (squiggle + radiusSquiggle) * circleRadius
        const ySquiggle = Math.sin(angle * config.squiggleFrequency * 0.7 + time * config.squiggleSpeed * 1.2) * config.squiggleAmount * 0.4

        const x = Math.cos(angle) * displacedRadius
        const z = Math.sin(angle) * displacedRadius
        positions.push(x, yPosition + ySquiggle * circleRadius, z)
        avgX += x
        avgZ += z
      }

      const count = config.segmentsPerGroup + 1
      avgX /= count
      avgZ /= count

      // Rotate segment center into world space to determine camera-facing depth
      const rotatedZ = avgZ * Math.cos(longitudeRotation) +
        avgX * Math.sin(longitudeRotation)
      const depthFactor = (rotatedZ / config.radius + 1) / 2
      const opacity = Math.pow(depthFactor, 1.5) * 0.95 + 0.05

      geometries[g].setPositions(positions)
      materials[g].opacity = opacity
      materials[g].resolution.set(size.width, size.height)
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

/**
 * 3D animated orb with flowing latitude lines and depth-based opacity.
 *
 * Lines travel pole-to-pole across a sphere surface with subtle squiggle
 * displacement, split into arc segments with independent opacity based on
 * camera-facing depth for a volumetric wireframe look.
 *
 * @example
 * ```tsx
 * <GeometricOrb />
 * <GeometricOrb config={{ color: "#4af", numLines: 30, speed: 10 }} />
 * ```
 */
export function GeometricOrb({
  config: configOverrides,
  className = "",
}: {
  config?: GeometricOrbConfig
  className?: string
}) {
  const config = { ...defaults, ...configOverrides }

  return (
    <div className={`w-full h-full ${className}`} style={{ background: config.background }}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={[config.background]} />
        <group>
          {Array.from({ length: config.numLines }, (_, i) => (
            <LatitudeLine key={i} index={i} config={config} />
          ))}
        </group>
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
