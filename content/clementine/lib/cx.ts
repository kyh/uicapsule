/** Joins class names, skipping empty ones. */
export const cx = (...names: (string | false | null | undefined)[]) =>
  names.filter(Boolean).join(" ");
