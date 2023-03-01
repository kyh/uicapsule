"use client";

import React from "react";
import useSingletonHotkey from "./_private/useSingletonHotkeys";

const useHotkeys = <Element extends HTMLElement>(
  hotkeys: Record<string, ((e: KeyboardEvent) => void) | null>,
  deps: unknown[] = []
) => {
  const context = useSingletonHotkey();
  const { addHotkeys } = context;
  const elementRef = React.useRef<Element | null>(null);
  const normalizedHotkeys = typeof hotkeys === "string" ? [hotkeys] : hotkeys;

  React.useEffect(() => {
    const remove = addHotkeys(hotkeys, { ref: elementRef });

    return () => {
      remove?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addHotkeys, normalizedHotkeys.toString(), ...deps]);

  return { ref: elementRef, checkHotkeyState: context.isPressed };
};

export default useHotkeys;
