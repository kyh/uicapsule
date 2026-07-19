"use client";

import { useEffect, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { Mesh } from "three";
import { AsciiEffect } from "three/examples/jsm/effects/AsciiEffect.js";

export const AsciiRenderer = () => {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <directionalLight position={[-10, -10, -5]} intensity={1} />
      <Torusknot />
      <OrbitControls />
      <Renderer />
    </Canvas>
  );
};

const Torusknot = () => {
  const meshRef = useRef<Mesh>(null);

  useFrame((_state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.rotation.y += delta / 2;
    mesh.rotation.x = mesh.rotation.y;
  });

  return (
    <mesh ref={meshRef} scale={1.25}>
      <torusKnotGeometry args={[1, 0.2, 128, 32]} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
  );
};

const Renderer = () => {
  const { gl, scene, camera, size } = useThree();
  const effectRef = useRef<AsciiEffect>(null);

  useEffect(() => {
    const effect = new AsciiEffect(gl, " .:-+*=%@#");

    effect.domElement.style.position = "absolute";
    effect.domElement.style.top = "0px";
    effect.domElement.style.left = "0px";
    effect.domElement.style.color = "white";
    effect.domElement.style.backgroundColor = "black";
    effect.domElement.style.pointerEvents = "none";

    const container = gl.domElement.parentNode;
    if (container) {
      container.replaceChild(effect.domElement, gl.domElement);
    }

    effectRef.current = effect;

    return () => {
      effectRef.current = null;
      if (container && effect.domElement.parentNode) {
        container.replaceChild(gl.domElement, effect.domElement);
      }
    };
  }, [gl]);

  // Resizing must not tear the effect down: recreating it would detach and
  // reattach the ASCII <div>, dropping a frame on every resize tick.
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
