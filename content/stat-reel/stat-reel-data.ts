/**
 * Static dataset for the stat reel.
 *
 * The gradient and the stat are declared together so the 1:1 pairing between a
 * figure and its colour triad cannot drift apart: there is no second array to
 * keep in sync.
 */

const GRAD_SIZE = "95% 95%";
const GRAD_POS = { x: 50, y: 110 } as const;
const GRAD_BASE = "#2a2e36";

type Triad = readonly [string, string, string];

const gradientFrom = ([c0, c1, c2]: Triad) =>
  `radial-gradient(${GRAD_SIZE} at ${GRAD_POS.x}% ${GRAD_POS.y}%, ${c0} 0%, rgba(${c1},0.669) 34.13%, rgba(${c2},0.5) 65.38%, rgba(158,144,96,0) 100%), linear-gradient(${GRAD_BASE}, ${GRAD_BASE})`;

interface RawStat {
  readonly prefix?: string;
  readonly value: string;
  readonly label: string;
  readonly triad: Triad;
}

export interface Stat {
  readonly prefix?: string;
  readonly value: string;
  readonly label: string;
  /** Ready-to-paint `background-image` for the transparent-text figure. */
  readonly gradient: string;
}

const RAW = [
  {
    prefix: "Down to",
    value: "10,935m",
    label: "Depth of the Challenger Deep",
    triad: ["#d7be68", "215,50,154", "84,109,208"],
  },
  {
    value: "1,100×",
    label: "Pressure at the trench floor",
    triad: ["#78ec81", "50,215,193", "208,84,177"],
  },
  {
    value: "4°C",
    label: "Water at two kilometres down",
    triad: ["#ecbf78", "215,50,66", "84,88,208"],
  },
  {
    value: "0%",
    label: "Light in the midnight zone",
    triad: ["#78c8ec", "120,84,236", "236,84,140"],
  },
  {
    prefix: "Under",
    value: "1%",
    label: "Of seafloor mapped in detail",
    triad: ["#c8ec78", "50,200,120", "90,84,208"],
  },
  {
    value: "200m",
    label: "Top of the twilight zone",
    triad: ["#ecae78", "236,130,50", "150,84,208"],
  },
  {
    value: "76%",
    label: "Of deep-sea life that glows",
    triad: ["#78ece4", "84,140,236", "208,84,200"],
  },
  {
    value: "11h",
    label: "Round trip for a crewed dive",
    triad: ["#ec78b4", "236,84,150", "84,120,208"],
  },
  {
    prefix: "Over",
    value: "2,000",
    label: "New marine species each year",
    triad: ["#ece078", "150,215,50", "50,200,193"],
  },
  {
    value: "3.7km",
    label: "Average depth of the ocean",
    triad: ["#b478ec", "208,84,200", "236,180,84"],
  },
  {
    value: "97%",
    label: "Of Earth's water is ocean",
    triad: ["#78ecc8", "50,200,215", "120,84,236"],
  },
  {
    value: "1,500m/s",
    label: "Speed of sound in seawater",
    triad: ["#ec8878", "236,84,84", "150,84,236"],
  },
  {
    value: "1cm",
    label: "Abyssal sediment per 1,000yr",
    triad: ["#9aecb0", "50,215,180", "84,120,236"],
  },
  {
    prefix: "Up to",
    value: "400yr",
    label: "Lifespan of Greenland shark",
    triad: ["#a8a8ec", "84,120,236", "236,84,180"],
  },
  {
    value: "8,336m",
    label: "Deepest fish ever filmed",
    triad: ["#ecc878", "236,84,180", "50,200,200"],
  },
  {
    value: "−1.8°C",
    label: "Freezing point of seawater",
    triad: ["#a8ec78", "150,215,50", "84,100,236"],
  },
  {
    prefix: "Over",
    value: "600",
    label: "Known hydrothermal vents",
    triad: ["#ec9ab0", "236,84,140", "100,84,236"],
  },
  {
    value: "121°C",
    label: "Hottest water microbes take",
    triad: ["#78ecd0", "50,215,140", "215,84,200"],
  },
  {
    value: "1atm",
    label: "Added pressure per 10 metres",
    triad: ["#ecd278", "236,160,50", "84,110,236"],
  },
  {
    value: "12h25m",
    label: "Between two high tides",
    triad: ["#90a8ec", "140,84,236", "236,90,150"],
  },
  {
    prefix: "Roughly",
    value: "2.5Gt",
    label: "Carbon absorbed each year",
    triad: ["#78ecb8", "50,200,200", "160,84,236"],
  },
  {
    value: "6,000m",
    label: "Where the hadal zone begins",
    triad: ["#eca090", "236,110,84", "84,130,236"],
  },
  {
    prefix: "Nearly",
    value: "50%",
    label: "Of your oxygen from plankton",
    triad: ["#d0ec78", "80,210,110", "215,84,190"],
  },
  {
    value: "1,000yr",
    label: "One global conveyor cycle",
    triad: ["#9ad8ec", "84,150,236", "215,84,180"],
  },
] as const satisfies readonly [RawStat, ...RawStat[]];

const toStat = (raw: RawStat): Stat => ({
  prefix: raw.prefix,
  value: raw.value,
  label: raw.label,
  gradient: gradientFrom(raw.triad),
});

const [FIRST, ...REST] = RAW;

/**
 * Non-empty by construction, so `STATS[0]` is a safe fallback under
 * `noUncheckedIndexedAccess`.
 */
export const STATS: readonly [Stat, ...Stat[]] = [toStat(FIRST), ...REST.map(toStat)];

export const N = STATS.length;

/** Wraps any integer (including negatives) into a defined stat. */
export const statAt = (index: number): Stat => {
  const wrapped = ((Math.trunc(index) % N) + N) % N;
  return STATS[wrapped] ?? STATS[0];
};
