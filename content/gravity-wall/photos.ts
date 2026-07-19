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
    id: "1506905925346-21bda4d32df4",
    title: "Granite Light",
    category: "Landscape",
    aspect: 1.5,
    year: 2023,
    description:
      "Morning broke quietly above the cloud line — fifteen minutes after sunrise, before the wind picked up.",
  },
  {
    id: "1469474968028-56623f02e42e",
    title: "Far Saddle",
    category: "Landscape",
    aspect: 1.5,
    year: 2022,
    description:
      "A figure on the last outcrop, for scale. The saddle behind looked closer than it was.",
  },
  {
    id: "1518837695005-2083093ee35b",
    title: "Long Water",
    category: "Water",
    aspect: 1.5,
    year: 2021,
    description: "Open swell an hour from land — the same shape arriving forever, never twice.",
  },
  {
    id: "1441974231531-c6227db76b6e",
    title: "Cathedral",
    category: "Forest",
    aspect: 1.5,
    year: 2023,
    description: "A path between trunks two hundred years older than the path.",
  },
  {
    id: "1470071459604-3b5ec3a7fe05",
    title: "First Breath",
    category: "Landscape",
    aspect: 0.75,
    year: 2022,
    description: "Cloud came up the valley between five and six — by seven the ridge was clear.",
  },
  {
    id: "1447752875215-b2761acb3c5d",
    title: "The Crossing",
    category: "Forest",
    aspect: 1,
    year: 2024,
    description:
      "A footbridge with nothing on either side but green, and no reason at all to hurry across it.",
  },
  {
    id: "1500964757637-c85e8a162699",
    title: "Every Ridge",
    category: "Landscape",
    aspect: 1.5,
    year: 2020,
    description:
      "Ridge behind ridge behind ridge, each one a shade paler, until the sky takes over.",
  },
  {
    id: "1501785888041-af3ef285b470",
    title: "Still Passage",
    category: "Water",
    aspect: 1.5,
    year: 2023,
    description: "One boat, one wake, and water clear enough to make the depth a guess.",
  },
  {
    id: "1444080748397-f442aa95c3e5",
    title: "Old Light",
    category: "Night",
    aspect: 0.75,
    year: 2024,
    description: "Every photon that landed here had been travelling for thousands of years.",
  },
  {
    id: "1431794062232-2a99a5431c6c",
    title: "The Cut",
    category: "Landscape",
    aspect: 0.75,
    year: 2021,
    description:
      "Water found the one soft seam in the rock and spent a few million years widening it.",
  },
  {
    id: "1426604966848-d7adac402bff",
    title: "The Big Wall",
    category: "Landscape",
    aspect: 1.5,
    year: 2022,
    description: "The meadow keeps its own hours. The wall behind it keeps none at all.",
  },
  {
    id: "1490604001847-b712b0c2f967",
    title: "Blue Distance",
    category: "Landscape",
    aspect: 1.5,
    year: 2023,
    description: "Distance stacked into layers — you can count them off like rings in a stump.",
  },
  {
    id: "1505144808419-1957a94ca61e",
    title: "The Carve",
    category: "Water",
    aspect: 0.75,
    year: 2022,
    description: "From above, the break stops being a wave and becomes a drawing.",
  },
  {
    id: "1505765050516-f72dcac9c60e",
    title: "Above the Weather",
    category: "Landscape",
    aspect: 1,
    year: 2024,
    description: "The summit surfaced for about a minute, then the cloud closed over it again.",
  },
  {
    id: "1418065460487-3e41a6c84dc5",
    title: "Low Cloud",
    category: "Forest",
    aspect: 1.5,
    year: 2022,
    description:
      "Fog sitting in the trees at the height of a person, which is where fog is strangest.",
  },
  {
    id: "1502082553048-f009c37129b9",
    title: "The Only Tree",
    category: "Nature",
    aspect: 1,
    year: 2023,
    description: "Two hundred years of growing outward instead of upward, because it could.",
  },
  {
    id: "1495107334309-fcf20504a5ab",
    title: "Late Green",
    category: "Nature",
    aspect: 0.75,
    year: 2020,
    description: "Twenty minutes when the field held more light than the sky above it.",
  },
  {
    id: "1472213984618-c79aaec7fef0",
    title: "The Stair",
    category: "Landscape",
    aspect: 1,
    year: 2022,
    description: "The river comes down in steps, and the mountain behind it does the same.",
  },
  {
    id: "1480714378408-67cf0d13bc1b",
    title: "Gridlight",
    category: "Architecture",
    aspect: 1.5,
    year: 2024,
    description: "The grid catches the last of the sun and holds it, one avenue at a time.",
  },
  {
    id: "1449034446853-66c86144b0ad",
    title: "Red Span",
    category: "Architecture",
    aspect: 1.5,
    year: 2023,
    description: "Steel enough to cross a strait, painted a colour that argues with the sky.",
  },
  {
    id: "1500530855697-b586d89ba3ee",
    title: "Long Way Round",
    category: "Landscape",
    aspect: 1.5,
    year: 2024,
    description: "Nothing out here but red rock and one road that refuses to go straight.",
  },
  {
    id: "1488972685288-c3fd157d7c7a",
    title: "Fin & Shadow",
    category: "Architecture",
    aspect: 0.75,
    year: 2022,
    description: "A façade that is mostly shade — making it is the only job the building has here.",
  },
  {
    id: "1444723121867-7a241cacace9",
    title: "The Basin",
    category: "Night",
    aspect: 0.75,
    year: 2023,
    description: "A million rooms, from far enough away that they read as a single thing.",
  },
  {
    id: "1465379944081-7f47de8d74ac",
    title: "Slow Company",
    category: "Nature",
    aspect: 1,
    year: 2023,
    description:
      "They had been standing like that long before the fog, and stayed after it lifted.",
  },
  {
    id: "1499002238440-d264edd596ec",
    title: "Field of Hours",
    category: "Nature",
    aspect: 1,
    year: 2024,
    description: "Late June — every horizon the same shade of unrepeatable violet.",
  },
  {
    id: "1483728642387-6c3bdd6c93e5",
    title: "Cold Mirror",
    category: "Landscape",
    aspect: 0.75,
    year: 2023,
    description: "The water gave the mountain back, one stop darker than it was lent.",
  },
  {
    id: "1486325212027-8081e485255e",
    title: "Night Shift",
    category: "Night",
    aspect: 0.75,
    year: 2023,
    description: "Every lit window is somebody deciding not to go home just yet.",
  },
  {
    id: "1494500764479-0c8f2919a3d8",
    title: "Found Water",
    category: "Water",
    aspect: 1,
    year: 2023,
    description: "A tree that decided to grow where the lake was, and somehow won the argument.",
  },
  {
    id: "1448375240586-882707db888b",
    title: "Deep Green",
    category: "Forest",
    aspect: 1.5,
    year: 2022,
    description: "Ten metres in, the sound changes before the light does.",
  },
  {
    id: "1487958449943-2429e8be8625",
    title: "White Facets",
    category: "Architecture",
    aspect: 0.75,
    year: 2023,
    description: "Every plane set at an angle that catches a different hour of the day.",
  },
  {
    id: "1486718448742-163732cd1544",
    title: "Spiral",
    category: "Architecture",
    aspect: 0.75,
    year: 2022,
    description: "Corrugated steel bent into a curve it has no business holding.",
  },
  {
    id: "1470770841072-f978cf4d019e",
    title: "The Boathouse",
    category: "Water",
    aspect: 1.5,
    year: 2022,
    description: "Somebody's grandfather built it out over the water, and nobody has argued since.",
  },
];

const toPhoto = (seed: PhotoSeed): Photo => ({
  slug: seed.id,
  title: seed.title,
  category: seed.category,
  description: seed.description,
  aspect: seed.aspect,
  imageUrl: unsplashUrl(seed.id, seed.aspect, FULL_HEIGHT),
  thumbUrl: unsplashUrl(seed.id, seed.aspect, THUMB_HEIGHT),
  year: seed.year,
});

const [firstSeed, ...restSeeds] = PHOTO_SEEDS;

/* Typed as a non-empty tuple so `PHOTOS[0]` narrows to `Photo` under
   noUncheckedIndexedAccess without an assertion. */
export const PHOTOS: readonly [Photo, ...Photo[]] = [toPhoto(firstSeed), ...restSeeds.map(toPhoto)];
