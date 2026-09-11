/**
 * Lookbook data layer.
 *
 * Owns every constant the renderer reads: the eighteen base looks, the four
 * cycle permutations that expand them into 72 unique cards, the card/cell
 * geometry, and the deterministic grid layout helpers.
 *
 * Every look is one photograph, generated to a fixed framing (full body, model
 * centred, small margin above the head and below the shoes) so
 * `look-figure.tsx` can crop any piece out of any look with one set of boxes.
 */

const LOOK_IMAGE_BASE = "https://pub-327ea719340342d3a3d5c5aa7f979e3a.r2.dev/lookbook-camera/looks";

export type ItemCategory = "Outerwear" | "Knitwear" | "Tops" | "Trousers" | "Skirt" | "Footwear";

interface ItemBase {
  id: string;
  name: string;
  category: ItemCategory;
  material: string;
  size: string;
  priceCents: number;
}

/**
 * The slot is a literal discriminant, not a free string: it is what the detail
 * panel reads to crop the figure down to the piece being shown, so an item can
 * never point at a region of the drawing that does not exist.
 */
export type TopItem = ItemBase & { slot: "top" };
export type LowerItem = ItemBase & { slot: "lower" };
export type ShoeItem = ItemBase & { slot: "shoes" };
export type ClothingItem = TopItem | LowerItem | ShoeItem;
export type ItemSlot = ClothingItem["slot"];

export interface Look {
  id: string;
  lookNumber: string;
  name: string;
  season: string;
  accent: string;
  imageUrl: string;
  items: [TopItem, LowerItem, ShoeItem];
}

const SS = "Spring / Summer";
const AW = "Autumn / Winter";
const RESORT = "Resort";
const PREFALL = "Pre-Fall";

