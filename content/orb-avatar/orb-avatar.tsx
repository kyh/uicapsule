"use client"

import { useRef, useMemo } from "react"
import { Canvas, useFrame, extend } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"
import { Line2 } from "three/examples/jsm/lines/Line2.js"
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js"
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js"

extend({ Line2, LineMaterial, LineGeometry })

const NUM_LINES = 20
const SPHERE_RADIUS = 1.5
const ANIMATION_DURATION = 20
const NUM_SEGMENT_GROUPS = 32
const SEGMENTS_PER_GROUP = 3
const SQUIGGLE_FREQUENCY = 6
const SQUIGGLE_AMOUNT = 0.06
const SQUIGGLE_SPEED = 3

function LatitudeLine({ index }: { index: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const longitudeRotation = (index / NUM_LINES) * Math.PI
  const timeOffset = (index / NUM_LINES) * ANIMATION_DURATION

  const materials = useMemo(() => {
    return Array.from({ length: NUM_SEGMENT_GROUPS }, () =>
      new LineMaterial({
        color: 0xeeeeee,
        linewidth: 3.5,
        transparent: true,
        opacity: 1,
        resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
      })
    )
  }, [])

  const geometries = useMemo(() => {
    return Array.from({ length: NUM_SEGMENT_GROUPS }, () => new LineGeometry())
  }, [])

  useFrame((state) => {
    if (!groupRef.current) return

    const time = state.clock.elapsedTime
    const progress = ((time + timeOffset) % ANIMATION_DURATION) / ANIMATION_DURATION
    const latitude = progress * Math.PI
    const circleRadius = Math.sin(latitude) * SPHERE_RADIUS
    const yPosition = Math.cos(latitude) * SPHERE_RADIUS

    for (let g = 0; g < NUM_SEGMENT_GROUPS; g++) {
      const positions: number[] = []
      const startAngle = (g / NUM_SEGMENT_GROUPS) * Math.PI * 2
      const endAngle = ((g + 1) / NUM_SEGMENT_GROUPS) * Math.PI * 2
      let avgZ = 0

      for (let i = 0; i <= SEGMENTS_PER_GROUP; i++) {
        const angle = startAngle + (i / SEGMENTS_PER_GROUP) * (endAngle - startAngle)
        const squiggle = Math.sin(angle * SQUIGGLE_FREQUENCY + time * SQUIGGLE_SPEED + index * 0.5) * SQUIGGLE_AMOUNT
        const radiusSquiggle = Math.cos(angle * SQUIGGLE_FREQUENCY * 1.3 + time * SQUIGGLE_SPEED * 0.8) * SQUIGGLE_AMOUNT * 0.5
        const displacedRadius = circleRadius + (squiggle + radiusSquiggle) * circleRadius
        const ySquiggle = Math.sin(angle * SQUIGGLE_FREQUENCY * 0.7 + time * SQUIGGLE_SPEED * 1.2) * SQUIGGLE_AMOUNT * 0.4

        positions.push(
          Math.cos(angle) * displacedRadius,
          yPosition + ySquiggle * circleRadius,
          Math.sin(angle) * displacedRadius,
        )
        avgZ += Math.sin(angle) * displacedRadius
      }

      avgZ /= SEGMENTS_PER_GROUP + 1

      const rotatedZ = avgZ * Math.cos(longitudeRotation) +
        (positions[0] || 0) * Math.sin(longitudeRotation)
      const depthFactor = (rotatedZ / SPHERE_RADIUS + 1) / 2
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

function SphericalOrb() {
  return (
    <group>
      {Array.from({ length: NUM_LINES }, (_, i) => (
        <LatitudeLine key={i} index={i} />
      ))}
    </group>
  )
}

export function AIOrb({ className = "" }: { className?: string }) {
  return (
    <div className={`w-full h-full bg-[#0a0a0a] ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={["#0a0a0a"]} />
        <SphericalOrb />
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={2}
          maxDistance={8}
        />
      </Canvas>
    </div>
  )
}
