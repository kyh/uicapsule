"use client";

import type { CSSProperties, RefObject } from "react";
import { Check, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

import type { Look } from "./lookbook-data";
import { LookFigure } from "./look-figure";
import { fmtPrice, lookTotal } from "./lookbook-data";

/**
 * Below this container width the panel always drops underneath the focused
 * card instead of sitting beside it. It is a floor, not the whole rule —
 * `usesSideLayout` is what both this panel and the host actually branch on.
 */
export const NARROW_BREAKPOINT = 920;

/** Gap the beside-card layout wants between the card and the panel. */
const PANEL_GAP = 40;
/** Smallest gap the beside-card layout will accept before giving up on it. */
const PANEL_MIN_GAP = 16;
/** Space kept between the panel and the right edge of the frame. */
const PANEL_EDGE = 16;

function panelWidth(containerW: number): number {
  return Math.min(420, containerW * 0.36);
}

/**
 * Right edge of the focused card in the beside-card layout: it lands centred
 * on 0.34w and renders 0.75h tall, so it is 0.25h wide either side.
 */
function focusedCardRight(containerW: number, containerH: number): number {
  return 0.34 * containerW + 0.25 * containerH;
}

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
export function usesSideLayout(containerW: number, containerH: number): boolean {
  if (containerW < NARROW_BREAKPOINT) return false;
  const rightEdge =
    focusedCardRight(containerW, containerH) + PANEL_MIN_GAP + panelWidth(containerW) + PANEL_EDGE;
  return rightEdge <= containerW;
}

const SLOT_TAG = { top: "A", lower: "B", shoes: "C" } as const;

/** Utilities-layer scrollbar suppression — the app's base layer styles one in. */
const NO_SCROLLBAR =
  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

export interface DetailPanelProps {
  look: Look;
  /** Measured container box — never `window`, so the panel matches the frame. */
  containerW: number;
  containerH: number;
  panelRef: RefObject<HTMLDivElement | null>;
}

export function DetailPanel({ look, containerW, containerH, panelRef }: DetailPanelProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [bag, setBag] = useState<ReadonlySet<string>>(new Set<string>());

  const narrow = !usesSideLayout(containerW, containerH);

  const setCardRef = useCallback(
    (node: HTMLDivElement | null) => {
      panelRef.current = node;
    },
    [panelRef],
  );

  const firstPaint = useRef(true);
  // Hide before first paint so the open animation never flashes, and so
  // re-renders (thumbnail switches) can't reset opacity mid-view.
  useLayoutEffect(() => {
    if (firstPaint.current && panelRef.current) {
      panelRef.current.style.opacity = "0";
    }
    firstPaint.current = false;
    return () => {
      firstPaint.current = true;
    };
  }, [panelRef]);

  const [topItem, lowerItem, shoeItem] = look.items;
  const orderedItems = [topItem, lowerItem, shoeItem];
  const activeItem = orderedItems[activeIdx] ?? topItem;
  const isActiveAdded = bag.has(activeItem.id);
  const itemsCount = orderedItems.length;
  const tag = SLOT_TAG[activeItem.slot];

  function toggle(itemId: string) {
    setBag((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }
  function prevItem() {
    setActiveIdx((i) => (i - 1 + itemsCount) % itemsCount);
  }
  function nextItem() {
    setActiveIdx((i) => (i + 1) % itemsCount);
  }

  const panelW = panelWidth(containerW);
  // Start PANEL_GAP past the card's right edge and never run off the frame.
  // `usesSideLayout` has already guaranteed the clamp cannot pull this back
  // over the card — if it could, we would not be in this layout.
  const panelLeft = Math.min(
    focusedCardRight(containerW, containerH) + PANEL_GAP,
    containerW - panelW - PANEL_EDGE,
  );
  // In the narrow layout the card sits at 0.2h + 28 and is 0.18h tall either
  // side, so 0.38h + 38 clears its bottom edge.
  const narrowTop = Math.round(0.38 * containerH + 38);

  const wrapperStyle: CSSProperties = narrow
    ? { top: narrowTop, left: 8, right: 8, bottom: 8 }
    : {
        top: "50%",
        left: Math.round(panelLeft),
        transform: "translateY(-50%)",
        width: Math.round(panelW),
      };

  const maxCardHeight = Math.round(containerH * 0.92);
  // The narrow sheet only owns ~0.6h, and the hero competes with the info,
  // the add button and the total for it — keep it small enough that the
  // primary action stays above the fold on a short frame.
  const heroHeight = narrow
    ? Math.round(Math.min(containerH * 0.2, containerW * 0.45))
    : Math.round(containerH * 0.44);

  const cardStyle: CSSProperties = {
    maxHeight: narrow ? "100%" : maxCardHeight,
    height: narrow ? "100%" : undefined,
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 55%, rgba(255,255,255,0.14) 100%)",
    backdropFilter: "blur(40px) saturate(180%)",
    WebkitBackdropFilter: "blur(40px) saturate(180%)",
    border: "1px solid rgba(255,255,255,0.28)",
    boxShadow: [
      "inset 0 1px 0 rgba(255,255,255,0.55)",
      "inset 0 0 0 1px rgba(255,255,255,0.08)",
      "inset 0 -1px 0 rgba(0,0,0,0.04)",
      "0 30px 80px -16px rgba(0,0,0,0.32)",
      "0 12px 28px -8px rgba(0,0,0,0.16)",
      `0 0 0 1px ${look.accent}10`,
    ].join(", "),
  };

  return (
    <div className="absolute z-40" style={wrapperStyle}>
      <div ref={setCardRef} className="relative overflow-hidden rounded-[28px]" style={cardStyle}>
        {/* Top sheen */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-32"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.08) 40%, rgba(255,255,255,0) 100%)",
          }}
        />
        {/* Accent halo */}
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-12 -left-12 size-56 rounded-full opacity-25 blur-3xl"
          style={{ background: look.accent }}
        />

        <div
          className={`relative z-10 overflow-y-auto ${NO_SCROLLBAR} ${narrow ? "h-full" : ""}`}
          style={{ maxHeight: narrow ? undefined : maxCardHeight }}
        >
          {/* Hero — a crop of the very same drawing the card shows */}
          <div
            className="relative mb-3 w-full"
            style={{ height: heroHeight, background: `${look.accent}14` }}
            data-detail-anim
          >
            {orderedItems.map((item, i) => (
              <div
                key={item.id}
                className={`absolute inset-0 transition-opacity duration-[450ms] ease-out ${
                  i === activeIdx ? "opacity-100" : "opacity-0"
                }`}
              >
                {/* The narrow sheet's hero is a ~2.3:1 letterbox while every
                    crop is taller than it is wide, so "meet" would strand the
                    drawing at ~37% of the width against flat accent fill.
                    Fill it instead; the thumbnails below still show each crop
                    whole. The wide layout is close enough to square to keep
                    the full figure. */}
                <LookFigure
                  look={look}
                  crop={item.slot}
                  fit={narrow ? "slice" : "meet"}
                  className="size-full"
                />
              </div>
            ))}

            {/* Progress pips */}
            <div className="absolute top-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {orderedItems.map((item, i) => (
                <span
                  key={item.id}
                  className="block h-[3px] rounded-full transition-all duration-300"
                  style={{
                    width: i === activeIdx ? 18 : 5,
                    background: i === activeIdx ? look.accent : "rgba(0,0,0,0.18)",
                  }}
                />
              ))}
            </div>

            {/* Look ID badge */}
            <span
              className="bg-background/85 absolute top-3 right-3 z-10 rounded-full border px-2.5 py-1 text-[9px] tracking-[0.34em] uppercase backdrop-blur-md"
              style={{ borderColor: `${look.accent}66`, color: look.accent }}
            >
              N° {look.lookNumber}
            </span>

            {/* Category badge */}
            <span
              // top-3, not the source's top-9: on a short hero the arrows sit
              // at 50% and ran straight through a badge pinned lower down.
              className="absolute top-3 left-3 z-10 rounded-md px-2 py-1 text-[8.5px] tracking-[0.24em] text-white uppercase shadow-sm"
              style={{ background: `${look.accent}e0` }}
            >
              {tag} · {activeItem.category}
            </span>

            {/* Prev / next */}
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

            {/* Floating thumbnail pill */}
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
                        onClick={() => setActiveIdx(i)}
                        aria-pressed={isActive}
                        aria-label={`View ${item.name}`}
                        className="absolute inset-0 overflow-hidden rounded-xl transition-all duration-300"
                        style={{
                          opacity: isActive ? 1 : 0.6,
                          background: `${look.accent}12`,
                          boxShadow: isActive
                            ? "inset 0 0 0 1.5px var(--foreground, #111)"
                            : "inset 0 0 0 1px rgba(0,0,0,0.06)",
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

          {/* Active item info */}
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

          {/* Add this piece */}
          <div className="mt-4 px-5" data-detail-anim>
            <button
              type="button"
              onClick={() => toggle(activeItem.id)}
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

          {/* Divider */}
          <div className="mt-4 mb-3 flex items-center gap-2 px-5" data-detail-anim>
            <div className="bg-foreground/10 h-px flex-1" />
            <span className="size-1 rounded-full" style={{ background: look.accent }} />
            <div className="bg-foreground/10 h-px flex-1" />
          </div>

          {/* Price of the whole look — the bag counter beside it is progress
              towards owning it, not a subtotal, so this figure is constant. */}
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
}