const RAW_LOOKS: Omit<Look, "imageUrl">[] = [
  {
    accent: "#4a4540",
    id: "look-01",
    items: [
      {
        category: "Outerwear",
        id: "01-top",
        material: "Worsted wool, silk lining",
        name: "Worsted Wool Blazer",
        priceCents: 86_000,
        size: "M / 38R",
        slot: "top",
      },
      {
        category: "Trousers",
        id: "01-lower",
        material: "Crêpe de chine",
        name: "Pleated Crepe Trouser",
        priceCents: 42_000,
        size: "32 / 30L",
        slot: "lower",
      },
      {
        category: "Footwear",
        id: "01-shoes",
        material: "Suede, leather sole",
        name: "Suede Derby",
        priceCents: 39_000,
        size: "EU 42",
        slot: "shoes",
      },
    ],
    lookNumber: "01",
    name: "Off-Hour Tailoring",
    season: SS,
  },
  {
    accent: "#1b1b1f",
    id: "look-02",
    items: [
      {
        category: "Outerwear",
        id: "02-top",
        material: "Garment-dyed organic cotton",
        name: "Boxy Cotton Overshirt",
        priceCents: 38_000,
        size: "M",
        slot: "top",
      },
      {
        category: "Trousers",
        id: "02-lower",
        material: "Cotton drill",
        name: "Tapered Drill Trouser",
        priceCents: 34_000,
        size: "32 / 32L",
        slot: "lower",
      },
      {
        category: "Footwear",
        id: "02-shoes",
        material: "Full-grain leather, rubber sole",
        name: "Leather Court Sneaker",
        priceCents: 42_000,
        size: "EU 42",
        slot: "shoes",
      },
    ],
    lookNumber: "02",
    name: "Studio Black",
    season: SS,
  },
  {
    accent: "#6c7257",
    id: "look-03",
    items: [
      {
        category: "Knitwear",
        id: "03-top",
        material: "Lambswool, hand-linked rib",
        name: "Chunky Lambswool Sweater",
        priceCents: 32_000,
        size: "L",
        slot: "top",
      },
      {
        category: "Trousers",
        id: "03-lower",
        material: "Brushed virgin wool",
        name: "Brushed Wool Trouser",
        priceCents: 39_000,
        size: "33 / 32L",
        slot: "lower",
      },
      {
        category: "Footwear",
        id: "03-shoes",
        material: "Calf leather, shearling lining",
        name: "Shearling Hiker Boot",
        priceCents: 58_000,
        size: "EU 43",
        slot: "shoes",
      },
    ],
    lookNumber: "03",
    name: "Northern Wool",
    season: AW,
  },
  {
    accent: "#5b2434",
    id: "look-04",
    items: [
      {
        category: "Outerwear",
        id: "04-top",
        material: "Cotton velvet, cupro lining",
        name: "Velvet Dinner Jacket",
        priceCents: 94_000,
        size: "M / 38R",
        slot: "top",
      },
      {
        category: "Trousers",
        id: "04-lower",
        material: "Silk-wool blend",
        name: "Silk-Wool Trouser",
        priceCents: 46_000,
        size: "32 / 31L",
        slot: "lower",
      },
      {
        category: "Footwear",
        id: "04-shoes",
        material: "Patent calf, leather sole",
        name: "Patent Leather Loafer",
        priceCents: 49_000,
        size: "EU 42",
        slot: "shoes",
      },
    ],
    lookNumber: "04",
    name: "Velvet Hour",
    season: RESORT,
  },
  {
    accent: "#8a8783",
    id: "look-05",
    items: [
      {
        category: "Outerwear",
        id: "05-top",
        material: "Washed cotton canvas",
        name: "Washed Field Jacket",
        priceCents: 44_000,
        size: "L",
        slot: "top",
      },
      {
        category: "Trousers",
        id: "05-lower",
        material: "Heavyweight cotton twill",
        name: "Relaxed Carpenter Pant",
        priceCents: 32_000,
        size: "34 / 32L",
        slot: "lower",
      },
      {
        category: "Footwear",
        id: "05-shoes",
        material: "Organic canvas, gum sole",
        name: "Canvas Court Trainer",
        priceCents: 21_000,
        size: "EU 43",
        slot: "shoes",
      },
    ],
    lookNumber: "05",
    name: "Concrete Stone",
    season: SS,
  },
  {
    accent: "#a3b18a",
    id: "look-06",
    items: [
      {
        category: "Tops",
        id: "06-top",
        material: "Washed European linen",
        name: "Linen Camp Shirt",
        priceCents: 24_000,
        size: "M",
        slot: "top",
      },
      {
        category: "Trousers",
        id: "06-lower",
        material: "Linen-viscose blend",
        name: "Drawstring Linen Trouser",
        priceCents: 26_000,
        size: "M",
        slot: "lower",
      },
      {
        category: "Footwear",
        id: "06-shoes",
        material: "Vegetable-tanned leather",
        name: "Woven Leather Sandal",
        priceCents: 28_000,
        size: "EU 42",
        slot: "shoes",
      },
    ],
    lookNumber: "06",
    name: "Spring Field",
    season: SS,
  },
  {
    accent: "#2c3a4a",
    id: "look-07",
    items: [
      {
        category: "Outerwear",
        id: "07-top",
        material: "Bonded cotton, taped seams",
        name: "Bonded Trench Coat",
        priceCents: 78_000,
        size: "L",
        slot: "top",
      },
      {
        category: "Trousers",
        id: "07-lower",
        material: "Technical nylon blend",
        name: "Water-Repellent Trouser",
        priceCents: 38_000,
        size: "32 / 32L",
        slot: "lower",
      },
      {
        category: "Footwear",
        id: "07-shoes",
        material: "Vulcanised rubber, leather",
        name: "Rubberised Chelsea Boot",
        priceCents: 44_000,
        size: "EU 43",
        slot: "shoes",
      },
    ],
    lookNumber: "07",
    name: "Rain Coat",
    season: AW,
  },
  {
    accent: "#b5896a",
    id: "look-08",
    items: [
      {
        category: "Outerwear",
        id: "08-top",
        material: "Camel hair, horn buttons",
        name: "Camel Hair Overcoat",
        priceCents: 112_000,
        size: "L",
        slot: "top",
      },
      {
        category: "Trousers",
        id: "08-lower",
        material: "Cotton-linen twill",
        name: "Pleated Cotton Chino",
        priceCents: 30_000,
        size: "33 / 31L",
        slot: "lower",
      },
      {
        category: "Footwear",
        id: "08-shoes",
        material: "Oiled suede, crepe sole",
        name: "Suede Desert Boot",
        priceCents: 33_000,
        size: "EU 42",
        slot: "shoes",
      },
    ],
    lookNumber: "08",
    name: "Sand Dune",
    season: RESORT,
  },
  {
    accent: "#1a1a2c",
    id: "look-09",
    items: [
      {
        category: "Outerwear",
        id: "09-top",
        material: "Wool barathea, satin lapel",
        name: "Satin-Lapel Tuxedo Jacket",
        priceCents: 98_000,
        size: "M / 38R",
        slot: "top",
      },
      {
        category: "Trousers",
        id: "09-lower",
        material: "Wool, satin side stripe",
        name: "Tuxedo Trouser",
        priceCents: 44_000,
        size: "32 / 31L",
        slot: "lower",
      },
      {
        category: "Footwear",
        id: "09-shoes",
        material: "Patent leather, grosgrain bow",
        name: "Opera Pump",
        priceCents: 47_000,
        size: "EU 42",
        slot: "shoes",
      },
    ],
    lookNumber: "09",
    name: "Midnight Cut",
    season: PREFALL,
  },
  {
    accent: "#b08bb8",
    id: "look-10",
    items: [
      {
        category: "Tops",
        id: "10-top",
        material: "Printed cupro",
        name: "Printed Cupro Shirt",
        priceCents: 27_000,
        size: "M",
        slot: "top",
      },
      {
        category: "Trousers",
        id: "10-lower",
        material: "Tencel-linen blend",
        name: "Cropped Wide Trouser",
        priceCents: 29_000,
        size: "S",
        slot: "lower",
      },
      {
        category: "Footwear",
        id: "10-shoes",
        material: "Nappa leather",
        name: "Block-Heel Mule",
        priceCents: 31_000,
        size: "EU 39",
        slot: "shoes",
      },
    ],
    lookNumber: "10",
    name: "Garden Party",
    season: SS,
  },
  {
    accent: "#7a6448",
    id: "look-11",
    items: [
      {
        category: "Outerwear",
        id: "11-top",
        material: "Waxed cotton, corduroy collar",
        name: "Waxed Chore Jacket",
        priceCents: 42_000,
        size: "L",
        slot: "top",
      },
      {
        category: "Trousers",
        id: "11-lower",
        material: "Cotton canvas, reinforced knee",
        name: "Double-Knee Work Pant",
        priceCents: 28_000,
        size: "34 / 32L",
        slot: "lower",
      },
      {
        category: "Footwear",
        id: "11-shoes",
        material: "Oiled leather, wedge sole",
        name: "Moc-Toe Work Boot",
        priceCents: 41_000,
        size: "EU 43",
        slot: "shoes",
      },
    ],
    lookNumber: "11",
    name: "Workwear",
    season: AW,
  },
  {
    accent: "#b5953a",
    id: "look-12",
    items: [
      {
        category: "Outerwear",
        id: "12-top",
        material: "Metallic lamé, cupro lining",
        name: "Lamé Bomber Jacket",
        priceCents: 64_000,
        size: "M",
        slot: "top",
      },
      {
        category: "Trousers",
        id: "12-lower",
        material: "Fluid satin",
        name: "Liquid Satin Trouser",
        priceCents: 38_000,
        size: "S",
        slot: "lower",
      },
      {
        category: "Footwear",
        id: "12-shoes",
        material: "Laminated leather",
        name: "Metallic Strap Heel",
        priceCents: 36_000,
        size: "EU 39",
        slot: "shoes",
      },
    ],
    lookNumber: "12",
    name: "Evening Glow",
    season: RESORT,
  },
  {
    accent: "#c8b9a0",
    id: "look-13",
    items: [
      {
        category: "Outerwear",
        id: "13-top",
        material: "Slubbed European linen",
        name: "Unstructured Linen Blazer",
        priceCents: 52_000,
        size: "M / 38R",
        slot: "top",
      },
      {
        category: "Trousers",
        id: "13-lower",
        material: "Heavy Irish linen",
        name: "Wide Linen Trouser",
        priceCents: 28_000,
        size: "33 / 30L",
        slot: "lower",
      },
      {
        category: "Footwear",
        id: "13-shoes",
        material: "Suede, jute sole",
        name: "Leather Espadrille",
        priceCents: 19_000,
        size: "EU 42",
        slot: "shoes",
      },
    ],
    lookNumber: "13",
    name: "Linen Hours",
    season: SS,
  },
  {
    accent: "#3f4855",
    id: "look-14",
    items: [
      {
        category: "Outerwear",
        id: "14-top",
        material: "Brushed wool flannel",
        name: "Flannel Suit Jacket",
        priceCents: 88_000,
        size: "M / 38R",
        slot: "top",
      },
      {
        category: "Trousers",
        id: "14-lower",
        material: "Brushed wool flannel",
        name: "Flannel Suit Trouser",
        priceCents: 42_000,
        size: "32 / 31L",
        slot: "lower",
      },
      {
        category: "Footwear",
        id: "14-shoes",
        material: "Calf leather, leather sole",
        name: "Leather Monk Strap",
        priceCents: 46_000,
        size: "EU 42",
        slot: "shoes",
      },
    ],
    lookNumber: "14",
    name: "Slate Tailoring",
    season: AW,
  },
  {
    accent: "#4a5c3a",
    id: "look-15",
    items: [
      {
        category: "Outerwear",
        id: "15-top",
        material: "Recycled nylon, jersey lining",
        name: "Panelled Track Jacket",
        priceCents: 34_000,
        size: "M",
        slot: "top",
      },
      {
        category: "Trousers",
        id: "15-lower",
        material: "Brushed-back jersey",
        name: "Tapered Track Pant",
        priceCents: 24_000,
        size: "M",
        slot: "lower",
      },
      {
        category: "Footwear",
        id: "15-shoes",
        material: "Suede-mesh, EVA sole",
        name: "Suede Mesh Runner",
        priceCents: 29_000,
        size: "EU 43",
        slot: "shoes",
      },
    ],
    lookNumber: "15",
    name: "Track Side",
    season: PREFALL,
  },
  {
    accent: "#7c5a3a",
    id: "look-16",
    items: [
      {
        category: "Outerwear",
        id: "16-top",
        material: "Cotton corduroy, elbow patches",
        name: "Corduroy Blazer",
        priceCents: 48_000,
        size: "L",
        slot: "top",
      },
      {
        category: "Trousers",
        id: "16-lower",
        material: "Wool gabardine",
        name: "Pleated Wool Trouser",
        priceCents: 36_000,
        size: "33 / 32L",
        slot: "lower",
      },
      {
        category: "Footwear",
        id: "16-shoes",
        material: "Burnished calf, leather sole",
        name: "Penny Loafer",
        priceCents: 38_000,
        size: "EU 42",
        slot: "shoes",
      },
    ],
    lookNumber: "16",
    name: "Library",
    season: AW,
  },
  {
    accent: "#1f3a5f",
    id: "look-17",
    items: [
      {
        category: "Outerwear",
        id: "17-top",
        material: "Melton wool, anchor buttons",
        name: "Double-Breasted Peacoat",
        priceCents: 68_000,
        size: "L",
        slot: "top",
      },
      {
        category: "Trousers",
        id: "17-lower",
        material: "Cotton-wool twill",
        name: "Sailor Trouser",
        priceCents: 32_000,
        size: "32 / 32L",
        slot: "lower",
      },
      {
        category: "Footwear",
        id: "17-shoes",
        material: "Leather, siped sole",
        name: "Hand-Sewn Deck Shoe",
        priceCents: 27_000,
        size: "EU 42",
        slot: "shoes",
      },
    ],
    lookNumber: "17",
    name: "Maritime",
    season: RESORT,
  },
  {
    accent: "#c98a8a",
    id: "look-18",
    items: [
      {
        category: "Outerwear",
        id: "18-top",
        material: "Cotton bouclé",
        name: "Cropped Bouclé Jacket",
        priceCents: 46_000,
        size: "S",
        slot: "top",
      },
      {
        category: "Skirt",
        id: "18-lower",
        material: "Stretch cotton twill",
        name: "A-Line Midi Skirt",
        priceCents: 28_000,
        size: "S",
        slot: "lower",
      },
      {
        category: "Footwear",
        id: "18-shoes",
        material: "Nappa leather",
        name: "Slingback Flat",
        priceCents: 33_000,
        size: "EU 38",
        slot: "shoes",
      },
    ],
    lookNumber: "18",
    name: "Powder Rose",
    season: SS,
  },
];

