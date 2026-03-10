"use client"

import { useRef, useMemo } from "react"
import { Canvas, useFrame, extend } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"
import { Line2 } from "three/examples/jsm/lines/Line2.js"
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js"
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js"

extend({ Line2, LineMaterial, LineGeometry })

type OrbType = "geometric"

type OrbConfig = {
  numLines?: number
  radius?: number
  speed?: number
  lineWidth?: number
  color?: string
  background?: string
  squiggleAmount?: number
  squiggleFrequency?: number
  squiggleSpeed?: number
  segmentGroups?: number
  segmentsPerGroup?: number
  enableZoom?: boolean
  enablePan?: boolean
  minDistance?: number
  maxDistance?: number
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
}

function resolveConfig(config?: OrbConfig): Required<OrbConfig> {
  return { ...defaultConfig, ...config }
}

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

function GeometricOrb({ config }: { config: Required<OrbConfig> }) {
  return (
    <group>
      {Array.from({ length: config.numLines }, (_, i) => (
        <LatitudeLine key={i} index={i} config={config} />
      ))}
    </group>
  )
}

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
