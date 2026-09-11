"use client";

import type { Work } from "./formation-poses";
import { Formation } from "./formation";

const rootUrl = "https://pub-327ea719340342d3a3d5c5aa7f979e3a.r2.dev/formation";

const works: Work[] = [
  {
    image: `${rootUrl}/vista.jpg`,
    title: "Vantage",
  },
  {
    image: `${rootUrl}/mirror.jpg`,
    title: "Mirror",
  },
  {
    image: `${rootUrl}/cosmos.jpg`,
    title: "Cosmos",
  },
  {
    image: `${rootUrl}/current.jpg`,
    title: "Current",
  },
  {
    image: `${rootUrl}/portal.jpg`,
    title: "Threshold",
  },
  {
    image: `${rootUrl}/valley.jpg`,
    title: "Hollow",
  },
  {
    image: `${rootUrl}/ascent.jpg`,
    title: "Ascent",
  },
  {
    image: `${rootUrl}/array.jpg`,
    title: "Array",
  },
  {
    image: `${rootUrl}/giza.jpg`,
    title: "Meridian",
  },
  {
    image: `${rootUrl}/rift.jpg`,
    title: "Rift",
  },
  {
    image: `${rootUrl}/overlook.jpg`,
    title: "Overlook",
  },
  {
    image: `${rootUrl}/horizon.jpg`,
    title: "Event Horizon",
  },
  {
    image: `${rootUrl}/archipelago.jpg`,
    title: "Archipelago",
  },
  {
    image: `${rootUrl}/crest.jpg`,
    title: "Crest",
  },
  {
    image: `${rootUrl}/ridge.jpg`,
    title: "Ridge",
  },
  {
    image: `${rootUrl}/fathom.jpg`,
    title: "Fathom",
  },
];

const Preview = () => <Formation works={works} />;

export default Preview;
