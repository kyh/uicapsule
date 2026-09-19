import { useCallback, useLayoutEffect, useRef, useState } from "react";

interface UseControllableStateParams<T> {
  prop?: T | undefined;
  defaultProp: T;
  onChange?: ((state: T) => void) | undefined;
}

/** Direct values only. This keeps callable values unambiguous. */
type SetValue<T> = (next: T) => void;

export const useControllableState = <T>({
  prop,
  defaultProp,
  onChange,
}: UseControllableStateParams<T>): [T, SetValue<T>] => {
  const [uncontrolled, setUncontrolled] = useState(() => defaultProp);
  const isControlled = prop !== undefined;
  const value = isControlled ? prop : uncontrolled;
  const currentRef = useRef({ isControlled, onChange, value });

  useLayoutEffect(() => {
    currentRef.current = { isControlled, onChange, value };
  }, [value, isControlled, onChange]);

  const setValue = useCallback((next: T) => {
    const { current } = currentRef;
    if (Object.is(next, current.value)) {
      return;
    }

    if (!current.isControlled) {
      current.value = next;
      setUncontrolled(() => next);
    }
    current.onChange?.(next);
  }, []);

  return [value, setValue];
};
