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
  title?: string;
  headerCenter?: ReactNode;
  headerRight?: ReactNode;
  headerClassName?: string;
  bodyClassName?: string;
  children: ReactNode;
}

interface HeaderDrag {
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  moved: boolean;
  pointerId: number;
  dragging: boolean;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const WindowFrame = ({
  win,
  isMobile,
  sectionRef,
  onClose,
  onFocus,
  onMove,
  title,
  headerCenter,
  headerRight,
  headerClassName,
  bodyClassName,
  children,
}: FrameProps): ReactNode => {
  const frameRef = useRef<HTMLDivElement>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const drag = useRef<HeaderDrag>({
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    moved: false,
    pointerId: -1,
    dragging: false,
  });

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

  const onHeaderPointerDown = (e: ReactPointerEvent<HTMLDivElement>): void => {
    if (isMobile) return;
    if (e.button !== 0) return;
    if (!(e.target instanceof Element)) return;
    // Traffic lights are inside the drag handle but must stay clickable.
    if (e.target.closest("[data-traffic-light]")) return;

    const el = frameRef.current;
    if (!el) return;

    onFocus(win.uid);
    el.setPointerCapture(e.pointerId);
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: win.x,
      originY: win.y,
      moved: false,
      pointerId: e.pointerId,
      dragging: true,
    };
  };

  const onHeaderPointerMove = (e: ReactPointerEvent<HTMLDivElement>): void => {
    const state = drag.current;
    if (!state.dragging) return;
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
    lastPos.current = { x: nx, y: ny };
  };

  const onHeaderPointerUp = (e: ReactPointerEvent<HTMLDivElement>): void => {
    const state = drag.current;
    if (!state.dragging) return;
    const el = frameRef.current;
    if (el && el.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
    state.dragging = false;

    const committed = lastPos.current;
    if (state.moved && committed) {
      onMove(win.uid, committed.x, committed.y);
      lastPos.current = null;
    }
  };

  return (
    <div
      ref={frameRef}
      role="dialog"
      aria-label={title ?? win.kind}
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
        className={`flex shrink-0 select-none items-center gap-3 border-b border-black/[0.07] px-3 py-2 ${
          isMobile ? "cursor-default" : "cursor-grab active:cursor-grabbing"
        } ${headerClassName ?? "bg-[#ecebe6]"}`}
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
          {headerCenter ?? (
            <span className="truncate text-[12px] font-medium tracking-tight text-black/70">
              {title}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end" style={{ minWidth: 60 }}>
          {headerRight}
        </div>
      </div>

      <div className={`relative min-h-0 flex-1 overflow-hidden ${bodyClassName ?? ""}`}>
        {children}
      </div>
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
