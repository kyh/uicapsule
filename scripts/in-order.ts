/** Runs `step` over `items` one at a time, each after the previous one settles, in order. */
export const inOrder = async <T>(
  items: readonly T[],
  step: (item: T, index: number) => Promise<void>,
) => {
  const entries = items.entries();

  const drain: () => Promise<void> = async () => {
    const next = entries.next();

    if (next.done === true) {
      return;
    }

    const [index, item] = next.value;
    await step(item, index);
    await drain();
  };

  await drain();
};
