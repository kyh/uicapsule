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

const LOOK_IMAGE_BASE =
  "https://zmdrwswxugswzmcokvff.supabase.co/storage/v1/object/public/uicapsule/lookbook-camera/looks";

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
    id: "look-01",
    lookNumber: "01",
    name: "Off-Hour Tailoring",
    season: SS,
    accent: "#4a4540",
    items: [
      {
        slot: "top",
        id: "01-top",
        name: "Worsted Wool Blazer",
        category: "Outerwear",
        material: "Worsted wool, silk lining",
        size: "M / 38R",
        priceCents: 86000,
      },
      {
        slot: "lower",
        id: "01-lower",
        name: "Pleated Crepe Trouser",
        category: "Trousers",
        material: "Crêpe de chine",
        size: "32 / 30L",
        priceCents: 42000,
      },
      {
        slot: "shoes",
        id: "01-shoes",
        name: "Suede Derby",
        category: "Footwear",
        material: "Suede, leather sole",
        size: "EU 42",
        priceCents: 39000,
      },
    ],
  },
  {
    id: "look-02",
    lookNumber: "02",
    name: "Studio Black",
    season: SS,
    accent: "#1b1b1f",
    items: [
      {
        slot: "top",
        id: "02-top",
        name: "Boxy Cotton Overshirt",
        category: "Outerwear",
        material: "Garment-dyed organic cotton",
        size: "M",
        priceCents: 38000,
      },
      {
        slot: "lower",
        id: "02-lower",
        name: "Tapered Drill Trouser",
        category: "Trousers",
        material: "Cotton drill",
        size: "32 / 32L",
        priceCents: 34000,
      },
      {
        slot: "shoes",
        id: "02-shoes",
        name: "Leather Court Sneaker",
        category: "Footwear",
        material: "Full-grain leather, rubber sole",
        size: "EU 42",
        priceCents: 42000,
      },
    ],
  },
  {
    id: "look-03",
    lookNumber: "03",
    name: "Northern Wool",
    season: AW,
    accent: "#6c7257",
    items: [
      {
        slot: "top",
        id: "03-top",
        name: "Chunky Lambswool Sweater",
        category: "Knitwear",
        material: "Lambswool, hand-linked rib",
        size: "L",
        priceCents: 32000,
      },
      {
        slot: "lower",
        id: "03-lower",
        name: "Brushed Wool Trouser",
        category: "Trousers",
        material: "Brushed virgin wool",
        size: "33 / 32L",
        priceCents: 39000,
      },
      {
        slot: "shoes",
        id: "03-shoes",
        name: "Shearling Hiker Boot",
        category: "Footwear",
        material: "Calf leather, shearling lining",
        size: "EU 43",
        priceCents: 58000,
      },
    ],
  },
  {
    id: "look-04",
    lookNumber: "04",
    name: "Velvet Hour",
    season: RESORT,
    accent: "#5b2434",
    items: [
      {
        slot: "top",
        id: "04-top",
        name: "Velvet Dinner Jacket",
        category: "Outerwear",
        material: "Cotton velvet, cupro lining",
        size: "M / 38R",
        priceCents: 94000,
      },
      {
        slot: "lower",
        id: "04-lower",
        name: "Silk-Wool Trouser",
        category: "Trousers",
        material: "Silk-wool blend",
        size: "32 / 31L",
        priceCents: 46000,
      },
      {
        slot: "shoes",
        id: "04-shoes",
        name: "Patent Leather Loafer",
        category: "Footwear",
        material: "Patent calf, leather sole",
        size: "EU 42",
        priceCents: 49000,
      },
    ],
  },
  {
    id: "look-05",
    lookNumber: "05",
    name: "Concrete Stone",
    season: SS,
    accent: "#8a8783",
    items: [
      {
        slot: "top",
        id: "05-top",
        name: "Washed Field Jacket",
        category: "Outerwear",
        material: "Washed cotton canvas",
        size: "L",
        priceCents: 44000,
      },
      {
        slot: "lower",
        id: "05-lower",
        name: "Relaxed Carpenter Pant",
        category: "Trousers",
        material: "Heavyweight cotton twill",
        size: "34 / 32L",
        priceCents: 32000,
      },
      {
        slot: "shoes",
        id: "05-shoes",
        name: "Canvas Court Trainer",
        category: "Footwear",
        material: "Organic canvas, gum sole",
        size: "EU 43",
        priceCents: 21000,
      },
    ],
  },
  {
    id: "look-06",
    lookNumber: "06",
    name: "Spring Field",
    season: SS,
    accent: "#a3b18a",
    items: [
      {
        slot: "top",
        id: "06-top",
        name: "Linen Camp Shirt",
        category: "Tops",
        material: "Washed European linen",
        size: "M",
        priceCents: 24000,
      },
      {
        slot: "lower",
        id: "06-lower",
        name: "Drawstring Linen Trouser",
        category: "Trousers",
        material: "Linen-viscose blend",
        size: "M",
        priceCents: 26000,
      },
      {
        slot: "shoes",
        id: "06-shoes",
        name: "Woven Leather Sandal",
        category: "Footwear",
        material: "Vegetable-tanned leather",
        size: "EU 42",
        priceCents: 28000,
      },
    ],
  },
  {
    id: "look-07",
    lookNumber: "07",
    name: "Rain Coat",
    season: AW,
    accent: "#2c3a4a",
    items: [
      {
        slot: "top",
        id: "07-top",
        name: "Bonded Trench Coat",
        category: "Outerwear",
        material: "Bonded cotton, taped seams",
        size: "L",
        priceCents: 78000,
      },
      {
        slot: "lower",
        id: "07-lower",
        name: "Water-Repellent Trouser",
        category: "Trousers",
        material: "Technical nylon blend",
        size: "32 / 32L",
        priceCents: 38000,
      },
      {
        slot: "shoes",
        id: "07-shoes",
        name: "Rubberised Chelsea Boot",
        category: "Footwear",
        material: "Vulcanised rubber, leather",
        size: "EU 43",
        priceCents: 44000,
      },
    ],
  },
  {
    id: "look-08",
    lookNumber: "08",
    name: "Sand Dune",
    season: RESORT,
    accent: "#b5896a",
    items: [
      {
        slot: "top",
        id: "08-top",
        name: "Camel Hair Overcoat",
        category: "Outerwear",
        material: "Camel hair, horn buttons",
        size: "L",
        priceCents: 112000,
      },
      {
        slot: "lower",
        id: "08-lower",
        name: "Pleated Cotton Chino",
        category: "Trousers",
        material: "Cotton-linen twill",
        size: "33 / 31L",
        priceCents: 30000,
      },
      {
        slot: "shoes",
        id: "08-shoes",
        name: "Suede Desert Boot",
        category: "Footwear",
        material: "Oiled suede, crepe sole",
        size: "EU 42",
        priceCents: 33000,
      },
    ],
  },
  {
    id: "look-09",
    lookNumber: "09",
    name: "Midnight Cut",
    season: PREFALL,
    accent: "#1a1a2c",
    items: [
      {
        slot: "top",
        id: "09-top",
        name: "Satin-Lapel Tuxedo Jacket",
        category: "Outerwear",
        material: "Wool barathea, satin lapel",
        size: "M / 38R",
        priceCents: 98000,
      },
      {
        slot: "lower",
        id: "09-lower",
        name: "Tuxedo Trouser",
        category: "Trousers",
        material: "Wool, satin side stripe",
        size: "32 / 31L",
        priceCents: 44000,
      },
      {
        slot: "shoes",
        id: "09-shoes",
        name: "Opera Pump",
        category: "Footwear",
        material: "Patent leather, grosgrain bow",
        size: "EU 42",
        priceCents: 47000,
      },
    ],
  },
  {
    id: "look-10",
    lookNumber: "10",
    name: "Garden Party",
    season: SS,
    accent: "#b08bb8",
    items: [
      {
        slot: "top",
        id: "10-top",
        name: "Printed Cupro Shirt",
        category: "Tops",
        material: "Printed cupro",
        size: "M",
        priceCents: 27000,
      },
      {
        slot: "lower",
        id: "10-lower",
        name: "Cropped Wide Trouser",
        category: "Trousers",
        material: "Tencel-linen blend",
        size: "S",
        priceCents: 29000,
      },
      {
        slot: "shoes",
        id: "10-shoes",
        name: "Block-Heel Mule",
        category: "Footwear",
        material: "Nappa leather",
        size: "EU 39",
        priceCents: 31000,
      },
    ],
  },
  {
    id: "look-11",
    lookNumber: "11",
    name: "Workwear",
    season: AW,
    accent: "#7a6448",
    items: [
      {
        slot: "top",
        id: "11-top",
        name: "Waxed Chore Jacket",
        category: "Outerwear",
        material: "Waxed cotton, corduroy collar",
        size: "L",
        priceCents: 42000,
      },
      {
        slot: "lower",
        id: "11-lower",
        name: "Double-Knee Work Pant",
        category: "Trousers",
        material: "Cotton canvas, reinforced knee",
        size: "34 / 32L",
        priceCents: 28000,
      },
      {
        slot: "shoes",
        id: "11-shoes",
        name: "Moc-Toe Work Boot",
        category: "Footwear",
        material: "Oiled leather, wedge sole",
        size: "EU 43",
        priceCents: 41000,
      },
    ],
  },
  {
    id: "look-12",
    lookNumber: "12",
    name: "Evening Glow",
    season: RESORT,
    accent: "#b5953a",
    items: [
      {
        slot: "top",
        id: "12-top",
        name: "Lamé Bomber Jacket",
        category: "Outerwear",
        material: "Metallic lamé, cupro lining",
        size: "M",
        priceCents: 64000,
      },
      {
        slot: "lower",
        id: "12-lower",
        name: "Liquid Satin Trouser",
        category: "Trousers",
        material: "Fluid satin",
        size: "S",
        priceCents: 38000,
      },
      {
        slot: "shoes",
        id: "12-shoes",
        name: "Metallic Strap Heel",
        category: "Footwear",
        material: "Laminated leather",
        size: "EU 39",
        priceCents: 36000,
      },
    ],
  },
  {
    id: "look-13",
    lookNumber: "13",
    name: "Linen Hours",
    season: SS,
    accent: "#c8b9a0",
    items: [
      {
        slot: "top",
        id: "13-top",
        name: "Unstructured Linen Blazer",
        category: "Outerwear",
        material: "Slubbed European linen",
        size: "M / 38R",
        priceCents: 52000,
      },
      {
        slot: "lower",
        id: "13-lower",
        name: "Wide Linen Trouser",
        category: "Trousers",
        material: "Heavy Irish linen",
        size: "33 / 30L",
        priceCents: 28000,
      },
      {
        slot: "shoes",
        id: "13-shoes",
        name: "Leather Espadrille",
        category: "Footwear",
        material: "Suede, jute sole",
        size: "EU 42",
        priceCents: 19000,
      },
    ],
  },
  {
    id: "look-14",
    lookNumber: "14",
    name: "Slate Tailoring",
    season: AW,
    accent: "#3f4855",
    items: [
      {
        slot: "top",
        id: "14-top",
        name: "Flannel Suit Jacket",
        category: "Outerwear",
        material: "Brushed wool flannel",
        size: "M / 38R",
        priceCents: 88000,
      },
      {
        slot: "lower",
        id: "14-lower",
        name: "Flannel Suit Trouser",
        category: "Trousers",
        material: "Brushed wool flannel",
        size: "32 / 31L",
        priceCents: 42000,
      },
      {
        slot: "shoes",
        id: "14-shoes",
        name: "Leather Monk Strap",
        category: "Footwear",
        material: "Calf leather, leather sole",
        size: "EU 42",
        priceCents: 46000,
      },
    ],
  },
  {
    id: "look-15",
    lookNumber: "15",
    name: "Track Side",
    season: PREFALL,
    accent: "#4a5c3a",
    items: [
      {
        slot: "top",
        id: "15-top",
        name: "Panelled Track Jacket",
        category: "Outerwear",
        material: "Recycled nylon, jersey lining",
        size: "M",
        priceCents: 34000,
      },
      {
        slot: "lower",
        id: "15-lower",
        name: "Tapered Track Pant",
        category: "Trousers",
        material: "Brushed-back jersey",
        size: "M",
        priceCents: 24000,
      },
      {
        slot: "shoes",
        id: "15-shoes",
        name: "Suede Mesh Runner",
        category: "Footwear",
        material: "Suede-mesh, EVA sole",
        size: "EU 43",
        priceCents: 29000,
      },
    ],
  },
  {
    id: "look-16",
    lookNumber: "16",
    name: "Library",
    season: AW,
    accent: "#7c5a3a",
    items: [
      {
        slot: "top",
        id: "16-top",
        name: "Corduroy Blazer",
        category: "Outerwear",
        material: "Cotton corduroy, elbow patches",
        size: "L",
        priceCents: 48000,
      },
      {
        slot: "lower",
        id: "16-lower",
        name: "Pleated Wool Trouser",
        category: "Trousers",
        material: "Wool gabardine",
        size: "33 / 32L",
        priceCents: 36000,
      },
      {
        slot: "shoes",
        id: "16-shoes",
        name: "Penny Loafer",
        category: "Footwear",
        material: "Burnished calf, leather sole",
        size: "EU 42",
        priceCents: 38000,
      },
    ],
  },
  {
    id: "look-17",
    lookNumber: "17",
    name: "Maritime",
    season: RESORT,
    accent: "#1f3a5f",
    items: [
      {
        slot: "top",
        id: "17-top",
        name: "Double-Breasted Peacoat",
        category: "Outerwear",
        material: "Melton wool, anchor buttons",
        size: "L",
        priceCents: 68000,
      },
      {
        slot: "lower",
        id: "17-lower",
        name: "Sailor Trouser",
        category: "Trousers",
        material: "Cotton-wool twill",
        size: "32 / 32L",
        priceCents: 32000,
      },
      {
        slot: "shoes",
        id: "17-shoes",
        name: "Hand-Sewn Deck Shoe",
        category: "Footwear",
        material: "Leather, siped sole",
        size: "EU 42",
        priceCents: 27000,
      },
    ],
  },
  {
    id: "look-18",
    lookNumber: "18",
    name: "Powder Rose",
    season: SS,
    accent: "#c98a8a",
    items: [
      {
        slot: "top",
        id: "18-top",
        name: "Cropped Bouclé Jacket",
        category: "Outerwear",
        material: "Cotton bouclé",
        size: "S",
        priceCents: 46000,
      },
      {
        slot: "lower",
        id: "18-lower",
        name: "A-Line Midi Skirt",
        category: "Skirt",
        material: "Stretch cotton twill",
        size: "S",
        priceCents: 28000,
      },
      {
        slot: "shoes",
        id: "18-shoes",
        name: "Slingback Flat",
        category: "Footwear",
        material: "Nappa leather",
        size: "EU 38",
        priceCents: 33000,
      },
    ],
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

function cloneLook(look: Look, suffix: string): Look {
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
}

export const LOOKS: Look[] = CYCLE_ORDERS.flatMap((order, cycleIdx) => {
  const suffix = CYCLE_SUFFIXES[cycleIdx] ?? "";
  const out: Look[] = [];
  for (const baseIdx of order) {
    const base = BASE_LOOKS[baseIdx];
    if (!base) continue;
    // Cycle 0 keeps the base objects by reference — only 1-3 clone, which is
    // what keeps `look-01` unsuffixed and every key unique.
    out.push(cycleIdx === 0 ? base : cloneLook(base, suffix));
  }
  return out;
});

export function lookTotal(look: Look): number {
  return look.items.reduce((sum, it) => sum + it.priceCents, 0);
}

export function fmtPrice(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

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
export function wrapOffset(v: number, centre: number, tile: number): number {
  return -Math.round((v - centre) / tile) * tile;
}

/** Stable pseudo-random in [0, 1) from a numeric seed. */
function hash(n: number): number {
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Pick the column count whose rendered pixel-grid aspect mirrors the viewport.
 * Only perfect divisions are considered so the wrap-tiled world never reveals
 * an empty cell.
 */
export function chooseCols(count: number, viewportAspect: number): number {
  const cardAspect = CARD_W / CARD_H;
  const target = viewportAspect / cardAspect;
  let best = 1;
  let bestDiff = Infinity;
  for (let cols = 1; cols <= count; cols++) {
    if (count % cols !== 0) continue;
    const rows = count / cols;
    const diff = Math.abs(cols / rows - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = cols;
    }
  }
  return best;
}

/**
 * Deterministic grid with mild per-cell jitter. Each item sits at its cell
 * centre plus a hashed offset (±0.09 cellW, ±0.07 cellH) and a rotation of up
 * to ±2°. Positions are stable across renders.
 */
export function layoutPositions(
  worldW: number,
  worldH: number,
  cols: number,
  count: number,
): Pos[] {
  const rows = Math.ceil(count / cols);
  const cellW = worldW / cols;
  const cellH = worldH / rows;
  const out: Pos[] = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const seed = i * 37 + 7;
    const ox = (hash(seed) - 0.5) * cellW * 0.18;
    const oy = (hash(seed + 1) - 0.5) * cellH * 0.14;
    const rot = (hash(seed + 2) - 0.5) * 4;
    out.push({
      x: col * cellW + cellW / 2 + ox,
      y: row * cellH + cellH / 2 + oy,
      rot,
    });
  }
  return out;
}
