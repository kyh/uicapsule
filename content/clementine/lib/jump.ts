/** Scrolls a section of the page into view, then moves focus to a control inside it. */
export const jumpTo = (id: string, focus?: string) => {
  const target = document.querySelector<HTMLElement>(`#${id}`);

  if (!target) {
    return;
  }

  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });

  if (focus) {
    target.querySelector<HTMLElement>(focus)?.focus({ preventScroll: true });
  }
};
