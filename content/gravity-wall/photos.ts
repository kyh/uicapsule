/* Photo metadata for the wall.
 *
 * Each seed's `id` is an Unsplash photo id; both renditions are derived from it
 * at module scope, so the component needs no CMS, no CDN and no local assets.
 * Aspects are only ever 3:4, 1:1 or 3:2 — the wall's row packing relies on that
 * narrow set to keep cell heights uniform. */

const FULL_HEIGHT = 900;
const THUMB_HEIGHT = 300;

const unsplashUrl = (id: string, aspect: number, height: number) =>
  `https://images.unsplash.com/photo-${id}?w=${Math.round(
    height * aspect,
  )}&h=${height}&fit=crop&q=80&auto=format`;

/* Portrait (3:4) < square (1:1) < landscape (3:2). */
type Aspect = 0.75 | 1 | 1.5;

interface PhotoSeed {
  id: string;
  title: string;
  category: string;
  description: string;
  aspect: Aspect;
  location: string;
  year: number;
}

export interface Photo {
  slug: string;
  title: string;
  category: string;
  description: string;
  aspect: number;
  /** Large rendition — only requested once a card is expanded. */
  imageUrl: string;
  /** Small rendition — every one of the ~500 wall cells uses this. */
  thumbUrl: string;
  location: string;
  year: number;
}

