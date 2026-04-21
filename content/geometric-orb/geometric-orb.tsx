"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";

extend({ Line2, LineMaterial, LineGeometry });

/**
 * Configuration options for the geometric orb.
 * All fields are optional and fall back to sensible defaults.
 */
export type GeometricOrbConfig = {
  /** Number of latitude lines rendered on the sphere. @default 20 */
  numLines?: number;
  /** Radius of the sphere in world units. @default 1.5 */
  radius?: number;
  /** Duration in seconds for a full pole-to-pole animation cycle. @default 20 */
  speed?: number;
  /** Thickness of each line in pixels. @default 3.5 */
  lineWidth?: number;
  /** CSS color string for the lines. @default "#eeeeee" */
  color?: string;
  /** CSS color string for the canvas background. @default "#0a0a0a" */
  background?: string;
  /** Intensity of the squiggle displacement on each line. @default 0.06 */
  squiggleAmount?: number;
  /** Wave frequency of the squiggle effect. Higher = more waves. @default 6 */
  squiggleFrequency?: number;
  /** Animation speed of the squiggle oscillation. @default 3 */
  squiggleSpeed?: number;
  /** Number of points around the full circle. Higher = smoother curves + finer depth-fade. @default 96 */
  pointsPerLine?: number;
  /** Whether scroll-to-zoom is enabled. @default true */
  enableZoom?: boolean;
  /** Whether click-and-drag panning is enabled. @default false */
  enablePan?: boolean;
  /** Minimum camera distance (closest zoom). @default 2 */
  minDistance?: number;
  /** Maximum camera distance (farthest zoom). @default 8 */
  maxDistance?: number;
};

const defaults: Required<GeometricOrbConfig> = {
  numLines: 20,
  radius: 1.5,
  speed: 20,
  lineWidth: 2,
  color: "#eeeeee",
  background: "#0a0a0a",
  squiggleAmount: 0.04,
  squiggleFrequency: 4,
  squiggleSpeed: 2,
  pointsPerLine: 96,
  enableZoom: true,
  enablePan: false,
  minDistance: 2,
  maxDistance: 20,
};

/**
 * All latitude lines rendered with a single useFrame callback.
 * Each line is one Line2 with per-vertex colors encoding depth-based opacity,
 * reducing draw calls from numLines×segmentGroups to just numLines.
 */