/**
 * Cycle expansion. The 18 base looks are emitted four times into a single
 * LOOKS array of length 72. Each cycle uses a different permutation (generated
 * offline by simulated annealing against an adjacency-cost objective for column
 * counts 8..15) so duplicates never sit adjacent at any chooseCols result.
 * Cycles 1-3 suffix every id so React keys stay unique while cycle 0 keeps the
 * base objects by reference.
 */
const CYCLE_ORDERS: number[][] = [
  [0, 8, 2, 16, 4, 5, 11, 7, 1, 10, 17, 6, 12, 13, 14, 15, 3, 9],
  [13, 15, 3, 8, 9, 2, 16, 7, 5, 0, 1, 10, 6, 17, 11, 4, 14, 12],
  [17, 4, 13, 8, 14, 12, 2, 16, 9, 3, 15, 6, 5, 11, 7, 1, 0, 10],
  [5, 10, 4, 1, 0, 13, 14, 2, 8, 15, 12, 3, 17, 7, 16, 6, 9, 11],
];

const CYCLE_SUFFIXES = ["", "b", "c", "d"];

export const BASE_LOOKS: Look[] = RAW_LOOKS.map((look) =>
  Object.assign(look, { imageUrl: `${LOOK_IMAGE_BASE}/${look.id}.jpg` }),
);

