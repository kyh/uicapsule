import type { ComponentType } from "react";

import { startPreview } from "./preview-runtime";

const entry = document.querySelector('meta[name="uicapsule-entry"]')?.getAttribute("content");

if (entry) {
  const bundle: { default: ComponentType } = await import(entry);
  startPreview(bundle.default);
}
