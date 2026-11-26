const WORD = 4_294_967_296;

/** The number's unsigned 32-bit wrap, as `x >>> 0` gives it. */
export const toUint32 = (x: number) => {
  if (!Number.isFinite(x)) {
    return 0;
  }

  const wrapped = Math.trunc(x) % WORD;

  return wrapped < 0 ? wrapped + WORD : wrapped + 0;
};

/** `x >>> bits`, for bits from 0 to 31. */
export const shiftRight = (x: number, bits: number) => Math.floor(toUint32(x) / 2 ** bits);

const bitByBit = (a: number, b: number, bit: (x: number, y: number) => number) => {
  let x = toUint32(a);
  let y = toUint32(b);
  let out = 0;

  for (let place = 1; place < WORD; place *= 2) {
    out += bit(x % 2, y % 2) * place;
    x = Math.floor(x / 2);
    y = Math.floor(y / 2);
  }

  return out;
};

/** `(a ^ b) >>> 0`. */
export const xor = (a: number, b: number) => bitByBit(a, b, (x, y) => (x === y ? 0 : 1));

/** `(a | b) >>> 0`. */
export const or = (a: number, b: number) => bitByBit(a, b, (x, y) => Math.max(x, y));
