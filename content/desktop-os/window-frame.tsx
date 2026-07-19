"use client";

import type { PointerEvent as ReactPointerEvent, ReactNode, RefObject } from "react";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { XIcon } from "lucide-react";

import type { OpenWindow } from "./window-types";

export interface FrameProps {
  win: OpenWindow;
  isMobile: boolean;
  sectionRef: RefObject<HTMLElement | null>;
  onClose: (uid: number) => void;
  onFocus: (uid: number) => void;
  onMove: (uid: number, x: number, y: number) => void;
  /** Required: it is both the visible header label and the dialog's accessible name. */
  title: string;
  children: ReactNode;
}

/**
 * Modelled as a union so "not dragging" cannot carry drag coordinates: the
 * previous shape kept a `dragging` boolean beside stale start/origin values,
 * and any path that failed to reset it left the window glued to the cursor.
 */
type HeaderDrag =
  | { readonly phase: "idle" }
  | {
      readonly phase: "active";
      readonly pointerId: number;
      readonly startX: number;
      readonly startY: number;
      readonly originX: number;
      readonly originY: number;
      moved: boolean;
      last: { readonly x: number; readonly y: number } | null;
    };

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/**
 * Releasing capture schedules a `lostpointercapture`, which routes back into the
 * cancel handler — so every caller drops its own state *before* calling this,
 * leaving that handler nothing to undo.
 */
const releaseCapture = (el: HTMLElement, pointerId: number): void => {
  if (el.hasPointerCapture(pointerId)) el.releasePointerCapture(pointerId);
};

