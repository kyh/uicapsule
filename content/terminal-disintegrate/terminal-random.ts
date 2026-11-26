import { or, shiftRight, toUint32, xor } from "./terminal-uint32";

/** A seeded mulberry32 generator: the same seed gives the same sequence of numbers in [0, 1). */
export const seededRng = (seed: number) => {
  let s = toUint32(seed) === 0 ? 1 : toUint32(seed);

  return () => {
    s = toUint32(s + 0x6d_2b_79_f5);
    let t = Math.imul(xor(s, shiftRight(s, 15)), or(s, 1));
    t = xor(t, t + Math.imul(xor(t, shiftRight(t, 7)), or(t, 61)));

    return xor(t, shiftRight(t, 14)) / 4_294_967_296;
  };
};
