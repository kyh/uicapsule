"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";

const OrbLine = extend(Line2);

/**
 * Configuration options for the geometric orb.
 * All fields are optional and fall back to sensible defaults.
 */
export interface GeometricOrbConfig {
  /** Number of latitude lines rendered on the sphere. @default 20 */
  numLines?: number;
  /** Radius of the sphere in world units. @default 1.5 */
  radius?: number;
  /** Duration in seconds for a full pole-to-pole animation cycle. @default 20 */
  speed?: number;
  /** Thickness of each line in pixels. @default 2 */
  lineWidth?: number;
  /** CSS color string for the lines. @default "#eeeeee" */
  color?: string;
  /** CSS color string for the canvas background. @default "#0a0a0a" */
  background?: string;
  /** Intensity of the squiggle displacement on each line. @default 0.04 */
  squiggleAmount?: number;
  /** Wave frequency of the squiggle effect. Higher = more waves. @default 4 */
  squiggleFrequency?: number;
  /** Animation speed of the squiggle oscillation. @default 2 */
  squiggleSpeed?: number;
  /** How far lines on the far side fade toward the background, from 0 (flat) to 1 (invisible). @default 0.85 */
  depthFade?: number;
  /** Number of points around the full circle. Higher = smoother curves + finer depth-fade. @default 96 */
  pointsPerLine?: number;
  /** Whether scroll-to-zoom is enabled. @default true */
  enableZoom?: boolean;
  /** Whether click-and-drag panning is enabled. @default false */
  enablePan?: boolean;
  /** Minimum camera distance (closest zoom). @default 2 */
  minDistance?: number;
  /** Maximum camera distance (farthest zoom). @default 20 */
  maxDistance?: number;
}

const defaults: Required<GeometricOrbConfig> = {
  background: "#0a0a0a",
  color: "#eeeeee",
  depthFade: 0.85,
  enablePan: false,
  enableZoom: true,
  lineWidth: 2,
  maxDistance: 20,
  minDistance: 2,
  numLines: 20,
  pointsPerLine: 96,
  radius: 1.5,
  speed: 20,
  squiggleAmount: 0.04,
  squiggleFrequency: 4,
  squiggleSpeed: 2,
};

