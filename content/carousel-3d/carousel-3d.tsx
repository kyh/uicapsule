import { useEffect, useMemo, useRef } from "react";
import type { ReactNode, RefObject } from "react";
import type { BufferGeometry, Group, Mesh as MeshType, Texture } from "three";

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
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
import { NodeMaterial, WebGPURenderer } from "three/webgpu";

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

// Nearest image angle, expressed in whichever full turn is closest to the
// current rotation so the snap never travels the long way round.
const closestSnapRotation = (currentRotation: number, anglePerImage: number, count: number) => {
  const normalizedAngle = ((-currentRotation % TAU) + TAU) % TAU;
  const nearestImageIndex = Math.round(normalizedAngle / anglePerImage) % count;
  const targetRotation = -(nearestImageIndex * anglePerImage);

  const diff1 = Math.abs(targetRotation - currentRotation);
  const diff2 = Math.abs(targetRotation + TAU - currentRotation);
  const diff3 = Math.abs(targetRotation - TAU - currentRotation);

  if (diff2 < diff1 && diff2 < diff3) {
    return targetRotation + TAU;
  }
  if (diff3 < diff1 && diff3 < diff2) {
    return targetRotation - TAU;
  }
  return targetRotation;
};

const setPlaneOpacity = (group: Group, opacity: number) => {
  for (const child of group.children) {
    if (child instanceof Mesh && child.material instanceof NodeMaterial) {
      child.material.opacity = opacity;
    }
  }
};
/** Extra curvature applied on top of `bendAmount`. */
const BEND_MULTIPLIER = 2;
/** Half-width of the smoothstep band that antialiases the rounded-corner mask. */
const CORNER_MASK_FEATHER = 0.01;

export const ImageCarouselCanvas = ({
  backgroundColor = "#6F6D66",
  children,
}: {
  backgroundColor?: string;
  children: ReactNode;
}) => (
  <Canvas
    shadows
    camera={{ fov: 45, position: [0, 0, 12] }}
    className="cursor-grab active:cursor-grabbing"
    gl={async (props) => {
      if (!(props.canvas instanceof HTMLCanvasElement)) {
        throw new Error("ImageCarouselCanvas requires an HTML canvas");
      }
      const renderer = new WebGPURenderer({
        alpha: props.alpha,
        antialias: props.antialias,
        canvas: props.canvas,
        depth: props.depth,
        stencil: props.stencil,
      });
      await renderer.init();
      return renderer;
    }}
  >
    <color attach="background" args={[backgroundColor]} />
    {children}
  </Canvas>
);

interface ImagePlaneProps {
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
}

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
  const meshRef = useRef<MeshType<BufferGeometry, NodeMaterial> | null>(null);

  const angle = (index * TAU) / total;
  const x = Math.sin(angle) * radius;
  const z = Math.cos(angle) * radius;
  const planeHeight = planeWidth * IMAGE_ASPECT;

  const roundedCornersMaterial = useMemo(() => {
    const material = new NodeMaterial();

    const position = positionLocal;

    const bendStrength = mul(bendAmount, BEND_MULTIPLIER);
    const normalizedX = div(position.x, planeWidth * 0.5);
    const curvature = mul(mul(normalizedX, normalizedX), bendStrength);
    const bentZ = add(position.z, curvature);

    material.positionNode = vec3(position.x, position.y, bentZ);

    const uvCoords = uv();

    const imageColor = texture(imageTexture, uvCoords);

    const center = sub(uvCoords, 0.5);
    const d = length(max(sub(abs(center), 0.5 - cornerRadius), 0));

    const mask = smoothstep(
      cornerRadius + CORNER_MASK_FEATHER,
      cornerRadius - CORNER_MASK_FEATHER,
      d,
    );

    const finalColor = mix(vec4(0, 0, 0, 0), imageColor, mask);

    material.colorNode = finalColor;
    material.transparent = true;
    material.side = DoubleSide;

    return material;
  }, [imageTexture, bendAmount, planeWidth, cornerRadius]);

  useEffect(() => () => roundedCornersMaterial.dispose(), [roundedCornersMaterial]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }

    mesh.lookAt(0, mesh.position.y, 0);

    // Ring distance to the centred card, wrapping around the seam.
    const rawDistance = Math.abs(index - currentIndexRef.current);
    const distance = rawDistance > total / 2 ? total - rawDistance : rawDistance;

    if (distance === 0) {
      mesh.material.opacity = centerOpacity;
      return;
    }
    if (distance === 1) {
      mesh.material.opacity = adjacentOpacity;
      return;
    }
    // Smooth interpolation for positions beyond adjacent
    const maxDistance = Math.ceil(total / 2);
    const t = maxDistance > 1 ? (Math.min(distance, maxDistance) - 1) / (maxDistance - 1) : 0;
    mesh.material.opacity = adjacentOpacity + (farOpacity - adjacentOpacity) * t;
  });

  return (
    <mesh ref={meshRef} position={[x, 0, z]} material={roundedCornersMaterial}>
      <planeGeometry args={[planeWidth, planeHeight, 32, 32]} />
    </mesh>
  );
};

