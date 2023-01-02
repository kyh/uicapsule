export const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error(`Invalid hex value: ${hex}`);

  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
};

export const hexToRgbString = (hex: string) => {
  const rgb = hexToRgb(hex);

  return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
};

export const getOnColor = (bg: string) => {
  const { r, g, b } = hexToRgb(bg);
  return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? "#000" : "#fff";
};
