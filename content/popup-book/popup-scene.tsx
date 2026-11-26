"use client";

import { Edges } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import { useMotionValueEvent } from "motion/react";
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  FrontSide,
  Matrix4,
  OrthographicCamera,
  SRGBColorSpace,
} from "three";
import type { Object3D, Texture } from "three";
import { CITIES, INK, PAPER, cardSpan, placement } from "./popup-cities";
import type { PopupLayer, PopupSolid } from "./popup-cities";

type Vec = readonly [number, number, number];

const SIZE = 200;
const ELEVATION = (36 * Math.PI) / 180;
const SIN_E = Math.sin(ELEVATION);
const COS_E = Math.cos(ELEVATION);
const BACKING = "#e7dfcf";
const CLOTH = "#d6ccb6";
const PAGE_PPU = 5;
const FACE_PPU = 12;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const smoothstep = (t: number) => t * t * (3 - 2 * t);
const rad = (deg: number) => (deg * Math.PI) / 180;
const dir = (deg: number) => [Math.cos(rad(deg)), Math.sin(rad(deg)), 0] satisfies Vec;
const scale = (v: Vec, s: number) => [v[0] * s, v[1] * s, v[2] * s] satisfies Vec;
const sub = (a: Vec, b: Vec) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]] satisfies Vec;
const add = (a: Vec, b: Vec) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]] satisfies Vec;

const cross = (a: Vec, b: Vec) =>
  [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]] satisfies Vec;

const unit = (v: Vec) => scale(v, 1 / (Math.hypot(v[0], v[1], v[2]) || 1));

const pageAngle = (page: number, progress: number) => {
  const offset = page - progress;

  if (offset <= 0) {
    return 135 + 24 * (1 - Math.exp(offset / 2.4));
  }

  if (offset >= 1) {
    return 45 - 34 * (1 - Math.exp(-(offset - 1) / 2.6));
  }

  return 135 - 90 * offset;
};

const setFrame = (target: Object3D | undefined, origin: Vec, x: Vec, y: Vec, z?: Vec) => {
  if (!target) {
    return;
  }

  const n = z ?? unit(cross(x, y));

  target.matrix.set(
    x[0],
    y[0],
    n[0],
    origin[0],
    x[1],
    y[1],
    n[1],
    origin[1],
    x[2],
    y[2],
    n[2],
    origin[2],
    0,
    0,
    0,
    1,
  );
  target.matrixWorldNeedsUpdate = true;
};

const geometry = (points: number[][], uvs: number[][], index: number[]) => {
  const result = new BufferGeometry();

  result.setAttribute("position", new BufferAttribute(new Float32Array(points.flat()), 3));
  result.setAttribute("uv", new BufferAttribute(new Float32Array(uvs.flat()), 2));
  result.setAttribute(
    "normal",
    new BufferAttribute(new Float32Array(points.flatMap(() => [0, 0, 1])), 3),
  );
  result.setIndex(index);

  return result;
};

const quad = (x0: number, x1: number, height: number, u0: number, u1: number) =>
  geometry(
    [
      [x0, 0, 0],
      [x1, 0, 0],
      [x1, height, 0],
      [x0, height, 0],
    ],
    [
      [u0, 1],
      [u1, 1],
      [u1, 0],
      [u0, 0],
    ],
    [0, 1, 2, 0, 2, 3],
  );

const TRIANGLES = [
  geometry(
    [
      [0, 0, 0],
      [SIZE, 0, 0],
      [SIZE, SIZE, 0],
    ],
    [
      [0, 1],
      [1, 1],
      [1, 0],
    ],
    [0, 1, 2],
  ),
  geometry(
    [
      [0, 0, 0],
      [SIZE, SIZE, 0],
      [0, SIZE, 0],
    ],
    [
      [0, 1],
      [1, 0],
      [0, 0],
    ],
    [0, 1, 2],
  ),
];

const PAGE_HALVES = [quad(0, SIZE, SIZE, 0.5, 1), quad(0, SIZE, SIZE, 0, 0.5)];

