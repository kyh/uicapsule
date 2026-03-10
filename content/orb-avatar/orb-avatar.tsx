"use client"

import { useRef, useMemo } from "react"
import { Canvas, useFrame, extend, useThree } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"
import { Line2 } from "three/examples/jsm/lines/Line2.js"
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js"
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js"

extend({ Line2, LineMaterial, LineGeometry })

const NUM_LINES = 20
const SPHERE_RADIUS = 1.5
const ANIMATION_DURATION = 20 // seconds for full cycle (slower)

/*
  Concept:
  - Imagine an invisible 3D globe
  - Each line is a circle that wraps around the globe like a latitude line
  - The circle animates from one pole to the other:
    - At the poles: circle radius is 0 (point)
    - At the equator: circle radius is maximum (full sphere width)
  - 20 lines are distributed around the globe (different longitudes)
  - Each line is offset in time, creating waves flowing across the sphere
  - Back-facing portions fade out based on Z depth
*/

function LatitudeLine({ index }: { index: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const linesRef = useRef<Line2[]>([])
  const geometriesRef = useRef<LineGeometry[]>([])
  const materialsRef = useRef<LineMaterial[]>([])

  // Rotate this line around Y-axis to position it at different longitudes
  const longitudeRotation = (index / NUM_LINES) * Math.PI

  // Stagger the animation timing for each line
  const timeOffset = (index / NUM_LINES) * ANIMATION_DURATION

  // Create multiple line segments with different opacities for depth effect
  const numSegmentGroups = 32

  const materials = useMemo(() => {
    const mats: LineMaterial[] = []
    for (let i = 0; i < numSegmentGroups; i++) {
      mats.push(new LineMaterial({
        color: 0xeeeeee,
        linewidth: 3.5,
        transparent: true,
        opacity: 1,
        resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
      }))
    }
    materialsRef.current = mats
    return mats
  }, [])

  const geometries = useMemo(() => {
    const geos: LineGeometry[] = []
    for (let i = 0; i < numSegmentGroups; i++) {
      geos.push(new LineGeometry())
    }
    geometriesRef.current = geos
    return geos
  }, [])

  const { camera } = useThree()

  useFrame((state) => {
    if (!groupRef.current) return

    const time = state.clock.elapsedTime

    // Progress: 0 to 1 representing pole-to-pole journey
    const progress = ((time + timeOffset) % ANIMATION_DURATION) / ANIMATION_DURATION

    // Convert progress to latitude angle: 0 -> PI (north pole to south pole)
    const latitude = progress * Math.PI

    // Circle radius based on latitude (sin curve: 0 at poles, max at equator)
    const circleRadius = Math.sin(latitude) * SPHERE_RADIUS

    // Y position on the sphere (cos curve: top at 0, bottom at PI)
    const yPosition = Math.cos(latitude) * SPHERE_RADIUS

    // Squiggle parameters - more pronounced animation
    const squiggleFrequency = 6
    const squiggleAmount = 0.06
    const squiggleSpeed = 3

    // Generate segments with depth-based opacity
    const segmentsPerGroup = 3

    for (let g = 0; g < numSegmentGroups; g++) {
      const positions: number[] = []
      const startAngle = (g / numSegmentGroups) * Math.PI * 2
      const endAngle = ((g + 1) / numSegmentGroups) * Math.PI * 2

      // Calculate average Z position for this segment to determine opacity
      let avgZ = 0

      for (let i = 0; i <= segmentsPerGroup; i++) {
        const angle = startAngle + (i / segmentsPerGroup) * (endAngle - startAngle)

        // Add animated squiggle displacement
        const squiggle = Math.sin(angle * squiggleFrequency + time * squiggleSpeed + index * 0.5) * squiggleAmount
        const radiusSquiggle = Math.cos(angle * squiggleFrequency * 1.3 + time * squiggleSpeed * 0.8) * squiggleAmount * 0.5
        const displacedRadius = circleRadius + (squiggle + radiusSquiggle) * circleRadius

        // Y wobble
        const ySquiggle = Math.sin(angle * squiggleFrequency * 0.7 + time * squiggleSpeed * 1.2) * squiggleAmount * 0.4

        const x = Math.cos(angle) * displacedRadius
        const y = yPosition + ySquiggle * circleRadius
        const z = Math.sin(angle) * displacedRadius

        positions.push(x, y, z)
        avgZ += z
      }

      avgZ /= (segmentsPerGroup + 1)

      // Apply rotation to get world Z
      const rotatedZ = avgZ * Math.cos(longitudeRotation) +
                       (positions[0] || 0) * Math.sin(longitudeRotation)

      // Opacity based on depth: front (positive Z) = full opacity, back (negative Z) = faded
      const depthFactor = (rotatedZ / SPHERE_RADIUS + 1) / 2 // 0 to 1
      const opacity = Math.pow(depthFactor, 1.5) * 0.95 + 0.05 // Fade back, keep front bright

      geometries[g].setPositions(positions)
      materials[g].opacity = opacity
      materials[g].resolution.set(window.innerWidth, window.innerHeight)
    }

    // Rotate around Y to position at this longitude
    groupRef.current.rotation.y = longitudeRotation
  })

  return (
    <group ref={groupRef}>
      {geometries.map((geo, i) => (
        <line2 key={i} ref={(el) => { if (el) linesRef.current[i] = el }}>
          <primitive object={geo} attach="geometry" />
          <primitive object={materials[i]} attach="material" />
        </line2>
      ))}
    </group>
  )
}

function SphericalOrb() {
  const groupRef = useRef<THREE.Group>(null)

  return (
    <group ref={groupRef}>
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
