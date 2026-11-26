"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type { Ref, RefObject } from "react";

import {
  STOCK_PALETTE,
  addBackLayer,
  onFrame,
  removeBackLayer,
  setPalette,
  squashy,
  toHex,
  toRgb,
} from "./sakuga-core";
import type { Layer, Squashy } from "./sakuga-core";

const noop = () => null;

export type Styled<Props> = Omit<Props, "className"> & { className?: string };

const assignRef = <T,>(ref: Ref<T> | undefined, node: T | null) => {
  if (!ref) {
    return null;
  }

  if ("current" in ref) {
    ref.current = node;

    return null;
  }

  return ref(node) ?? null;
};

export const useMergedRef = <T,>(...refs: (Ref<T> | undefined)[]) => {
  const latest = useRef(refs);

  const held = useRef<{ node: T | null; cleanups: ((() => void) | null)[]; refs: typeof refs }>({
    cleanups: [],
    node: null,
    refs: [],
  });

  const release = (i: number) => {
    const cleanup = held.current.cleanups[i];

    if (cleanup) {
      cleanup();
    } else {
      assignRef(held.current.refs[i], null);
    }
  };

  useLayoutEffect(() => {
    latest.current = refs;
    const h = held.current;

    if (h.node === null) {
      return;
    }

    for (const [i, ref] of refs.entries()) {
      if (h.refs[i] !== ref) {
        release(i);
        h.refs[i] = ref;
        h.cleanups[i] = assignRef(ref, h.node);
      }
    }
  });

  return useCallback((node: T | null) => {
    const h = held.current;
    h.node = node;
    h.refs = [...latest.current];
    h.cleanups = h.refs.map((ref) => assignRef(ref, node));

    return () => {
      for (const i of h.refs.keys()) {
        const cleanup = h.cleanups[i];

        if (cleanup) {
          cleanup();
        } else {
          assignRef(h.refs[i], null);
        }
      }

      held.current = { cleanups: [], node: null, refs: [] };
    };
  }, []);
};

const VARS =
  "--sk-card:#fff;--sk-ink:#1d1a4a;--sk-dim:#8580b0;--sk-soft:#b8b3ff;--sk-pri:#8f8df7;--sk-pri-ink:#1d1a4a;--sk-acc:#ff5fa8;--sk-track:#c9cbe0;--sk-rule:#dcdaf0;--sk-r:15px;--sk-bw:3.2px;--sk-sh:6px 7px 0 var(--sk-soft);--sk-btn-sh:var(--sk-sh);--sk-btn-line:var(--sk-ink);--sk-alt-sh:var(--sk-sh);--sk-alt-line:var(--sk-ink);--sk-tick:var(--sk-ink);--sk-fill:var(--sk-acc);--sk-on-pri:#fff;";

export const SakugaStyle = () => (
  <style href="sakuga-vfx" precedence="default">{`:where(:root){${VARS}}`}</style>
);

/** Page-wide overrides for the stock tokens; colors are hex, sizes are px. */
export interface SakugaThemeValues {
  primary: string;
  accent: string;
  ink: string;
  shadow: string;
  paper: string;
  line: string;
  radius: number;
  outline: number;
}

const STOCK_PAPER = toRgb(STOCK_PALETTE.fill);
const STOCK_INK = toRgb(STOCK_PALETTE.ink);

const between = (stock: string, inkShare: number, paper: string, ink: string) => {
  const p = toRgb(paper);
  const k = toRgb(ink);

  return toHex(
    toRgb(stock).map(
      (v, i) =>
        v +
        (1 - inkShare) * ((p[i] ?? 0) - (STOCK_PAPER[i] ?? 0)) +
        inkShare * ((k[i] ?? 0) - (STOCK_INK[i] ?? 0)),
    ),
  );
};

/**
 * Applies a theme to every Sakuga control on the page: CSS tokens on `:root` (so portalled
 * popups follow) and the palette the canvas effects and the switch's sprite are drawn in. Track,
 * hint and hairline tones are derived from paper and ink. `line` only colors effects. The switch
 * is a hand-drawn sprite, so it takes the colors but keeps its own pill shape and line weight.
 */
export const SakugaTheme = ({
  primary,
  accent,
  ink,
  shadow,
  paper,
  line,
  radius,
  outline,
}: Partial<SakugaThemeValues>) => {
  const toned = paper !== undefined || ink !== undefined;
  const p = paper ?? STOCK_PALETTE.fill;
  const k = ink ?? STOCK_PALETTE.ink;
  const track = toned ? between(STOCK_PALETTE.track, 0.22, p, k) : undefined;

  useLayoutEffect(() => {
    setPalette({ accent, fill: paper, ink, line, primary, shade: shadow, track });

    return () => {
      setPalette();
    };
  }, [accent, paper, ink, line, primary, shadow, track]);

  const tokens = Object.entries({
    "--sk-acc": accent,
    "--sk-bw": outline === undefined ? undefined : `${outline}px`,
    "--sk-card": paper,
    "--sk-dim": toned ? between("#8580b0", 0.5, p, k) : undefined,
    "--sk-ink": ink,
    "--sk-on-pri": paper,
    "--sk-pri": primary,
    "--sk-pri-ink": ink,
    "--sk-r": radius === undefined ? undefined : `${radius}px`,
    "--sk-rule": toned ? between("#dcdaf0", 0.12, p, k) : undefined,
    "--sk-soft": shadow,
    "--sk-track": track,
  }).flatMap(([name, value]) => (value === undefined ? [] : [`${name}:${value};`]));

  return tokens.length > 0 ? <style>{`:root{${tokens.join("")}}`}</style> : null;
};

export const FONT_BODY =
  '[font-family:-apple-system,BlinkMacSystemFont,"Inter","Segoe_UI",system-ui,sans-serif]';

export const FONT_DISPLAY =
  '[font-family:"Avenir_Next","Nunito",-apple-system,"Segoe_UI",system-ui,sans-serif]';

export const BACK_CANVAS =
  "pointer-events-none absolute -left-40 -top-40 -z-10 h-[calc(100%+320px)] w-[calc(100%+320px)]";

export const useFrame = (fn: (dt: number) => void) => {
  const latest = useRef(fn);
  useEffect(() => {
    latest.current = fn;
  });
  useEffect(
    () =>
      onFrame((dt) => {
        latest.current(dt);
      }),
    [],
  );
};

export const useBackLayer = () => {
  const layer = useRef<Layer | null>(null);

  const attach = useCallback((canvas: HTMLCanvasElement | null) => {
    if (layer.current) {
      removeBackLayer(layer.current);
      layer.current = null;
    }

    if (canvas) {
      layer.current = addBackLayer(canvas);
    }
  }, []);

  return [attach, layer] as const;
};

export const useSquashy = (
  el: RefObject<HTMLElement | null>,
  { low, k, d, wide }: { low?: number; k?: number; d?: number; wide?: number } = {},
) => {
  const sq = useRef<Squashy | null>(null);
  useEffect(() => {
    if (!el.current) {
      return noop;
    }

    const made = squashy(el.current, { d, k, low, wide });
    sq.current = made;

    return () => {
      made.dispose();
      sq.current = null;
    };
  }, [el, low, k, d, wide]);

  return sq;
};
