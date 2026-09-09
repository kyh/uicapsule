/* Photo metadata for the wall.
 *
 * Each seed's `id` is an Unsplash photo id; both renditions are derived from it
 * at module scope, so the component needs no CMS, no CDN and no local assets.
 * Aspects are only ever 3:4, 1:1 or 3:2 — the wall's row packing relies on that
 * narrow set to keep cell heights uniform.
 *
 * Title, category and description describe what is actually in the frame. They
 * deliberately make no claim about *where* a photo was taken: the ids are stock
 * images, so any place name would be invented, and an invented place name that
 * contradicts the picture reads as a bug. `year` is flavour, not a claim. */

const FULL_HEIGHT = 900;
const THUMB_HEIGHT = 300;

const unsplashUrl = (id: string, aspect: number, height: number) =>
  `https://images.unsplash.com/photo-${id}?w=${Math.round(
    height * aspect,
  )}&h=${height}&fit=crop&q=80&auto=format`;

/* Portrait (3:4) < square (1:1) < landscape (3:2). */
type Aspect = 0.75 | 1 | 1.5;

/* Closed set, so a typo can't mint a one-off category that appears exactly
   once in the deck. */
type Category = "Landscape" | "Nature" | "Forest" | "Water" | "Night" | "Architecture";

interface PhotoSeed {
  id: string;
  title: string;
  category: Category;
  description: string;
  aspect: Aspect;
  year: number;
}

export interface Photo {
  slug: string;
  title: string;
  category: Category;
  description: string;
  aspect: number;
  /** Large rendition — only requested once a card is expanded. */
  imageUrl: string;
  /** Small rendition — every one of the ~500 wall cells uses this. */
  thumbUrl: string;
  year: number;
}

