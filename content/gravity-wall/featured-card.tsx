"use client";

import type { ComponentProps, FC, ReactNode, Ref } from "react";
import { useEffect, useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { Bookmark, ChevronLeft, ChevronRight, Heart, X } from "lucide-react";

import type { Photo } from "./photos";

/* The source shipped these as a `.moments-icon-btn` global class; inlined here
   so the package carries no stylesheet. */
const ICON_BTN =
  "flex items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/85 backdrop-blur-[12px] transition-colors hover:bg-white/20 hover:text-white";

/* Playfair Display came from next/font in the source app, which a content
   package cannot use. Georgia keeps the serif character. */
const DISPLAY_FONT = "Georgia, 'Times New Roman', serif";

/* The expanded state hangs satellite UI off the card: prev/next plus a title
   that can wrap to two lines above (~150px), caption and description below
   (~95px). The card is centred in the frame, so the taller side governs — the
   budget below reserves twice the top chrome. Under ~430px of frame height the
   chrome cannot fit at any card size; MIN_EXPANDED_H stops the card collapsing
   to nothing while it degrades. Both are inert at the designed size, where
   `expH` wins the Math.min. */
const EXPANDED_CHROME_H = 300;
const MIN_EXPANDED_H = 120;

interface IconButtonProps {
  onClick: () => void;
  label: string;
  /** `sm` is the prev/next pair; `md` is like / save / close. */
  size: "sm" | "md";
  /** Only set for the two toggles, which are the only buttons with a state. */
  pressed?: boolean;
  ref?: Ref<HTMLButtonElement>;
  children: ReactNode;
}

/* Card-level clicks open the detail view, so every control inside has to stop
   the event before running its own action. */
const IconButton: FC<IconButtonProps> = ({ onClick, label, size, pressed, ref, children }) => (
  <button
    ref={ref}
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className={`${ICON_BTN} ${size === "sm" ? "size-8" : "size-9"}`}
    aria-label={label}
    aria-pressed={pressed}
  >
    {children}
  </button>
);

interface ToggleButtonProps {
  icon: LucideIcon;
  pressed: boolean;
  onLabel: string;
  offLabel: string;
  onClick: () => void;
}

/* Like / save: the only buttons with a state, so the only ones whose label flips. */
const ToggleButton: FC<ToggleButtonProps> = ({
  icon: Icon,
  pressed,
  onLabel,
  offLabel,
  onClick,
}) => (
  <IconButton onClick={onClick} label={pressed ? onLabel : offLabel} size="md" pressed={pressed}>
    <Icon className="size-4" fill={pressed ? "currentColor" : "none"} />
  </IconButton>
);

/* Expanded, the card behaves as a modal — Escape and a backdrop click both
   close it, and the wall behind is `aria-hidden`. Collapsed, it is the button
   that opens the detail view. */
const surfaceProps = (
  expanded: boolean,
  title: string,
  onOpen: () => void,
): ComponentProps<"div"> => {
  if (expanded) {
    return {
      "aria-label": title,
      "aria-modal": true,
      onClick: onOpen,
      role: "dialog",
      tabIndex: -1,
    };
  }
  return {
    "aria-label": `Open ${title}`,
    onClick: onOpen,
    onKeyDown: (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onOpen();
      }
    },
    role: "button",
    tabIndex: 0,
  };
};

interface CardFrame {
  w: number;
  frameH: number;
}

/* Sizes the card for its state; the frame budgets stop it outgrowing the preview box. */
const cardFrame = (
  aspect: number,
  expanded: boolean,
  isMobile: boolean,
  vw: number,
  vh: number,
): CardFrame => {
  const restH = isMobile ? 220 : 280;
  const restMaxW = isMobile ? 270 : 400;
  const expH = isMobile ? 280 : 360;
  const expMaxW = isMobile ? 300 : 480;
  const expMinW = isMobile ? 260 : 340;

  const heightBudget = expanded
    ? Math.min(vh * 0.44, Math.max(MIN_EXPANDED_H, vh - EXPANDED_CHROME_H))
    : vh * 0.62;
  const widthBudget = vw * (expanded ? 0.78 : 0.86);

  const h = Math.min(expanded ? expH : restH, heightBudget);
  const maxW = Math.min(expanded ? expMaxW : restMaxW, widthBudget);
  /* Clamp against the height budget too: without it, a tall-but-narrow photo
     takes the min-width branch below and recomputes frameH from width alone,
     re-inflating past the budget and clipping the satellite UI in short frames. */
  const minW = Math.min(expMinW, widthBudget, heightBudget * aspect);

  let w = h * aspect;
  let frameH = h;
  if (w > maxW) {
    w = maxW;
    frameH = maxW / aspect;
  } else if (expanded && w < minW) {
    w = minW;
    frameH = minW / aspect;
  }
  return { frameH, w };
};

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
  const cardRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  /* Expanding strips the card's own `role`/`tabIndex`, which destroys the
     focusability of the element that was just activated — so hand focus to
     Close, and give it back on collapse. Seeded from `expanded` so a mount in
     either state never steals focus from the surrounding page. */
  const wasExpanded = useRef(expanded);

  useEffect(() => {
    if (wasExpanded.current === expanded) {
      return;
    }
    wasExpanded.current = expanded;
    if (expanded) {
      closeRef.current?.focus();
    } else {
      cardRef.current?.focus();
    }
  }, [expanded]);

  const { w, frameH } = cardFrame(photo.aspect, expanded, isMobile, vw, vh);

  const likeBtn = (
    <ToggleButton
      icon={Heart}
      pressed={liked}
      onLabel="Remove like"
      offLabel="Like"
      onClick={onToggleLike}
    />
  );
  const saveBtn = (
    <ToggleButton
      icon={Bookmark}
      pressed={saved}
      onLabel="Remove from saved"
      offLabel="Save"
      onClick={onToggleSave}
    />
  );
  const closeBtn = (
    <IconButton ref={closeRef} onClick={onClose} label="Close" size="md">
      <X className="size-4" />
    </IconButton>
  );

  return (
    <div
      ref={cardRef}
      className={`pointer-events-auto absolute${expanded ? "" : " cursor-pointer"}`}
      style={{
        height: frameH,
        transform: "translate(-50%, -50%)",
        transition:
          "width 0.25s cubic-bezier(0.16, 1, 0.3, 1), height 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        width: w,
      }}
      {...surfaceProps(expanded, photo.title, onOpen)}
    >
      {expanded && (
        <div className="absolute bottom-full left-1/2 mb-4 w-max max-w-[80%] -translate-x-1/2 text-center">
          <div className="flex items-center justify-center gap-3">
            <IconButton onClick={onPrev} label="Previous photo" size="sm">
              <ChevronLeft className="size-4" />
            </IconButton>
            <IconButton onClick={onNext} label="Next photo" size="sm">
              <ChevronRight className="size-4" />
            </IconButton>
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
            maxWidth: vw * 0.9,
            minWidth: Math.min(isMobile ? 260 : 320, vw * 0.9),
          }}
        >
          <div className="text-[11px] tracking-[0.24em] text-white/60 uppercase">{photo.year}</div>

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
              style={{ lineHeight: 1.6, maxWidth: 440 }}
            >
              {photo.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
