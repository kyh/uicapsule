import { useCallback, useLayoutEffect, useRef, useState } from "react";

type UseControllableStateParams<T> = {
  prop?: T | undefined;
  defaultProp: T;
  onChange?: ((state: T) => void) | undefined;
};

/** Direct values only. This keeps callable values unambiguous. */
type SetValue<T> = (next: T) => void;

export const useControllableState = <T>({
  prop,
  defaultProp,
  onChange,
}: UseControllableStateParams<T>): [T, SetValue<T>] => {
  const [uncontrolled, setUncontrolled] = useState(defaultProp);
  const isControlled = prop !== undefined;
  const value = isControlled ? prop : uncontrolled;
  const currentRef = useRef({ prop, onChange });

  useLayoutEffect(() => {
    currentRef.current = { prop, onChange };
  }, [onChange, prop]);

  const setValue = useCallback((next: T) => {
    const current = currentRef.current;
    if (current.prop !== undefined) {
      if (next !== current.prop) current.onChange?.(next);
      return;
    }

    setUncontrolled((previous) => {
      if (next !== previous) current.onChange?.(next);
      return next;
    });
  }, []);

  return [value, setValue];
};
