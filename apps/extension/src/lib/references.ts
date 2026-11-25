import { MAX_REFERENCE_LINKS } from "@repo/contract/request/request-schema";
import { z } from "zod";

export const splitLines = (value: string) =>
  value
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);

/** A reference list as the request schema wants it, or the message to show instead. */
export const parseReferences = (value: string) => {
  const lines = splitLines(value);

  if (lines.length > MAX_REFERENCE_LINKS) {
    return { error: `At most ${MAX_REFERENCE_LINKS} links`, ok: false } as const;
  }

  if (!lines.every((line) => z.url().safeParse(line).success)) {
    return { error: "One full URL per line", ok: false } as const;
  }

  return { ok: true, references: lines } as const;
};

/** Appends `url` as a reference line unless it is already there. */
export const addReference = (value: string, url: string) =>
  splitLines(value).includes(url) ? value : [...splitLines(value), url].join("\n");
