export type Rgba = readonly [number, number, number, number];

const toLinear = (channel: number) => {
  const value = channel / 255;

  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

export const luminance = ([red, green, blue]: Rgba) =>
  0.2126 * toLinear(red) + 0.7152 * toLinear(green) + 0.0722 * toLinear(blue);

export const contrastRatio = (foreground: Rgba, background: Rgba) => {
  const a = luminance(foreground);
  const b = luminance(background);

  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

let canvasContext: CanvasRenderingContext2D | null = null;

const getContext = () => {
  if (!canvasContext) {
    const canvas = document.createElement("canvas");

    canvas.width = 1;
    canvas.height = 1;
    canvasContext = canvas.getContext("2d", { willReadFrequently: true });
  }

  return canvasContext;
};

/** Paints `color` over `ground` on a 1px canvas and returns the composited sRGB pixel. */
export const paint = (color: string, ground = "white") => {
  const context = getContext();

  if (!context) {
    return null;
  }

  context.clearRect(0, 0, 1, 1);
  context.fillStyle = ground;
  context.fillRect(0, 0, 1, 1);
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);

  const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;
  const pixel: Rgba = [red, green, blue, 1];

  return pixel;
};

const D50_WHITE = [0.96422, 1, 0.82521] as const;

const multiply = (matrix: readonly (readonly number[])[], vector: readonly number[]) =>
  matrix.map((row) => row.reduce((sum, cell, index) => sum + cell * (vector[index] ?? 0), 0));

const D50_TO_D65 = [
  [0.955473421488075, -0.02309845494876471, 0.06325924320057072],
  [-0.0283697093338637, 1.0099953980813041, 0.021041441191917323],
  [0.012314014864481998, -0.020507649298898964, 1.330365926242124],
];

const XYZ_TO_LMS = [
  [0.8189330101, 0.3618667424, -0.1288597137],
  [0.0329845436, 0.9293118715, 0.0361456387],
  [0.0482003018, 0.2643662691, 0.633851707],
];

const LMS_TO_OKLAB = [
  [0.2104542553, 0.793617785, -0.0040720468],
  [1.9779984951, -2.428592205, 0.4505937099],
  [0.0259040371, 0.7827717662, -0.808675766],
];

const EPSILON = 216 / 24_389;
const KAPPA = 24_389 / 27;

const fromLab = (lightness: number, a: number, b: number) => {
  const fy = (lightness + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;
  const cube = (f: number) => (f ** 3 > EPSILON ? f ** 3 : (116 * f - 16) / KAPPA);
  const y = lightness > KAPPA * EPSILON ? fy ** 3 : lightness / KAPPA;
  const xyz = [cube(fx) * D50_WHITE[0], y, cube(fz) * D50_WHITE[2]];
  const lms = multiply(XYZ_TO_LMS, multiply(D50_TO_D65, xyz)).map(Math.cbrt);
  const [ok = 0, okA = 0, okB = 0] = multiply(LMS_TO_OKLAB, lms);
  const chroma = Math.hypot(okA, okB);
  const hue = (Math.atan2(okB, okA) * 180) / Math.PI;

  return [ok, chroma, hue < 0 ? hue + 360 : hue] as const;
};

const trim = (value: number, digits: number) =>
  Number(value.toFixed(digits)).toString().replace(/^0\./u, ".");

/** Writes a computed `lab()` color as the `oklch()` the token was authored in; other values pass through. */
export const toOklch = (value: string) => {
  const groups =
    /^lab\(\s*(?<l>[\d.-]+)%?\s+(?<a>[\d.-]+)\s+(?<b>[\d.-]+)\s*(?:\/\s*(?<alpha>[\d.]+%?))?\s*\)$/u.exec(
      value,
    )?.groups;

  if (!groups) {
    return value;
  }

  const [lightness, chroma, hue] = fromLab(Number(groups.l), Number(groups.a), Number(groups.b));
  const { alpha } = groups;
  const tail = alpha === undefined ? "" : ` / ${alpha}`;

  return `oklch(${trim(lightness, 3)} ${trim(chroma, 3)} ${Math.round(hue)}${tail})`;
};
