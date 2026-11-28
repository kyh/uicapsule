import { useEffect, useReducer, useState } from "react";

import { emptyHistory, reduceAnnotations } from "./annotations";

/** Whether a key event comes from a text field, where the inspector's shortcuts must not fire. */
export const isTyping = (event: KeyboardEvent) => {
  const [target] = event.composedPath();

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
};

/**
 * The annotations drawn over the page, with undo history and the one that is selected. While
 * `keys` is on, ⌘Z / ⌘⇧Z undo and redo, and Delete or Backspace removes the selected annotation.
 */
export const useAnnotations = (keys: boolean) => {
  const [history, dispatch] = useReducer(reduceAnnotations, emptyHistory);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!keys || isTyping(event)) {
        return;
      }

      const command = event.metaKey || event.ctrlKey;

      if (command && event.key.toLowerCase() === "z") {
        dispatch({ type: event.shiftKey ? "redo" : "undo" });
      } else if ((event.key === "Backspace" || event.key === "Delete") && selectedId !== null) {
        dispatch({ id: selectedId, type: "remove" });
        setSelectedId(null);
      } else {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    };

    window.addEventListener("keydown", onKey, { capture: true });

    return () => {
      window.removeEventListener("keydown", onKey, { capture: true });
    };
  }, [keys, selectedId]);

  return {
    annotations: history.present,
    dispatch,
    selectedId,
    setSelectedId,
  };
};

export type AnnotationsState = ReturnType<typeof useAnnotations>;
