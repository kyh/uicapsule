"use client";

import type { Work } from "./formation-poses";
import { Formation } from "./formation";

const rootUrl =
  "https://zmdrwswxugswzmcokvff.supabase.co/storage/v1/object/public/uicapsule/formation";

const works: Work[] = [
  {
    title: "Vantage",
    image: `${rootUrl}/vista.jpg`,
  },
  {
    title: "Mirror",
    image: `${rootUrl}/mirror.jpg`,
  },
  {
    title: "Cosmos",
    image: `${rootUrl}/cosmos.jpg`,
  },
  {
    title: "Current",
    image: `${rootUrl}/current.jpg`,
  },
  {
    title: "Threshold",
    image: `${rootUrl}/portal.jpg`,
  },
  {
    title: "Hollow",
    image: `${rootUrl}/valley.jpg`,
  },
  {
    title: "Ascent",
    image: `${rootUrl}/ascent.jpg`,
  },
  {
    title: "Array",
    image: `${rootUrl}/array.jpg`,
  },
  {
    title: "Meridian",
    image: `${rootUrl}/giza.jpg`,
  },
  {
    title: "Rift",
    image: `${rootUrl}/rift.jpg`,
  },
  {
    title: "Overlook",
    image: `${rootUrl}/overlook.jpg`,
  },
  {
    title: "Event Horizon",
    image: `${rootUrl}/horizon.jpg`,
  },
  {
    title: "Archipelago",
    image: `${rootUrl}/archipelago.jpg`,
  },
  {
    title: "Crest",
    image: `${rootUrl}/crest.jpg`,
  },
  {
    title: "Ridge",
    image: `${rootUrl}/ridge.jpg`,
  },
  {
    title: "Fathom",
    image: `${rootUrl}/fathom.jpg`,
  },
];

const Preview = () => {
  return <Formation works={works} />;
};

export default Preview;