export const WindowFrame = ({
  win,
  isMobile,
  sectionRef,
  onClose,
  onFocus,
  onMove,
  title,
  children,
}: FrameProps): ReactNode => {
  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<HeaderDrag>({ phase: "idle" });

  // Mount pop. gsap writes inline styles, so the tween owns the rest state too.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      gsap.set(el, { opacity: 1, scale: 1, y: 0, filter: "none" });
      return;
    }

    const tween = gsap.fromTo(
      el,
      { opacity: 0, scale: 0.94, y: 14, filter: "blur(6px)" },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.36,
        ease: "power3.out",
      },
    );

    return () => {
      tween.kill();
    };
  }, []);

  /** Undo the gesture's imperative writes and hand `left`/`top` back to React. */
  const resetFramePosition = (): void => {
    const el = frameRef.current;
    if (!el) return;
    el.style.left = `${win.x}px`;
    el.style.top = `${win.y}px`;
  };

  const onHeaderPointerDown = (e: ReactPointerEvent<HTMLDivElement>): void => {
    if (isMobile) return;
    if (e.button !== 0) return;
    if (drag.current.phase === "active") return;
    if (!(e.target instanceof Element)) return;
    // Traffic lights are inside the drag handle but must stay clickable.
    if (e.target.closest("[data-traffic-light]")) return;
    if (!frameRef.current) return;

    onFocus(win.uid);
    // Capture on the element that owns these handlers. Capturing on an ancestor
    // retargets every later event to that ancestor, where nothing is listening —
    // which is to say the drag would never move and never end.
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      phase: "active",
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: win.x,
      originY: win.y,
      moved: false,
      last: null,
    };
  };

  const onHeaderPointerMove = (e: ReactPointerEvent<HTMLDivElement>): void => {
    const state = drag.current;
    if (state.phase !== "active" || state.pointerId !== e.pointerId) return;
    const el = frameRef.current;
    const section = sectionRef.current;
    if (!el || !section) return;

    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;
    if (!state.moved && Math.hypot(dx, dy) < 3) return;
    state.moved = true;

    const nx = clamp(state.originX + dx, -win.w + 80, section.clientWidth - 80);
    const ny = clamp(state.originY + dy, 28, Math.max(28, section.clientHeight - 60));
    el.style.left = `${nx}px`;
    el.style.top = `${ny}px`;
    state.last = { x: nx, y: ny };
  };

  const onHeaderPointerUp = (e: ReactPointerEvent<HTMLDivElement>): void => {
    const state = drag.current;
    if (state.phase !== "active" || state.pointerId !== e.pointerId) return;

    drag.current = { phase: "idle" };
    releaseCapture(e.currentTarget, e.pointerId);

    const committed = state.last;
    if (state.moved && committed) onMove(win.uid, committed.x, committed.y);
  };

  /**
   * Alt-tab, a context menu or a cancelled touch ends the gesture without a
   * `pointerup`. Drop the drag and redraw from the last committed position
   * rather than stranding half a move in the inline style.
   */
  const onHeaderPointerCancel = (e: ReactPointerEvent<HTMLDivElement>): void => {
    const state = drag.current;
    if (state.phase !== "active" || state.pointerId !== e.pointerId) return;

    drag.current = { phase: "idle" };
    releaseCapture(e.currentTarget, e.pointerId);
    resetFramePosition();
  };

  return (
    <div
      ref={frameRef}
      role="dialog"
      aria-label={title}
      onMouseDown={() => onFocus(win.uid)}
      className="pointer-events-auto absolute flex flex-col overflow-hidden rounded-[12px] border border-black/15 bg-[#fbfaf7] text-[#1a1612] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45),0_8px_24px_-8px_rgba(0,0,0,0.35)]"
      style={{
        left: win.x,
        top: win.y,
        width: win.w,
        height: win.h,
        zIndex: win.z,
      }}
    >
      <div
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={onHeaderPointerUp}
        onPointerCancel={onHeaderPointerCancel}
        onLostPointerCapture={onHeaderPointerCancel}
        className={`flex shrink-0 select-none items-center gap-3 border-b border-black/[0.07] bg-[#ecebe6] px-3 py-2 ${
          isMobile ? "cursor-default" : "cursor-grab active:cursor-grabbing"
        }`}
        style={{ touchAction: "none" }}
      >
        <div data-traffic-light className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Close window"
            onClick={() => onClose(win.uid)}
            className="group/tl flex size-3 items-center justify-center rounded-full bg-[#ff5f57] ring-1 ring-black/10"
          >
            <svg
              width="6"
              height="6"
              viewBox="0 0 6 6"
              className="opacity-0 group-hover/tl:opacity-100"
            >
              <path
                d="M1 1 L5 5 M5 1 L1 5"
                stroke="#5a0900"
                strokeWidth="1.1"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <span
            className="size-3 rounded-full bg-[#febc2e] ring-1 ring-black/10"
            aria-hidden="true"
          />
          <span
            className="size-3 rounded-full bg-[#28c840] ring-1 ring-black/10"
            aria-hidden="true"
          />
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-center">
          <span className="truncate text-[12px] font-medium tracking-tight text-black/70">
            {title}
          </span>
        </div>

        {/*
          Empty on purpose. The traffic lights sit in the row's left slot, so the
          title only lands optically centred while a same-order counterweight
          holds the right slot open.
        */}
        <div className="shrink-0" style={{ minWidth: 60 }} aria-hidden="true" />
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
};

export const PhotoLightbox = ({
  src,
  onClose,
}: {
  src: string;
  onClose: () => void;
}): ReactNode => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;

    const tween = gsap.fromTo(
      el,
      { opacity: 0 },
      { opacity: 1, duration: 0.25, ease: "power2.out" },
    );

    return () => {
      tween.kill();
    };
  }, []);

  return (
    <div
      ref={overlayRef}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="absolute inset-0 z-[60] flex items-center justify-center bg-black/85 p-8 backdrop-blur-sm"
    >
      <img
        src={src}
        alt="Enlarged view"
        draggable={false}
        className="max-h-full max-w-full rounded-[8px] shadow-2xl"
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-5 right-5 flex size-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-colors hover:bg-white/25"
      >
        <XIcon className="size-5" />
      </button>
    </div>
  );
};
