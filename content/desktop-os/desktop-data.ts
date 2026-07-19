/**
 * All static content for the desktop simulation.
 *
 * Every image is a remote Unsplash CDN derivative — the package ships no binary
 * assets and the wallpaper is pure CSS, so there is nothing to host.
 */

const unsplash = (id: string, width: number): string =>
  `https://images.unsplash.com/${id}?w=${width}&q=75&auto=format&fit=crop`;

/* ------------------------------------------------------------------ files -- */

export interface SeedPos {
  readonly xPct: number;
  readonly yPct: number;
}

export interface DesktopFile {
  readonly id: string;
  readonly name: string;
  /** Small derivative — desktop tile + boot reel. */
  readonly thumb: string;
  /** Large derivative — Quick Look + lightbox. */
  readonly full: string;
  readonly dimensions: string;
  /** Hand-tuned percentage seed so tiles never collide at any frame size. */
  readonly pos: SeedPos;
}

/**
 * A tuple (not a plain array) so `FILES[0]` is statically known to exist under
 * `noUncheckedIndexedAccess`.
 */
export const FILES = [
  {
    id: "wetland-dusk",
    name: "Wetland Dusk.jpg",
    thumb: unsplash("photo-1506744038136-46273834b3fb", 400),
    full: unsplash("photo-1506744038136-46273834b3fb", 1600),
    dimensions: "4000 × 2667",
    pos: { xPct: 8, yPct: 14 },
  },
  {
    id: "fog-pines",
    name: "Fog Pines.jpg",
    thumb: unsplash("photo-1470071459604-3b5ec3a7fe05", 400),
    full: unsplash("photo-1470071459604-3b5ec3a7fe05", 1600),
    dimensions: "3840 × 2560",
    pos: { xPct: 22, yPct: 22 },
  },
  {
    id: "coast-road",
    name: "Coast Road.jpg",
    thumb: unsplash("photo-1500534314209-a25ddb2bd429", 400),
    full: unsplash("photo-1500534314209-a25ddb2bd429", 1600),
    dimensions: "3600 × 2400",
    pos: { xPct: 38, yPct: 12 },
  },
  {
    id: "sunlit-grove",
    name: "Sunlit Grove.jpg",
    thumb: unsplash("photo-1441974231531-c6227db76b6e", 400),
    full: unsplash("photo-1441974231531-c6227db76b6e", 1600),
    dimensions: "5184 × 3456",
    pos: { xPct: 56, yPct: 18 },
  },
  {
    id: "open-water",
    name: "Open Water.jpg",
    thumb: unsplash("photo-1518837695005-2083093ee35b", 400),
    full: unsplash("photo-1518837695005-2083093ee35b", 1600),
    dimensions: "4288 × 2848",
    pos: { xPct: 72, yPct: 26 },
  },
  {
    id: "salt-flats",
    name: "Salt Flats.jpg",
    thumb: unsplash("photo-1439066615861-d1af74d74000", 400),
    full: unsplash("photo-1439066615861-d1af74d74000", 1600),
    dimensions: "3888 × 2592",
    pos: { xPct: 14, yPct: 38 },
  },
  {
    id: "aurora-fjord",
    name: "Aurora Fjord.jpg",
    thumb: unsplash("photo-1493246507139-91e8fad9978e", 400),
    full: unsplash("photo-1493246507139-91e8fad9978e", 1600),
    dimensions: "4608 × 3072",
    pos: { xPct: 30, yPct: 46 },
  },
  {
    id: "alpine-lake",
    name: "Alpine Lake.jpg",
    thumb: unsplash("photo-1470252649378-9c29740c9fa8", 400),
    full: unsplash("photo-1470252649378-9c29740c9fa8", 1600),
    dimensions: "5472 × 3648",
    pos: { xPct: 46, yPct: 42 },
  },
  {
    id: "forest-path",
    name: "Forest Path.jpg",
    thumb: unsplash("photo-1447752875215-b2761acb3c5d", 400),
    full: unsplash("photo-1447752875215-b2761acb3c5d", 1600),
    dimensions: "4272 × 2848",
    pos: { xPct: 62, yPct: 50 },
  },
  {
    id: "green-valley",
    name: "Green Valley.jpg",
    thumb: unsplash("photo-1426604966848-d7adac402bff", 400),
    full: unsplash("photo-1426604966848-d7adac402bff", 1600),
    dimensions: "5760 × 3840",
    pos: { xPct: 78, yPct: 44 },
  },
] as const satisfies readonly DesktopFile[];

export const HERO_FILE = FILES[0];

export const findFile = (id: string | undefined): DesktopFile | undefined =>
  FILES.find((file) => file.id === id);

/* ------------------------------------------------------------------ tiles -- */

export type DesktopTile =
  | { readonly kind: "file"; readonly file: DesktopFile }
  | {
      readonly kind: "folder";
      readonly id: string;
      readonly name: string;
      readonly pos: SeedPos;
    };

export const tileId = (tile: DesktopTile): string =>
  tile.kind === "file" ? tile.file.id : tile.id;

export const tileName = (tile: DesktopTile): string =>
  tile.kind === "file" ? tile.file.name : tile.name;

export const tilePos = (tile: DesktopTile): SeedPos =>
  tile.kind === "file" ? tile.file.pos : tile.pos;

export const TILES: readonly DesktopTile[] = [
  ...FILES.map((file): DesktopTile => ({ kind: "file", file })),
  { kind: "folder", id: "archive", name: "Archive", pos: { xPct: 6, yPct: 60 } },
];

