"use client";

import type { CSSProperties, RefObject } from "react";
import { Check, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

import type { Look } from "./lookbook-data";
import { LookFigure } from "./look-figure";
import { fmtPrice, lookTotal } from "./lookbook-data";

/**
 * Below this container width the panel always drops underneath the focused
 * card instead of sitting beside it. It is a floor, not the whole rule —
 * `usesSideLayout` is what both this panel and the host actually branch on.
 */
export const NARROW_BREAKPOINT = 920;

const PANEL_GAP = 40;
const PANEL_MIN_GAP = 16;
const PANEL_EDGE = 16;

const panelWidth = (containerW: number) => Math.min(420, containerW * 0.36);

const focusedCardRight = (containerW: number, containerH: number) =>
  0.34 * containerW + 0.25 * containerH;

/**
 * Whether the panel sits beside the focused card rather than beneath it.
 *
 * Width alone is not enough. The focused card is sized off the container
 * HEIGHT, so a tall-narrow desktop frame keeps growing it until the panel no
 * longer fits alongside — at which point the right-edge clamp below drags the
 * panel back on top of the card it describes (measured: 15px of overlap at
 * 920x1100). Falling back to the sheet layout is only safe because the host
 * reads this same predicate to choose where to fly the camera; the two must
 * never disagree about which layout is in play.
 */
export const usesSideLayout = (containerW: number, containerH: number) => {
  if (containerW < NARROW_BREAKPOINT) {
    return false;
  }

  const rightEdge =
    focusedCardRight(containerW, containerH) + PANEL_MIN_GAP + panelWidth(containerW) + PANEL_EDGE;

  return rightEdge <= containerW;
};

const SLOT_TAG = { lower: "B", shoes: "C", top: "A" } as const;

const NO_SCROLLBAR =
  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

export interface DetailPanelProps {
  look: Look;
  /** Measured container box — never `window`, so the panel matches the frame. */
  containerW: number;
  containerH: number;
  /** The glass card itself — the host choreographs its entrance and exit. */
  ref: RefObject<HTMLDivElement | null>;
}

export const DetailPanel = ({ look, containerW, containerH, ref }: DetailPanelProps) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [bag, setBag] = useState<ReadonlySet<string>>(new Set<string>());

  const narrow = !usesSideLayout(containerW, containerH);

  const firstPaint = useRef(true);
  useLayoutEffect(() => {
    if (firstPaint.current && ref.current) {
      ref.current.style.opacity = "0";
    }

    firstPaint.current = false;

    return () => {
      firstPaint.current = true;
    };
  }, [ref]);

  const orderedItems = look.items;
  const activeItem = orderedItems[activeIdx] ?? orderedItems[0];
  const isActiveAdded = bag.has(activeItem.id);
  const itemsCount = orderedItems.length;
  const tag = SLOT_TAG[activeItem.slot];

  const toggle = (itemId: string) => {
    setBag((prev) => {
      const next = new Set(prev);

      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }

      return next;
    });
  };

  const prevItem = () => {
    setActiveIdx((i) => (i - 1 + itemsCount) % itemsCount);
  };

  const nextItem = () => {
    setActiveIdx((i) => (i + 1) % itemsCount);
  };

  const panelW = panelWidth(containerW);

  const panelLeft = Math.min(
    focusedCardRight(containerW, containerH) + PANEL_GAP,
    containerW - panelW - PANEL_EDGE,
  );

  const narrowTop = Math.round(0.38 * containerH + 38);

  const wrapperStyle: CSSProperties = narrow
    ? { bottom: 8, left: 8, right: 8, top: narrowTop }
    : {
        left: Math.round(panelLeft),
        top: "50%",
        transform: "translateY(-50%)",
        width: Math.round(panelW),
      };

  const maxCardHeight = Math.round(containerH * 0.92);

  const heroHeight = narrow
    ? Math.round(Math.min(containerH * 0.2, containerW * 0.45))
    : Math.round(containerH * 0.44);

  const cardStyle: CSSProperties = {
    WebkitBackdropFilter: "blur(40px) saturate(180%)",
    backdropFilter: "blur(40px) saturate(180%)",
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 55%, rgba(255,255,255,0.14) 100%)",
    border: "1px solid rgba(255,255,255,0.28)",
    boxShadow: [
      "inset 0 1px 0 rgba(255,255,255,0.55)",
      "inset 0 0 0 1px rgba(255,255,255,0.08)",
      "inset 0 -1px 0 rgba(0,0,0,0.04)",
      "0 30px 80px -16px rgba(0,0,0,0.32)",
      "0 12px 28px -8px rgba(0,0,0,0.16)",
      `0 0 0 1px ${look.accent}10`,
    ].join(", "),
    height: narrow ? "100%" : undefined,
    maxHeight: narrow ? "100%" : maxCardHeight,
  };

  return (
    <div className="absolute z-40" style={wrapperStyle}>
      <div ref={ref} className="relative overflow-hidden rounded-[28px]" style={cardStyle}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-32"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.08) 40%, rgba(255,255,255,0) 100%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-12 -left-12 size-56 rounded-full opacity-25 blur-3xl"
          style={{ background: look.accent }}
        />

        <div
          className={`relative z-10 overflow-y-auto ${NO_SCROLLBAR} ${narrow ? "h-full" : ""}`}
          style={{ maxHeight: narrow ? undefined : maxCardHeight }}
        >
          <div
            className="relative mb-3 w-full"
            style={{ background: `${look.accent}14`, height: heroHeight }}
            data-detail-anim
          >
            {orderedItems.map((item, i) => (
              <div
                key={item.id}
                className={`absolute inset-0 transition-opacity duration-[450ms] ease-out ${
                  i === activeIdx ? "opacity-100" : "opacity-0"
                }`}
              >
                <LookFigure
                  look={look}
                  crop={item.slot}
                  fit={narrow ? "slice" : "meet"}
                  className="size-full"
                />
              </div>
            ))}

            <div className="absolute top-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {orderedItems.map((item, i) => (
                <span
                  key={item.id}
                  className="block h-[3px] rounded-full transition-all duration-300"
                  style={{
                    background: i === activeIdx ? look.accent : "rgba(0,0,0,0.18)",
                    width: i === activeIdx ? 18 : 5,
                  }}
                />
              ))}
            </div>

            <span
              className="bg-background/85 absolute top-3 right-3 z-10 rounded-full border px-2.5 py-1 text-[9px] tracking-[0.34em] uppercase backdrop-blur-md"
              style={{ borderColor: `${look.accent}66`, color: look.accent }}
            >
              N° {look.lookNumber}
            </span>

            <span
              className="absolute top-3 left-3 z-10 rounded-md px-2 py-1 text-[8.5px] tracking-[0.24em] text-white uppercase shadow-sm"
              style={{ background: `${look.accent}e0` }}
            >
              {tag} · {activeItem.category}
            </span>

            <button
              type="button"
              onClick={prevItem}
              aria-label="Previous piece"
              className="bg-background/85 border-foreground/15 hover:border-foreground/40 hover:bg-background absolute top-1/2 left-3 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full border shadow-md backdrop-blur-md transition-all"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={nextItem}
              aria-label="Next piece"
              className="bg-background/85 border-foreground/15 hover:border-foreground/40 hover:bg-background absolute top-1/2 right-3 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full border shadow-md backdrop-blur-md transition-all"
            >
              <ChevronRight className="size-3.5" />
            </button>

            <div
              className="pointer-events-none absolute bottom-0 left-1/2 z-20"
              style={{ transform: "translate(-50%, 50%)" }}
            >
              <div className="bg-background/85 border-foreground/12 pointer-events-auto flex gap-2 rounded-2xl border p-1.5 shadow-lg backdrop-blur-xl">
                {orderedItems.map((item, i) => {
                  const isActive = i === activeIdx;
                  const inBag = bag.has(item.id);

                  return (
                    <div key={item.id} className="group/thumb relative size-[72px]">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveIdx(i);
                        }}
                        aria-pressed={isActive}
                        aria-label={`View ${item.name}`}
                        className="absolute inset-0 overflow-hidden rounded-xl transition-all duration-300"
                        style={{
                          background: `${look.accent}12`,
                          boxShadow: isActive
                            ? "inset 0 0 0 1.5px var(--foreground, #111)"
                            : "inset 0 0 0 1px rgba(0,0,0,0.06)",
                          opacity: isActive ? 1 : 0.6,
                        }}
                      >
                        <LookFigure
                          look={look}
                          crop={item.slot}
                          className={`size-full transition-transform duration-500 ${
                            isActive ? "scale-100" : "scale-[1.06] group-hover/thumb:scale-100"
                          }`}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggle(item.id);
                        }}
                        aria-label={inBag ? `Remove ${item.name}` : `Add ${item.name}`}
                        aria-pressed={inBag}
                        className={`absolute top-1 right-1 z-10 grid size-4 place-items-center rounded-full transition-all ${
                          inBag
                            ? "bg-foreground text-background hover:bg-foreground/85 opacity-100"
                            : "bg-background/85 text-foreground border-foreground/15 hover:bg-foreground hover:text-background hover:border-foreground border opacity-0 group-hover/thumb:opacity-100"
                        }`}
                      >
                        {inBag ? <Check className="size-2.5" /> : <Plus className="size-2.5" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="px-5 pt-12" key={`info-${activeItem.id}`} data-detail-anim>
            <div className="flex items-baseline justify-between gap-3">
              <h4 className="lbk-display truncate text-[19px] leading-tight">{activeItem.name}</h4>
              <span className="lbk-display shrink-0 text-[18px] tabular-nums">
                {fmtPrice(activeItem.priceCents)}
              </span>
            </div>
            <p className="mt-1 truncate text-[11px] opacity-60">{activeItem.material}</p>
            <div className="mt-2.5 flex items-center gap-2 text-[9px] tracking-[0.2em] uppercase opacity-70">
              <span className="border-foreground/15 rounded-full border px-2 py-0.5">
                Size {activeItem.size}
              </span>
              <span>·</span>
              <span>{look.season}</span>
            </div>
          </div>

          <div className="mt-4 px-5" data-detail-anim>
            <button
              type="button"
              onClick={() => {
                toggle(activeItem.id);
              }}
              aria-pressed={isActiveAdded}
              className={`group/add w-full rounded-full border py-2.5 text-[10.5px] tracking-[0.22em] uppercase transition-all ${
                isActiveAdded
                  ? "border-foreground bg-foreground/[0.06] hover:bg-foreground/[0.12]"
                  : "border-foreground/20 hover:border-foreground/45 hover:bg-foreground/[0.04]"
              }`}
            >
              {isActiveAdded ? (
                <span className="flex items-center justify-center gap-2">
                  <Check className="size-3 group-hover/add:hidden" />
                  <X className="hidden size-3 group-hover/add:block" />
                  <span className="group-hover/add:hidden">
                    Added · {fmtPrice(activeItem.priceCents)}
                  </span>
                  <span className="hidden group-hover/add:inline">Remove from bag</span>
                </span>
              ) : (
                `Add this piece · ${fmtPrice(activeItem.priceCents)}`
              )}
            </button>
          </div>

          <div className="mt-4 mb-3 flex items-center gap-2 px-5" data-detail-anim>
            <div className="bg-foreground/10 h-px flex-1" />
            <span className="size-1 rounded-full" style={{ background: look.accent }} />
            <div className="bg-foreground/10 h-px flex-1" />
          </div>

          <div className="px-5 pb-6" data-detail-anim>
            <div className="mb-2 flex items-baseline justify-between px-0.5">
              <span className="text-[9px] tracking-[0.28em] uppercase opacity-55">
                Complete look · {bag.size}/{itemsCount} added
              </span>
              <span className="lbk-display text-[20px] tabular-nums">
                {fmtPrice(lookTotal(look))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