const LatitudeLines = ({ config }: { config: Required<GeometricOrbConfig> }) => {
  const camDirRef = useRef(new THREE.Vector3());
  const { size } = useThree();

  const baseColor = useMemo(() => new THREE.Color(config.color), [config.color]);
  const backgroundColor = useMemo(() => new THREE.Color(config.background), [config.background]);
  const phaseRef = useRef({ cycle: 0, squiggle: 0 });

  const lineConstants = useMemo(
    () =>
      Array.from({ length: config.numLines }, (_, i) => ({
        cosR: Math.cos((i / config.numLines) * Math.PI),
        longitudeRotation: (i / config.numLines) * Math.PI,
        phaseOffset: i / config.numLines,
        sinR: Math.sin((i / config.numLines) * Math.PI),
      })),
    [config.numLines],
  );

  const materials = useMemo(
    () =>
      Array.from(
        { length: config.numLines },
        () =>
          new LineMaterial({
            color: 0xff_ff_ff,
            linewidth: config.lineWidth,
            opacity: 1,
            transparent: true,
            vertexColors: true,
          }),
      ),
    [config.numLines, config.lineWidth],
  );

  const vertexCount = config.pointsPerLine + 1;

  const geometries = useMemo(
    () =>
      Array.from({ length: config.numLines }, () => {
        const geometry = new LineGeometry();
        geometry.setPositions(new Float32Array(vertexCount * 3));

        return geometry;
      }),
    [config.numLines, vertexCount],
  );

  useEffect(
    () => () => {
      for (const material of materials) {
        material.dispose();
      }
    },
    [materials],
  );
  useEffect(
    () => () => {
      for (const geometry of geometries) {
        geometry.dispose();
      }
    },
    [geometries],
  );

  useEffect(() => {
    for (const mat of materials) {
      mat.resolution.set(size.width, size.height);
    }
  }, [materials, size.width, size.height]);

  const buffersRef = useRef<{
    vertexCount: number;
    positions: Float32Array;
    colors: Float32Array;
  } | null>(null);

  useFrame((state, delta) => {
    if (buffersRef.current?.vertexCount !== vertexCount) {
      buffersRef.current = {
        colors: new Float32Array(vertexCount * 3),
        positions: new Float32Array(vertexCount * 3),
        vertexCount,
      };
    }

    const { positions: positionBuffer, colors: colorBuffer } = buffersRef.current;
    const phase = phaseRef.current;
    phase.cycle = (phase.cycle + delta / config.speed) % 1;
    phase.squiggle += delta * config.squiggleSpeed;
    const squigglePhase = phase.squiggle;
    const camDir = camDirRef.current.copy(state.camera.position).normalize();

    for (let lineIdx = 0; lineIdx < config.numLines; lineIdx += 1) {
      const constants = lineConstants[lineIdx];
      const geometry = geometries[lineIdx];

      if (!constants || !geometry) {
        continue;
      }

      const { phaseOffset, cosR, sinR } = constants;
      const progress = (phase.cycle + phaseOffset) % 1;
      const latitude = progress * Math.PI;
      const circleRadius = Math.sin(latitude) * config.radius;
      const yPosition = Math.cos(latitude) * config.radius;

      for (let i = 0; i < config.pointsPerLine; i += 1) {
        const angle = (i / config.pointsPerLine) * Math.PI * 2;

        const squiggle =
          Math.sin(angle * config.squiggleFrequency + squigglePhase + lineIdx * 0.5) *
          config.squiggleAmount;

        const radiusSquiggle =
          Math.cos(angle * config.squiggleFrequency * 1.3 + squigglePhase * 0.8) *
          config.squiggleAmount *
          0.5;

        const displacedRadius = circleRadius + (squiggle + radiusSquiggle) * circleRadius;

        const ySquiggle =
          Math.sin(angle * config.squiggleFrequency * 0.7 + squigglePhase * 1.2) *
          config.squiggleAmount *
          0.4;

        const x = Math.cos(angle) * displacedRadius;
        const y = yPosition + ySquiggle * circleRadius;
        const z = Math.sin(angle) * displacedRadius;

        const offset = i * 3;
        positionBuffer[offset] = x;
        positionBuffer[offset + 1] = y;
        positionBuffer[offset + 2] = z;

        const worldX = x * cosR + z * sinR;
        const worldZ = -x * sinR + z * cosR;
        const dot = worldX * camDir.x + y * camDir.y + worldZ * camDir.z;
        const depthFactor = (dot / config.radius + 1) / 2;
        const opacity = 1 - (1 - depthFactor) * config.depthFade;

        colorBuffer[offset] = THREE.MathUtils.lerp(backgroundColor.r, baseColor.r, opacity);
        colorBuffer[offset + 1] = THREE.MathUtils.lerp(backgroundColor.g, baseColor.g, opacity);
        colorBuffer[offset + 2] = THREE.MathUtils.lerp(backgroundColor.b, baseColor.b, opacity);
      }

      const last = config.pointsPerLine * 3;
      positionBuffer.copyWithin(last, 0, 3);
      colorBuffer.copyWithin(last, 0, 3);

      geometry.setPositions(positionBuffer);
      geometry.setColors(colorBuffer);
    }
  });

  return (
    <>
      {Array.from({ length: config.numLines }, (_, lineIdx) => {
        const geometry = geometries[lineIdx];
        const material = materials[lineIdx];
        const constants = lineConstants[lineIdx];

        if (!geometry || !material || !constants) {
          return null;
        }

        return (
          <group key={lineIdx} rotation-y={constants.longitudeRotation}>
            <OrbLine>
              <primitive object={geometry} attach="geometry" />
              <primitive object={material} attach="material" />
            </OrbLine>
          </group>
        );
      })}
    </>
  );
};

/**
 * 3D animated orb with flowing latitude lines and depth that fades into the background.
 *
 * Lines travel pole-to-pole across a sphere surface with subtle squiggle
 * displacement. Per-vertex colors blend from the line color toward the background by
 * camera-facing depth for a volumetric wireframe look.
 *
 * @example
 * ```tsx
 * <GeometricOrb />
 * <GeometricOrb config={{ color: "#4af", numLines: 30, speed: 10 }} />
 * ```
 */
export const GeometricOrb = ({
  config: configOverrides,
  className = "",
}: {
  config?: GeometricOrbConfig;
  className?: string;
}) => {
  const config = { ...defaults, ...configOverrides };

  return (
    <div className={`w-full h-full ${className}`} style={{ background: config.background }}>
      <Canvas camera={{ fov: 45, position: [0, 0, 8] }} gl={{ alpha: false, antialias: true }}>
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
};
