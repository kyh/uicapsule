/** Parses `#rgb` or `#rrggbb` into 0–255 channels; null for anything else. */
export const parseHex = (value: string) => {
  const clean = value.trim().replace("#", "").toLowerCase();

  const full =
    clean.length === 3
      ? Array.from(clean, (digit) => `${digit}${digit}`).join("")
      : clean.slice(0, 6);

  if (!/^[0-9a-f]{6}$/u.test(full)) {
    return null;
  }

  return [0, 2, 4].map((start) => Number.parseInt(full.slice(start, start + 2), 16));
};

const toHex = (rgb: readonly number[]) =>
  `#${rgb.map((channel) => Math.round(channel).toString(16).padStart(2, "0")).join("")}`;

/** Moves `from` toward `to` by `amount` (0–1) in sRGB; returns `from` unchanged if either is not hex. */
export const mixHex = (from: string, to: string, amount: number) => {
  const a = parseHex(from);
  const b = parseHex(to);

  if (!a || !b) {
    return from;
  }

  return toHex(a.map((channel, index) => channel + ((b[index] ?? channel) - channel) * amount));
};

/** Writes a hex color as `rgb(r g b / alpha)`. */
export const withAlpha = (hex: string, alpha: number) => {
  const [r = 0, g = 0, b = 0] = parseHex(hex) ?? [];

  return `rgb(${String(r)} ${String(g)} ${String(b)} / ${String(alpha)})`;
};
