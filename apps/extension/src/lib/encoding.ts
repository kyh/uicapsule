import type { Encoded } from "./messages";

const CHUNK = 0x80_00;

/** A blob as base64, so it can cross extension messaging, which carries JSON only. */
export const encodeBlob = async (blob: Blob, name: string) => {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const parts: string[] = [];

  for (let start = 0; start < bytes.length; start += CHUNK) {
    parts.push(String.fromCodePoint(...bytes.subarray(start, start + CHUNK)));
  }

  return { base64: btoa(parts.join("")), name, type: blob.type } satisfies Encoded;
};

export const decodeFile = ({ base64, name, type }: Encoded) =>
  new File([Uint8Array.from(atob(base64), (char) => char.codePointAt(0) ?? 0)], name, { type });
