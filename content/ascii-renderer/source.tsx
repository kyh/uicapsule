"use client";

import React, { useEffect, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
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
  const meshRef = useRef<any>(null);

  useFrame(
    (state, delta) =>
      (meshRef.current.rotation.x = meshRef.current.rotation.y += delta / 2),
  );

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

    effect.setSize(size.width, size.height);

    const container = gl.domElement.parentNode;
    if (container) {
      container.replaceChild(effect.domElement, gl.domElement);
    }

    effectRef.current = effect;

    return () => {
      if (container && effect.domElement.parentNode) {
        container.replaceChild(gl.domElement, effect.domElement);
      }
    };
  }, [gl, size]);

  useFrame(() => {
    if (effectRef.current) {
      effectRef.current.render(scene, camera);
    }
  }, 1);

  return null;
};
