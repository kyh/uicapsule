import { createContext, use, useEffect, useRef, useState, useSyncExternalStore } from "react";

const noop = () => null;

const QUERY = "(prefers-reduced-motion: reduce)";

const subscribe = (onChange: () => void) => {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);

  return () => {
    media.removeEventListener("change", onChange);
  };
};

const readReduced = () => window.matchMedia(QUERY).matches;
const readServer = () => false;

/** False when the showcase has motion switched off, which reads the same as reduced motion. */
export const MotionContext = createContext(true);

/** True when the viewer asked for reduced motion or the showcase switched motion off. */
export const useReducedMotion = () => {
  const reduced = useSyncExternalStore(subscribe, readReduced, readServer);

  return reduced || !use(MotionContext);
};

const GLYPHS = "abcdefghjkmnpqrstuvwxyz0123456789_";
const SEP = "\u0000";
const KEEP = new Set([" ", ".", ",", "_", "-", "·"]);

const randomGlyph = () => GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));

/** Types `text` in one character at a time whenever `text` or `replay` changes. */
export const useTypewriter = (text: string, replay = 0, perChar = 20) => {
  const reduced = useReducedMotion();
  const key = `${text}${SEP}${replay}`;
  const [state, setState] = useState({ count: 0, key });

  if (state.key !== key) {
    setState({ count: 0, key });
  }

  useEffect(() => {
    if (reduced) {
      return noop;
    }

    const length = key.split(SEP)[0]?.length ?? 0;

    const timer = window.setInterval(() => {
      setState((current) => {
        if (current.key !== key || current.count >= length) {
          window.clearInterval(timer);

          return current;
        }

        return { count: current.count + 1, key };
      });
    }, perChar);

    return () => {
      window.clearInterval(timer);
    };
  }, [key, reduced, perChar]);

  const count = reduced ? text.length : state.count;

  return { shown: text.slice(0, count), typing: count < text.length };
};

/** Settles `text` left to right out of random glyphs whenever `text` or `replay` changes. */
export const useScramble = (text: string, replay = 0, duration = 420) => {
  const reduced = useReducedMotion();
  const key = `${text}${SEP}${replay}`;
  const [shown, setShown] = useState(text);

  useEffect(() => {
    if (reduced) {
      return noop;
    }

    const target = key.split(SEP)[0] ?? "";
    const start = performance.now();
    let frame = 0;

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const settled = Math.floor(progress * target.length);
      setShown(
        Array.from(target, (char, index) =>
          index < settled || KEEP.has(char) ? char : randomGlyph(),
        ).join(""),
      );

      if (progress < 1) {
        frame = requestAnimationFrame(step);
      }
    };

    frame = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [key, reduced, duration]);

  return reduced ? text : shown;
};

/** Calls `onTick` every `ms` while `running`. */
export const useInterval = (onTick: () => void, ms: number, running = true) => {
  const saved = useRef(onTick);

  useEffect(() => {
    saved.current = onTick;
  });

  useEffect(() => {
    if (!running) {
      return noop;
    }

    const timer = window.setInterval(() => {
      saved.current();
    }, ms);

    return () => {
      window.clearInterval(timer);
    };
  }, [ms, running]);
};

/** Copies text, resolving true when the clipboard accepted it. */
export const copyText = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);

    return true;
  } catch {
    return false;
  }
};
