/** Blob keys `previous` referenced that `current` no longer does, deduplicated, in `previous` order. */
export const unreferencedKeys = (previous: readonly string[], current: readonly string[]) => {
  const live = new Set(current);

  return [...new Set(previous)].filter((key) => !live.has(key));
};
