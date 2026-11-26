import { useEffect } from "react";
import type { RefObject } from "react";

const noop = () => null;

export type DismissReason = "escape" | "outside";

/** Closes a popup on Escape or on a press outside the given elements, and says which it was. */
export const useDismiss = (
  open: boolean,
  onClose: (reason: DismissReason) => void,
  refs: RefObject<HTMLElement | null>[],
) => {
  useEffect(() => {
    if (!open) {
      return noop;
    }

    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;

      if (refs.every((ref) => ref.current?.contains(target) !== true)) {
        onClose("outside");
      }
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose("escape");
      }
    };

    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, refs]);
};
