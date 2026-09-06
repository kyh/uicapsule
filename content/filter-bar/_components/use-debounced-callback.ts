import { useCallback, useEffect, useRef } from "react";

export function useDebouncedCallback<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  delay: number,
) {
  const callbackRef = useRef(callback);
  const pendingRef = useRef<{ timeout: ReturnType<typeof setTimeout>; args: TArgs } | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (pendingRef.current !== null) clearTimeout(pendingRef.current.timeout);
    pendingRef.current = null;
  }, []);

  useEffect(() => cancel, [cancel]);

  const flush = useCallback(() => {
    const pending = pendingRef.current;
    if (!pending) return;
    cancel();
    callbackRef.current(...pending.args);
  }, [cancel]);

  const schedule = useCallback(
    (...args: TArgs) => {
      cancel();
      pendingRef.current = { timeout: setTimeout(flush, delay), args };
    },
    [cancel, delay, flush],
  );

  return { schedule, cancel, flush };
}