const svgDocument = (node: ReactNode, width: number, height: number, ppu: number) =>
  renderToStaticMarkup(
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${width} ${height}`}
      width={Math.round(width * ppu)}
      height={Math.round(height * ppu)}
    >
      <defs>
        <pattern
          id="hatch"
          width={6}
          height={6}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <path d="M0 0 V6" stroke={INK} strokeWidth={0.7} opacity={0.22} />
        </pattern>
        <filter id="ink" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.035"
            numOctaves={2}
            seed={3}
            result="wobble"
          />
          <feDisplacementMap in="SourceGraphic" in2="wobble" scale={1.5} result="inked" />
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={11} />
          <feColorMatrix
            values="0 0 0 0 0.92  0 0 0 0 0.9  0 0 0 0 0.95  -1.4 0 0 0 1.3"
            result="grain"
          />
          <feComposite in="grain" in2="inked" operator="in" result="speckle" />
          <feBlend in="speckle" in2="inked" mode="multiply" />
        </filter>
      </defs>
      <g filter="url(#ink)">{node}</g>
    </svg>,
  );

const rasterize = async (node: ReactNode, width: number, height: number, ppu: number) => {
  const image = new Image();

  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgDocument(node, width, height, ppu))}`;
  await image.decode();

  const canvas = document.createElement("canvas");

  canvas.width = Math.round(width * ppu);
  canvas.height = Math.round(height * ppu);
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);

  const texture = new CanvasTexture(canvas);

  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 16;

  return texture;
};

const Paper = ({ width, height, fill }: { width: number; height: number; fill: string }) => (
  <>
    <rect width={width} height={height} fill={fill} />
    <rect width={width} height={height} fill="url(#hatch)" />
  </>
);

const Edge = ({ d }: { d: string }) => (
  <path d={d} fill="none" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
);

const cardArt = (layer: PopupLayer, back: boolean) => {
  const { width } = cardSpan(layer.left, layer.right);
  const transform = placement(layer);
  const lineScale = layer.place?.zoom ?? 1;

  return (
    <>
      <clipPath id="outline">
        <path d={layer.outline} transform={transform} />
      </clipPath>
      <path
        d={layer.outline}
        transform={transform}
        fill="none"
        stroke={back ? BACKING : "#fffdf8"}
        strokeWidth={4.5 / lineScale}
        strokeLinejoin="round"
      />
      <g clipPath="url(#outline)">
        {back ? (
          <Paper width={width} height={layer.height} fill={BACKING} />
        ) : (
          <g transform={transform}>{layer.art}</g>
        )}
      </g>
      <path
        d={layer.outline}
        transform={transform}
        fill="none"
        stroke={INK}
        strokeWidth={1.6 / lineScale}
        strokeLinejoin="round"
      />
    </>
  );
};

type FaceKey = "top" | "left" | "right";

const faceSize = (solid: PopupSolid, face: FaceKey) => {
  const [w, d, h] = solid.size;

  if (face === "top") {
    return [w, d] as const;
  }

  return face === "left" ? ([d, h] as const) : ([w, h] as const);
};

interface BookTextures {
  backing: Texture;
  cloth: Texture;
  cities: {
    panorama: Texture;
    floor: Texture;
    cards: { front: Texture; back: Texture }[];
    faces: Map<string, Texture>;
  }[];
}

const faceKey = (solidIndex: number, face: FaceKey) => `${solidIndex}-${face}`;