function LatitudeLines({ config }: { config: Required<GeometricOrbConfig> }) {
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const camDirRef = useRef(new THREE.Vector3());
  const { size } = useThree();

  const colorInt = useMemo(() => new THREE.Color(config.color).getHex(), [config.color]);

  const lineConstants = useMemo(
    () =>
      Array.from({ length: config.numLines }, (_, i) => ({
        longitudeRotation: (i / config.numLines) * Math.PI,
        timeOffset: (i / config.numLines) * config.speed,
        cosR: Math.cos((i / config.numLines) * Math.PI),
        sinR: Math.sin((i / config.numLines) * Math.PI),
      })),
    [config.numLines, config.speed],
  );

  // One material per line with vertexColors enabled
  const materials = useMemo(
    () =>
      Array.from(
        { length: config.numLines },
        () =>
          new LineMaterial({
            color: colorInt,
            linewidth: config.lineWidth,
            transparent: true,
            opacity: 1,
            vertexColors: true,
          }),
      ),
    [colorInt, config.numLines, config.lineWidth],
  );

  // One geometry per line
  const geometries = useMemo(
    () => Array.from({ length: config.numLines }, () => new LineGeometry()),
    [config.numLines],
  );

  useEffect(() => {
    return () => {
      for (const mat of materials) mat.dispose();
      for (const geo of geometries) geo.dispose();
    };
  }, [materials, geometries]);

  useEffect(() => {
    for (const mat of materials) {
      mat.resolution.set(size.width, size.height);
    }
  }, [materials, size.width, size.height]);

  // Pre-allocate reusable buffers (+1 vertex to close the loop)
  const vertexCount = config.pointsPerLine + 1;
  const positionBuffer = useMemo(() => new Float32Array(vertexCount * 3), [vertexCount]);
  const colorBuffer = useMemo(() => new Float32Array(vertexCount * 3), [vertexCount]);

  const baseColor = useMemo(() => new THREE.Color(config.color), [config.color]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const camDir = camDirRef.current.copy(state.camera.position).normalize();
    const r = baseColor.r;
    const g = baseColor.g;
    const b = baseColor.b;

    for (let lineIdx = 0; lineIdx < config.numLines; lineIdx++) {
      const group = groupRefs.current[lineIdx];
      if (!group) continue;

      const constants = lineConstants[lineIdx];
      const geometry = geometries[lineIdx];
      if (!constants || !geometry) continue;
      const { timeOffset, longitudeRotation, cosR, sinR } = constants;
      const progress = ((time + timeOffset) % config.speed) / config.speed;
      const latitude = progress * Math.PI;
      const circleRadius = Math.sin(latitude) * config.radius;
      const yPosition = Math.cos(latitude) * config.radius;

      for (let i = 0; i < config.pointsPerLine; i++) {
        const angle = (i / config.pointsPerLine) * Math.PI * 2;
        const squiggle =
          Math.sin(angle * config.squiggleFrequency + time * config.squiggleSpeed + lineIdx * 0.5) *
          config.squiggleAmount;
        const radiusSquiggle =
          Math.cos(angle * config.squiggleFrequency * 1.3 + time * config.squiggleSpeed * 0.8) *
          config.squiggleAmount *
          0.5;
        const displacedRadius = circleRadius + (squiggle + radiusSquiggle) * circleRadius;
        const ySquiggle =
          Math.sin(angle * config.squiggleFrequency * 0.7 + time * config.squiggleSpeed * 1.2) *
          config.squiggleAmount *
          0.4;

        const x = Math.cos(angle) * displacedRadius;
        const y = yPosition + ySquiggle * circleRadius;
        const z = Math.sin(angle) * displacedRadius;

        const offset = i * 3;
        positionBuffer[offset] = x;
        positionBuffer[offset + 1] = y;
        positionBuffer[offset + 2] = z;

        // Smooth depth-fade via vertex color brightness
        const worldX = x * cosR + z * sinR;
        const worldZ = -x * sinR + z * cosR;
        const dot = worldX * camDir.x + y * camDir.y + worldZ * camDir.z;
        const depthFactor = (dot / config.radius + 1) / 2;
        const opacity = depthFactor * 0.85 + 0.15;

        colorBuffer[offset] = r * opacity;
        colorBuffer[offset + 1] = g * opacity;
        colorBuffer[offset + 2] = b * opacity;
      }

      // Close the loop: copy first vertex exactly to avoid floating-point gaps
      const last = config.pointsPerLine * 3;
      positionBuffer[last] = positionBuffer[0]!;
      positionBuffer[last + 1] = positionBuffer[1]!;
      positionBuffer[last + 2] = positionBuffer[2]!;
      colorBuffer[last] = colorBuffer[0]!;
      colorBuffer[last + 1] = colorBuffer[1]!;
      colorBuffer[last + 2] = colorBuffer[2]!;

      geometry.setPositions(positionBuffer);
      geometry.setColors(colorBuffer);
      group.rotation.y = longitudeRotation;
    }
  });

  return (
    <>
      {Array.from({ length: config.numLines }, (_, lineIdx) => {
        const geometry = geometries[lineIdx];
        const material = materials[lineIdx];
        if (!geometry || !material) return null;
        return (
          <group
            key={lineIdx}
            ref={(el) => {
              groupRefs.current[lineIdx] = el;
            }}
          >
            {/* @ts-expect-error line2 is an R3F extension registered via extend() */}
            <line2>
              <primitive object={geometry} attach="geometry" />
              <primitive object={material} attach="material" />
              {/* @ts-expect-error line2 is an R3F extension registered via extend() */}
            </line2>
          </group>
        );
      })}
    </>
  );
}

/**
 * 3D animated orb with flowing latitude lines and depth-based opacity.
 *
 * Lines travel pole-to-pole across a sphere surface with subtle squiggle
 * displacement. Per-vertex colors encode camera-facing depth for a
 * volumetric wireframe look.
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
  config?: GeometricOrbConfig;
  className?: string;
}) {
  const configKey = JSON.stringify(configOverrides);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const config = useMemo(() => ({ ...defaults, ...configOverrides }), [configKey]);

  return (
    <div className={`w-full h-full ${className}`} style={{ background: config.background }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }} gl={{ antialias: true, alpha: false }}>
        <color attach="background" args={[config.background]} />
        <LatitudeLines config={config} />
        <OrbitControls
          enablePan={config.enablePan}
          enableZoom={config.enableZoom}
          minDistance={config.minDistance}
          maxDistance={config.maxDistance}
        />
      </Canvas>
    </div>
  );
}
