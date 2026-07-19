import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import type { Group, Mesh as MeshType, Texture } from "three";

import {
  Canvas,
  extend,
  Frameloop,
  ThreeToJSXElements,
  useFrame,
  useLoader,
  useThree,
} from "@react-three/fiber";
import { DoubleSide, Mesh, SRGBColorSpace, TextureLoader } from "three";
import {
  abs,
  add,
  div,
  length,
  max,
  mix,
  mul,
  positionLocal,
  smoothstep,
  sub,
  texture,
  uv,
  vec3,
  vec4,
} from "three/tsl";
import * as THREE from "three/tsl";
import { NodeMaterial, WebGPURenderer } from "three/webgpu";

declare module "@react-three/fiber" {
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> {}
}

extend(THREE as any);

/** Cards are laid out on the ring at a fixed 16:9 ratio regardless of source image. */
const IMAGE_ASPECT = 9 / 16;
/** Viewport width (world units) at and above which cards render at their full `imageWidth`. */
const FULL_SIZE_VIEWPORT_WIDTH = 10;
/** Ring starts a quarter turn away and unwinds to 0 during the entrance. */
const INITIAL_ROTATION = -Math.PI * 0.5;
const ENTRANCE_DURATION_SECONDS = 2;
/** Friction/velocity are tuned per 60fps frame, then rescaled by the real delta. */
const REFERENCE_FPS = 60;
/** Below this angular velocity the ring gives up and snaps to the nearest card. */
const VELOCITY_THRESHOLD = 0.002;
/** Fraction of the remaining snap distance consumed each frame. */
const SNAP_SPEED = 0.15;
/** Snap is considered complete once within this many radians of the target. */
const SNAP_EPSILON = 0.005;
const TAU = Math.PI * 2;
/** Extra curvature applied on top of `bendAmount`. */
const BEND_MULTIPLIER = 2.0;
/** Half-width of the smoothstep band that antialiases the rounded-corner mask. */
const CORNER_MASK_FEATHER = 0.01;

export const ImageCarouselCanvas = ({
  backgroundColor = "#6F6D66",
  children,
}: {
  backgroundColor?: string;
  children: ReactNode;
}) => {
  const [frameloop, setFrameloop] = useState<Frameloop>("never");

  return (
    <Canvas
      shadows
      camera={{ position: [0, 0, 12], fov: 45 }}
      frameloop={frameloop}
      gl={async (props) => {
        const renderer = new WebGPURenderer(props as any);
        renderer.init().then(() => {
          setFrameloop("always");
        });
        return renderer;
      }}
    >
      <color attach="background" args={[backgroundColor]} />
      {children}
    </Canvas>
  );
};

type ImagePlaneProps = {
  texture: Texture;
  index: number;
  total: number;
  radius: number;
  planeWidth: number;
  cornerRadius: number;
  bendAmount: number;
  centerOpacity: number;
  adjacentOpacity: number;
  farOpacity: number;
  /** Read per-frame rather than as a prop so ring rotation never re-renders the tree. */
  currentIndexRef: RefObject<number>;
};

