import { useCallback, useState } from "react";

type UseControllableStateParams<T> = {
  prop?: T | undefined;
  defaultProp: T;
  onChange?: ((state: T) => void) | undefined;
};

export const useControllableState = <T>({
  prop,
  defaultProp,
  onChange,
}: UseControllableStateParams<T>): [T, (next: T) => void] => {
  const [uncontrolled, setUncontrolled] = useState(defaultProp);
  const isControlled = prop !== undefined;
  const value = isControlled ? prop : uncontrolled;

  const setValue = useCallback(
    (next: T) => {
      if (isControlled) {
        if (next !== value) onChange?.(next);
        return;
      }

      setUncontrolled((previous) => {
        if (next !== previous) onChange?.(next);
        return next;
      });
    },
    [isControlled, onChange, value],
  );

  return [value, setValue];
};
