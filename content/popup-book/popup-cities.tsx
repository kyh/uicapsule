import type { ReactNode } from "react";

export const INK = "#3528d6";
export const PAPER = "#fbf7ee";

export interface PopupLayer {
  left: number;
  right: number;
  height: number;
  outline: string;
  art: ReactNode;
  place?: { anchor: number; at: number; zoom: number };
}

/** SVG transform that scales a layer's art about `anchor` on its baseline and moves it to `at`. */
export const placement = (layer: PopupLayer) =>
  layer.place
    ? `translate(${layer.place.at - layer.place.anchor * layer.place.zoom} 0) scale(${layer.place.zoom})`
    : undefined;

export interface PopupCity {
  name: string;
  country: string;
  coords: string;
  panorama: ReactNode;
  ground: string;
  floor: ReactNode;
  layers: PopupLayer[];
}

/** Flat width of a V-fold card glued `left` and `right` units from the spine, and where it creases. */
export const cardSpan = (left: number, right: number) => {
  const width = Math.hypot(left, right);

  return { crease: (width + left - right) / 2, width };
};

const BACK = { left: 99, right: 99 };
const MID = { left: 135, right: 135 };
const FRONT = { left: 178, right: 178 };
const MID_W = cardSpan(MID.left, MID.right).width;
const ZOOM = 1.7;
const MID_H = 70 * ZOOM;
const FRONT_W = cardSpan(FRONT.left, FRONT.right).width;

const ink = {
  stroke: INK,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  strokeWidth: 1.4,
} as const;

const hair = { ...ink, fill: "none", strokeOpacity: 0.5, strokeWidth: 0.8 } as const;

const range = (count: number) => Array.from({ length: count }, (_, index) => index);

const box = (x: number, y: number, w: number, h: number) => `M${x} ${y}h${w}v${h}h${-w}z`;