const PHOTO_SEEDS: readonly [PhotoSeed, ...PhotoSeed[]] = [
  {
    aspect: 1.5,
    category: "Landscape",
    description:
      "Morning broke quietly above the cloud line — fifteen minutes after sunrise, before the wind picked up.",
    id: "1506905925346-21bda4d32df4",
    title: "Granite Light",
    year: 2023,
  },
  {
    aspect: 1.5,
    category: "Landscape",
    description:
      "A figure on the last outcrop, for scale. The saddle behind looked closer than it was.",
    id: "1469474968028-56623f02e42e",
    title: "Far Saddle",
    year: 2022,
  },
  {
    aspect: 1.5,
    category: "Water",
    description: "Open swell an hour from land — the same shape arriving forever, never twice.",
    id: "1518837695005-2083093ee35b",
    title: "Long Water",
    year: 2021,
  },
  {
    aspect: 1.5,
    category: "Forest",
    description: "A path between trunks two hundred years older than the path.",
    id: "1441974231531-c6227db76b6e",
    title: "Cathedral",
    year: 2023,
  },
  {
    aspect: 0.75,
    category: "Landscape",
    description: "Cloud came up the valley between five and six — by seven the ridge was clear.",
    id: "1470071459604-3b5ec3a7fe05",
    title: "First Breath",
    year: 2022,
  },
  {
    aspect: 1,
    category: "Forest",
    description:
      "A footbridge with nothing on either side but green, and no reason at all to hurry across it.",
    id: "1447752875215-b2761acb3c5d",
    title: "The Crossing",
    year: 2024,
  },
  {
    aspect: 1.5,
    category: "Landscape",
    description:
      "Ridge behind ridge behind ridge, each one a shade paler, until the sky takes over.",
    id: "1500964757637-c85e8a162699",
    title: "Every Ridge",
    year: 2020,
  },
  {
    aspect: 1.5,
    category: "Water",
    description: "One boat, one wake, and water clear enough to make the depth a guess.",
    id: "1501785888041-af3ef285b470",
    title: "Still Passage",
    year: 2023,
  },
  {
    aspect: 0.75,
    category: "Night",
    description: "Every photon that landed here had been travelling for thousands of years.",
    id: "1444080748397-f442aa95c3e5",
    title: "Old Light",
    year: 2024,
  },
  {
    aspect: 0.75,
    category: "Landscape",
    description:
      "Water found the one soft seam in the rock and spent a few million years widening it.",
    id: "1431794062232-2a99a5431c6c",
    title: "The Cut",
    year: 2021,
  },
  {
    aspect: 1.5,
    category: "Landscape",
    description: "The meadow keeps its own hours. The wall behind it keeps none at all.",
    id: "1426604966848-d7adac402bff",
    title: "The Big Wall",
    year: 2022,
  },
  {
    aspect: 1.5,
    category: "Landscape",
    description: "Distance stacked into layers — you can count them off like rings in a stump.",
    id: "1490604001847-b712b0c2f967",
    title: "Blue Distance",
    year: 2023,
  },
  {
    aspect: 0.75,
    category: "Water",
    description: "From above, the break stops being a wave and becomes a drawing.",
    id: "1505144808419-1957a94ca61e",
    title: "The Carve",
    year: 2022,
  },
  {
    aspect: 1,
    category: "Landscape",
    description: "The summit surfaced for about a minute, then the cloud closed over it again.",
    id: "1505765050516-f72dcac9c60e",
    title: "Above the Weather",
    year: 2024,
  },
  {
    aspect: 1.5,
    category: "Forest",
    description:
      "Fog sitting in the trees at the height of a person, which is where fog is strangest.",
    id: "1418065460487-3e41a6c84dc5",
    title: "Low Cloud",
    year: 2022,
  },
  {
    aspect: 1,
    category: "Nature",
    description: "Two hundred years of growing outward instead of upward, because it could.",
    id: "1502082553048-f009c37129b9",
    title: "The Only Tree",
    year: 2023,
  },
  {
    aspect: 0.75,
    category: "Nature",
    description: "Twenty minutes when the field held more light than the sky above it.",
    id: "1495107334309-fcf20504a5ab",
    title: "Late Green",
    year: 2020,
  },
  {
    aspect: 1,
    category: "Landscape",
    description: "The river comes down in steps, and the mountain behind it does the same.",
    id: "1472213984618-c79aaec7fef0",
    title: "The Stair",
    year: 2022,
  },
  {
    aspect: 1.5,
    category: "Architecture",
    description: "The grid catches the last of the sun and holds it, one avenue at a time.",
    id: "1480714378408-67cf0d13bc1b",
    title: "Gridlight",
    year: 2024,
  },
  {
    aspect: 1.5,
    category: "Architecture",
    description: "Steel enough to cross a strait, painted a colour that argues with the sky.",
    id: "1449034446853-66c86144b0ad",
    title: "Red Span",
    year: 2023,
  },
  {
    aspect: 1.5,
    category: "Landscape",
    description: "Nothing out here but red rock and one road that refuses to go straight.",
    id: "1500530855697-b586d89ba3ee",
    title: "Long Way Round",
    year: 2024,
  },
  {
    aspect: 0.75,
    category: "Architecture",
    description: "A façade that is mostly shade — making it is the only job the building has here.",
    id: "1488972685288-c3fd157d7c7a",
    title: "Fin & Shadow",
    year: 2022,
  },
  {
    aspect: 0.75,
    category: "Night",
    description: "A million rooms, from far enough away that they read as a single thing.",
    id: "1444723121867-7a241cacace9",
    title: "The Basin",
    year: 2023,
  },
  {
    aspect: 1,
    category: "Nature",
    description:
      "They had been standing like that long before the fog, and stayed after it lifted.",
    id: "1465379944081-7f47de8d74ac",
    title: "Slow Company",
    year: 2023,
  },
  {
    aspect: 1,
    category: "Nature",
    description: "Late June — every horizon the same shade of unrepeatable violet.",
    id: "1499002238440-d264edd596ec",
    title: "Field of Hours",
    year: 2024,
  },
  {
    aspect: 0.75,
    category: "Landscape",
    description: "The water gave the mountain back, one stop darker than it was lent.",
    id: "1483728642387-6c3bdd6c93e5",
    title: "Cold Mirror",
    year: 2023,
  },
  {
    aspect: 0.75,
    category: "Night",
    description: "Every lit window is somebody deciding not to go home just yet.",
    id: "1486325212027-8081e485255e",
    title: "Night Shift",
    year: 2023,
  },
  {
    aspect: 1,
    category: "Water",
    description: "A tree that decided to grow where the lake was, and somehow won the argument.",
    id: "1494500764479-0c8f2919a3d8",
    title: "Found Water",
    year: 2023,
  },
  {
    aspect: 1.5,
    category: "Forest",
    description: "Ten metres in, the sound changes before the light does.",
    id: "1448375240586-882707db888b",
    title: "Deep Green",
    year: 2022,
  },
  {
    aspect: 0.75,
    category: "Architecture",
    description: "Every plane set at an angle that catches a different hour of the day.",
    id: "1487958449943-2429e8be8625",
    title: "White Facets",
    year: 2023,
  },
  {
    aspect: 0.75,
    category: "Architecture",
    description: "Corrugated steel bent into a curve it has no business holding.",
    id: "1486718448742-163732cd1544",
    title: "Spiral",
    year: 2022,
  },
  {
    aspect: 1.5,
    category: "Water",
    description: "Somebody's grandfather built it out over the water, and nobody has argued since.",
    id: "1470770841072-f978cf4d019e",
    title: "The Boathouse",
    year: 2022,
  },
];

const toPhoto = (seed: PhotoSeed): Photo => ({
  aspect: seed.aspect,
  category: seed.category,
  description: seed.description,
  imageUrl: unsplashUrl(seed.id, seed.aspect, FULL_HEIGHT),
  slug: seed.id,
  thumbUrl: unsplashUrl(seed.id, seed.aspect, THUMB_HEIGHT),
  title: seed.title,
  year: seed.year,
});

const [firstSeed, ...restSeeds] = PHOTO_SEEDS;

/* Typed as a non-empty tuple so `PHOTOS[0]` narrows to `Photo` under
   noUncheckedIndexedAccess without an assertion. */
export const PHOTOS: readonly [Photo, ...Photo[]] = [toPhoto(firstSeed), ...restSeeds.map(toPhoto)];
