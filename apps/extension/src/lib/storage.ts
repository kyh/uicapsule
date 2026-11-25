export const DEFAULT_SERVICE_URL = import.meta.env.DEV
  ? "http://localhost:3000"
  : "https://www.uicapsule.com";

export const serviceUrlItem = storage.defineItem<string>("local:serviceUrl", {
  fallback: DEFAULT_SERVICE_URL,
});

export const creditItem = storage.defineItem<{ name: string; url: string }>("local:credit", {
  fallback: { name: "", url: "" },
});

export const preferencesItem = storage.defineItem<{ html: boolean; video: boolean }>(
  "local:preferences",
  { fallback: { html: true, video: true } },
);