const disc = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 1 ${2 * r} 0a${r} ${r} 0 1 1 ${-2 * r} 0z`;

const ridge = (base: number, heights: number[], step: number) =>
  `M0 ${base}${heights.map((h, index) => `V${base - h}H${(index + 1) * step}`).join("")}V${base}z`;

const Cloud = ({ x, y, s }: { x: number; y: number; s: number }) => (
  <path
    {...ink}
    fill="#fffcf5"
    strokeWidth={1.1}
    d={`M${x} ${y}q${4 * s} ${-10 * s} ${14 * s} ${-6 * s}q${6 * s} ${-12 * s} ${20 * s} ${-4 * s}q${12 * s} ${-2 * s} ${12 * s} ${10 * s}z`}
  />
);

const Birds = ({ points }: { points: [number, number][] }) => (
  <path
    {...hair}
    strokeOpacity={0.8}
    strokeWidth={1}
    d={points.map(([x, y]) => `M${x - 4} ${y - 2}q2 -1 4 2q2 -3 4 -2`).join("")}
  />
);

const Windows = ({
  x,
  y,
  cols,
  rows,
  w,
  h,
  gx,
  gy,
  fill,
}: {
  x: number;
  y: number;
  cols: number;
  rows: number;
  w: number;
  h: number;
  gx: number;
  gy: number;
  fill: string;
}) => (
  <g>
    {range(rows).map((row) =>
      range(cols).map((col) => (
        <rect
          key={`${row}-${col}`}
          x={x + col * gx}
          y={y + row * gy}
          width={w}
          height={h}
          fill={fill}
          stroke={INK}
          strokeOpacity={0.6}
          strokeWidth={0.7}
        />
      )),
    )}
  </g>
);

const Stipple = ({ color, count, seed }: { color: string; count: number; seed: number }) => (
  <g fill={color}>
    {range(count).map((k) => (
      <circle
        key={k}
        cx={(k * 73 + seed * 31) % 200}
        cy={(k * 37 + seed * 17 + Math.floor(k / 5) * 11) % 200}
        r={0.9 + (k % 3) * 0.4}
      />
    ))}
  </g>
);

const Haussmann = ({ x, w, top }: { x: number; w: number; top: number }) => {
  const cols = Math.floor((w - 6) / 11);

  return (
    <g>
      <path {...ink} d={box(x + 5, top - 8, 5, 8)} fill="#eab3a0" strokeWidth={1} />
      <path {...ink} d={`M${x} ${top + 14}l6 -14h${w - 12}l6 14z`} fill="#a9add8" />
      <Windows
        x={x + 9}
        y={top + 4}
        cols={Math.max(1, cols - 1)}
        rows={1}
        w={4}
        h={6}
        gx={11}
        gy={0}
        fill={PAPER}
      />
      <rect {...ink} x={x} y={top + 14} width={w} height={200 - top - 14} fill="#f6ead7" />
      <Windows
        x={x + 5}
        y={top + 20}
        cols={cols}
        rows={4}
        w={5}
        h={9}
        gx={11}
        gy={16}
        fill="#bcd2ee"
      />
      <path {...hair} d={`M${x} ${top + 31}h${w}M${x} ${top + 63}h${w}`} strokeOpacity={0.9} />
      <path {...hair} d={`M${x} ${top + 32}h${w}`} strokeDasharray="1.5 2" strokeOpacity={0.9} />
    </g>
  );
};

const Bunting = ({ y, sag, colors }: { y: number; sag: number; colors: string[] }) => (
  <g>
    <path {...hair} strokeOpacity={0.9} d={`M0 ${y}Q200 ${y + sag * 2} 400 ${y}`} />
    {range(20).map((k) => {
      const t = (k + 0.5) / 20;
      const x = t * 400;
      const yy = y + sag * 4 * t * (1 - t);

      return (
        <path
          key={k}
          d={`M${x - 5} ${yy}h10l-5 9z`}
          fill={colors[k % colors.length]}
          stroke={INK}
          strokeWidth={0.7}
          strokeLinejoin="round"
        />
      );
    })}
  </g>
);

const parisTower = `M0 150V146H18L30 132L42 108L40 104L48 100L56 76L54 72L58 70L63 40L64 18L68 16L70 2L72 16L76 18L77 40L82 70L86 72L84 76L92 100L100 104L98 108L110 132L122 146H140V150zM98 146Q70 106 42 146z${disc(11, 130, 10)}${disc(129, 130, 10)}`;

const paris = {
  coords: "48.86° N · 2.29° E",
  country: "France",
  floor: (
    <g>
      <Stipple color="#cbb995" count={90} seed={1} />
      <path d="M28 0H200V172z" fill="#b2d8aa" />
      <path d="M0 28V200H172z" fill="#b2d8aa" />
      {range(8).map((k) => (
        <path
          key={k}
          d={`M${44 + k * 20} 0L200 ${156 - k * 20}M0 ${44 + k * 20}L${156 - k * 20} 200`}
          stroke="#c8e6bd"
          strokeWidth={7}
        />
      ))}
      <path {...ink} d="M28 0L200 172M0 28L172 200" fill="none" />
      <path {...hair} d="M34 0L200 166M0 34L166 200" strokeDasharray="2 3" />
      {range(16).map((k) => (
        <circle
          key={k}
          cx={158 + Math.cos(k * 0.39) * 36}
          cy={158 + Math.sin(k * 0.39) * 36}
          r={3.4}
          fill={k % 2 === 0 ? "#f4b3c0" : "#fae2a0"}
          stroke={INK}
          strokeWidth={0.6}
        />
      ))}
      <circle {...ink} cx={158} cy={158} r={27} fill="#e7dcc4" />
      <circle {...ink} cx={158} cy={158} r={22} fill="#bfe0ea" />
      <circle
        {...hair}
        cx={158}
        cy={158}
        r={15}
        stroke="#fdfcf8"
        strokeOpacity={1}
        strokeWidth={1.4}
      />
      <circle
        {...hair}
        cx={158}
        cy={158}
        r={9}
        stroke="#fdfcf8"
        strokeOpacity={1}
        strokeWidth={1.2}
      />
      <circle {...ink} cx={158} cy={158} r={4} fill="#fdfcf8" strokeWidth={1} />
      {[
        [120, 92],
        [128, 100],
        [60, 70],
      ].map(([x = 0, y = 0]) => (
        <g key={`${x}-${y}`}>
          <ellipse {...ink} cx={x} cy={y} rx={3.4} ry={2.4} fill="#c9c6dc" strokeWidth={0.8} />
          <circle cx={x + 2.6} cy={y - 1.6} r={1.4} fill="#a9a6c4" />
        </g>
      ))}
      <path {...ink} d="M150 40h22v6h-22zM152 46v5M170 46v5" fill="#e3c08e" strokeWidth={1} />
      <path {...ink} d="M40 150h6v22h-6zM46 152v4M46 168v4" fill="#e3c08e" strokeWidth={1} />
    </g>
  ),
  ground: "#ece0c6",
  layers: [
    {
      ...BACK,
      art: (
        <g>
          <rect width={140} height={150} fill="#ddad8c" />
          {range(18).map((k) => (
            <path
              key={k}
              {...hair}
              d={`M${16 + k * 7} 0L${k * 7 - 44} 150M${k * 7 - 26} 0L${k * 7 + 34} 150`}
              strokeOpacity={0.35}
            />
          ))}
          <path {...ink} d={box(58, 38, 24, 5)} fill="#c98c68" strokeWidth={1.1} />
          <path {...ink} d={box(50, 68, 40, 6)} fill="#c98c68" strokeWidth={1.1} />
          <path {...ink} d={box(38, 100, 64, 7)} fill="#c98c68" strokeWidth={1.1} />
          <path {...hair} d="M70 4V36M66 78L70 98L74 78" strokeOpacity={0.6} />
          <circle cx={11} cy={130} r={10} fill="#9fce9e" />
          <circle cx={129} cy={130} r={10} fill="#9fce9e" />
          <path {...hair} d="M5 128q4 -5 9 -1M123 128q4 -5 9 -1" strokeOpacity={0.9} />
          <rect y={146} width={140} height={4} fill="#d9c7a3" />
        </g>
      ),
      height: 150,
      outline: parisTower,
    },
    {
      ...MID,
      place: { anchor: 148, at: 140, zoom: ZOOM },
      art: (
        <g>
          <rect width={MID_W} height={70} fill="#f2e6cf" />
          <path d="M126 30q22 -24 44 0z" fill="#ee9aa2" />
          {range(4).map((k) => (
            <path key={k} d={`M${131 + k * 11} 30L148 9`} stroke={PAPER} strokeWidth={2.6} />
          ))}
          <rect x={146.5} y={30} width={3} height={22} fill="#8d86c9" />
          <ellipse cx={148} cy={52} rx={16} ry={3} fill="#f6ead7" />
          <path {...hair} d="M148 55v13M142 68h12" strokeOpacity={1} />
          <path
            {...hair}
            d="M122 46v22M122 52h10v16M174 46v22M174 52h-10v16"
            strokeOpacity={1}
            strokeWidth={1.2}
          />
          <path {...ink} d="M50 56h12l-2 12h-8z" fill="#e8b48f" strokeWidth={1.1} />
          <circle cx={56} cy={50} r={8} fill="#9fce9e" />
        </g>
      ),
      height: MID_H,
      outline: `M126 30q22 -24 44 0z${box(146.5, 30, 3, 22)}M132 52a16 3 0 1 0 32 0a16 3 0 1 0 -32 0z${box(146.5, 54, 3, 14)}${box(141, 66, 14, 2)}${box(120.5, 46, 3, 22)}${box(120, 51, 13, 3)}${box(130, 51, 3, 17)}${box(172.5, 46, 3, 22)}${box(163, 51, 13, 3)}${box(163, 51, 3, 17)}M50 56h12l-2 12h-8z${disc(56, 50, 8)}`,
    },
    {
      ...FRONT,
      art: (
        <g>
          <rect width={FRONT_W} height={84} fill="#93c79c" />
          {range(7).map((k) => (
            <g key={k}>
              <path {...hair} d={`M${k * 20 + 4} 70q6 -6 12 0`} strokeOpacity={0.7} />
              <circle cx={k * 20 + 6} cy={66} r={1.9} fill="#f4a7b7" />
              <circle cx={k * 20 + 15} cy={73} r={1.7} fill="#fbe3a0" />
            </g>
          ))}
          <rect x={22} y={10} width={5} height={52} fill="#7d78bd" />
          <path {...ink} d={box(18, 2, 13, 12)} fill="#fbe7b0" strokeWidth={1.1} />
          <rect x={232} y={10} width={5} height={74} fill="#7d78bd" />
          <path {...ink} d={box(228, 2, 13, 12)} fill="#fbe7b0" strokeWidth={1.1} />
          <path
            {...ink}
            d="M88 50h40v4h-40zM90 54v8M126 54v8M88 44h40v3h-40z"
            fill="#e3c08e"
            strokeWidth={1}
          />
        </g>
      ),
      height: 84,
      outline: `M0 84V62${range(7)
        .map(() => "q10 -12 20 0")
        .join(
          "",
        )}V84z${box(22, 10, 5, 54)}${box(18, 2, 13, 12)}${box(232, 10, 5, 74)}${box(228, 2, 13, 12)}${box(88, 44, 40, 10)}`,
    },
  ],
  name: "Paris",
  panorama: (
    <g>
      <rect width={400} height={200} fill="#f7dcd2" />
      <rect width={400} height={56} fill="#f3cdd0" />
      <rect width={400} height={24} fill="#ecc0cc" />
      <circle {...ink} cx={292} cy={84} r={18} fill="#fce6b6" />
      <Cloud x={50} y={46} s={1.1} />
      <Cloud x={218} y={32} s={0.8} />
      <Cloud x={336} y={58} s={1} />
      <Birds
        points={[
          [150, 60],
          [162, 54],
          [172, 62],
          [260, 40],
          [270, 46],
        ]}
      />
      <path
        d={ridge(
          150,
          [34, 42, 30, 48, 38, 26, 44, 36, 30, 46, 40, 28, 38, 50, 32, 42, 36, 30, 44, 38],
          20,
        )}
        fill="#dcd1ee"
      />
      <path {...ink} d="M56 114q14 -26 28 0zM66 94q4 -12 8 0z" fill="#f2ecf8" strokeWidth={1} />
      <path {...ink} d="M54 118h32v10h-32z" fill="#f2ecf8" strokeWidth={1} />
      {[
        [0, 46, 132],
        [46, 40, 124],
        [86, 52, 136],
        [138, 44, 128],
        [182, 38, 140],
        [220, 50, 126],
        [270, 42, 134],
        [312, 48, 122],
        [360, 40, 130],
      ].map(([x = 0, w = 0, top = 0]) => (
        <Haussmann key={x} x={x} w={w} top={top} />
      ))}
      <Bunting y={18} sag={16} colors={["#f2a3b0", "#fbe3a0", "#b9d0ee", "#f6ead7"]} />
    </g>
  ),
} satisfies PopupCity;

const pagodaOutline = (() => {
  const parts = [box(0, 144, 140, 6), box(22, 136, 96, 8)];

  for (const tier of range(5)) {
    const y = 132 - tier * 24;
    const w = 122 - tier * 15;
    const body = w * 0.56;
    parts.push(
      `M${70 - w / 2} ${y}q8 -2 12 -8H${70 + w / 2 - 12}q4 6 12 8l-8 4H${70 - w / 2 + 8}z`,
      box(70 - body / 2, y + 4, body, tier === 0 ? 4 : 14),
    );
  }

  parts.push(box(68.5, 4, 3, 30));

  return parts.join("");
})();

const kyoto = {
  coords: "34.98° N · 135.75° E",
  country: "Japan",
  floor: (
    <g>
      {range(14).map((k) => (
        <path
          key={k}
          {...hair}
          strokeOpacity={0.35}
          d={`M${k * 15} 0L200 ${200 - k * 15}M0 ${k * 15}L${200 - k * 15} 200`}
        />
      ))}
      <ellipse {...ink} cx={152} cy={50} rx={34} ry={26} fill="#b6dfdc" />
      <ellipse {...hair} cx={152} cy={50} rx={40} ry={32} strokeOpacity={0.6} />
      <ellipse {...hair} cx={152} cy={50} rx={46} ry={38} strokeOpacity={0.4} />
      <path {...hair} d="M132 50q10 -6 20 0M144 60q10 -6 20 0" strokeOpacity={0.8} />
      <path
        d="M146 44q6 -4 10 0q-4 4 -10 0zM160 54q5 -3 9 0q-4 3 -9 0zM138 56q4 -3 8 0q-4 3 -8 0z"
        fill="#f0a27a"
      />
      {[
        [116, 168, 9],
        [168, 120, 12],
      ].map(([x = 0, y = 0, r = 0]) => (
        <g key={x}>
          {range(4).map((ring) => (
            <circle key={ring} {...hair} cx={x} cy={y} r={r + 6 + ring * 6} strokeOpacity={0.55} />
          ))}
          <path
            {...ink}
            d={`M${x - r} ${y + 2}q2 -${r} ${r} -${r}q${r} 1 ${r} ${r + 2}z`}
            fill="#bdb8c6"
          />
          <path
            d={`M${x - r * 0.6} ${y + 3}q${r * 0.6} 3 ${r * 1.4} 0`}
            stroke="#9fd09c"
            strokeWidth={2}
            fill="none"
          />
        </g>
      ))}
      {range(7).map((k) => (
        <ellipse
          key={k}
          {...ink}
          cx={62 + k * 21}
          cy={28 + k * 21}
          rx={9}
          ry={7}
          fill="#dcd8ce"
          strokeWidth={1}
        />
      ))}
      <path d="M20 120q16 -10 30 4q10 18 -8 24q-24 4 -22 -28z" fill="#bcdcb2" />
      <path d="M150 168q20 -12 34 6q2 16 -18 18q-20 -4 -16 -24z" fill="#bcdcb2" />
      <circle {...ink} cx={48} cy={166} r={9} fill="#efb093" />
      <circle {...ink} cx={62} cy={178} r={6} fill="#f3c2a2" />
    </g>
  ),
  ground: "#f1eadb",
  layers: [
    {
      ...BACK,
      art: (
        <g>
          <rect width={140} height={150} fill="#f7efe0" />
          {range(5).map((tier) => {
            const y = 132 - tier * 24;
            const w = 122 - tier * 15;

            return (
              <g key={tier}>
                <path
                  {...ink}
                  d={`M${70 - w / 2} ${y}q8 -2 12 -8H${70 + w / 2 - 12}q4 6 12 8l-8 4H${70 - w / 2 + 8}z`}
                  fill="#9a94d0"
                />
                <path
                  d={`M${70 - w * 0.2} ${y + 7}v12M${70 + w * 0.2} ${y + 7}v12M${70 - w * 0.06} ${y + 7}v12M${70 + w * 0.06} ${y + 7}v12`}
                  stroke="#e58a6f"
                  strokeWidth={1.6}
                />
              </g>
            );
          })}
          <rect x={68.5} y={4} width={3} height={30} fill="#d6b56a" />
          {range(5).map((k) => (
            <rect key={k} x={66} y={8 + k * 5} width={8} height={1.6} fill="#d6b56a" />
          ))}
          <rect y={136} width={140} height={14} fill="#d8d0bf" />
          <path {...hair} d="M22 140h96M0 146h140" strokeOpacity={0.6} />
        </g>
      ),
      height: 150,
      outline: pagodaOutline,
    },
    {
      ...MID,
      place: { anchor: 40, at: 146, zoom: 1.4 },
      art: (
        <g>
          <rect width={MID_W} height={70} fill="#dcd8ce" />
          <path {...hair} d="M30 30h20M34 46h12M28 60h24" strokeOpacity={0.7} />
          <path d="M34 34h12v10h-12z" fill="#fbe7b0" />
        </g>
      ),
      height: 70 * 1.4,
      outline: `M28 30l12 -12l12 12z${box(30, 30, 20, 4)}${box(32, 34, 16, 10)}${box(36, 44, 8, 14)}${box(28, 58, 24, 4)}${box(32, 62, 16, 8)}`,
    },
    {
      ...FRONT,
      art: (
        <g>
          <rect width={FRONT_W} height={140} fill="#ea8a72" />
          <rect x={0} y={2} width={FRONT_W} height={7} fill="#6e6aa6" />
          <rect x={114} y={16} width={24} height={14} fill="#6e6aa6" />
          <path {...hair} d="M118 21h16M118 25h16" stroke="#fbe7b0" strokeOpacity={1} />
          <path
            {...hair}
            d="M52 40v96M56 40v96M200 40v96M204 40v96"
            stroke="#fbf7ee"
            strokeOpacity={0.5}
          />
          <rect x={44} y={132} width={22} height={8} fill="#6e6aa6" />
          <rect x={186} y={132} width={22} height={8} fill="#6e6aa6" />
        </g>
      ),
      height: 140,
      outline: `M4 4q60 7 122 7q62 0 122 -7l-5 12H9z${box(26, 16, 200, 6)}${box(114, 16, 24, 16)}${box(48, 16, 12, 120)}${box(192, 16, 12, 120)}${box(34, 32, 184, 6)}${box(44, 132, 22, 8)}${box(186, 132, 22, 8)}`,
    },
  ],
  name: "Kyoto",
  panorama: (
    <g>
      <rect width={400} height={200} fill="#fbefd9" />
      <rect width={400} height={46} fill="#f8e4c4" />
      <rect width={400} height={18} fill="#f4dbb6" />
      <circle {...ink} cx={128} cy={66} r={20} fill="#f2a58e" />
      <Cloud x={238} y={52} s={1} />
      <path {...hair} d="M196 36h60M206 42h70M60 30h50" strokeOpacity={0.4} />
      <path
        d="M290 40l8 -3l-2 4l10 -2l-12 6zM312 52l7 -3l-2 3l9 -2l-11 5z"
        fill="#fffcf5"
        stroke={INK}
        strokeWidth={0.8}
        strokeLinejoin="round"
      />
      <path
        {...ink}
        d="M0 136L60 92L110 120L170 76L240 124L300 88L360 116L400 98V200H0z"
        fill="#d7ddef"
        strokeWidth={1.1}
      />
      <path {...hair} d="M164 80l6 -4l6 6M294 92l6 -4l6 6M54 96l6 -4l6 6" strokeOpacity={0.8} />
      <path
        {...ink}
        d="M0 150L40 128L96 146L150 118L220 148L280 122L340 144L400 126V200H0z"
        fill="#bccde4"
        strokeWidth={1.1}
      />
      <path d="M0 200V160Q50 150 100 158T200 156T300 160T400 154V200z" fill="#aed4b3" />
      {range(26).map((k) => (
        <path
          key={k}
          {...ink}
          strokeWidth={0.9}
          d={`M${k * 16 - 4} ${168 + (k % 3) * 4}l6 -16l6 16z`}
          fill={k % 4 === 0 ? "#efa58a" : "#93c49e"}
        />
      ))}
    </g>
  ),
} satisfies PopupCity;

const crown = "M52 52Q52 22 70 8Q88 22 88 52z";

const spireOutline = `${box(0, 144, 140, 6)}${box(6, 80, 32, 64)}${box(40, 52, 48, 92)}${crown}${box(69, 0, 2, 10)}${box(92, 86, 42, 58)}${box(100, 70, 26, 16)}${box(106, 58, 14, 12)}${box(112, 36, 2, 22)}`;

const newYork = {
  coords: "40.75° N · 73.99° W",
  country: "United States",
  floor: (
    <g>
      <Stipple color="#b7b8c8" count={70} seed={4} />
      <path d="M0 0H28V200H0zM0 0H200V28H0z" fill="#ebe8e2" />
      {range(8).map((k) => (
        <path
          key={k}
          {...hair}
          strokeOpacity={0.4}
          d={`M0 ${k * 25 + 28}H28M${k * 25 + 28} 0V28`}
        />
      ))}
      <path {...ink} d="M28 28V200M28 28H200" fill="none" />
      {range(7).map((k) => {
        const cx = 150 + (k - 3) * 9;
        const cy = 150 - (k - 3) * 9;

        return (
          <path
            key={k}
            d={`M${cx - 14} ${cy - 14}L${cx + 14} ${cy + 14}`}
            stroke="#fbf8f2"
            strokeWidth={5.5}
          />
        );
      })}
      <path
        d="M44 40L96 92M48 36L100 88M174 168L196 190M178 164L200 186"
        stroke="#f0c95e"
        strokeWidth={2}
      />
      <path
        d="M72 120l10 10l-4 0l0 8l-4 0l0 -8l-4 0z"
        fill="#fbf8f2"
        transform="rotate(-45 77 129)"
      />
      <path
        d="M118 70l10 10l-4 0l0 8l-4 0l0 -8l-4 0z"
        fill="#fbf8f2"
        transform="rotate(-45 123 79)"
      />
      <circle {...ink} cx={70} cy={150} r={10} fill="#a8aabd" />
      <path {...hair} d="M63 146h14M62 150h16M63 154h14" strokeOpacity={0.8} />
      <path
        d="M66 140q-4 -8 2 -14q6 -6 0 -12"
        stroke="#fffcf5"
        strokeWidth={2.4}
        fill="none"
        opacity={0.9}
      />
      {range(4).map((k) => (
        <circle key={k} {...ink} cx={13} cy={46 + k * 44} r={7} fill="#a9d1ae" strokeWidth={1} />
      ))}
      {range(4).map((k) => (
        <circle key={k} {...ink} cx={46 + k * 44} cy={13} r={7} fill="#a9d1ae" strokeWidth={1} />
      ))}
    </g>
  ),
  ground: "#cfd0dc",
  layers: [
    {
      ...BACK,
      art: (
        <g>
          <rect width={140} height={150} fill="#dfe1f2" />
          <rect x={40} y={52} width={48} height={92} fill="#e9ebf6" />
          <path d={crown} fill="#f1f2f9" />
          {range(4).map((k) => (
            <g key={k}>
              <path
                {...hair}
                strokeOpacity={0.9}
                d={`M${52 + k * 4} ${52 - k * 9}Q${52 + k * 4} ${30 - k * 6} 70 ${18 - k * 2}Q${88 - k * 4} ${30 - k * 6} ${88 - k * 4} ${52 - k * 9}`}
              />
              {range(5 - k).map((j) => (
                <path
                  key={j}
                  d={`M${56 + k * 4 + (j * (28 - k * 8)) / (4 - k || 1)} ${50 - k * 9}l2 -5l2 5z`}
                  fill="#c8cde8"
                />
              ))}
            </g>
          ))}
          <Windows x={45} y={58} cols={5} rows={10} w={4} h={5} gx={8.4} gy={8.4} fill="#fbe7b0" />
          <rect x={6} y={80} width={32} height={64} fill="#cdd1ea" />
          <Windows x={10} y={86} cols={3} rows={6} w={4} h={5} gx={9} gy={9} fill="#fbe7b0" />
          <rect x={92} y={86} width={42} height={58} fill="#efe3d4" />
          <rect x={100} y={70} width={26} height={16} fill="#efe3d4" />
          <rect x={106} y={58} width={14} height={12} fill="#efe3d4" />
          <Windows x={96} y={92} cols={4} rows={5} w={4} h={5} gx={9} gy={9} fill="#bcd2ee" />
          <path {...hair} d="M100 86h26M106 70h14" strokeOpacity={0.9} />
          <rect y={144} width={140} height={6} fill="#b6b9cb" />
        </g>
      ),
      height: 150,
      outline: spireOutline,
    },
    {
      ...MID,
      place: { anchor: 146, at: 138, zoom: ZOOM },
      art: (
        <g>
          <rect width={MID_W} height={70} fill="#f3e6cf" />
          <path d="M126 26q20 -20 40 0z" fill="#f0c95e" />
          {range(3).map((k) => (
            <path key={k} d={`M${133 + k * 10} 26L146 8`} stroke="#ee8f96" strokeWidth={3} />
          ))}
          {range(5).map((k) => (
            <path
              key={k}
              d={`M${126 + k * 8} 26h8v3q-4 3 -8 0z`}
              fill={k % 2 === 0 ? "#ee8f96" : "#fbf8f2"}
            />
          ))}
          <rect x={144.5} y={29} width={3} height={9} fill="#8d86c9" />
          <rect x={150} y={37} width={4} height={7} rx={1} fill="#f0c95e" />
          <rect x={156} y={36} width={4} height={8} rx={1} fill="#e2675f" />
          <rect x={122} y={42} width={48} height={3} fill="#fbf8f2" />
          <rect x={124} y={45} width={44} height={15} fill="#d6daee" />
          <path d="M124 49h44" stroke="#8d86c9" strokeWidth={1.4} />
          <rect x={128} y={51} width={16} height={7} fill="#fbf8f2" />
          <path {...hair} d="M130 53h10M130 56h7" strokeOpacity={1} />
          <circle cx={156} cy={54} r={3} fill="#ee8f96" />
          <circle cx={132} cy={64} r={5} fill="#8d86c9" />
          <circle cx={160} cy={64} r={5} fill="#8d86c9" />
          <circle cx={132} cy={64} r={1.8} fill="#e9ebf6" />
          <circle cx={160} cy={64} r={1.8} fill="#e9ebf6" />
          <path {...ink} d="M40 50h10v18h-10zM38 46h14v4h-14z" fill="#ef9a90" strokeWidth={1.1} />
        </g>
      ),
      height: MID_H,
      outline: `M126 26q20 -20 40 0z${box(126, 26, 40, 5)}${box(144.5, 26, 3, 18)}${box(150, 37, 4, 7)}${box(156, 36, 4, 8)}${box(122, 42, 48, 3)}${box(124, 44, 44, 16)}${disc(132, 64, 5)}${disc(160, 64, 5)}${box(40, 50, 10, 18)}${box(38, 46, 14, 4)}`,
    },
    {
      ...FRONT,
      art: (
        <g>
          <rect width={FRONT_W} height={84} fill="#f0c95e" />
          <path {...ink} d="M36 60h22l5 9h-32z" fill="#d6e4f6" strokeWidth={1.1} />
          <path {...ink} d="M43 60h7v-4h-7z" fill={PAPER} strokeWidth={0.9} />
          <path {...hair} d="M46 60v9M22 73h52" strokeOpacity={0.9} />
          <path d="M22 72h52" stroke="#2a2150" strokeOpacity={0.15} strokeWidth={6} />
          <circle {...ink} cx={32} cy={78} r={5.5} fill="#8d86c9" />
          <circle {...ink} cx={62} cy={78} r={5.5} fill="#8d86c9" />
          <circle cx={32} cy={78} r={2} fill="#e9ebf6" />
          <circle cx={62} cy={78} r={2} fill="#e9ebf6" />
          <rect x={236} y={8} width={4} height={76} fill="#7d78bd" />
          <path {...ink} d="M228 8h20v6h-20z" fill="#fbe7b0" strokeWidth={1.1} />
          <circle cx={200} cy={38} r={20} fill="#a9d1ae" />
          <circle cx={186} cy={48} r={12} fill="#9bc8a3" />
          <rect x={198} y={52} width={4} height={32} fill="#a48a78" />
          <path {...hair} d="M190 34q6 -6 14 -2M180 46q4 -4 8 -1" strokeOpacity={0.9} />
        </g>
      ),
      height: 84,
      outline: `M22 69h9l5 -9h22l5 9h11v11h-52z${disc(32, 78, 5.5)}${disc(62, 78, 5.5)}${box(43, 56, 7, 4)}${box(236, 10, 4, 74)}${box(228, 8, 20, 6)}${disc(200, 38, 20)}${disc(186, 48, 12)}${box(198, 52, 4, 32)}`,
    },
  ],
  name: "New York",
  panorama: (
    <g>
      <rect width={400} height={200} fill="#f6d8c9" />
      <rect width={400} height={74} fill="#dcd6f0" />
      <rect width={400} height={36} fill="#c9cdee" />
      <Cloud x={70} y={62} s={1} />
      <Cloud x={300} y={42} s={1.1} />
      <path {...hair} d="M180 30l60 -10" strokeOpacity={0.5} strokeDasharray="3 3" />
      <path {...ink} d="M240 20l7 -2l-1 3z" fill="#fffcf5" strokeWidth={0.8} />
      <path
        d={ridge(
          200,
          [
            92, 120, 76, 140, 98, 84, 128, 70, 110, 150, 88, 104, 132, 80, 118, 96, 72, 136, 90,
            112,
          ],
          20,
        )}
        fill="#b0b5df"
      />
      {range(40).map((k) => (
        <rect
          key={k}
          x={(k * 37) % 400}
          y={70 + ((k * 53) % 90)}
          width={3}
          height={4}
          fill="#fbe7b0"
        />
      ))}
      {[
        [0, 44, 120, "#ecdccd"],
        [50, 36, 140, "#d6daee"],
        [92, 48, 112, "#f2e6d6"],
        [262, 40, 128, "#d6daee"],
        [308, 50, 116, "#ecdccd"],
        [362, 38, 136, "#f2e6d6"],
      ].map(([x = 0, w = 0, top = 0, fill = ""]) => (
        <g key={Number(x)}>
          <rect {...ink} x={x} y={top} width={w} height={200 - Number(top)} fill={String(fill)} />
          <Windows
            x={Number(x) + 5}
            y={Number(top) + 8}
            cols={Math.floor((Number(w) - 6) / 9)}
            rows={Math.floor((200 - Number(top) - 12) / 12)}
            w={4}
            h={6}
            gx={9}
            gy={12}
            fill="#bcd2ee"
          />
          <path
            {...ink}
            d={`M${Number(x) + 8} ${top}v-12h12v12zM${Number(x) + 7} ${Number(top) - 12}l7 -6l7 6z`}
            fill="#d7b296"
            strokeWidth={1}
          />
          <path {...hair} d={`M${Number(x) + 9} ${top}l2 6M${Number(x) + 19} ${top}l-2 6`} />
        </g>
      ))}
    </g>
  ),
} satisfies PopupCity;

const rialtoArcade = "M4 117L56 99V82L4 100zM136 117L84 99V82L136 100z";
const rialtoRoofs = "M1 101L58 81V75L1 95zM139 101L82 81V75L139 95z";
const gondolaFerro = "M246 40l6 -6l2 2l-4 4v10h-4z";
const gondolaOar = "M110 25l38 56l-2.4 1.6l-38 -56z";

const venice = {
  coords: "45.44° N · 12.34° E",
  country: "Italy",
  floor: (
    <g>
      {range(20).map((k) => (
        <path
          key={k}
          {...hair}
          strokeOpacity={0.35}
          d={`M${k * 10} 0V200M0 ${k * 10}H200`}
          strokeDasharray={k % 2 === 0 ? undefined : "4 6"}
        />
      ))}
      <path {...ink} d="M46 0L200 154V200H154L0 46V0z" fill="#a8d6d4" />
      {range(9).map((k) => (
        <path
          key={k}
          d={`M${30 + k * 20} ${52 + k * 18}q6 -4 12 0q6 4 12 0`}
          fill="none"
          stroke="#e6f6f4"
          strokeWidth={1.6}
          strokeLinecap="round"
        />
      ))}
      <path
        d="M40 30q8 -3 16 0M120 118q8 -3 16 0"
        stroke="#7fbcbc"
        fill="none"
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      {[
        [42, 8],
        [8, 42],
        [176, 132],
        [132, 176],
      ].map(([x = 0, y = 0]) => (
        <g key={`${x}-${y}`}>
          <circle {...ink} cx={x} cy={y} r={4} fill="#ef9aa2" strokeWidth={1} />
          <circle cx={x} cy={y} r={1.6} fill={PAPER} />
        </g>
      ))}
    </g>
  ),
  ground: "#ebdec8",
  layers: [
    {
      ...BACK,
      art: (
        <g>
          <rect width={140} height={150} fill="#f4e4cc" />
          <path d={rialtoArcade} fill="#f4e4cc" />
          <path d={rialtoRoofs} fill="#e7a68e" />
          {range(5).map((k) => {
            const x = 9 + k * 9.5;
            const base = 117 - (x - 4) * 0.346;

            return (
              <g key={k}>
                <path
                  d={`M${x} ${base}v-9q2.5 -4.5 5 0v9z`}
                  fill="#9fb2da"
                  stroke={INK}
                  strokeWidth={0.7}
                />
                <path
                  d={`M${136 - x} ${base}v-9q-2.5 -4.5 -5 0v9z`}
                  fill="#9fb2da"
                  stroke={INK}
                  strokeWidth={0.7}
                />
              </g>
            );
          })}
          <path d="M56 100V60h28v40z" fill="#f8eedd" />
          <path d="M52 60L70 44L88 60z" fill="#e7a68e" />
          <path {...hair} d="M58 60L70 50L82 60" strokeOpacity={0.9} />
          <circle cx={70} cy={55} r={2} fill="#9fb2da" />
          <path d="M62 100V80q8 -11 16 0v20z" fill="#9fb2da" stroke={INK} strokeWidth={0.8} />
          <path {...hair} d="M56 66h28M56 72h28" strokeOpacity={0.8} />
          <path {...hair} d="M58 66v-4M82 66v-4" strokeOpacity={0.8} />
          <path {...hair} d="M0 121L56 102H84L140 121" strokeOpacity={1} />
          {range(14).map((k) => {
            const x = 3 + k * 4;

            return (
              <path
                key={k}
                {...hair}
                d={`M${x} ${124 - x * 0.34}v4M${140 - x} ${124 - x * 0.34}v4`}
                strokeOpacity={0.9}
              />
            );
          })}
          <path d="M18 150Q70 92 122 150z" fill="#a8d6d4" />
          <path {...ink} d="M18 150Q70 92 122 150" fill="none" />
          <path {...hair} d="M26 150Q70 102 114 150" strokeDasharray="2 3" strokeOpacity={0.9} />
          <path
            d="M44 140q6 -3 12 0M78 136q6 -3 12 0M60 146q6 -3 12 0"
            stroke="#e6f6f4"
            strokeWidth={1.4}
            fill="none"
            strokeLinecap="round"
          />
        </g>
      ),
      height: 150,
      outline: `M0 150V121L56 102H84L140 121V150zM122 150Q70 92 18 150z${rialtoArcade}${rialtoRoofs}M56 100V60h28v40zM52 60L70 44L88 60z`,
    },
    {
      ...MID,
      place: { anchor: 40, at: 44, zoom: ZOOM },
      art: (
        <g>
          <rect width={MID_W} height={70} fill={PAPER} />
          {range(6).map((k) => (
            <g key={k}>
              <rect x={30} y={4 + k * 11} width={5} height={6} fill="#9fb6e6" />
              <rect x={44} y={10 + k * 10} width={5} height={5} fill="#ef9aa2" />
            </g>
          ))}
          <circle cx={32.5} cy={2} r={3} fill="#e8c46e" />
          <circle cx={46.5} cy={8} r={3} fill="#e8c46e" />
        </g>
      ),
      height: MID_H,
      outline: `${box(30, 2, 5, 68)}${box(44, 8, 5, 62)}${disc(32.5, 2, 3)}${disc(46.5, 8, 3)}`,
    },
    {
      ...FRONT,
      art: (
        <g>
          <rect width={FRONT_W} height={84} fill="#8d86c9" />
          <path d="M100 66q70 9 130 0" stroke="#f0d287" strokeWidth={1.6} fill="none" />
          <path {...hair} d="M102 72q66 8 126 0" stroke={PAPER} strokeOpacity={0.6} />
          <path d="M112 62h118q14 -2 16 -16" stroke="#6b64b0" strokeWidth={2} fill="none" />
          <path {...ink} d="M150 64v-7q0 -3 3 -3h22q3 0 3 3v7z" fill="#ef8f8a" strokeWidth={0.9} />
          <path {...ink} d={gondolaFerro} fill="#f0d287" strokeWidth={0.8} />
          <path d={gondolaOar} fill="#a48a78" />
          <rect x={100} y={40} width={8} height={26} fill="#4b4590" />
          <rect x={98} y={20} width={12} height={20} fill={PAPER} />
          {range(4).map((k) => (
            <rect key={k} x={98} y={22 + k * 5} width={12} height={2.4} fill="#ef8f8a" />
          ))}
          <path d="M108 26l6 2" stroke="#f4d0b2" strokeWidth={3} strokeLinecap="round" />
          <circle {...ink} cx={104} cy={15} r={5} fill="#f4d0b2" strokeWidth={1} />
          <path {...ink} d="M95 10.5h18v2h-18zM99 10.5v-4h10v4z" fill="#f0d287" strokeWidth={0.8} />
          <path d="M99 9h10" stroke="#e2675f" strokeWidth={1.4} />
          <rect x={14} y={6} width={5} height={78} fill={PAPER} />
          {range(7).map((k) => (
            <rect key={k} x={14} y={10 + k * 11} width={5} height={5} fill="#9fb6e6" />
          ))}
        </g>
      ),
      height: 84,
      outline: `M84 62q8 6 26 8h120q16 -2 18 -22l4 3q-2 26 -24 28h-118q-22 -2 -30 -14zM150 64v-7q0 -3 3 -3h22q3 0 3 3v7z${gondolaFerro}${gondolaOar}${box(100, 38, 8, 28)}${box(98, 20, 12, 20)}${disc(104, 15, 5)}M95 10.5h18v2h-18zM99 10.5v-4h10v4z${box(14, 6, 5, 78)}`,
    },
  ],
  name: "Venice",
  panorama: (
    <g>
      <rect width={400} height={200} fill="#dcedf3" />
      <rect width={400} height={30} fill="#cfe6f0" />
      <Cloud x={160} y={34} s={1} />
      <Cloud x={330} y={26} s={0.8} />
      <Birds
        points={[
          [96, 30],
          [108, 24],
          [250, 40],
          [262, 34],
          [272, 42],
        ]}
      />
      <path {...ink} d="M28 122V40l8 -12l8 12v82z" fill="#efb39c" />
      <path {...hair} d="M32 50h8v10h-8z" strokeOpacity={1} />
      {[
        [0, 64, 92, "#f3d29e"],
        [64, 52, 80, "#eeb197"],
        [116, 60, 100, "#f4c6bf"],
        [176, 48, 86, "#f6ead2"],
        [224, 62, 96, "#efc192"],
        [286, 54, 82, "#f4c6bf"],
        [340, 60, 94, "#f3d29e"],
      ].map(([x = 0, w = 0, top = 0, fill = ""]) => (
        <g key={Number(x)}>
          <rect {...ink} x={x} y={top} width={w} height={200 - Number(top)} fill={String(fill)} />
          <path
            {...ink}
            d={`M${Number(x) + 6} ${top}v-10l-2 -4h10l-2 4v10z`}
            fill="#dba48c"
            strokeWidth={0.9}
          />
          {range(3).map((row) =>
            range(Math.floor((Number(w) - 8) / 12)).map((col) => {
              const wx = Number(x) + 7 + col * 12;
              const wy = Number(top) + 12 + row * 26;

              return (
                <path
                  key={`${row}-${col}`}
                  d={`M${wx} ${wy + 14}v-9q3 -6 6 0v9z`}
                  fill="#9fb2da"
                  stroke={INK}
                  strokeWidth={0.7}
                />
              );
            }),
          )}
          <path {...hair} d={`M${x} ${Number(top) + 36}h${w}`} strokeOpacity={0.9} />
          <path
            d={`M${Number(x) + 4} ${Number(top) + 40}h${Number(w) - 8}`}
            stroke="#e98f96"
            strokeWidth={2}
            strokeDasharray="3 3"
          />
        </g>
      ))}
      <rect y={176} width={400} height={24} fill="#a8d6d4" />
      <path {...ink} d="M0 176H400" fill="none" />
      <path
        d="M10 186q8 -3 16 0M90 190q8 -3 16 0M210 186q8 -3 16 0M320 190q8 -3 16 0"
        stroke="#e6f6f4"
        fill="none"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </g>
  ),
} satisfies PopupCity;

const santorini = {
  coords: "36.46° N · 25.38° E",
  country: "Greece",
  floor: (
    <g>
      {range(9).map((k) => (
        <path
          key={k}
          {...hair}
          strokeOpacity={0.4}
          d={`M${k * 24 + 6} 0q4 100 0 200M0 ${k * 24 + 6}q100 4 200 0`}
        />
      ))}
      <path {...ink} d={box(112, 22, 70, 46)} fill="#acd0f2" />
      <path
        d="M120 34q8 -4 16 0t16 0t16 0M120 50q8 -4 16 0t16 0t16 0"
        stroke="#e3f1fc"
        fill="none"
        strokeWidth={1.4}
      />
      {range(20).map((k) => (
        <circle
          key={k}
          cx={150 + Math.cos(k * 0.314) * 28}
          cy={150 + Math.sin(k * 0.314) * 28}
          r={2.4}
          fill={k % 2 === 0 ? "#9bb6ea" : "#e7d9c4"}
          stroke={INK}
          strokeWidth={0.5}
        />
      ))}
      {range(10).map((k) => (
        <path
          key={k}
          d={`M${150 + Math.cos(k * 0.628) * 10} ${150 + Math.sin(k * 0.628) * 10}L${150 + Math.cos(k * 0.628) * 21} ${150 + Math.sin(k * 0.628) * 21}`}
          stroke="#e8c46e"
          strokeWidth={3}
          strokeLinecap="round"
        />
      ))}
      <circle {...ink} cx={150} cy={150} r={8} fill="#f6d98a" strokeWidth={0.9} />
      <circle {...ink} cx={40} cy={160} r={10} fill="#ecb393" />
      <circle cx={40} cy={160} r={6} fill="#a9d1ae" />
      <circle {...ink} cx={176} cy={176} r={9} fill="#ecb393" />
      <circle cx={176} cy={176} r={5} fill="#f08bbd" />
    </g>
  ),
  ground: "#f8f4ec",
  layers: [
    {
      ...BACK,
      art: (
        <g>
          <rect width={140} height={150} fill="#fdfcf8" />
          <path {...ink} d="M42 84q0 -36 34 -36q34 0 34 36z" fill="#86a8e8" />
          <path
            {...hair}
            d="M54 70q20 -18 44 -6"
            stroke="#e1ebfb"
            strokeOpacity={1}
            strokeWidth={1.8}
          />
          <path {...ink} d="M75 48v-14M70 39h10" fill="none" strokeWidth={1.6} />
          <path {...ink} d="M10 60q0 -26 12 -26q12 0 12 26z" fill="#86a8e8" />
          <path
            {...ink}
            d="M18 96q4 -8 8 0v12h-8zM18 72q4 -8 8 0v10h-8z"
            fill="#a9b0d6"
            strokeWidth={1.1}
          />
          <circle cx={22} cy={80} r={2.4} fill="#e8c46e" />
          <path {...ink} d="M66 144v-24q10 -12 20 0v24z" fill="#86a8e8" />
          <path
            {...ink}
            d="M48 104h10v12h-10zM96 104h10v12h-10z"
            fill="#86a8e8"
            strokeWidth={1.1}
          />
          <path {...hair} d="M36 92h80M10 116h24" strokeOpacity={0.4} />
          <rect y={144} width={140} height={6} fill="#ebe3d4" />
        </g>
      ),
      height: 150,
      outline: `${box(0, 144, 140, 6)}${box(36, 84, 80, 60)}M42 84q0 -36 34 -36q34 0 34 36z${box(74, 30, 2, 20)}${box(70, 37, 10, 3)}${box(10, 60, 24, 84)}M10 60q0 -26 12 -26q12 0 12 26z${box(116, 112, 24, 32)}`,
    },
    {
      ...MID,
      place: { anchor: 150, at: 150, zoom: ZOOM },
      art: (
        <g>
          <rect width={MID_W} height={70} fill="#fdfcf8" />
          <path {...hair} d="M120 58h60M132 46h48M144 34h36" strokeOpacity={0.7} />
          <path {...ink} d="M150 18h14l-2 10h-10z" fill="#ecb393" strokeWidth={1.1} />
          <circle cx={157} cy={12} r={7} fill="#f08bbd" />
          <circle cx={152} cy={9} r={3} fill="#f7b3d4" />
          <path {...ink} d="M124 50h6l-1 8h-4z" fill="#86a8e8" strokeWidth={1} />
        </g>
      ),
      height: MID_H,
      outline: `M120 70V58h12V46h12V34h36V70z${box(150, 18, 14, 16)}${disc(157, 12, 7)}${box(124, 50, 6, 8)}`,
    },
    {
      ...FRONT,
      art: (
        <g>
          <rect width={FRONT_W} height={84} fill="#fdfcf8" />
          {[
            [18, 40, 12],
            [44, 32, 10],
            [80, 42, 9],
            [116, 36, 11],
          ].map(([cx = 0, cy = 0, r = 0], k) => (
            <g key={cx}>
              <circle cx={cx} cy={cy} r={r} fill="#9cc9a2" />
              {range(7).map((j) => (
                <circle
                  key={j}
                  cx={cx + Math.cos(j * 0.9 + k) * r * 0.55}
                  cy={cy + Math.sin(j * 0.9 + k) * r * 0.55}
                  r={r * 0.34}
                  fill={j % 3 === 0 ? "#f3a3c8" : "#ea7fb3"}
                  stroke="#d65f98"
                  strokeWidth={0.5}
                />
              ))}
              <path
                {...hair}
                d={`M${cx - r * 0.6} ${cy + r * 0.8}q${r * 0.4} -${r * 0.5} ${r * 0.9} 0`}
                stroke="#5f9b6c"
                strokeOpacity={0.9}
              />
            </g>
          ))}
          <path
            {...hair}
            d="M8 52q30 -14 60 -2M70 50q30 -12 60 0"
            stroke="#7fb58c"
            strokeOpacity={1}
            strokeWidth={1.4}
          />
          <path {...hair} d="M0 66h140M46 52h48" strokeOpacity={0.4} />
          <path {...ink} d="M168 84v-34q12 -14 24 0v34z" fill="#86a8e8" strokeWidth={1.1} />
          <path {...hair} d="M180 46v38M170 62h20" stroke={PAPER} strokeOpacity={0.8} />
          <path {...ink} d="M210 70h20l-3 14h-14z" fill="#ecb393" strokeWidth={1.1} />
          <path d="M220 70q-10 -30 0 -62q10 32 0 62z" fill="#88b996" />
          <path {...hair} d="M220 66v-52" strokeOpacity={0.6} />
        </g>
      ),
      height: 84,
      outline: `M0 84V52h46v-6h48v6h46V84z${box(160, 34, 40, 50)}M160 34q20 -20 40 0z${disc(18, 40, 12)}${disc(44, 32, 10)}${disc(80, 42, 9)}${disc(116, 36, 11)}${box(210, 70, 20, 14)}M220 70q-10 -30 0 -62q10 32 0 62z`,
    },
  ],
  name: "Santorini",
  panorama: (
    <g>
      <rect width={400} height={200} fill="#fde7d2" />
      <rect width={400} height={52} fill="#f9d6c8" />
      <rect width={400} height={20} fill="#f4c8c2" />
      <circle {...ink} cx={318} cy={90} r={14} fill="#fcd98e" />
      <path {...ink} d="M28 104v-30l8 -8l8 8v30z" fill="#fdfcf8" strokeWidth={1.1} />
      <path {...ink} d="M28 74l8 -8l8 8z" fill="#d8bcae" strokeWidth={1} />
      <path
        {...hair}
        d="M36 70l-20 -14M36 70l14 -22M36 70l20 12M36 70l-10 22"
        strokeOpacity={0.9}
        strokeWidth={1.1}
      />
      <path
        d="M16 56l4 -3l8 6zM50 48l3 3l-6 9zM56 82l-2 4l-9 -6zM26 92l-4 -2l6 -8z"
        fill="#fdfcf8"
        stroke={INK}
        strokeWidth={0.7}
      />
      <path {...ink} d="M262 122h34l-4 6h-28zM270 122v-5h18v5z" fill="#fdfcf8" strokeWidth={1} />
      <path d="M266 130q12 2 26 0" stroke="#d3e1f7" strokeWidth={1.2} fill="none" />
      <Birds
        points={[
          [80, 40],
          [92, 34],
          [104, 42],
          [220, 30],
          [232, 36],
        ]}
      />
      <rect y={104} width={400} height={96} fill="#a9c3ec" />
      <path d="M0 104H400" stroke={INK} strokeWidth={1.2} />
      <path {...ink} d="M210 104q30 -22 60 -10q30 -14 70 10z" fill="#d8bcae" strokeWidth={1} />
      <path {...ink} d="M150 124h24l-4 6h-16zM162 124v-18l10 16z" fill={PAPER} strokeWidth={1} />
      {range(8).map((k) => (
        <path
          key={k}
          d={`M${30 + k * 48} ${122 + (k % 3) * 10}q8 -3 16 0`}
          stroke="#d3e1f7"
          fill="none"
          strokeWidth={1.4}
          strokeLinecap="round"
        />
      ))}
      {[
        [0, 130, 46],
        [40, 146, 36],
        [72, 124, 40],
        [106, 150, 34],
        [262, 152, 38],
        [296, 128, 44],
        [336, 144, 34],
        [366, 120, 34],
      ].map(([x = 0, top = 0, w = 0], index) => (
        <g key={x}>
          <rect {...ink} x={x} y={top} width={w} height={200 - top} fill="#fdfcf8" />
          <path
            {...ink}
            d={`M${x + w * 0.35} ${top + 26}v-9q${w * 0.15} -8 ${w * 0.3} 0v9z`}
            fill="#9bb6ea"
            strokeWidth={0.9}
          />
          {index % 3 === 1 ? (
            <path {...ink} d={`M${x + 6} ${top}q${(w - 12) / 2} -22 ${w - 12} 0z`} fill="#86a8e8" />
          ) : null}
          <rect x={x + 5} y={top + 34} width={6} height={6} fill="#a9b0d6" />
        </g>
      ))}
    </g>
  ),
} satisfies PopupCity;

const lombardTurns = range(8).map<[number, number]>((index) => {
  const along = 34 + index * 21;
  const side = (index % 2 === 0 ? -1 : 1) * 30;

  return [along + side * Math.SQRT1_2, along - side * Math.SQRT1_2];
});

const lombard = `M30 30${lombardTurns.map(([x, y]) => `L${x.toFixed(1)} ${y.toFixed(1)}`).join("")}L200 200`;

const Hydrangea = ({ x, y, r }: { x: number; y: number; r: number }) => (
  <g>
    <circle {...ink} cx={x} cy={y} r={r} fill="#7fbf8c" strokeWidth={0.9} />
    {range(5).map((k) => (
      <circle
        key={k}
        cx={x + Math.cos(k * 1.26) * r * 0.5}
        cy={y + Math.sin(k * 1.26) * r * 0.5}
        r={r * 0.34}
        fill={k % 2 === 0 ? "#f27aa6" : "#9d86ea"}
      />
    ))}
  </g>
);

const pyramid = "M80 2L97 146H63z";
const coit = `M0 150V112Q22 98 46 110V150z${box(16, 62, 12, 48)}${box(14, 56, 16, 6)}${box(18, 48, 8, 8)}`;

const victorians = range(3)
  .map((k) => {
    const x = 6 + k * 30;

    return `M${x} 34L${x + 14} 12L${x + 28} 34z${box(x + 1, 34, 26, 50)}`;
  })
  .join("");

const palmFronds = range(7)
  .map((k) => {
    const angle = Math.PI * (1.05 + k * 0.15);
    const tipX = 227 + Math.cos(angle) * 24;
    const tipY = 22 + Math.sin(angle) * 14 + 10;

    return `M227 22Q${(227 + tipX) / 2} ${Math.min(tipY, 22) - 10} ${tipX.toFixed(1)} ${tipY.toFixed(1)}Q${(227 + tipX) / 2} ${Math.min(tipY, 22) - 3} 227 25z`;
  })
  .join("");

const palmTrunk = "M223 84Q220 54 226 22h3Q224 54 228 84z";
const cableCar = `${box(118, 32, 56, 26)}M114 32L120 24H172L178 32z${box(130, 19, 32, 5)}${box(112, 58, 68, 3)}${disc(128, 64, 5)}${disc(164, 64, 5)}`;

const sanFrancisco = {
  coords: "37.80° N · 122.41° W",
  country: "United States",
  floor: (
    <g>
      <Stipple color="#a9c99e" count={60} seed={7} />
      <path d="M0 0H22V200H0zM0 0H200V22H0z" fill="#ebe4d6" />
      {range(24).map((k) => (
        <path key={k} {...hair} strokeOpacity={0.45} d={`M0 ${k * 8 + 26}H22M${k * 8 + 26} 0V22`} />
      ))}
      <path {...ink} d="M22 22V200M22 22H200" fill="none" />
      <path d={lombard} fill="none" stroke={INK} strokeWidth={20} strokeLinejoin="round" />
      <path d={lombard} fill="none" stroke="#e7a08f" strokeWidth={17} strokeLinejoin="round" />
      <path
        d={lombard}
        fill="none"
        stroke="#d58d7e"
        strokeWidth={17}
        strokeLinejoin="round"
        strokeDasharray="1 3"
      />
      <path
        d={lombard}
        fill="none"
        stroke="#fbf8f2"
        strokeWidth={0.9}
        strokeLinejoin="round"
        strokeDasharray="4 4"
      />
      {lombardTurns.map(([x, y], index) => {
        const side = index % 2 === 0 ? -1 : 1;

        return (
          <g key={`${x}-${y}`}>
            <Hydrangea x={x + side * 13} y={y - side * 13} r={7} />
            <Hydrangea x={x - side * 17 + 11} y={y + side * 17 + 11} r={5.5} />
          </g>
        );
      })}
    </g>
  ),
  ground: "#cfe3c6",
  layers: [
    {
      ...BACK,
      art: (
        <g>
          <rect width={140} height={150} fill="#cfe3c6" />
          <rect x={10} y={56} width={30} height={60} fill="#f3ecdf" />
          <rect x={16} y={62} width={12} height={48} fill="#f3ecdf" />
          <path {...hair} d="M19 64v44M22 64v44M25 64v44" strokeOpacity={0.9} />
          <rect x={14} y={56} width={16} height={6} fill="#e8dcc6" />
          <Windows x={15} y={57} cols={3} rows={1} w={3} h={3} gx={5} gy={0} fill="#bcd2ee" />
          <rect x={18} y={48} width={8} height={8} fill="#e8dcc6" />
          <path d="M0 150V112Q22 98 46 110V150z" fill="#a9d1ae" />
          <path {...hair} d="M4 120q6 -4 12 -2M28 114q6 -2 12 1" strokeOpacity={0.9} />
          <path d={pyramid} fill="#f1f2f9" />
          {range(16).map((k) => {
            const y = 14 + k * 8;
            const half = ((y - 2) / 144) * 17 - 2;

            return (
              <path
                key={k}
                d={`M${80 - half} ${y}H${80 + half}`}
                stroke="#bcd2ee"
                strokeWidth={2.4}
                strokeDasharray="2 1.4"
              />
            );
          })}
          <path {...hair} d="M80 2V146" strokeOpacity={0.5} />
          <rect x={100} y={112} width={16} height={34} fill="#f4c6bf" />
          <path d="M100 112l8 -8l8 8z" fill="#e2675f" />
          <rect x={118} y={104} width={20} height={42} fill="#bcd2ee" />
          <path d="M118 104l10 -9l10 9z" fill="#8d86c9" />
          <Windows x={104} y={118} cols={2} rows={3} w={3} h={4} gx={5} gy={8} fill={PAPER} />
          <Windows x={122} y={110} cols={2} rows={4} w={4} h={5} gx={7} gy={8} fill={PAPER} />
          <rect y={144} width={140} height={6} fill="#b6b9cb" />
        </g>
      ),
      height: 150,
      outline: `${box(0, 144, 140, 6)}${coit}${pyramid}${box(100, 112, 16, 34)}M100 112l8 -8l8 8z${box(118, 104, 20, 42)}M118 104l10 -9l10 9z`,
    },
    {
      ...MID,
      place: { anchor: 146, at: 140, zoom: ZOOM },
      art: (
        <g>
          <rect width={MID_W} height={70} fill="#f6ead7" />
          <path d="M114 32L120 24H172L178 32z" fill="#8d86c9" />
          <rect x={130} y={19} width={32} height={5} fill="#8d86c9" />
          <rect x={134} y={25} width={24} height={5} fill={PAPER} />
          <path {...hair} d="M137 27.5h18" strokeOpacity={1} />
          <rect x={118} y={46} width={56} height={12} fill="#e2675f" />
          <path d="M118 46h56" stroke="#f0c95e" strokeWidth={1.4} />
          <Windows x={122} y={35} cols={5} rows={1} w={7} h={8} gx={10} gy={0} fill="#bcd2ee" />
          <path {...hair} d="M146 34v12" strokeOpacity={1} />
          <rect x={112} y={58} width={68} height={3} fill="#a48a78" />
          <circle cx={128} cy={64} r={5} fill="#8d86c9" />
          <circle cx={164} cy={64} r={5} fill="#8d86c9" />
          <circle cx={128} cy={64} r={1.8} fill="#e9ebf6" />
          <circle cx={164} cy={64} r={1.8} fill="#e9ebf6" />
          <circle cx={170} cy={22} r={2} fill="#f0c95e" />
        </g>
      ),
      height: MID_H,
      outline: `${cableCar}${disc(170, 22, 2)}`,
    },
    {
      ...FRONT,
      art: (
        <g>
          <rect width={FRONT_W} height={84} fill="#f6ead7" />
          {[
            ["#f4c6bf", "#e2675f"],
            ["#bcd2ee", "#8d86c9"],
            ["#f3d29e", "#ea8a72"],
          ].map(([wall = "", roof = ""], k) => {
            const x = 6 + k * 30;

            return (
              <g key={wall}>
                <path d={`M${x} 34L${x + 14} 12L${x + 28} 34z`} fill={roof} />
                <path d={`M${x + 8} 30L${x + 14} 20L${x + 20} 30z`} fill={PAPER} />
                <circle cx={x + 14} cy={27} r={2} fill="#bcd2ee" />
                <rect x={x + 1} y={34} width={26} height={50} fill={wall} />
                <path {...hair} d={`M${x + 1} 37h26`} strokeOpacity={1} strokeDasharray="1.5 1.5" />
                <path {...ink} d={box(x + 4, 42, 10, 16)} fill={PAPER} strokeWidth={0.8} />
                <path {...hair} d={`M${x + 7.3} 42v16M${x + 10.6} 42v16`} strokeOpacity={0.8} />
                <path {...ink} d={box(x + 18, 42, 6, 10)} fill="#bcd2ee" strokeWidth={0.8} />
                <path {...ink} d={box(x + 18, 64, 6, 20)} fill={roof} strokeWidth={0.8} />
                <path {...hair} d={`M${x + 16} 84v-4h10v4M${x + 15} 78h12`} strokeOpacity={1} />
                <path {...ink} d={box(x + 4, 64, 10, 10)} fill="#bcd2ee" strokeWidth={0.8} />
              </g>
            );
          })}
          <path d={palmTrunk} fill="#b98b6f" />
          <path {...hair} d="M222 70h5M222 58h5M223 46h5M224 34h4" strokeOpacity={0.9} />
          <path d={palmFronds} fill="#8fc49a" />
          <path {...ink} d="M186 84v-12q0 -4 4 -4q4 0 4 4v12z" fill="#e2675f" strokeWidth={1} />
          <path d="M184 74h12" stroke="#e2675f" strokeWidth={3} strokeLinecap="round" />
        </g>
      ),
      height: 84,
      outline: `${victorians}${palmTrunk}${palmFronds}M186 84v-12q0 -4 4 -4q4 0 4 4v12z${box(184, 72.5, 12, 3)}`,
    },
  ],
  name: "San Francisco",
  panorama: (
    <g>
      <rect width={400} height={200} fill="#fbe3d0" />
      <rect width={400} height={60} fill="#f2d3dc" />
      <rect width={400} height={26} fill="#e5cbe6" />
      <path d="M0 150V108Q40 84 80 104Q120 90 150 112Q170 120 200 118V150z" fill="#b8d0a8" />
      <path {...hair} d="M0 108Q40 84 80 104Q120 90 150 112" strokeOpacity={0.7} />
      <Cloud x={120} y={86} s={1.6} />
      <Cloud x={20} y={98} s={1.2} />
      <Cloud x={330} y={44} s={1} />
      <Birds
        points={[
          [250, 36],
          [262, 30],
          [274, 38],
        ]}
      />
      {[
        [212, 20, 64, "#d6daee"],
        [236, 18, 80, "#ecdccd"],
        [228, 30, 118, "#f4c6bf"],
        [258, 24, 126, "#f6ead2"],
        [282, 34, 110, "#bcd2ee"],
        [316, 28, 122, "#f3d29e"],
        [344, 26, 114, "#e9d6f0"],
        [370, 30, 120, "#f4c6bf"],
      ].map(([x = 0, w = 0, top = 0, fill = ""]) => (
        <g key={Number(x)}>
          <rect
            {...ink}
            x={x}
            y={top}
            width={w}
            height={150 - Number(top)}
            fill={String(fill)}
            strokeWidth={1}
          />
          <Windows
            x={Number(x) + 4}
            y={Number(top) + 6}
            cols={Math.floor((Number(w) - 4) / 8)}
            rows={3}
            w={4}
            h={5}
            gx={8}
            gy={9}
            fill={PAPER}
          />
        </g>
      ))}
      <rect y={150} width={400} height={50} fill="#a9c9e6" />
      <path {...ink} d="M0 150H400" fill="none" />
      <path {...ink} d="M296 166q14 -12 34 -10q12 2 16 10z" fill="#c9b9a0" strokeWidth={1} />
      <path {...ink} d="M318 158v-12h4v12z" fill={PAPER} strokeWidth={0.9} />
      <path {...ink} d="M304 160h20v-4h-20z" fill="#efe3d4" strokeWidth={0.9} />
      <path
        d="M14 176q8 -3 16 0M120 184q8 -3 16 0M230 178q8 -3 16 0M360 186q8 -3 16 0"
        stroke="#e6f1fb"
        fill="none"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <path d="M-4 128L220 128" stroke="#e5775f" strokeWidth={6} />
      <path
        d="M-4 124L60 44Q115 228 170 44L220 116"
        stroke="#e5775f"
        strokeWidth={1.8}
        fill="none"
      />
      {range(36).map((k) => {
        const x = k * 6 + 2;
        const t = (x - 60) / 110;
        let top = 44 + 184 * t * (1 - t);

        if (x < 60) {
          top = 44 + ((60 - x) / 64) * 80;
        } else if (x > 170) {
          top = 44 + ((x - 170) / 50) * 72;
        }

        return (
          <path
            key={k}
            d={`M${x} ${Math.min(top, 126).toFixed(1)}V128`}
            stroke="#e5775f"
            strokeWidth={0.6}
          />
        );
      })}
      {[60, 170].map((x) => (
        <g key={x}>
          <path
            {...ink}
            d={`M${x - 5} 160V40h3v120zM${x + 2} 160V40h3v120z`}
            fill="#e5775f"
            strokeWidth={0.9}
          />
          <path
            d={`M${x - 3} 50h6M${x - 3} 76h6M${x - 3} 102h6M${x - 3} 128h6`}
            stroke="#c95c48"
            strokeWidth={3}
          />
        </g>
      ))}
      <path d="M-4 131.5H220" stroke={INK} strokeWidth={0.8} strokeOpacity={0.6} />
    </g>
  ),
} satisfies PopupCity;

export const CITIES = [
  sanFrancisco,
  paris,
  kyoto,
  newYork,
  venice,
  santorini,
] satisfies PopupCity[];
