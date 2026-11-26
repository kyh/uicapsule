"use client";

import { useEffect, useRef } from "react";
import type { ReactElement } from "react";
import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Vector2 } from "three";
import type { Mesh } from "three";
import { AsciiEffect } from "three/examples/jsm/effects/AsciiEffect.js";

export type AsciiModel = "torusKnot" | "torus" | "box" | "icosahedron";

export const DEFAULT_CHARACTERS = " .:-+*=%@#";

export interface AsciiRendererProps {
  /** Glyphs from brightest to darkest; fewer than two falls back to the default ramp. */
  characters?: string;
  /** Glyph cells per CSS pixel; higher is finer and slower. */
  resolution?: number;
  color?: string;
  background?: string;
  model?: AsciiModel;
  /** Radians per second around the Y and X axes. */
  rotationSpeed?: number;
  scale?: number;
}

const geometries = {
  box: () => <boxGeometry args={[1.5, 1.5, 1.5]} />,
  icosahedron: () => <icosahedronGeometry args={[1.25, 0]} />,
  torus: () => <torusGeometry args={[1, 0.42, 48, 96]} />,
  torusKnot: () => <torusKnotGeometry args={[1, 0.2, 128, 32]} />,
} satisfies Record<AsciiModel, () => ReactElement>;

const SpinningMesh = ({
  rotationSpeed,
  scale,
  model,
}: {
  rotationSpeed: number;
  scale: number;
  model: AsciiModel;
}) => {
  const meshRef = useRef<Mesh>(null);

  useFrame((_state, delta) => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    mesh.rotation.y += delta * rotationSpeed;
    mesh.rotation.x = mesh.rotation.y;
  });

  return (
    <mesh ref={meshRef} scale={scale}>
      {geometries[model]()}
      <meshStandardMaterial color="#ffffff" flatShading={model === "icosahedron"} />
    </mesh>
  );
};

const Renderer = ({ characters, resolution }: { characters: string; resolution: number }) => {
  const { gl, scene, camera, size } = useThree();
  const effectRef = useRef<AsciiEffect>(null);

  useEffect(() => {
    const effect = new AsciiEffect(gl, characters, { resolution });
    const { x: width, y: height } = gl.getSize(new Vector2());

    effect.domElement.style.position = "absolute";
    effect.domElement.style.top = "0px";
    effect.domElement.style.left = "0px";
    effect.domElement.style.pointerEvents = "none";
    effect.setSize(width, height);

    const container = gl.domElement.parentNode;

    if (container) {
      gl.domElement.replaceWith(effect.domElement);
    }

    effectRef.current = effect;

    return () => {
      effectRef.current = null;

      if (container && effect.domElement.parentNode) {
        effect.domElement.replaceWith(gl.domElement);
      }
    };
  }, [gl, characters, resolution]);

  useEffect(() => {
    effectRef.current?.setSize(size.width, size.height);
  }, [size.width, size.height]);

  useFrame(() => {
    if (effectRef.current) {
      effectRef.current.render(scene, camera);
    }
  }, 1);

  return null;
};

export const AsciiRenderer = ({
  background = "#000000",
  characters = DEFAULT_CHARACTERS,
  color = "#ffffff",
  resolution = 0.15,
  rotationSpeed = 0.5,
  scale = 1.25,
  model = "torusKnot",
}: AsciiRendererProps) => (
  <Canvas style={{ background, color }}>
    <ambientLight intensity={0.5} />
    <pointLight position={[10, 10, 10]} intensity={1} />
    <directionalLight position={[-10, -10, -5]} intensity={1} />
    <SpinningMesh rotationSpeed={rotationSpeed} scale={scale} model={model} />
    <OrbitControls />
    <Renderer
      characters={characters.length > 1 ? characters : DEFAULT_CHARACTERS}
      resolution={resolution}
    />
  </Canvas>
);
