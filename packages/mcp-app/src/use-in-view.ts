import { useEffect, useRef, useState } from "react";

/** Whether the element is within `rootMargin` of the viewport. */
export const useInView = <T extends Element>(rootMargin = "200px") => {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (element === null) {
      return () => null;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        setInView(entries.some((entry) => entry.isIntersecting));
      },
      { rootMargin },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin]);

  return { inView, ref };
};