const EMPTY_IMAGES: string[] = [];

interface ImageCarouselProps {
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
}

export const ImageCarousel = ({
  images = EMPTY_IMAGES,
  radius = 5,
  imageWidth = 3,
  cornerRadius = 0.15,
  bendAmount = 0.1,
  centerOpacity = 1,
  adjacentOpacity = 1,
  farOpacity = 1,
  friction = 0.95,
  wheelSensitivity = 0.002,
  dragSensitivity = 0.0003,
  enableSnapping = true,
  autorotate = true,
  autorotateSpeed = 0.02,
}: ImageCarouselProps) => {
  const groupRef = useRef<Group | null>(null);
  const { gl, viewport } = useThree();

  const rotationRef = useRef(0);
  const velocityRef = useRef(0);
  const isDragging = useRef(false);
  const lastPointerX = useRef(0);
  const targetRotationRef = useRef(0);
  const isSnapping = useRef(false);
  const currentIndexRef = useRef(0);

  const isAnimatingIn = useRef(true);
  const animationProgress = useRef(0);

  const sourceTextures = useLoader(TextureLoader, images, (loader) => {
    loader.crossOrigin = "anonymous";
  });

  const textures = useMemo(
    () =>
      sourceTextures.map((source) => {
        const cloned = source.clone();
        cloned.colorSpace = SRGBColorSpace;
        return cloned;
      }),
    [sourceTextures],
  );

  useEffect(
    () => () => {
      for (const cloned of textures) {
        cloned.dispose();
      }
    },
    [textures],
  );

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
      if (!isDragging.current) {
        return;
      }
      velocityRef.current += (clientX - lastPointerX.current) * dragSensitivity;
      lastPointerX.current = clientX;
      isSnapping.current = false;
    };

    const handleMouseDown = (event: MouseEvent) => {
      startDrag(event.clientX);
    };

    const handleMouseMove = (event: MouseEvent) => {
      moveDrag(event.clientX);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const handleTouchStart = (event: TouchEvent) => {
      const [touch] = event.touches;
      if (touch) {
        startDrag(touch.clientX);
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      const [touch] = event.touches;
      if (touch) {
        moveDrag(touch.clientX);
      }
    };

    const handleTouchEnd = () => {
      isDragging.current = false;
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseUp);

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

  useFrame((state, delta) => {
    if (!images.length) {
      return;
    }
    const group = groupRef.current;
    if (!group) {
      return;
    }

    if (isAnimatingIn.current) {
      animationProgress.current = Math.min(
        1,
        animationProgress.current + delta / ENTRANCE_DURATION_SECONDS,
      );
      if (animationProgress.current >= 1) {
        isAnimatingIn.current = false;
      }

      const easedProgress = 1 - (1 - animationProgress.current) ** 3;

      group.rotation.y =
        INITIAL_ROTATION + (rotationRef.current - INITIAL_ROTATION) * easedProgress;

      // Overwrite the per-plane opacity written earlier this frame with the fade-in value.
      setPlaneOpacity(group, easedProgress);

      return;
    }

    if (autorotate && !isDragging.current && !isSnapping.current) {
      velocityRef.current += autorotateSpeed * delta;
    }

    // Apply friction using delta time for frame-rate independence
    velocityRef.current *= friction ** (delta * REFERENCE_FPS);

    const anglePerImage = TAU / images.length;

    if (
      enableSnapping &&
      !isDragging.current &&
      !isSnapping.current &&
      Math.abs(velocityRef.current) < VELOCITY_THRESHOLD
    ) {
      targetRotationRef.current = closestSnapRotation(
        rotationRef.current,
        anglePerImage,
        images.length,
      );
      isSnapping.current = true;
      velocityRef.current = 0;
    }

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
      rotationRef.current += velocityRef.current * delta * REFERENCE_FPS;
    }

    group.rotation.y = rotationRef.current;

    const normalizedAngle = ((-rotationRef.current % TAU) + TAU) % TAU;
    currentIndexRef.current = Math.round(normalizedAngle / anglePerImage) % images.length;
  });

  if (!images.length) {
    return null;
  }

  return (
    <group ref={groupRef}>
      {textures.map((imageTexture, index) => (
        <ImagePlane
          key={imageTexture.uuid}
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
      ))}
      <pointLight position={[0, 2, 0]} intensity={0.5} />
      <ambientLight intensity={0.3} />
    </group>
  );
};
