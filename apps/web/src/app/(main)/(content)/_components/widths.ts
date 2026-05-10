import type { DefaultSize } from "@repo/api/content/content-schema";

export const WIDTH_BY_SIZE = {
  sm: 360,
  md: 720,
  full: 1392,
} as const satisfies Record<DefaultSize, number>;
