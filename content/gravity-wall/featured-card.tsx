"use client";

import type { FC } from "react";
import { Bookmark, ChevronLeft, ChevronRight, Heart, X } from "lucide-react";

import type { Photo } from "./photos";

/* The source shipped these as a `.moments-icon-btn` global class; inlined here
   so the package carries no stylesheet. */
const ICON_BTN =
  "flex items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/85 backdrop-blur-[12px] transition-colors hover:bg-white/20 hover:text-white";

/* Playfair Display came from next/font in the source app, which a content
   package cannot use. Georgia keeps the serif character. */
const DISPLAY_FONT = "Georgia, 'Times New Roman', serif";

/* Card-level clicks open the detail view; every control inside has to opt out. */
const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();

interface FeaturedCardProps {
  photo: Photo;
  expanded: boolean;
  isMobile: boolean;
  /** Frame size, so the card can never outgrow the preview box. */
  vw: number;
  vh: number;
  liked: boolean;
  saved: boolean;
  onOpen: () => void;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleLike: () => void;
  onToggleSave: () => void;
}

export const FeaturedCard: FC<FeaturedCardProps> = ({
  photo,
  expanded,
  isMobile,
  vw,
  vh,
  liked,
  saved,
  onOpen,
  onClose,
  onNext,
  onPrev,
  onToggleLike,
  onToggleSave,
}) => {
  const restH = isMobile ? 220 : 280;
  const restMaxW = isMobile ? 270 : 400;
  const expH = isMobile ? 280 : 360;
  const expMaxW = isMobile ? 300 : 480;
  const expMinW = isMobile ? 260 : 340;

  /* The expanded state hangs satellite UI above and below the frame, so leave
     room for it rather than letting the card claim the whole height. */
  const heightBudget = expanded ? vh * 0.44 : vh * 0.62;
  const widthBudget = vw * (expanded ? 0.78 : 0.86);

  const h = Math.min(expanded ? expH : restH, heightBudget);
  const maxW = Math.min(expanded ? expMaxW : restMaxW, widthBudget);
  /* Clamp against the height budget too: without it, a tall-but-narrow photo
     takes the min-width branch below and recomputes frameH from width alone,
     re-inflating past the budget and clipping the satellite UI in short frames. */
  const minW = Math.min(expMinW, widthBudget, heightBudget * photo.aspect);

  let w = h * photo.aspect;
  let frameH = h;
  if (w > maxW) {
    w = maxW;
    frameH = maxW / photo.aspect;
  } else if (expanded && w < minW) {
    w = minW;
    frameH = minW / photo.aspect;
  }

  const likeBtn = (
    <button
      type="button"
      onClick={(e) => {
        stop(e);
        onToggleLike();
      }}
      className={`${ICON_BTN} size-9`}
      aria-label={liked ? "Remove like" : "Like"}
      aria-pressed={liked}
    >
      <Heart className="size-4" fill={liked ? "currentColor" : "none"} />
    </button>
  );
  const saveBtn = (
    <button
      type="button"
      onClick={(e) => {
        stop(e);
        onToggleSave();
      }}
      className={`${ICON_BTN} size-9`}
      aria-label={saved ? "Remove from saved" : "Save"}
      aria-pressed={saved}
    >
      <Bookmark className="size-4" fill={saved ? "currentColor" : "none"} />
    </button>
  );
  const closeBtn = (
    <button
      type="button"
      onClick={(e) => {
        stop(e);
        onClose();
      }}
      className={`${ICON_BTN} size-9`}
      aria-label="Close"
    >
      <X className="size-4" />
    </button>
  );

  return (
    <div
      className={`pointer-events-auto absolute${expanded ? "" : " cursor-pointer"}`}
      style={{
        width: w,
        height: frameH,
        transform: "translate(-50%, -50%)",
        transition:
          "width 0.25s cubic-bezier(0.16, 1, 0.3, 1), height 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      onClick={onOpen}
      role={expanded ? undefined : "button"}
      tabIndex={expanded ? undefined : 0}
      aria-label={expanded ? undefined : `Open ${photo.title}`}
      onKeyDown={
        expanded
          ? undefined
          : (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpen();
              }
            }
      }
    >
      {expanded && (
        <div className="absolute bottom-full left-1/2 mb-4 w-max max-w-[80%] -translate-x-1/2 text-center">
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                stop(e);
                onPrev();
              }}
              className={`${ICON_BTN} size-8`}
              aria-label="Previous photo"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                stop(e);
                onNext();
              }}
              className={`${ICON_BTN} size-8`}
              aria-label="Next photo"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="mt-3 text-[10px] tracking-[0.24em] text-white/60 uppercase">
            {photo.category}
          </div>
          <div
            className="mt-1 text-white"
            style={{
              fontFamily: DISPLAY_FONT,
              fontSize: isMobile ? 24 : 30,
              lineHeight: 1.1,
            }}
          >
            {photo.title}
          </div>
        </div>
      )}

      {expanded && !isMobile && (
        <div className="absolute top-1/2 right-full mr-4 flex -translate-y-1/2 flex-col gap-2">
          {likeBtn}
          {saveBtn}
        </div>
      )}

      {/* Close sits on the card's own corner: with Share/Download dropped a
          second side rail would be a lone floating button. */}
      {expanded && !isMobile && <div className="absolute -top-3 -right-3 z-10">{closeBtn}</div>}

      <div
        className="relative h-full w-full overflow-hidden rounded-[6px] bg-black"
        style={{ boxShadow: "0 30px 70px -15px rgb(0 0 0 / 0.7)" }}
      >
        <img
          src={expanded ? photo.imageUrl : photo.thumbUrl}
          alt={photo.title}
          draggable={false}
          decoding="async"
          className="h-full w-full object-cover"
        />
        {!expanded && (
          <div
            className="absolute inset-x-0 bottom-0 p-3"
            style={{
              background:
                "linear-gradient(to top, rgb(0 0 0 / 0.85) 0%, rgb(0 0 0 / 0.4) 50%, transparent 100%)",
            }}
          >
            <div className="text-[10px] tracking-[0.22em] text-white/75 uppercase">
              {photo.category}
            </div>
            <div className="truncate text-white" style={{ fontFamily: DISPLAY_FONT, fontSize: 16 }}>
              {photo.title}
            </div>
          </div>
        )}
      </div>

      {expanded && (
        <div
          className="absolute top-full left-1/2 mt-4 -translate-x-1/2 text-center"
          style={{
            minWidth: Math.min(isMobile ? 260 : 320, vw * 0.9),
            maxWidth: vw * 0.9,
          }}
        >
          <div className="text-[11px] tracking-[0.24em] text-white/60 uppercase">
            {photo.location} · {photo.year}
          </div>

          {isMobile && (
            <div className="mt-3 flex items-center justify-center gap-2">
              {likeBtn}
              {saveBtn}
              {closeBtn}
            </div>
          )}

          {!isMobile && (
            <p
              className="mx-auto mt-3 text-[13px] text-white/70"
              style={{ maxWidth: 440, lineHeight: 1.6 }}
            >
              {photo.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
