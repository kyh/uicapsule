import type { ReactNode } from "react";

export const INK = "#3528d6";
export const PAPER = "#f6f2e9";

export interface PopupRoom {
  name: string;
  wall: string;
  floor: string;
  left: ReactNode;
  right: ReactNode;
  ground: ReactNode;
}

const line = {
  fill: "none",
  stroke: INK,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const ink = { stroke: INK, strokeLinejoin: "round" } as const;

const range = (count: number) => Array.from({ length: count }, (_, index) => index);

const Baseboard = () => <path {...line} d="M0 188 H200" strokeWidth={1.4} opacity={0.6} />;

const Frame = ({
  x,
  y,
  w,
  h,
  fill,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
}) => (
  <g>
    <rect {...ink} x={x} y={y} width={w} height={h} fill={PAPER} strokeWidth={1.6} />
    <rect {...ink} x={x + 3} y={y + 3} width={w - 6} height={h - 6} fill={fill} strokeWidth={0.9} />
  </g>
);

const Window = ({
  x,
  y,
  w,
  h,
  sky,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  sky: string;
}) => (
  <g>
    <rect {...ink} x={x} y={y} width={w} height={h} fill={sky} strokeWidth={1.8} />
    <path
      {...line}
      d={`M${x + w / 2} ${y} V${y + h} M${x} ${y + h / 2} H${x + w}`}
      strokeWidth={1.4}
    />
    <path
      {...line}
      d={`M${x + 8} ${y + 14} q6 -5 12 0 M${x + w - 26} ${y + h / 2 + 12} q6 -5 12 0`}
      strokeWidth={1}
    />
    <rect {...ink} x={x - 5} y={y + h} width={w + 10} height={5} fill={PAPER} strokeWidth={1.4} />
  </g>
);

const Curtain = ({ x, flip }: { x: number; flip: boolean }) => {
  const dir = flip ? -1 : 1;

  return (
    <path
      {...ink}
      fill="#f3b8c8"
      strokeWidth={1.3}
      d={`M${x} 28 h${18 * dir} q${-6 * dir} 40 ${-2 * dir} 78 q${-4 * dir} 4 ${-12 * dir} 4 q${-6 * dir} -40 ${-4 * dir} -82 z`}
    />
  );
};

const HangingPlant = ({ x }: { x: number }) => (
  <g>
    <path {...line} d={`M${x} 0 V24 M${x - 9} 24 L${x} 14 L${x + 9} 24`} strokeWidth={1} />
    <path {...ink} d={`M${x - 10} 24 h20 l-3 10 h-14 z`} fill="#e9a27a" strokeWidth={1.3} />
    <path
      {...line}
      d={`M${x - 6} 34 q-6 14 -2 28 M${x} 34 q2 18 -1 34 M${x + 6} 34 q6 12 3 24`}
      stroke="#3f9a6b"
      strokeWidth={1.6}
    />
  </g>
);

const Planks = ({ color, step }: { color: string; step: number }) => (
  <g>
    {range(Math.ceil(200 / step)).map((index) => (
      <path key={index} {...line} d={`M${index * step} 0 V200`} stroke={color} strokeWidth={1} />
    ))}
  </g>
);

const bedroom = {
  name: "bedroom",
  wall: "#ece7fb",
  floor: "#f4dfb8",
  left: (
    <g>
      <Window x={58} y={38} w={74} h={62} sky="#d6e4ff" />
      <Curtain x={48} flip={false} />
      <Curtain x={142} flip />
      <path {...line} d="M40 30 H150" strokeWidth={1.8} />
      <Frame x={18} y={112} w={20} h={26} fill="#f9d77e" />
      <Frame x={18} y={144} w={20} h={18} fill="#a8d5ba" />
      <path {...ink} d="M70 150 h110 v38 h-110 z" fill="#c9bdf5" strokeWidth={1.6} />
      <path {...ink} d="M70 138 h26 q6 0 6 6 v8 h-32 z" fill={PAPER} strokeWidth={1.4} />
      <path
        {...ink}
        d="M66 120 h6 v68 h-6 z M178 150 h6 v38 h-6 z"
        fill="#b39ae8"
        strokeWidth={1.4}
      />
      <Baseboard />
    </g>
  ),
  right: (
    <g>
      <HangingPlant x={30} />
      {range(6).map((index) => (
        <rect
          key={index}
          {...ink}
          x={96 + (index % 3) * 26}
          y={36 + Math.floor(index / 3) * 30}
          width={20}
          height={24}
          fill={["#f7c8d4", "#f9d77e", "#bfe3cf", "#c9d9ff", "#f9d77e", "#f7c8d4"][index]}
          strokeWidth={1.2}
        />
      ))}
      <path {...ink} d="M90 132 h96 v8 h-96 z" fill="#e7c48d" strokeWidth={1.5} />
      <path {...line} d="M96 140 V188 M180 140 V188" strokeWidth={1.6} />
      <path {...ink} d="M148 140 h32 v30 h-32 z" fill="#e7c48d" strokeWidth={1.3} />
      <path {...line} d="M148 155 h32 M162 147 h6 M162 162 h6" strokeWidth={1} />
      <path {...ink} d="M108 104 l10 -14 l10 14 z" fill="#f9d77e" strokeWidth={1.3} />
      <path {...line} d="M118 104 V132 M110 132 h16" strokeWidth={1.3} />
      <path {...ink} d="M134 112 h26 v20 h-26 z" fill="#d6e4ff" strokeWidth={1.3} />
      <Baseboard />
    </g>
  ),
  ground: (
    <g>
      <Planks color="#c9a56a" step={22} />
      <ellipse {...ink} cx={112} cy={112} rx={56} ry={46} fill="#f7c8d4" strokeWidth={1.5} />
      <ellipse {...line} cx={112} cy={112} rx={44} ry={35} strokeDasharray="3 4" strokeWidth={1} />
    </g>
  ),
} satisfies PopupRoom;

const kitchen = {
  name: "kitchen",
  wall: "#fbf2d6",
  floor: "#fffaf0",
  left: (
    <g>
      <Window x={30} y={40} w={64} h={58} sky="#d6e4ff" />
      {[40, 58, 76].map((x, index) => (
        <g key={x}>
          <path {...ink} d={`M${x} 92 h10 l-2 8 h-6 z`} fill="#e9a27a" strokeWidth={1.1} />
          <circle {...ink} cx={x + 5} cy={88} r={4 + index} fill="#8fd1a8" strokeWidth={1.1} />
        </g>
      ))}
      <path {...ink} d="M118 70 h70 v5 h-70 z" fill="#e7c48d" strokeWidth={1.3} />
      {[124, 142, 160, 176].map((x, index) => (
        <rect
          key={x}
          {...ink}
          x={x}
          y={56 - index * 2}
          width={12}
          height={14 + index * 2}
          rx={3}
          fill={["#f9d77e", "#f7c8d4", "#bfe3cf", "#d6e4ff"][index]}
          strokeWidth={1.1}
        />
      ))}
      <path {...ink} d="M0 128 h200 v60 h-200 z" fill="#bfe3cf" strokeWidth={1.6} />
      <path {...ink} d="M0 122 h200 v6 h-200 z" fill="#e7c48d" strokeWidth={1.3} />
      <path
        {...line}
        d="M66 128 V188 M133 128 V188 M58 150 V162 M74 150 V162 M125 150 V162 M141 150 V162"
        strokeWidth={1.3}
      />
      <Baseboard />
    </g>
  ),
  right: (
    <g>
      {range(4).map((row) =>
        range(9).map((col) => (
          <rect
            key={`${row}-${col}`}
            x={col * 15}
            y={82 + row * 10}
            width={15}
            height={10}
            fill="none"
            stroke={INK}
            strokeOpacity={0.35}
            strokeWidth={0.8}
          />
        )),
      )}
      <path {...ink} d="M0 30 h132 v40 h-132 z" fill="#bfe3cf" strokeWidth={1.5} />
      <path
        {...line}
        d="M44 30 V70 M88 30 V70 M38 56 V64 M50 56 V64 M82 56 V64 M94 56 V64"
        strokeWidth={1.2}
      />
      <path {...ink} d="M0 122 h134 v66 h-134 z" fill="#bfe3cf" strokeWidth={1.6} />
      <path {...ink} d="M0 116 h134 v6 h-134 z" fill="#e7c48d" strokeWidth={1.3} />
      <path {...line} d="M67 122 V188 M30 136 h10 M97 136 h10" strokeWidth={1.3} />
      <path {...ink} d="M50 104 h30 v12 h-30 z" fill="#d6e4ff" strokeWidth={1.2} />
      <path {...line} d="M56 104 q9 -10 18 0" strokeWidth={1} />
      <rect
        {...ink}
        x={142}
        y={52}
        width={50}
        height={136}
        rx={4}
        fill="#b8cff7"
        strokeWidth={1.7}
      />
      <path {...line} d="M142 100 H192 M149 72 V88 M149 112 V136" strokeWidth={1.4} />
      <circle {...ink} cx={164} cy={124} r={3} fill="#f7c8d4" strokeWidth={0.9} />
      <circle {...ink} cx={168} cy={20} r={10} fill={PAPER} strokeWidth={1.3} />
      <path {...line} d="M168 13 V20 L173 23" strokeWidth={1} />
      <Baseboard />
    </g>
  ),
  ground: (
    <g>
      {range(8).map((row) =>
        range(8).map((col) =>
          (row + col) % 2 === 0 ? (
            <rect
              key={`${row}-${col}`}
              x={col * 25}
              y={row * 25}
              width={25}
              height={25}
              fill="#cbdcf9"
            />
          ) : null,
        ),
      )}
      <ellipse
        {...ink}
        cx={140}
        cy={138}
        rx={30}
        ry={30}
        fill="#f9d77e"
        strokeWidth={1.4}
        opacity={0.9}
      />
    </g>
  ),
} satisfies PopupRoom;

const bathroom = {
  name: "bathroom",
  wall: "#e1f3ec",
  floor: "#eef6ff",
  left: (
    <g>
      {range(6).map((row) =>
        range(10).map((col) => (
          <rect
            key={`${row}-${col}`}
            x={col * 20}
            y={98 + row * 15}
            width={20}
            height={15}
            fill="#c6ebdd"
            stroke={INK}
            strokeOpacity={0.4}
            strokeWidth={0.8}
          />
        )),
      )}
      <path {...line} d="M60 26 H178" strokeWidth={2} />
      <path {...line} d="M168 26 V40 q0 8 -8 10" strokeWidth={1.4} />
      <path
        {...ink}
        d="M66 26 h50 q-4 60 2 150 h-46 q-8 -70 -6 -150 z"
        fill="#cfdcff"
        strokeWidth={1.5}
      />
      <path
        {...line}
        d="M78 30 q-3 70 2 146 M92 30 q-2 70 2 146 M106 30 q-1 70 2 146"
        strokeWidth={1.1}
      />
      <path {...ink} d="M18 62 h28 v4 h-28 z" fill="#e7c48d" strokeWidth={1.2} />
      <path {...ink} d="M22 46 h8 v16 h-8 z M34 50 h7 v12 h-7 z" fill="#f7c8d4" strokeWidth={1.1} />
      <Baseboard />
    </g>
  ),
  right: (
    <g>
      <path {...ink} d="M24 34 h40 v58 h-40 z" fill="#f6f3e4" strokeWidth={1.5} />
      <path
        {...ink}
        d="M30 120 h28 v40 q0 10 -14 10 q-14 0 -14 -10 z"
        fill="#fff"
        strokeWidth={1.5}
      />
      <path {...ink} d="M26 112 h36 v10 h-36 z" fill="#fff" strokeWidth={1.4} />
      <path
        {...ink}
        d="M104 38 q0 -24 24 -24 q24 0 24 24 v54 h-48 z"
        fill="#d6e4ff"
        strokeWidth={1.7}
      />
      <path {...line} d="M114 34 l12 -10 M118 52 l18 -16" strokeWidth={1} opacity={0.7} />
      <path {...ink} d="M96 120 h64 v8 h-64 z" fill="#fff" strokeWidth={1.4} />
      <path {...ink} d="M100 128 h56 v54 h-56 z" fill="#a8d5ba" strokeWidth={1.6} />
      <path
        {...line}
        d="M128 128 V182 M122 150 v8 M134 150 v8 M104 182 v6 M152 182 v6"
        strokeWidth={1.3}
      />
      <path {...line} d="M128 112 V120 M124 112 h8" strokeWidth={1.3} />
      <circle {...line} cx={180} cy={72} r={9} strokeWidth={1.4} />
      <path {...ink} d="M172 80 h16 v34 h-16 z" fill="#f7c8d4" strokeWidth={1.2} />
      <Baseboard />
    </g>
  ),
  ground: (
    <g>
      {range(11).map((index) => (
        <path
          key={index}
          {...line}
          d={`M${index * 20} 0 V200 M0 ${index * 20} H200`}
          strokeOpacity={0.35}
          strokeWidth={0.8}
        />
      ))}
      <rect
        {...ink}
        x={36}
        y={120}
        width={40}
        height={60}
        rx={4}
        fill="#cfdcff"
        strokeWidth={1.3}
      />
      <rect
        {...ink}
        x={120}
        y={34}
        width={56}
        height={40}
        rx={4}
        fill="#f7c8d4"
        strokeWidth={1.3}
      />
      <path {...line} d="M126 40 h44 M126 68 h44" strokeDasharray="2 3" strokeWidth={0.9} />
    </g>
  ),
} satisfies PopupRoom;

const study = {
  name: "reading nook",
  wall: "#fde8de",
  floor: "#ecd7b0",
  left: (
    <g>
      <path {...ink} d="M24 24 h120 v164 h-120 z" fill="#e7c48d" strokeWidth={1.7} />
      {[24, 64, 104, 144].map((y, row) => (
        <g key={y}>
          <path {...line} d={`M24 ${y + 40} H144`} strokeWidth={1.4} />
          {range(9).map((index) => {
            const height = 22 + ((index * 7 + row * 5) % 13);

            return (
              <rect
                key={index}
                {...ink}
                x={30 + index * 12}
                y={y + 40 - height}
                width={10}
                height={height}
                fill={["#f7c8d4", "#c9bdf5", "#bfe3cf", "#f9d77e", "#b8cff7"][(index + row) % 5]}
                strokeWidth={0.9}
              />
            );
          })}
        </g>
      ))}
      <Frame x={160} y={50} w={26} h={34} fill="#c9bdf5" />
      <Baseboard />
    </g>
  ),
  right: (
    <g>
      <rect {...ink} x={18} y={30} width={84} height={58} fill="#e7c48d" strokeWidth={1.6} />
      {[
        [26, 38, "#f9d77e"],
        [54, 42, "#f7c8d4"],
        [78, 36, "#bfe3cf"],
        [34, 62, "#b8cff7"],
        [66, 64, "#f9d77e"],
      ].map(([x, y, fill]) => (
        <g key={`${x}-${y}`}>
          <rect {...ink} x={x} y={y} width={18} height={18} fill={String(fill)} strokeWidth={0.9} />
          <circle cx={Number(x) + 9} cy={Number(y) + 2} r={1.6} fill="#e0566f" />
        </g>
      ))}
      <circle {...ink} cx={150} cy={44} r={16} fill={PAPER} strokeWidth={1.6} />
      <path {...line} d="M150 34 V44 L158 48" strokeWidth={1.4} />
      <path
        {...ink}
        d="M30 130 q0 -24 30 -24 q30 0 30 24 v24 h-60 z"
        fill="#c9bdf5"
        strokeWidth={1.6}
      />
      <path
        {...ink}
        d="M22 140 q0 -8 8 -8 v40 h-8 z M90 132 q8 0 8 8 v32 h-8 z"
        fill="#b39ae8"
        strokeWidth={1.4}
      />
      <path {...ink} d="M22 154 h76 v18 h-76 z" fill="#b39ae8" strokeWidth={1.4} />
      <path {...line} d="M30 172 v14 M90 172 v14" strokeWidth={1.6} />
      <path {...line} d="M150 188 V100" strokeWidth={1.6} />
      <path {...ink} d="M136 100 l6 -18 h16 l6 18 z" fill="#f9d77e" strokeWidth={1.4} />
      <path {...line} d="M140 188 h20" strokeWidth={1.6} />
      <Baseboard />
    </g>
  ),
  ground: (
    <g>
      <Planks color="#bd9658" step={18} />
      <rect
        {...ink}
        x={44}
        y={40}
        width={120}
        height={120}
        rx={6}
        fill="#c9bdf5"
        strokeWidth={1.5}
      />
      {range(5).map((index) => (
        <path
          key={index}
          {...line}
          d={`M${56 + index * 24} 40 V160`}
          stroke={PAPER}
          strokeWidth={4}
        />
      ))}
    </g>
  ),
} satisfies PopupRoom;

const balcony = {
  name: "balcony",
  wall: "#efe9fb",
  floor: "#e6c899",
  left: (
    <g>
      <path {...ink} d="M50 30 h92 v158 h-92 z" fill="#fbe7a6" strokeWidth={1.8} />
      <path {...line} d="M96 30 V188 M50 80 H142 M50 130 H142" strokeWidth={1.3} />
      <path {...line} d="M88 104 v12 M104 104 v12" strokeWidth={1.8} />
      <path {...line} d="M60 40 l14 -0 M60 46 l20 0" strokeWidth={0.9} opacity={0.6} />
      <HangingPlant x={170} />
      <Frame x={14} y={60} w={22} h={28} fill="#bfe3cf" />
      <Baseboard />
    </g>
  ),
  right: (
    <g>
      <rect x={0} y={0} width={200} height={200} fill="#3c3a9a" />
      {[
        [30, 30],
        [70, 18],
        [112, 44],
        [46, 70],
        [96, 84],
        [180, 96],
        [16, 104],
      ].map(([x, y]) => (
        <path
          key={`${x}-${y}`}
          d={`M${x} ${Number(y) - 4} V${Number(y) + 4} M${Number(x) - 4} ${y} H${Number(x) + 4}`}
          stroke="#fdf3c4"
          strokeWidth={1.3}
          strokeLinecap="round"
        />
      ))}
      <path d="M168 26 a18 18 0 1 0 14 30 a14 14 0 1 1 -14 -30 z" fill="#fdf3c4" />
      <path
        d="M0 136 v-20 h14 v-12 h12 v18 h12 v-30 h16 v26 h10 v-14 h14 v32 h12 v-22 h18 v10 h10 v-24 h14 v20 h12 v-8 h16 v28 h20 v28 h-200 z"
        fill="#2b2878"
      />
      {[
        [18, 112],
        [44, 98],
        [76, 120],
        [118, 108],
        [150, 116],
        [176, 124],
      ].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={3} height={4} fill="#fbe7a6" />
      ))}
      <path {...ink} d="M0 132 h200 v6 h-200 z" fill="#e7c48d" stroke="#fdf3c4" strokeWidth={1.2} />
      {range(13).map((index) => (
        <path key={index} d={`M${8 + index * 16} 138 V188`} stroke="#e7c48d" strokeWidth={3} />
      ))}
      <path d="M0 186 H200" stroke="#e7c48d" strokeWidth={4} />
    </g>
  ),
  ground: (
    <g>
      <Planks color="#b38a4e" step={16} />
      {[
        [40, 150, 14, "#f7c8d4"],
        [70, 166, 11, "#c9bdf5"],
        [158, 60, 16, "#f7c8d4"],
      ].map(([x, y, r, fill]) => (
        <g key={`${x}-${y}`}>
          <circle {...ink} cx={x} cy={y} r={r} fill="#e9a27a" strokeWidth={1.3} />
          <circle {...ink} cx={x} cy={y} r={Number(r) * 0.65} fill={String(fill)} strokeWidth={1} />
        </g>
      ))}
      <ellipse {...ink} cx={108} cy={104} rx={30} ry={30} fill="#f9d77e" strokeWidth={1.4} />
      <ellipse {...ink} cx={108} cy={104} rx={16} ry={16} fill="#f7c8d4" strokeWidth={1} />
    </g>
  ),
} satisfies PopupRoom;

export const ROOMS = [bedroom, kitchen, bathroom, study, balcony] satisfies PopupRoom[];
