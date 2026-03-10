"use client"

import { useRef, useMemo } from "react"
import { useFrame, extend } from "@react-three/fiber"
import * as THREE from "three"
import { Line2 } from "three/examples/jsm/lines/Line2.js"
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js"
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js"

import type { OrbConfig } from "./orb-types"

extend({ Line2, LineMaterial, LineGeometry })

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
export function GeometricOrb({ config }: { config: Required<OrbConfig> }) {
  return (
    <group>
      {Array.from({ length: config.numLines }, (_, i) => (
        <LatitudeLine key={i} index={i} config={config} />
      ))}
    </group>
  )
}