const cloneLook = (look: Look, suffix: string): Look => {
  const [top, lower, shoes] = look.items;
  return {
    ...look,
    id: `${look.id}-${suffix}`,
    items: [
      { ...top, id: `${top.id}-${suffix}` },
      { ...lower, id: `${lower.id}-${suffix}` },
      { ...shoes, id: `${shoes.id}-${suffix}` },
    ],
  };
};

export const LOOKS: Look[] = CYCLE_ORDERS.flatMap((order, cycleIdx) => {
  const suffix = CYCLE_SUFFIXES[cycleIdx] ?? "";
  const out: Look[] = [];
  for (const baseIdx of order) {
    const base = BASE_LOOKS[baseIdx];
    if (!base) {
      continue;
    }
    // Cycle 0 keeps the base objects by reference — only 1-3 clone, which is
    // what keeps `look-01` unsuffixed and every key unique.
    out.push(cycleIdx === 0 ? base : cloneLook(base, suffix));
  }
  return out;
});

export const lookTotal = (look: Look): number => {
  let sum = 0;
  for (const it of look.items) {
    sum += it.priceCents;
  }
  return sum;
};

export const fmtPrice = (cents: number): string =>
  `$${Math.round(cents / 100).toLocaleString("en-US")}`;

/* ── Layout geometry (world coordinates) ─────────────────────────── */

