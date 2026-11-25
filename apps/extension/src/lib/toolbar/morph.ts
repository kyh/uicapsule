import { h } from "./dom";

const STAGGER_MS = 35;
const DURATION_MS = 180;
const RESIZE_MS = 240;

const characters = (text: string, className: string) =>
  h(
    "span",
    { "aria-hidden": "true", class: className },
    [...text].map((char, index) => {
      const span = h("span", { class: "ch" }, [char]);
      span.style.setProperty("--i", String(index));

      return span;
    }),
  );

const sharedEnds = (previous: string, next: string) => {
  let start = 0;

  while (start < previous.length && start < next.length && previous[start] === next[start]) {
    start += 1;
  }

  let end = 0;

  while (
    end < previous.length - start &&
    end < next.length - start &&
    previous.at(-1 - end) === next.at(-1 - end)
  ) {
    end += 1;
  }

  return { end, start };
};

const timers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

/** Swaps a label letter by letter: the changed middle blurs out upward while the new one rises in. */
export const morphText = (element: HTMLElement, next: string) => {
  const previous = element.dataset.text ?? element.textContent ?? "";

  if (previous === next) {
    return;
  }

  element.dataset.text = next;
  clearTimeout(timers.get(element));

  const { end, start } = sharedEnds(previous, next);
  const oldPart = characters(previous.slice(start, previous.length - end), "morph-old");
  const newPart = characters(next.slice(start, next.length - end), "morph-new");
  const swap = h("span", { class: "morph-swap" }, [oldPart, newPart]);

  element.replaceChildren(next.slice(0, start), swap, next.slice(next.length - end));
  swap.style.width = `${oldPart.getBoundingClientRect().width}px`;
  swap.getBoundingClientRect();
  swap.classList.add("is-morphing");
  swap.style.width = `${newPart.getBoundingClientRect().width}px`;

  const changed = Math.max(previous.length, next.length) - start - end;
  const total = Math.max(DURATION_MS + STAGGER_MS * Math.max(changed - 1, 0), RESIZE_MS);

  timers.set(
    element,
    setTimeout(() => {
      element.textContent = next;
    }, total + 40),
  );
};
