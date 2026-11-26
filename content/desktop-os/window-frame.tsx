"use client";

import type { PointerEvent as ReactPointerEvent, ReactNode, RefObject } from "react";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { XIcon } from "lucide-react";

import type { OpenWindow } from "./window-types";

const noop = () => null;

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

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const releaseCapture = (el: HTMLElement, pointerId: number) => {
  if (el.hasPointerCapture(pointerId)) {
    el.releasePointerCapture(pointerId);
  }
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
}: FrameProps) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<HeaderDrag>({ phase: "idle" });

  useEffect(() => {
    const el = frameRef.current;

    if (!el) {
      return noop;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      gsap.set(el, { filter: "none", opacity: 1, scale: 1, y: 0 });

      return noop;
    }

    const tween = gsap.fromTo(
      el,
      { filter: "blur(6px)", opacity: 0, scale: 0.94, y: 14 },
      {
        duration: 0.36,
        ease: "power3.out",
        filter: "blur(0px)",
        opacity: 1,
        scale: 1,
        y: 0,
      },
    );

    return () => {
      tween.kill();
    };
  }, []);

  const resetFramePosition = () => {
    const el = frameRef.current;

    if (!el) {
      return;
    }

    el.style.left = `${win.x}px`;
    el.style.top = `${win.y}px`;
  };

  const onHeaderPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (isMobile) {
      return;
    }

    if (e.button !== 0) {
      return;
    }

    if (drag.current.phase === "active") {
      return;
    }

    if (!(e.target instanceof Element)) {
      return;
    }

    if (e.target.closest("[data-traffic-light]")) {
      return;
    }

    if (!frameRef.current) {
      return;
    }

    onFocus(win.uid);
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      last: null,
      moved: false,
      originX: win.x,
      originY: win.y,
      phase: "active",
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
    };
  };

  const onHeaderPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const state = drag.current;

    if (state.phase !== "active" || state.pointerId !== e.pointerId) {
      return;
    }

    const el = frameRef.current;
    const section = sectionRef.current;

    if (!el || !section) {
      return;
    }

    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;

    if (!state.moved && Math.hypot(dx, dy) < 3) {
      return;
    }

    state.moved = true;

    const nx = clamp(state.originX + dx, -win.w + 80, section.clientWidth - 80);
    const ny = clamp(state.originY + dy, 28, Math.max(28, section.clientHeight - 60));
    el.style.left = `${nx}px`;
    el.style.top = `${ny}px`;
    state.last = { x: nx, y: ny };
  };

  const onHeaderPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const state = drag.current;

    if (state.phase !== "active" || state.pointerId !== e.pointerId) {
      return;
    }

    drag.current = { phase: "idle" };
    releaseCapture(e.currentTarget, e.pointerId);

    const committed = state.last;

    if (state.moved && committed) {
      onMove(win.uid, committed.x, committed.y);
    }
  };

  const onHeaderPointerCancel = (e: ReactPointerEvent<HTMLDivElement>) => {
    const state = drag.current;

    if (state.phase !== "active" || state.pointerId !== e.pointerId) {
      return;
    }

    drag.current = { phase: "idle" };
    releaseCapture(e.currentTarget, e.pointerId);
    resetFramePosition();
  };

  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- mousedown only raises the window's z-order; focusing anything inside the window reaches the same state from the keyboard
    <div
      ref={frameRef}
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a <dialog> element's UA inset/fit-content sizing and open/close model fight this absolutely positioned, pointer-dragged frame
      role="dialog"
      aria-label={title}
      onMouseDown={() => {
        onFocus(win.uid);
      }}
      className="pointer-events-auto absolute flex flex-col overflow-hidden rounded-[12px] border border-black/15 bg-[#fbfaf7] text-[#1a1612] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45),0_8px_24px_-8px_rgba(0,0,0,0.35)]"
      style={{
        height: win.h,
        left: win.x,
        top: win.y,
        width: win.w,
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
            onClick={() => {
              onClose(win.uid);
            }}
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

        <div className="shrink-0" style={{ minWidth: 60 }} aria-hidden="true" />
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
};

export const PhotoLightbox = ({ src, onClose }: { src: string; onClose: () => void }) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = overlayRef.current;

    if (!el) {
      return noop;
    }

    const tween = gsap.fromTo(
      el,
      { opacity: 0 },
      { duration: 0.25, ease: "power2.out", opacity: 1 },
    );

    return () => {
      tween.kill();
    };
  }, []);

  return (
    <div
      ref={overlayRef}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
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