export const CARD_W = 188;
export const CARD_H = 282;
export const CELL_MARGIN_X = 22;
export const CELL_MARGIN_Y = 28;

export interface Pos {
  x: number;
  y: number;
  rot: number;
}

/**
 * Offset that moves a world coordinate onto the tiled copy nearest `centre`.
 *
 * The world is a torus: every card also exists at `v + k * tile` for every
 * integer k. Picking the k closest to the camera's world centre is the entire
 * edgeless mechanic — the RAF loop applies it per card per frame, and a
 * selection uses it so the camera flies to the copy already on screen rather
 * than to the canonical one a tile away.
 */
export const wrapOffset = (v: number, centre: number, tile: number): number =>
  -Math.round((v - centre) / tile) * tile;

/** Stable pseudo-random in [0, 1) from a numeric seed. */
const hash = (n: number): number => {
  const s = Math.sin(n * 12.9898 + 78.233) * 43_758.5453;
  return s - Math.floor(s);
};

/**
 * Pick the column count whose rendered pixel-grid aspect mirrors the viewport.
 * Only perfect divisions are considered so the wrap-tiled world never reveals
 * an empty cell.
 */
export const chooseCols = (count: number, viewportAspect: number): number => {
  const cardAspect = CARD_W / CARD_H;
  const target = viewportAspect / cardAspect;
  let best = 1;
  let bestDiff = Infinity;
  for (let cols = 1; cols <= count; cols += 1) {
    if (count % cols !== 0) {
      continue;
    }
    const rows = count / cols;
    const diff = Math.abs(cols / rows - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = cols;
    }
  }
  return best;
};

/**
 * Deterministic grid with mild per-cell jitter. Each item sits at its cell
 * centre plus a hashed offset (±0.09 cellW, ±0.07 cellH) and a rotation of up
 * to ±2°. Positions are stable across renders.
 */
export const layoutPositions = (
  worldW: number,
  worldH: number,
  cols: number,
  count: number,
): Pos[] => {
  const rows = Math.ceil(count / cols);
  const cellW = worldW / cols;
  const cellH = worldH / rows;
  const out: Pos[] = [];
  for (let i = 0; i < count; i += 1) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const seed = i * 37 + 7;
    const ox = (hash(seed) - 0.5) * cellW * 0.18;
    const oy = (hash(seed + 1) - 0.5) * cellH * 0.14;
    const rot = (hash(seed + 2) - 0.5) * 4;
    out.push({
      rot,
      x: col * cellW + cellW / 2 + ox,
      y: row * cellH + cellH / 2 + oy,
    });
  }
  return out;
};
