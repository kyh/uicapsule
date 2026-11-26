import type { ComponentType } from "react";
import { z } from "zod";

import { startPreview } from "./preview-runtime";

const bundleSchema = z.object({
  default: z.custom<ComponentType>((value) => z.function().safeParse(value).success),
});

const entry = document.querySelector('meta[name="uicapsule-entry"]')?.getAttribute("content");

if (entry !== undefined && entry !== null && entry !== "") {
  const bundle: unknown = await import(entry);
  startPreview(bundleSchema.parse(bundle).default);
}