const loadTextures = async () => {
  const backing = await rasterize(
    <>
      <Paper width={SIZE} height={SIZE} fill={BACKING} />
      <Edge d="M1 1H199V199H1z" />
    </>,
    SIZE,
    SIZE,
    1.5,
  );

  const cloth = await rasterize(
    <>
      <rect width={SIZE} height={SIZE} fill={CLOTH} />
      <Edge d="M1 1H199V199H1z" />
    </>,
    SIZE,
    SIZE,
    1,
  );

  const cities: BookTextures["cities"] = [];

  for (const city of CITIES) {
    const panorama = await rasterize(
      <>
        {city.panorama}
        <Edge d="M1 1H199V199H1zM201 1H399V199H201z" />
      </>,
      SIZE * 2,
      SIZE,
      PAGE_PPU,
    );

    const floor = await rasterize(
      <>
        <rect width={SIZE} height={SIZE} fill={city.ground} />
        {city.floor}
        <Edge d="M1 1H199V199H1z" />
        <path d="M0 0L200 200" stroke={INK} strokeWidth={1.2} opacity={0.25} />
      </>,
      SIZE,
      SIZE,
      PAGE_PPU,
    );

    const cards: BookTextures["cities"][number]["cards"] = [];

    for (const layer of city.layers) {
      const { width } = cardSpan(layer.left, layer.right);

      cards.push({
        back: await rasterize(cardArt(layer, true), width, layer.height, 1.5),
        front: await rasterize(cardArt(layer, false), width, layer.height, PAGE_PPU),
      });
    }

    const faces = new Map<string, Texture>();

    const solids: PopupSolid[] = city.solids ?? [];

    for (const [solidIndex, solid] of solids.entries()) {
      for (const face of ["top", "left", "right"] as const) {
        const art = solid.art?.[face];

        if (art) {
          const [fw, fh] = faceSize(solid, face);

          faces.set(faceKey(solidIndex, face), await rasterize(art, fw, fh, FACE_PPU));
        }
      }
    }

    cities.push({ cards, faces, floor, panorama });
  }

  return { backing, cities, cloth } satisfies BookTextures;
};

const FACES = {
  left: { a: [0, 1, 0], b: [0, 0, -1], normal: [1, 0, 0], origin: [1, 0, 1] },
  right: { a: [-1, 0, 0], b: [0, 0, -1], normal: [0, 1, 0], origin: [1, 1, 1] },
  top: { a: [1, 0, 0], b: [0, 1, 0], normal: [0, 0, 1], origin: [0, 0, 1] },
} as const;

const faceMatrix = (solid: PopupSolid, face: FaceKey) => {
  const [w, d, h] = solid.size;
  const [x0, y0] = solid.at;
  const spec = FACES[face];
  const [ou, ov, ot] = spec.origin;

  const origin = add(
    [x0 + ou * w, y0 + ov * d, (solid.lift ?? 0) + ot * h],
    scale(spec.normal, 0.15),
  );

  return new Matrix4().set(
    spec.a[0],
    spec.b[0],
    spec.normal[0],
    origin[0],
    spec.a[1],
    spec.b[1],
    spec.normal[1],
    origin[1],
    spec.a[2],
    spec.b[2],
    spec.normal[2],
    origin[2],
    0,
    0,
    0,
    1,
  );
};

const FaceDecal = ({ solid, face, map }: { solid: PopupSolid; face: FaceKey; map: Texture }) => {
  const [fw, fh] = faceSize(solid, face);
  const plane = useMemo(() => quad(0, fw, fh, 0, 1), [fw, fh]);
  const matrix = useMemo(() => faceMatrix(solid, face), [solid, face]);

  return (
    <mesh geometry={plane} matrix={matrix} matrixAutoUpdate={false}>
      <meshBasicMaterial map={map} alphaTest={0.05} side={DoubleSide} />
    </mesh>
  );
};