const ImagePlane = ({
  texture: imageTexture,
  index,
  total,
  radius,
  planeWidth,
  cornerRadius,
  bendAmount,
  centerOpacity,
  adjacentOpacity,
  farOpacity,
  currentIndexRef,
}: ImagePlaneProps) => {
  const meshRef = useRef<MeshType | null>(null);

  const angle = (index * TAU) / total;
  const x = Math.sin(angle) * radius;
  const z = Math.cos(angle) * radius;
  const planeHeight = planeWidth * IMAGE_ASPECT;

  // Create TSL material with rounded corners and cylindrical bending
  const roundedCornersMaterial = useMemo(() => {
    const material = new NodeMaterial();

    // Individual plane cylindrical bending
    const position = positionLocal;

    // Bend each plane individually to look curved
    // The bend should curve the plane inward toward the carousel center (like a cylinder segment)
    const bendStrength = mul(bendAmount, BEND_MULTIPLIER);
    const normalizedX = div(position.x, planeWidth * 0.5); // Normalize to half-width for better curve
    const curvature = mul(mul(normalizedX, normalizedX), bendStrength);
    const bentZ = add(position.z, curvature); // Changed from sub to add for inward curve

    material.positionNode = vec3(position.x, position.y, bentZ);

    const uvCoords = uv();

    const imageColor = texture(imageTexture, uvCoords);

    // Calculate distance from center for rounded rectangle
    const center = sub(uvCoords, 0.5);
    const d = length(max(sub(abs(center), 0.5 - cornerRadius), 0.0));

    // Create smooth mask for rounded corners
    const mask = smoothstep(
      cornerRadius + CORNER_MASK_FEATHER,
      cornerRadius - CORNER_MASK_FEATHER,
      d,
    );

    // Mix transparent and image color based on mask
    const finalColor = mix(vec4(0, 0, 0, 0), imageColor, mask);

    material.colorNode = finalColor;
    material.transparent = true;
    material.side = DoubleSide;

    return material;
  }, [imageTexture, bendAmount, planeWidth, cornerRadius]);

  useEffect(() => () => roundedCornersMaterial.dispose(), [roundedCornersMaterial]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    mesh.lookAt(0, mesh.position.y, 0);

    // Ring distance to the centred card, wrapping around the seam.
    const rawDistance = Math.abs(index - currentIndexRef.current);
    const distance = rawDistance > total / 2 ? total - rawDistance : rawDistance;

    if (distance === 0) {
      roundedCornersMaterial.opacity = centerOpacity;
      return;
    }
    if (distance === 1) {
      roundedCornersMaterial.opacity = adjacentOpacity;
      return;
    }
    // Smooth interpolation for positions beyond adjacent
    const maxDistance = Math.ceil(total / 2);
    const t = maxDistance > 1 ? (Math.min(distance, maxDistance) - 1) / (maxDistance - 1) : 0;
    roundedCornersMaterial.opacity = adjacentOpacity + (farOpacity - adjacentOpacity) * t;
  });

  return (
    <mesh ref={meshRef} position={[x, 0, z]} material={roundedCornersMaterial}>
      <planeGeometry args={[planeWidth, planeHeight, 32, 32]} />
    </mesh>
  );
};

type ImageCarouselProps = {
  images?: string[];
  radius?: number;
  imageWidth?: number;
  cornerRadius?: number;
  bendAmount?: number;
  centerOpacity?: number;
  adjacentOpacity?: number;
  farOpacity?: number;
  friction?: number;
  wheelSensitivity?: number;
  dragSensitivity?: number;
  enableSnapping?: boolean;
  autorotate?: boolean;
  autorotateSpeed?: number;
};

