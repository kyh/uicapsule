"use client";

// The React side of the core: the shared stylesheet, and hooks that put a control on the shared clock.

import { useCallback, useEffect, useRef } from "react";
import type { RefObject } from "react";

import { addBackLayer, onFrame, removeBackLayer, squashy } from "./sakuga-core";
import type { Layer, Squashy } from "./sakuga-core";

// The controls' colours. :where() keeps these at no specificity, so a page's own
// :root { --sk-acc: ... } wins.
const VARS =
  "--sk-card:#fff;--sk-ink:#1d1a4a;--sk-dim:#8580b0;--sk-soft:#b8b3ff;--sk-pri:#8f8df7;--sk-pri-ink:#1d1a4a;--sk-acc:#ff5fa8;--sk-track:#c9cbe0;--sk-r:15px;--sk-bw:3.2px;--sk-sh:6px 7px 0 var(--sk-soft);--sk-btn-sh:var(--sk-sh);--sk-btn-line:var(--sk-ink);--sk-alt-sh:var(--sk-sh);--sk-alt-line:var(--sk-ink);--sk-tick:var(--sk-ink);--sk-fill:var(--sk-acc);--sk-on-pri:#fff;";

// Every control renders this. React hoists it to <head> and keeps one copy however many controls mount.
export const SakugaStyle = () => (
  <style href="sakuga-vfx" precedence="default">{`:where(:root){${VARS}}`}</style>
);

// The body font and the display font the set uses.
export const FONT_BODY =
  'font-[-apple-system,BlinkMacSystemFont,"Inter","Segoe_UI",system-ui,sans-serif]';
export const FONT_DISPLAY =
  'font-["Avenir_Next","Nunito",-apple-system,"Segoe_UI",system-ui,sans-serif]';

// Classes for a back-layer canvas: it overhangs its control by 160px a side and sits behind it.
// The control's wrapper needs `relative isolate`.
export const BACK_CANVAS =
  "pointer-events-none absolute -left-40 -top-40 -z-10 h-[calc(100%+320px)] w-[calc(100%+320px)]";

// Run fn(dt) every frame on the shared clock while mounted.
export const useFrame = (fn: (dt: number) => void) => {
  const latest = useRef(fn);
  useEffect(() => {
    latest.current = fn;
  });
  useEffect(() => onFrame((dt) => latest.current(dt)), []);
};

// A canvas inside the control, behind it, for an effect that must sit behind it.
// Put the returned callback on a <canvas className={BACK_CANVAS} aria-hidden />, then pass
// layer.current as an effect's `layer`.
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

// A press that squashes while held and overshoots on release. Call .current?.step(dt) in useFrame.
export const useSquashy = (
  el: RefObject<HTMLElement | null>,
  { low, k, d, wide }: { low?: number; k?: number; d?: number; wide?: number } = {},
) => {
  const sq = useRef<Squashy | null>(null);
  useEffect(() => {
    if (!el.current) {
      return;
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
