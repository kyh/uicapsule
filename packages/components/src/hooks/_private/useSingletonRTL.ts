import React from "react";
import useIsomorphicLayoutEffect from "hooks/useIsomorphicLayoutEffect";

type Context = [boolean, (state: boolean) => void];
export const SingletonRTLContext = React.createContext<Context>([
  false,
  () => {},
]);

const useSingletonRTL = (defaultRTL?: boolean) => {
  const state = React.useState(defaultRTL || false);
  const [isRTL, setRTL] = state;

  /**
   * Handle changing dir attribute directly
   */
  useIsomorphicLayoutEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName !== "dir") return;

        const nextRTL = (mutation.target as HTMLElement).dir === "rtl";
        if (isRTL !== nextRTL) setRTL(nextRTL);
      });
    });

    observer.observe(document.body, { attributes: true });
    return () => observer.disconnect();
  }, [isRTL]);

  /**
   * Handle setRTL usage
   */
  useIsomorphicLayoutEffect(() => {
    document.body.setAttribute("dir", isRTL ? "rtl" : "ltr");
  }, [isRTL]);

  return state;
};

export default useSingletonRTL;