export const ImageCarousel = ({
  images = [],
  radius = 5,
  imageWidth = 3,
  cornerRadius = 0.15,
  bendAmount = 0.1,
  centerOpacity = 1.0,
  adjacentOpacity = 1.0,
  farOpacity = 1.0,
  friction = 0.95,
  wheelSensitivity = 0.002,
  dragSensitivity = 0.0003,
  enableSnapping = true,
  autorotate = true,
  autorotateSpeed = 0.02,
}: ImageCarouselProps) => {
  const groupRef = useRef<Group | null>(null);
  const { gl, viewport } = useThree();

  // Smooth rotation state
  const rotationRef = useRef(0);
  const velocityRef = useRef(0);
  const isDragging = useRef(false);
  const lastPointerX = useRef(0);
  const targetRotationRef = useRef(0);
  const isSnapping = useRef(false);
  const currentIndexRef = useRef(0);

  // Animation state for fade-in and spin-in
  const isAnimatingIn = useRef(true);
  const animationProgress = useRef(0);

  const textures = useLoader(TextureLoader, images, (loader) => {
    loader.crossOrigin = "anonymous";
  });

  // Set correct colorSpace for all textures
  textures.forEach((texture) => {
    texture.colorSpace = SRGBColorSpace;
  });

  // Event listeners setup
  useEffect(() => {
    const canvas = gl.domElement;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      velocityRef.current += event.deltaY * wheelSensitivity;
      isSnapping.current = false;
    };

    const startDrag = (clientX: number) => {
      isDragging.current = true;
      lastPointerX.current = clientX;
    };

    const moveDrag = (clientX: number) => {
      if (!isDragging.current) return;
      velocityRef.current += (clientX - lastPointerX.current) * dragSensitivity;
      lastPointerX.current = clientX;
      isSnapping.current = false;
    };

    const handleMouseDown = (event: MouseEvent) => {
      startDrag(event.clientX);
      canvas.style.cursor = "grabbing";
    };

    const handleMouseMove = (event: MouseEvent) => {
      moveDrag(event.clientX);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      canvas.style.cursor = "grab";
    };

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) startDrag(touch.clientX);
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) moveDrag(touch.clientX);
    };

    const handleTouchEnd = () => {
      isDragging.current = false;
    };

    canvas.style.cursor = "grab";
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseUp);

    // Touch events
    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: true });
    canvas.addEventListener("touchend", handleTouchEnd);

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseleave", handleMouseUp);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [gl.domElement, wheelSensitivity, dragSensitivity]);

  // Compute responsive image plane size from viewport.
  // Scale down images on smaller viewports, keep original size on large screens.
  const sizeScale = Math.min(1, viewport.width / FULL_SIZE_VIEWPORT_WIDTH);
  const planeWidth = imageWidth * sizeScale;

  // Smooth animation with friction and snapping
  useFrame((state, delta) => {
    if (!images.length) return;
    const group = groupRef.current;
    if (!group) return;

    // Handle entrance animation
    if (isAnimatingIn.current) {
      animationProgress.current = Math.min(
        1,
        animationProgress.current + delta / ENTRANCE_DURATION_SECONDS,
      );
      if (animationProgress.current >= 1) {
        isAnimatingIn.current = false;
      }

      // Smooth easing function
      const easedProgress = 1 - Math.pow(1 - animationProgress.current, 3);

      // Apply entrance animation
      group.rotation.y =
        INITIAL_ROTATION + (rotationRef.current - INITIAL_ROTATION) * easedProgress;

      // Overwrite the per-plane opacity written earlier this frame with the fade-in value.
      for (const child of group.children) {
        if (child instanceof Mesh && child.material instanceof NodeMaterial) {
          child.material.opacity = easedProgress;
        }
      }

      return; // Skip normal rotation logic during entrance
    }

    // Handle autorotate
    if (autorotate && !isDragging.current && !isSnapping.current) {
      velocityRef.current += autorotateSpeed * delta;
    }

    // Apply friction using delta time for frame-rate independence
    velocityRef.current *= Math.pow(friction, delta * REFERENCE_FPS);

    const anglePerImage = TAU / images.length;

    // Check if we should start snapping
    if (
      enableSnapping &&
      !isDragging.current &&
      !isSnapping.current &&
      Math.abs(velocityRef.current) < VELOCITY_THRESHOLD
    ) {
      const currentRotation = rotationRef.current;

      // Find which image we're closest to
      const normalizedAngle = ((-currentRotation % TAU) + TAU) % TAU;
      const nearestImageIndex = Math.round(normalizedAngle / anglePerImage) % images.length;

      // Calculate target rotation (keeping it negative as expected)
      const targetRotation = -(nearestImageIndex * anglePerImage);

      // Adjust target to be close to current rotation (avoid long rotations)
      let bestTargetRotation = targetRotation;
      const diff1 = Math.abs(targetRotation - currentRotation);
      const diff2 = Math.abs(targetRotation + TAU - currentRotation);
      const diff3 = Math.abs(targetRotation - TAU - currentRotation);

      if (diff2 < diff1 && diff2 < diff3) {
        bestTargetRotation = targetRotation + TAU;
      } else if (diff3 < diff1 && diff3 < diff2) {
        bestTargetRotation = targetRotation - TAU;
      }

      targetRotationRef.current = bestTargetRotation;
      isSnapping.current = true;
      velocityRef.current = 0;
    }

    // Handle snapping animation
    if (isSnapping.current) {
      let diff = targetRotationRef.current - rotationRef.current;

      // Handle wraparound - choose shortest path
      if (Math.abs(diff) > Math.PI) {
        diff += diff > 0 ? -TAU : TAU;
      }

      if (Math.abs(diff) < SNAP_EPSILON) {
        rotationRef.current = targetRotationRef.current;
        isSnapping.current = false;
      } else {
        rotationRef.current += diff * SNAP_SPEED;
      }
    } else {
      // Update rotation normally with delta time
      rotationRef.current += velocityRef.current * delta * REFERENCE_FPS;
    }

    // Apply smooth rotation to the group
    group.rotation.y = rotationRef.current;

    // Update current index based on rotation
    const normalizedAngle = ((-rotationRef.current % TAU) + TAU) % TAU;
    currentIndexRef.current = Math.round(normalizedAngle / anglePerImage) % images.length;
  });

  if (!images.length) return null;

  return (
    <group ref={groupRef}>
      {images.map((image, index) => {
        const imageTexture = textures[index];
        if (!imageTexture) return null;
        return (
          <ImagePlane
            key={`${image}-${index}`}
            texture={imageTexture}
            index={index}
            total={images.length}
            radius={radius}
            planeWidth={planeWidth}
            cornerRadius={cornerRadius}
            bendAmount={bendAmount}
            centerOpacity={centerOpacity}
            adjacentOpacity={adjacentOpacity}
            farOpacity={farOpacity}
            currentIndexRef={currentIndexRef}
          />
        );
      })}
      <pointLight position={[0, 2, 0]} intensity={0.5} />
      <ambientLight intensity={0.3} />
    </group>
  );
};
