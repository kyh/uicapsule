import { z } from "zod";

import { startPreview } from "./preview-runtime";

type PreviewModule = Parameters<typeof startPreview>[0];

const bundleSchema = z.object({
  controls: z.unknown().optional(),
  default: z.custom<PreviewModule["default"]>((value) => z.function().safeParse(value).success),
});

const entry = document.querySelector('meta[name="uicapsule-entry"]')?.getAttribute("content");

if (entry !== undefined && entry !== null && entry !== "") {
  const bundle: unknown = await import(entry);
  startPreview(bundleSchema.parse(bundle));
}