const PHOTO_SEEDS: readonly [PhotoSeed, ...PhotoSeed[]] = [
  {
    id: "1506905925346-21bda4d32df4",
    title: "Granite Light",
    category: "Landscape",
    aspect: 1.5,
    location: "French Alps",
    year: 2023,
    description:
      "Morning broke quietly over the alpine ridge — fifteen minutes after sunrise, before the wind picked up.",
  },
  {
    id: "1469474968028-56623f02e42e",
    title: "Far Saddle",
    category: "Landscape",
    aspect: 1.5,
    location: "Aiguille du Midi",
    year: 2022,
    description:
      "From the bivouac at 3,200 metres the saddle looked closer than it was — three hours' walk, easy.",
  },
  {
    id: "1518837695005-2083093ee35b",
    title: "Field of Hours",
    category: "Nature",
    aspect: 1.5,
    location: "Valensole, Provence",
    year: 2021,
    description: "Provence in late June — every horizon was the same shade of unrepeatable violet.",
  },
  {
    id: "1441974231531-c6227db76b6e",
    title: "October",
    category: "Landscape",
    aspect: 1.5,
    location: "Aspen, Colorado",
    year: 2023,
    description: "The aspens held their breath for one afternoon, then let it go all at once.",
  },
  {
    id: "1470071459604-3b5ec3a7fe05",
    title: "First Breath",
    category: "Landscape",
    aspect: 0.75,
    location: "Big Sur, California",
    year: 2022,
    description:
      "Coastal fog crept up the valley between five and six — by seven the trees were still again.",
  },
  {
    id: "1447752875215-b2761acb3c5d",
    title: "A Slow Window",
    category: "Landscape",
    aspect: 1,
    location: "British Columbia",
    year: 2024,
    description:
      "Sunlight angled through the cedars for maybe twenty minutes a day in November — this was eight of them.",
  },
  {
    id: "1500964757637-c85e8a162699",
    title: "Last Pier",
    category: "Landscape",
    aspect: 1.5,
    location: "Burleigh Heads, AU",
    year: 2020,
    description:
      "The old timber pier has been condemned for years. The sunsets don't seem to mind.",
  },
  {
    id: "1501785888041-af3ef285b470",
    title: "Honey Hour",
    category: "Landscape",
    aspect: 1.5,
    location: "Val d'Orcia, Tuscany",
    year: 2023,
    description: "The valley filled like a cup, slowly, with light the colour of pulled honey.",
  },
  {
    id: "1444080748397-f442aa95c3e5",
    title: "Silver Bones",
    category: "Nature",
    aspect: 0.75,
    location: "Hokkaido, Japan",
    year: 2024,
    description:
      "A birch grove in February — every trunk a struck match, every shadow a perfect parallel.",
  },
  {
    id: "1431794062232-2a99a5431c6c",
    title: "Quiet Walk",
    category: "Nature",
    aspect: 0.75,
    location: "Muir Woods, California",
    year: 2021,
    description:
      "The trail through the redwoods — when you stop walking, the silence becomes its own thing.",
  },
  {
    id: "1426604966848-d7adac402bff",
    title: "Iron Coast",
    category: "Landscape",
    aspect: 1.5,
    location: "Reynisfjara, Iceland",
    year: 2022,
    description:
      "The northern Atlantic doesn't visit gently. The rocks have been negotiating with it for a hundred million years.",
  },
  {
    id: "1490604001847-b712b0c2f967",
    title: "Field of Old Light",
    category: "Night",
    aspect: 1.5,
    location: "Atacama, Chile",
    year: 2023,
    description:
      "October new moon — every photon that landed had been travelling for thousands of years.",
  },
  {
    id: "1505144808419-1957a94ca61e",
    title: "The Carve",
    category: "Landscape",
    aspect: 0.75,
    location: "Antelope Canyon, Arizona",
    year: 2022,
    description:
      "A river cut this with patience. The walls keep score in red and rust and amber bands.",
  },
  {
    id: "1505765050516-f72dcac9c60e",
    title: "Equatorial Calm",
    category: "Travel",
    aspect: 1,
    location: "Bora Bora",
    year: 2024,
    description:
      "Late afternoon in the leeward Pacific — the palm fronds rasp like newspaper in a slow wind.",
  },
  {
    id: "1418065460487-3e41a6c84dc5",
    title: "Red Patience",
    category: "Landscape",
    aspect: 1.5,
    location: "Sossusvlei, Namibia",
    year: 2022,
    description:
      "The Namib at first light — the dunes look painted, but they move five centimetres a year.",
  },
  {
    id: "1502082553048-f009c37129b9",
    title: "After the Rain",
    category: "Nature",
    aspect: 1,
    location: "Cotswolds, England",
    year: 2023,
    description: "Twenty minutes after a brief shower — the petals held more light than the sky.",
  },
  {
    id: "1495107334309-fcf20504a5ab",
    title: "Glass Geometry",
    category: "Architecture",
    aspect: 0.75,
    location: "Berlin, Germany",
    year: 2020,
    description:
      "A façade from the late 1960s, photographed in winter sun — the geometry hadn't aged a day.",
  },
  {
    id: "1472213984618-c79aaec7fef0",
    title: "Russet Hour",
    category: "Landscape",
    aspect: 1,
    location: "Catskills, New York",
    year: 2022,
    description: "Late October in the Catskills — the air smelt like apple cider and stone.",
  },
  {
    id: "1480714378408-67cf0d13bc1b",
    title: "Held Sky",
    category: "Landscape",
    aspect: 1.5,
    location: "Moraine Lake, Banff",
    year: 2024,
    description:
      "Calm enough that the lake doubled the mountain — for about ninety seconds, before a fish broke the spell.",
  },
  {
    id: "1449034446853-66c86144b0ad",
    title: "Weather Bringing",
    category: "Sky",
    aspect: 1.5,
    location: "Isle of Skye, Scotland",
    year: 2023,
    description:
      "The first front of October pushing south — twenty-six minutes before the rain arrived.",
  },
  {
    id: "1500530855697-b586d89ba3ee",
    title: "Cold Country",
    category: "Landscape",
    aspect: 1.5,
    location: "Torres del Paine",
    year: 2024,
    description:
      "Above the treeline, sixty kilometres from the nearest road, an hour before the wind started moving.",
  },
  {
    id: "1488972685288-c3fd157d7c7a",
    title: "White Memory",
    category: "Architecture",
    aspect: 0.75,
    location: "Cádiz, Andalusia",
    year: 2022,
    description: "A modernist house on the coast — built in 1962, repainted every spring since.",
  },
  {
    id: "1444723121867-7a241cacace9",
    title: "Spire",
    category: "Landscape",
    aspect: 0.75,
    location: "Chamonix, France",
    year: 2023,
    description:
      "An aiguille in the Mont Blanc massif — climbed in 1881, photographed at sunrise on a clearer Tuesday.",
  },
  {
    id: "1465379944081-7f47de8d74ac",
    title: "Painted Strand",
    category: "Travel",
    aspect: 1,
    location: "Algarve, Portugal",
    year: 2023,
    description:
      "A beach hut repainted in slightly different colours every summer, by the same family, for sixty years.",
  },
  {
    id: "1499002238440-d264edd596ec",
    title: "A Brief Pink",
    category: "Still Life",
    aspect: 1,
    location: "Studio",
    year: 2024,
    description:
      "Peonies last about three days indoors. This one lasted ten minutes — long enough.",
  },
  {
    id: "1483728642387-6c3bdd6c93e5",
    title: "Stand of Pines",
    category: "Nature",
    aspect: 0.75,
    location: "Black Forest, Germany",
    year: 2023,
    description:
      "A grove on the ridge — straight as a question mark, every one of them the same age.",
  },
  {
    id: "1486325212027-8081e485255e",
    title: "Soft Modern",
    category: "Architecture",
    aspect: 0.75,
    location: "Lisbon, Portugal",
    year: 2023,
    description:
      "A residential block, late afternoon — the pink picking up the sky's pink, and giving it back.",
  },
  {
    id: "1494500764479-0c8f2919a3d8",
    title: "Found Water",
    category: "Nature",
    aspect: 1,
    location: "Pyrenees",
    year: 2023,
    description:
      "A pool nobody mapped — the trail walked past it twice before noticing it was there at all.",
  },
  {
    id: "1448375240586-882707db888b",
    title: "Stone & Sky",
    category: "Landscape",
    aspect: 1.5,
    location: "Dolomites, Italy",
    year: 2022,
    description:
      "Above the cloud layer at sunrise — the kind of view that doesn't repeat in a season.",
  },
  {
    id: "1487958449943-2429e8be8625",
    title: "Steel & Sun",
    category: "Architecture",
    aspect: 0.75,
    location: "Chicago",
    year: 2023,
    description:
      "A late-modernist office block, photographed in winter at the moment the sun crosses the corner.",
  },
  {
    id: "1486718448742-163732cd1544",
    title: "Spiral",
    category: "Architecture",
    aspect: 0.75,
    location: "Vienna",
    year: 2022,
    description:
      "A staircase in a museum addition, designed by an architect known for exactly one good idea.",
  },
  {
    id: "1470770841072-f978cf4d019e",
    title: "Drift Country",
    category: "Landscape",
    aspect: 1.5,
    location: "Utah",
    year: 2022,
    description:
      "Twilight over the high desert — the sky goes through every colour it knows in twelve minutes.",
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
  location: seed.location,
  year: seed.year,
});

const [firstSeed, ...restSeeds] = PHOTO_SEEDS;

/* Typed as a non-empty tuple so `PHOTOS[0]` narrows to `Photo` under
   noUncheckedIndexedAccess without an assertion. */
export const PHOTOS: readonly [Photo, ...Photo[]] = [toPhoto(firstSeed), ...restSeeds.map(toPhoto)];
