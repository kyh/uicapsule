"use client";

import type { Work } from "./formation-poses";
import { Formation } from "./formation";

const rootUrl =
  "https://zmdrwswxugswzmcokvff.supabase.co/storage/v1/object/public/uicapsule/formation";

const works: Work[] = [
  {
    title: "Vantage",
    category: "Art Direction",
    accent: "#e8b15a",
    image: `${rootUrl}/vista.jpg`,
  },
  {
    title: "Mirror",
    category: "Installation",
    accent: "#7b9e6b",
    image: `${rootUrl}/mirror.jpg`,
  },
  {
    title: "Cosmos",
    category: "Title Sequence",
    accent: "#6f7cf0",
    image: `${rootUrl}/cosmos.jpg`,
  },
  {
    title: "Current",
    category: "Motion",
    accent: "#9b7cf0",
    image: `${rootUrl}/current.jpg`,
  },
  {
    title: "Threshold",
    category: "Concept",
    accent: "#ff9a4d",
    image: `${rootUrl}/portal.jpg`,
  },
  {
    title: "Hollow",
    category: "Photography",
    accent: "#e0a85a",
    image: `${rootUrl}/valley.jpg`,
  },
  {
    title: "Ascent",
    category: "Campaign",
    accent: "#f0b84a",
    image: `${rootUrl}/ascent.jpg`,
  },
  {
    title: "Array",
    category: "Brand Film",
    accent: "#4bb98a",
    image: `${rootUrl}/array.jpg`,
  },
  {
    title: "Meridian",
    category: "Travel",
    accent: "#d8a967",
    image: `${rootUrl}/giza.jpg`,
  },
  {
    title: "Rift",
    category: "Key Art",
    accent: "#e0503a",
    image: `${rootUrl}/rift.jpg`,
  },
  {
    title: "Overlook",
    category: "Editorial",
    accent: "#c0895a",
    image: `${rootUrl}/overlook.jpg`,
  },
  {
    title: "Event Horizon",
    category: "Title Design",
    accent: "#f0a24a",
    image: `${rootUrl}/horizon.jpg`,
  },
  {
    title: "Archipelago",
    category: "Aerial",
    accent: "#3aa0c0",
    image: `${rootUrl}/archipelago.jpg`,
  },
  {
    title: "Crest",
    category: "Concept",
    accent: "#e8a24a",
    image: `${rootUrl}/crest.jpg`,
  },
  {
    title: "Ridge",
    category: "Photography",
    accent: "#6ea35a",
    image: `${rootUrl}/ridge.jpg`,
  },
  {
    title: "Fathom",
    category: "Editorial",
    accent: "#3a7ac0",
    image: `${rootUrl}/fathom.jpg`,
  },
];

const Preview = () => {
  return <Formation works={works} />;
};

export default Preview;
