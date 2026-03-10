"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { EffectComposer, Bloom } from "@react-three/postprocessing"

import type { OrbType, OrbConfig } from "./orb-types"
import { resolveConfig } from "./orb-types"
import { GeometricOrb } from "./geometric-orb"
import { WireframeOrb } from "./wireframe-orb"
import { GradientOrb } from "./gradient-orb"

export type { OrbType, OrbConfig }

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
