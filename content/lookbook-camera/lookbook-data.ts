/**
 * Lookbook data layer.
 *
 * Owns every constant the renderer reads: the eighteen base looks, the four
 * cycle permutations that expand them into 72 unique cards, the card/cell
 * geometry, and the deterministic grid layout helpers.
 *
 * The garments are drawn, not photographed — every look describes a figure by
 * silhouette + palette and `look-figure.tsx` turns that into SVG. There are no
 * image URLs anywhere: the whole gallery is self-contained vector art.
 */

/* ── Garment silhouettes ─────────────────────────────────────────── */

export type TopForm = "coat" | "blazer" | "jacket" | "shirt" | "knit";
export type LowerForm = "trouser" | "wide" | "skirt";
export type ShoeForm = "boot" | "sneaker" | "loafer" | "heel";

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

export interface LookPalette {
  skin: string;
  hair: string;
  top: string;
  lower: string;
  shoes: string;
}

export interface LookForms {
  top: TopForm;
  lower: LowerForm;
  shoes: ShoeForm;
}

export interface Look {
  id: string;
  lookNumber: string;
  name: string;
  season: string;
  accent: string;
  palette: LookPalette;
  forms: LookForms;
  /** -1 .. 1 — leans the stance so repeated silhouettes never read identical. */
  stance: number;
  items: [TopItem, LowerItem, ShoeItem];
}

const SS = "Spring / Summer";
const AW = "Autumn / Winter";
const RESORT = "Resort";
const PREFALL = "Pre-Fall";

export const BASE_LOOKS: Look[] = [
  {
    id: "look-01",
    lookNumber: "01",
    name: "Off-Hour Tailoring",
    season: SS,
    accent: "#4a4540",
    palette: {
      skin: "#d9bfa6",
      hair: "#3a2c22",
      top: "#4c4a46",
      lower: "#b7ac99",
      shoes: "#8a6a4a",
    },
    forms: { top: "blazer", lower: "trouser", shoes: "loafer" },
    stance: 0.2,
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
    palette: {
      skin: "#c9a184",
      hair: "#141212",
      top: "#1d1d20",
      lower: "#26262a",
      shoes: "#f1efe9",
    },
    forms: { top: "jacket", lower: "trouser", shoes: "sneaker" },
    stance: -0.35,
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
    palette: {
      skin: "#e0c3a4",
      hair: "#8a6a3c",
      top: "#78805e",
      lower: "#5c4b3a",
      shoes: "#4a3a2c",
    },
    forms: { top: "knit", lower: "trouser", shoes: "boot" },
    stance: 0.55,
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
    palette: {
      skin: "#c08e6a",
      hair: "#20161a",
      top: "#6b2b3c",
      lower: "#221c20",
      shoes: "#141013",
    },
    forms: { top: "blazer", lower: "trouser", shoes: "loafer" },
    stance: -0.1,
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
    palette: {
      skin: "#dcb894",
      hair: "#4a3b2e",
      top: "#9a968e",
      lower: "#c8bda6",
      shoes: "#eae5da",
    },
    forms: { top: "jacket", lower: "wide", shoes: "sneaker" },
    stance: 0.4,
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
    palette: {
      skin: "#e6c9a8",
      hair: "#b28a4e",
      top: "#adba92",
      lower: "#efe7d6",
      shoes: "#c69a68",
    },
    forms: { top: "shirt", lower: "wide", shoes: "loafer" },
    stance: -0.5,
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
    palette: {
      skin: "#cfa87f",
      hair: "#2a2019",
      top: "#3c4e62",
      lower: "#242c36",
      shoes: "#17191c",
    },
    forms: { top: "coat", lower: "trouser", shoes: "boot" },
    stance: 0.15,
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
    palette: {
      skin: "#e2c2a0",
      hair: "#6b4a2c",
      top: "#c39a72",
      lower: "#e3d6bd",
      shoes: "#a2764c",
    },
    forms: { top: "coat", lower: "trouser", shoes: "boot" },
    stance: -0.25,
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
    palette: {
      skin: "#b8845c",
      hair: "#15131a",
      top: "#1f2033",
      lower: "#1f2033",
      shoes: "#0f0f14",
    },
    forms: { top: "blazer", lower: "trouser", shoes: "loafer" },
    stance: 0.05,
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
    palette: {
      skin: "#e8cbae",
      hair: "#4e3a2e",
      top: "#c39cca",
      lower: "#d8c3dd",
      shoes: "#9a6f9f",
    },
    forms: { top: "shirt", lower: "wide", shoes: "heel" },
    stance: -0.6,
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
    palette: {
      skin: "#d3a97f",
      hair: "#3d2c1e",
      top: "#8d7350",
      lower: "#b0a077",
      shoes: "#6b3a2c",
    },
    forms: { top: "jacket", lower: "wide", shoes: "boot" },
    stance: 0.65,
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
    palette: {
      skin: "#c99a70",
      hair: "#241a12",
      top: "#c9a545",
      lower: "#e6d9b2",
      shoes: "#a8862c",
    },
    forms: { top: "jacket", lower: "wide", shoes: "heel" },
    stance: -0.2,
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
    palette: {
      skin: "#e4c4a2",
      hair: "#7c5c38",
      top: "#ded2bb",
      lower: "#eee6d5",
      shoes: "#bfa274",
    },
    forms: { top: "blazer", lower: "wide", shoes: "loafer" },
    stance: 0.3,
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
    palette: {
      skin: "#cba482",
      hair: "#2b2620",
      top: "#4e5866",
      lower: "#4e5866",
      shoes: "#1a1a1c",
    },
    forms: { top: "blazer", lower: "trouser", shoes: "loafer" },
    stance: -0.05,
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
    palette: {
      skin: "#d6ab82",
      hair: "#332721",
      top: "#5a6f45",
      lower: "#3e4c32",
      shoes: "#c8c4ba",
    },
    forms: { top: "jacket", lower: "trouser", shoes: "sneaker" },
    stance: 0.45,
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
    palette: {
      skin: "#dfba95",
      hair: "#54371f",
      top: "#8d6440",
      lower: "#b6a68d",
      shoes: "#7a4a2a",
    },
    forms: { top: "blazer", lower: "trouser", shoes: "loafer" },
    stance: -0.4,
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
    palette: {
      skin: "#e0bd9a",
      hair: "#241d16",
      top: "#26456e",
      lower: "#eae3d4",
      shoes: "#1b2b40",
    },
    forms: { top: "coat", lower: "trouser", shoes: "loafer" },
    stance: 0.1,
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
    palette: {
      skin: "#eccdb0",
      hair: "#8a5a34",
      top: "#dba0a0",
      lower: "#e8bdbd",
      shoes: "#f0dcd4",
    },
    forms: { top: "jacket", lower: "skirt", shoes: "heel" },
    stance: -0.15,
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
