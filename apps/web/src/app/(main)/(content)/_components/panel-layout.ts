"use client";

import { useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { z } from "zod";

export type PanelId = "nav" | "info" | "code";

interface PanelBounds {
  min: number;
  max: number;
  initial: number;
  cssVar: `--${string}`;
  sizeVar: `--${string}`;
}

export const PANEL_BOUNDS = {
  code: { cssVar: "--code-h", initial: 280, max: 720, min: 140, sizeVar: "--code-size" },
  info: { cssVar: "--info-w", initial: 340, max: 560, min: 280, sizeVar: "--info-size" },
  nav: { cssVar: "--nav-w", initial: 232, max: 400, min: 184, sizeVar: "--nav-size" },
} satisfies Record<PanelId, PanelBounds>;

const PANEL_IDS = ["nav", "info", "code"] as const satisfies readonly PanelId[];

const STORAGE_KEY = "uicapsule:workspace-layout:v2";

const panelStateSchema = z.object({ open: z.boolean(), size: z.number() });

const layoutSchema = z.object({
  code: panelStateSchema,
  info: panelStateSchema,
  nav: panelStateSchema,
});

export type PanelState = z.infer<typeof panelStateSchema>;

export type PanelLayout = z.infer<typeof layoutSchema>;

export const clampPanel = (id: PanelId, size: number) =>
  Math.round(Math.min(PANEL_BOUNDS[id].max, Math.max(PANEL_BOUNDS[id].min, size)));

const DEFAULT_LAYOUT: PanelLayout = {
  code: { open: false, size: PANEL_BOUNDS.code.initial },
  info: { open: false, size: PANEL_BOUNDS.info.initial },
  nav: { open: false, size: PANEL_BOUNDS.nav.initial },
};

const readLayout = () => {
  try {
    const parsed = layoutSchema.safeParse(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null"));

    if (!parsed.success) {
      return null;
    }

    const layout = { ...parsed.data };

    for (const id of PANEL_IDS) {
      layout[id] = { ...layout[id], size: clampPanel(id, layout[id].size) };
    }

    return layout;
  } catch {
    return null;
  }
};

const writeLayout = (layout: PanelLayout) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));

    return true;
  } catch {
    return false;
  }
};

export const panelCssValue = ({ open, size }: PanelState) => (open ? `${size}px` : "0px");

/**
 * Inline script that applies the stored panel sizes before first paint, so a reload never
 * flashes the default layout. Mirrors `readLayout` + `panelCssValue`.
 */
export const panelLayoutScript = (elementId: string) => {
  const config = JSON.stringify({
    bounds: PANEL_BOUNDS,
    id: elementId,
    key: STORAGE_KEY,
  }).replaceAll("<", String.raw`<`);

  return `(function(){try{var c=${config};var e=document.getElementById(c.id);var s=JSON.parse(localStorage.getItem(c.key)||"null");if(!e||!s)return;for(var k in c.bounds){var b=c.bounds[k];var p=s[k];if(!p||typeof p.size!=="number")continue;var z=Math.round(Math.min(b.max,Math.max(b.min,p.size)));e.style.setProperty(b.sizeVar,z+"px");e.style.setProperty(b.cssVar,(p.open===false?0:z)+"px");}}catch(_){}})();`;
};

const listeners = new Set<() => void>();
let current: PanelLayout | null = null;

const getSnapshot = () => {
  current ??= readLayout() ?? DEFAULT_LAYOUT;

  return current;
};

const getServerSnapshot = () => DEFAULT_LAYOUT;

const subscribe = (listener: () => void) => {
  listeners.add(listener);

  return () => listeners.delete(listener);
};

const subscribeNever = () => () => null;
const isClient = () => true;
const isServer = () => false;

const updateLayout = (update: (previous: PanelLayout) => PanelLayout) => {
  const previous = getSnapshot();
  const next = update(previous);

  if (next === previous) {
    return;
  }

  current = next;
  writeLayout(next);

  for (const listener of listeners) {
    listener();
  }
};

const setPanel = (id: PanelId, next: Partial<PanelState>) => {
  updateLayout((previous) => {
    const panel = previous[id];
    const merged = { open: next.open ?? panel.open, size: next.size ?? panel.size };

    if (merged.open === panel.open && merged.size === panel.size) {
      return previous;
    }

    return { ...previous, [id]: merged };
  });
};

const togglePanel = (id: PanelId) => {
  updateLayout((previous) => ({
    ...previous,
    [id]: { ...previous[id], open: !previous[id].open },
  }));
};

export const usePanelLayout = () => {
  const ref = useRef<HTMLDivElement>(null);
  const layout = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useSyncExternalStore(subscribeNever, isClient, isServer);

  useLayoutEffect(() => {
    const element = ref.current;

    if (!element || !hydrated) {
      return;
    }

    for (const id of PANEL_IDS) {
      element.style.setProperty(PANEL_BOUNDS[id].sizeVar, `${layout[id].size}px`);
      element.style.setProperty(PANEL_BOUNDS[id].cssVar, panelCssValue(layout[id]));
    }
  }, [hydrated, layout]);

  return { layout, ref, setPanel, togglePanel };
};
