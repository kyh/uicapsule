import { AntiSlopFoundation } from "./anti-slop";
import { ColorFoundation } from "./color";
import { IconFoundation } from "./icons";
import { MotionFoundation } from "./motion";
import { RadiusFoundation, SpaceFoundation } from "./shape";
import { BordersFoundation, ElevationFoundation } from "./surface";
import { TypeFoundation } from "./type";

export const FOUNDATIONS = [
  { Component: ColorFoundation, id: "color", title: "Color" },
  { Component: TypeFoundation, id: "typography", title: "Typography" },
  { Component: SpaceFoundation, id: "space", title: "Space" },
  { Component: RadiusFoundation, id: "radius", title: "Radius" },
  { Component: BordersFoundation, id: "borders", title: "Borders and lines" },
  { Component: ElevationFoundation, id: "elevation", title: "Elevation" },
  { Component: MotionFoundation, id: "motion", title: "Motion" },
  { Component: IconFoundation, id: "iconography", title: "Iconography" },
  { Component: AntiSlopFoundation, id: "anti-slop", title: "Anti-slop" },
] as const;
