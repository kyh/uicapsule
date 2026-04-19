import { useCallback, useRef, useState } from "react";

type UseControllableStateParams<T> = {
  prop?: T | undefined;
  defaultProp: T;
  onChange?: ((state: T) => void) | undefined;
};

type SetStateFn<T> = (prev: T) => T;

export const useControllableState = <T,>({
  prop,
  defaultProp,
  onChange,
}: UseControllableStateParams<T>): [T, (next: T | SetStateFn<T>) => void] => {
  const [uncontrolled, setUncontrolled] = useState(defaultProp);
  const isControlled = prop !== undefined;
  const value = isControlled ? prop : uncontrolled;

  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const isControlledRef = useRef(isControlled);
  isControlledRef.current = isControlled;

  const setValue = useCallback((next: T | SetStateFn<T>) => {
    const resolve = (prev: T) =>
      typeof next === "function" ? (next as SetStateFn<T>)(prev) : next;

    if (isControlledRef.current) {
      const resolved = resolve(valueRef.current);
      if (resolved !== valueRef.current) onChangeRef.current?.(resolved);
    } else {
      setUncontrolled((prev) => {
        const resolved = resolve(prev);
        if (resolved !== prev) onChangeRef.current?.(resolved);
        return resolved;
      });
    }
  }, []);

  return [value, setValue];
};