const FORMS = {
  cone: <cylinderGeometry args={[0, 1, 1, 24]} />,
  cylinder: <cylinderGeometry args={[1, 1, 1, 20]} />,
  dome: <sphereGeometry args={[1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />,
  gable: <cylinderGeometry args={[1, 1, 1, 3]} />,
} as const;

const HALO = 1.4;

const Halo = ({ extent, children }: { extent: [number, number, number]; children: ReactNode }) => (
  <mesh scale={extent.map((size) => 1 + (2 * HALO) / size) as [number, number, number]}>
    {children}
    <meshBasicMaterial color={PAPER} side={BackSide} />
  </mesh>
);

const SolidMesh = ({
  solid,
  faces,
}: {
  solid: PopupSolid;
  faces: (face: FaceKey) => Texture | undefined;
}) => {
  const [w, d, h] = solid.size;
  const [x0, y0] = solid.at;
  const lift = solid.lift ?? 0;
  const form = solid.form ?? "box";
  const cx = x0 + w / 2;
  const cy = y0 + d / 2;

  if (form === "box") {
    const colors = [
      solid.color,
      solid.color,
      solid.color,
      solid.color,
      solid.top ?? solid.color,
      solid.color,
    ];

    return (
      <group>
        <mesh position={[cx, cy, lift + h / 2]} castShadow receiveShadow>
          <boxGeometry args={[w, d, h]} />
          {colors.map((color, slot) => (
            <meshLambertMaterial key={slot} attach={`material-${slot}`} color={color} />
          ))}
          <Edges color={INK} lineWidth={1.6} threshold={20} />
          <Halo extent={[w, d, h]}>
            <boxGeometry args={[w, d, h]} />
          </Halo>
        </mesh>
        {(["top", "left", "right"] as const).map((face) => {
          const map = faces(face);

          return map ? <FaceDecal key={face} solid={solid} face={face} map={map} /> : null;
        })}
      </group>
    );
  }

  const wrap = faces("top");

  if (form === "gable") {
    return (
      <mesh
        position={[cx, cy, lift + h / 3]}
        scale={[w / Math.sqrt(3), d, h / 1.5]}
        castShadow
        receiveShadow
      >
        {FORMS.gable}
        <meshLambertMaterial color={wrap ? "#ffffff" : solid.color} map={wrap} />
        <Edges color={INK} lineWidth={1.6} threshold={20} />
        <Halo extent={[w, d, h]}>{FORMS.gable}</Halo>
      </mesh>
    );
  }

  return (
    <mesh
      position={[cx, cy, lift + (form === "dome" ? 0 : h / 2)]}
      rotation={[Math.PI / 2, 0, 0]}
      scale={[w / 2, h, d / 2]}
      castShadow
      receiveShadow
    >
      {FORMS[form]}
      <meshLambertMaterial color={wrap ? "#ffffff" : solid.color} map={wrap} />
      <Edges color={INK} lineWidth={1.6} threshold={30} />
      <Halo extent={[w, h, d]}>{FORMS[form]}</Halo>
    </mesh>
  );
};

const Rig = () => {
  const set = useThree((state) => state.set);

  const camera = useMemo(() => {
    const ortho = new OrthographicCamera(-230, 230, 186, -190, 1, 3000);

    Object.assign(ortho, { manual: true });
    ortho.position.set(0, SIN_E * 1000, COS_E * 1000);
    ortho.lookAt(0, 0, 0);
    ortho.updateProjectionMatrix();

    return ortho;
  }, []);

  useLayoutEffect(() => {
    set({ camera });
  }, [camera, set]);

  return null;
};

const ROOT = new Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1);

const Book = ({
  progress,
  textures,
}: {
  progress: MotionValue<number>;
  textures: BookTextures;
}) => {
  const nodes = useRef(new Map<string, Object3D>());
  const hatch = useRef(new Map<number, { opacity: number }>());
  const invalidate = useThree((state) => state.invalidate);

  useMotionValueEvent(progress, "change", () => {
    invalidate();
  });

  const register = (key: string) => (node: Object3D | null) => {
    if (node) {
      nodes.current.set(key, node);
    } else {
      nodes.current.delete(key);
    }
  };

  const cardGeometry = useMemo(
    () =>
      CITIES.map((city) =>
        city.layers.map((layer) => {
          const { width, crease } = cardSpan(layer.left, layer.right);

          return [
            quad(0, crease + 0.4, layer.height, 0, (crease + 0.4) / width),
            quad(crease, width, layer.height, crease / width, 1),
          ];
        }),
      ),
    [],
  );

  useFrame(() => {
    const value = progress.get();
    const get = (key: string) => nodes.current.get(key);
    const angles = Array.from({ length: CITIES.length + 1 }, (_, page) => pageAngle(page, value));
    const angleAt = (page: number) => angles[page] ?? 0;

    const openness = (spread: number) =>
      spread < 0 || spread >= CITIES.length
        ? 0
        : clamp((angleAt(spread) - angleAt(spread + 1)) / 90, 0, 1);

    const top: Vec = [0, 0, SIZE];
    const down: Vec = [0, 0, -1];

    for (const [page, theta] of angles.entries()) {
      const u = dir(theta);

      setFrame(get(`page-${page}-a`), top, u, down);
      setFrame(get(`page-${page}-b`), add(top, scale(u, SIZE)), scale(u, -1), down);

      for (const [side, spread] of [
        ["a", page - 1],
        ["b", page],
      ] as const) {
        const material = hatch.current.get(page * 2 + (side === "a" ? 0 : 1));

        if (material) {
          material.opacity = 0.85 * (1 - openness(spread)) ** 1.5;
        }
      }
    }

    for (const [index, city] of CITIES.entries()) {
      const left = angleAt(index);
      const right = angleAt(index + 1);
      const spread = left - right;
      const room = get(`room-${index}`);

      if (room) {
        room.visible = spread >= 0.5;
      }

      if (spread < 0.5) {
        continue;
      }

      const bisector = dir((left + right) / 2);
      const cosLift = Math.min(1, Math.SQRT1_2 / Math.cos(rad(spread / 2)));
      const sinLift = Math.sqrt(1 - cosLift * cosLift);
      const tip = scale([bisector[0] * cosLift, bisector[1] * cosLift, sinLift], SIZE * Math.SQRT2);
      const a3 = scale(dir(left), SIZE);
      const b3 = scale(dir(right), SIZE);

      const frames = [
        { x: scale(a3, 1 / SIZE), y: scale(sub(tip, a3), 1 / SIZE) },
        { x: scale(sub(tip, b3), 1 / SIZE), y: scale(b3, 1 / SIZE) },
      ];

      const rise = smoothstep(clamp((openness(index) - 0.6) / 0.4, 0, 1));

      for (const [half, frame] of frames.entries()) {
        setFrame(get(`floor-${index}-${half}`), [0, 0, 0], frame.x, frame.y);

        const objects = get(`objects-${index}-${half}`);

        if (objects) {
          objects.visible = rise > 0.02;
          setFrame(objects, [0, 0, 0], frame.x, frame.y, [0, 0, Math.max(rise, 0.02)]);
        }
      }

      const floorZ = (point: Vec) => {
        const wall = bisector[0] * point[1] - bisector[1] * point[0] >= 0 ? a3 : b3;
        const normal = cross(wall, tip);

        return Math.abs(normal[2]) < 1e-6
          ? 0
          : -(normal[0] * point[0] + normal[1] * point[1]) / normal[2];
      };

      for (const [layerIndex, layer] of city.layers.entries()) {
        const { width, crease } = cardSpan(layer.left, layer.right);
        const longRight = width - crease;
        const pL = scale(dir(left), layer.left);
        const pR = scale(dir(right), layer.right);
        const gap = sub(pR, pL);
        const span = Math.hypot(gap[0], gap[1]) || 1;
        const along = scale(gap, 1 / span);
        let side: Vec = [-along[1], along[0], 0];

        if (side[0] * pL[0] + side[1] * pL[1] > 0) {
          side = scale(side, -1);
        }

        const reachAlong = (crease ** 2 - longRight ** 2 + span ** 2) / (2 * span);
        const offset = Math.sqrt(Math.max(0, crease ** 2 - reachAlong ** 2));
        const flat = add(add(pL, scale(along, reachAlong)), scale(side, offset));
        const apex: Vec = [flat[0], flat[1], floorZ(flat)];
        const up: Vec = [0, 0, layer.height];
        const leftAxis = scale(sub(apex, pL), 1 / crease);
        const rightAxis = scale(sub(pR, apex), 1 / longRight);

        setFrame(get(`card-${index}-${layerIndex}-0`), add(pL, up), leftAxis, down);
        setFrame(
          get(`card-${index}-${layerIndex}-1`),
          add(sub(apex, scale(rightAxis, crease)), up),
          rightAxis,
          down,
        );
      }
    }
  });

  return (
    <group matrix={ROOT} matrixAutoUpdate={false}>
      <ambientLight intensity={0.75 * Math.PI} />
      <directionalLight
        position={[-100, 160, 352]}
        intensity={0.28 * Math.PI}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-radius={4}
        shadow-bias={-0.0004}
        shadow-normalBias={0.6}
        shadow-camera-left={-320}
        shadow-camera-right={320}
        shadow-camera-top={320}
        shadow-camera-bottom={-320}
        shadow-camera-near={10}
        shadow-camera-far={1400}
      />
      {Array.from({ length: CITIES.length + 1 }, (_, page) => {
        const before = textures.cities[page - 1];
        const after = textures.cities[page];

        return (
          <group key={page}>
            {(
              [
                ["a", before, 0],
                ["b", after, 1],
              ] as const
            ).map(([side, entry, slot]) => (
              <group key={side} ref={register(`page-${page}-${side}`)} matrixAutoUpdate={false}>
                <mesh geometry={PAGE_HALVES[slot]} castShadow>
                  <meshBasicMaterial
                    map={entry ? entry.panorama : textures.cloth}
                    side={FrontSide}
                    shadowSide={DoubleSide}
                  />
                </mesh>
                {entry ? (
                  <mesh geometry={PAGE_HALVES[slot]} renderOrder={1}>
                    <meshBasicMaterial
                      ref={(material) => {
                        if (material) {
                          hatch.current.set(page * 2 + slot, material);
                        }
                      }}
                      map={textures.backing}
                      transparent
                      opacity={0}
                      depthWrite={false}
                      polygonOffset
                      polygonOffsetFactor={-1}
                    />
                  </mesh>
                ) : null}
              </group>
            ))}
          </group>
        );
      })}
      {CITIES.map((city, index) => {
        const entry = textures.cities[index];

        if (!entry) {
          return null;
        }

        const list: PopupSolid[] = city.solids ?? [];
        const solids = list.map((solid, solidIndex) => ({ solid, solidIndex }));

        return (
          <group key={city.name} ref={register(`room-${index}`)}>
            {TRIANGLES.map((triangle, half) => (
              <group key={half} ref={register(`floor-${index}-${half}`)} matrixAutoUpdate={false}>
                <mesh geometry={triangle}>
                  <meshBasicMaterial map={entry.floor} side={BackSide} />
                </mesh>
                <mesh geometry={triangle} receiveShadow renderOrder={1}>
                  <shadowMaterial
                    opacity={0.2}
                    color={INK}
                    side={BackSide}
                    depthWrite={false}
                    polygonOffset
                    polygonOffsetFactor={-1}
                  />
                </mesh>
                <mesh geometry={triangle}>
                  <meshBasicMaterial map={textures.backing} side={FrontSide} />
                </mesh>
              </group>
            ))}
            {city.layers.map((layer, layerIndex) =>
              [0, 1].map((panel) => {
                const card = entry.cards[layerIndex];
                const plane = cardGeometry[index]?.[layerIndex]?.[panel];

                return card && plane ? (
                  <group
                    key={`${layer.left}-${layerIndex}-${panel}`}
                    ref={register(`card-${index}-${layerIndex}-${panel}`)}
                    matrixAutoUpdate={false}
                  >
                    <mesh geometry={plane}>
                      <meshBasicMaterial map={card.front} alphaTest={0.5} side={FrontSide} />
                    </mesh>
                    <mesh geometry={plane}>
                      <meshBasicMaterial map={card.back} alphaTest={0.5} side={BackSide} />
                    </mesh>
                  </group>
                ) : null;
              }),
            )}
            {[0, 1].map((half) => (
              <group key={half} ref={register(`objects-${index}-${half}`)} matrixAutoUpdate={false}>
                {solids.flatMap(({ solid, solidIndex }) => {
                  const onA = solid.at[0] + solid.size[0] / 2 >= solid.at[1] + solid.size[1] / 2;

                  return (half === 0) === onA
                    ? [
                        <SolidMesh
                          key={solidIndex}
                          solid={solid}
                          faces={(face) => entry.faces.get(faceKey(solidIndex, face))}
                        />,
                      ]
                    : [];
                })}
              </group>
            ))}
          </group>
        );
      })}
    </group>
  );
};

const SceneRoot = ({
  progress,
  onReady,
}: {
  progress: MotionValue<number>;
  onReady: () => void;
}) => {
  const [textures, setTextures] = useState<BookTextures | null>(null);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    let live = true;

    const load = async () => {
      const loaded = await loadTextures();

      if (live) {
        setTextures(loaded);
        onReady();
        invalidate();
      }
    };

    void load();

    return () => {
      live = false;
    };
  }, [invalidate, onReady]);

  return (
    <>
      <Rig />
      {textures ? <Book progress={progress} textures={textures} /> : null}
    </>
  );
};

export const PopupScene = memo(SceneRoot);