/* ----------------------------------------------------------------- photos -- */

export interface DesktopPhoto {
  readonly src: string;
  readonly full: string;
  readonly ratio: "tall" | "wide" | "square";
  readonly caption: string;
}

const photo = (id: string, ratio: DesktopPhoto["ratio"], caption: string): DesktopPhoto => ({
  src: unsplash(id, 600),
  full: unsplash(id, 1600),
  ratio,
  caption,
});

export const PHOTOS: readonly DesktopPhoto[] = [
  photo("photo-1501785888041-af3ef285b470", "wide", "Shoreline, low tide"),
  photo("photo-1472214103451-9374bd1c798e", "tall", "Ridge line"),
  photo("photo-1444927714506-8492d94b4e3d", "tall", "Meadow, mid-morning"),
  photo("photo-1475924156734-496f6cac6ec1", "tall", "Wildflowers"),
  photo("photo-1490750967868-88aa4486c946", "tall", "Field lines"),
  photo("photo-1519681393784-d120267933ba", "wide", "Night sky, north face"),
  photo("photo-1507525428034-b723cf961d3e", "tall", "Warm sand"),
  photo("photo-1454391304352-2bf4678b1a7a", "wide", "Workbench"),
  photo("photo-1465101162946-4377e57745c3", "tall", "First light"),
];

/* ------------------------------------------------------------------ notes -- */

export interface DesktopNote {
  readonly id: string;
  readonly title: string;
  readonly date: string;
  readonly preview: string;
  readonly body: string;
}

export const NOTES = [
  {
    id: "timings",
    title: "Motion timings",
    date: "Today",
    preview: "Enter 320ms, exit 180ms. Exits are always faster.",
    body: `Enter 320ms, exit 180ms. Exits are always faster — the user has already decided.

Anything under 90ms reads as an instant state change, not a transition. Anything over 500ms reads as a wait.

Blur is expensive. Scale and opacity are free. Spend the blur where it is the whole point.`,
  },
  {
    id: "palette",
    title: "Palette notes",
    date: "Today",
    preview: "Warm grey vs cold grey is a whole mood.",
    body: `Pick the hue first, then the chroma, then the lightness. In that order, every time.

Warm grey and cold grey are not interchangeable. One of them is wrong for the surface you are on.

Two accents maximum. A third accent is a decision you have not made yet.`,
  },
  {
    id: "checklist",
    title: "Shipping checklist",
    date: "Yesterday",
    preview: "Keyboard, reduced motion, empty state, 320px.",
    body: `Keyboard path end to end.
Reduced motion honoured.
Empty state drawn, not forgotten.
320px wide without a horizontal scrollbar.
Focus ring visible on every interactive thing.
Nothing depends on hover alone.`,
  },
  {
    id: "read-later",
    title: "Read later",
    date: "Mar 02",
    preview: "Spring constants, optical alignment, subpixel text.",
    body: `Spring constants — the gap between motion that feels cheap and motion that feels expensive is about three numbers.

Optical alignment beats geometric alignment whenever a shape has a point on it.

Subpixel text rendering changes when you promote a layer. Know which of your layers are promoted.`,
  },
] as const satisfies readonly DesktopNote[];

export const FIRST_NOTE = NOTES[0];

/* ------------------------------------------------------------------- dock -- */

export type DockAppId = "files" | "preview" | "photos" | "notes" | "terminal" | "trash";

export interface DockApp {
  readonly id: DockAppId;
  readonly name: string;
}

export const DOCK_APPS: readonly DockApp[] = [
  { id: "files", name: "Files" },
  { id: "preview", name: "Preview" },
  { id: "photos", name: "Photos" },
  { id: "notes", name: "Notes" },
  { id: "terminal", name: "Terminal" },
  { id: "trash", name: "Trash" },
];

export const MOBILE_PRIMARY: readonly DockAppId[] = ["files", "photos", "notes"];
export const GROUP_APPS: readonly DockAppId[] = ["preview", "terminal", "trash"];

/* -------------------------------------------------------------- wallpaper -- */

/**
 * Pure-CSS wallpaper. The thin conic rays are what makes the boot's
 * `blur(24px) → blur(0)` legible on a gradient.
 *
 * Deliberately fixed rather than theme-reactive: the menu bar, dock tooltips
 * and icon labels are all white (as on macOS, where the wallpaper is chosen by
 * the user and does not invert with the system theme). A pale wallpaper drops
 * that chrome to ~1.8:1 contrast, and darkening one far enough to carry white
 * text just reproduces this gradient.
 */
export const WALLPAPER = [
  "repeating-conic-gradient(from 196deg at 50% 118%, rgba(255,255,255,0.045) 0deg 1.6deg, rgba(255,255,255,0) 1.6deg 7deg)",
  "radial-gradient(120% 82% at 20% 8%, #2b3d74 0%, rgba(43,61,116,0) 58%)",
  "radial-gradient(110% 88% at 82% 4%, #4a2a63 0%, rgba(74,42,99,0) 54%)",
  "radial-gradient(140% 110% at 50% 116%, #05070f 0%, rgba(5,7,15,0) 64%)",
  "linear-gradient(158deg, #1d2647 0%, #2a2350 34%, #171634 66%, #08090f 100%)",
].join(", ");

export const VEIL_GRADIENT =
  "radial-gradient(120% 90% at 50% 30%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.18) 70%, rgba(0,0,0,0.35) 100%)";
