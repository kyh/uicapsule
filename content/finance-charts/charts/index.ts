import type { ChartEntry } from "./entry";
import { GROUP_1 } from "./group-1";
import { GROUP_2 } from "./group-2";
import { GROUP_3 } from "./group-3";
import { GROUP_4 } from "./group-4";
import { GROUP_5 } from "./group-5";
import { GROUP_6 } from "./group-6";
import { GROUP_7 } from "./group-7";
import { TotalValue } from "./total-value";

/** Page order of the source kit. */
export const CHARTS: ChartEntry[] = [
  { Chart: TotalValue, id: "total-value" },
  ...GROUP_1,
  ...GROUP_2,
  ...GROUP_3,
  ...GROUP_4,
  ...GROUP_5,
  ...GROUP_6,
  ...GROUP_7,
];
