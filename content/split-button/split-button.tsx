"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, ToggleEvent } from "react";
import { Check, ChevronDown, Copy, Pencil, Save, Upload } from "lucide-react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

const noop = () => null;

type ActionId = "save" | "save-as" | "copy" | "export";

const MENU_ITEMS = [
  { icon: Pencil, id: "save-as", label: "Save as" },
  { icon: Copy, id: "copy", label: "Save a copy" },
  { icon: Upload, id: "export", label: "Export" },
] as const satisfies readonly { id: ActionId; label: string; icon: typeof Save }[];

const DONE_LABEL: Record<Exclude<ActionId, "save">, string> = {
  copy: "Copied",
  export: "Exported",
  "save-as": "Saved as",
};

const SEAM = 2;
const TRAILING_SIZE = 56;
const TRAILING_RADIUS = TRAILING_SIZE / 2;

const PRESS_DOWN = { duration: 0.08, ease: "easeOut" } as const;
const PRESS_RELEASE = { bounce: 0.55, type: "spring", visualDuration: 0.35 } as const;

const roundnessOf = (morph: number) => Math.min(Math.max(morph, 0), 1);

type SplitStyle = CSSProperties & Record<`--${string}`, string>;

interface Confirmation {
  id: ActionId;
  seq: number;
}

/** Colors, copy and motion of a {@link SplitButton}; every field is optional. */
export interface SplitButtonProps {
  /** Leading action text. */
  label?: string;
  /** Leading action text while its confirmation shows. */
  doneLabel?: string;
  /** Leading segment width in px. */
  width?: number;
  /** Button container color; hover, press and open tints mix it with white. */
  accent?: string;
  /** Text and icon color on the button. */
  ink?: string;
  /** Menu surface color. */
  menuColor?: string;
  /** Menu text color. */
  menuInk?: string;
  /** Focused menu item background. */
  highlight?: string;
  /** Focused menu item text color. */
  highlightInk?: string;
  /** Spring bounce of the trailing segment's corner morph, 0 to 1. */
  bounce?: number;
  /** Visual duration of the corner morph in seconds. */
  morphDuration?: number;
  /** Trailing segment scale at the bottom of its press. */
  pressScale?: number;
  /** How long a confirmation stays before the label returns, in ms. */
  confirmMs?: number;
}

export const SplitButton = ({
  label = "Save",
  doneLabel = "Saved",
  width = 144,
  accent = "#a8c7fa",
  ink = "#062e6f",
  menuColor = "#2b2c30",
  menuInk = "#e3e3e3",
  highlight = "#004a77",
  highlightInk = "#c2e7ff",
  bounce = 0.35,
  morphDuration = 0.3,
  pressScale = 0.9,
  confirmMs = 1600,
}: SplitButtonProps) => {
  const domId = useId().replaceAll(/[^\w-]/gu, "");
  const anchorName = `--split-${domId}`;
  const menuId = `split-menu-${domId}`;

  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const confirmSeq = useRef(0);

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const morph = useSpring(0, { bounce, visualDuration: morphDuration });
  const scale = useMotionValue(1);
  const cornerRadius = useTransform(morph, (m) => roundnessOf(m) * TRAILING_RADIUS);
  const chevronRotate = useTransform(morph, [0, 1], [0, 180]);
  const chevronShift = useTransform(morph, (m) => (roundnessOf(m) - 1) * 2);
  const seamX = useTransform(() => width + TRAILING_RADIUS * (1 - scale.get()));
  const filletRadius = useTransform(() => cornerRadius.get() * scale.get() + SEAM);
  const filletTop = useTransform(() => TRAILING_RADIUS * (1 - scale.get()) - SEAM);

  const filletBottom = useTransform(
    () => TRAILING_RADIUS * (1 + scale.get()) + SEAM - filletRadius.get(),
  );

  const notchMask = {
    maskImage: useMotionTemplate`linear-gradient(#000, #000), radial-gradient(circle ${filletRadius}px at 100% 100%, transparent ${filletRadius}px, #000 calc(${filletRadius}px + 0.5px)), radial-gradient(circle ${filletRadius}px at 100% 0, transparent ${filletRadius}px, #000 calc(${filletRadius}px + 0.5px))`,
    maskPosition: useMotionTemplate`0 0, calc(${seamX}px - 1px) ${filletTop}px, calc(${seamX}px - 1px) ${filletBottom}px`,
    maskRepeat: "no-repeat",
    maskSize: useMotionTemplate`${seamX}px 100%, calc(${filletRadius}px + 1px) ${filletRadius}px, calc(${filletRadius}px + 1px) ${filletRadius}px`,
  };

  const confirm = (id: ActionId) => {
    confirmSeq.current += 1;
    setConfirmation({ id, seq: confirmSeq.current });
  };

  const choose = (id: ActionId) => {
    menuRef.current?.hidePopover();
    confirm(id);
  };

  useEffect(() => {
    if (!confirmation) {
      return noop;
    }

    const timer = window.setTimeout(() => {
      setConfirmation(null);
    }, confirmMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [confirmation, confirmMs]);

  const press = async () => {
    await animate(scale, pressScale, PRESS_DOWN);
    await animate(scale, 1, PRESS_RELEASE);
  };

  const onToggle = (event: ToggleEvent<HTMLDivElement>) => {
    const isOpen = event.newState === "open";
    setOpen(isOpen);
    morph.set(isOpen ? 1 : 0);
    void press();

    if (!isOpen) {
      setActiveIndex(null);
    }
  };

  const focusItem = (index: number) => {
    const count = MENU_ITEMS.length;
    const next = (index + count) % count;
    setActiveIndex(next);
    itemRefs.current[next]?.focus();
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = new Map([
      ["ArrowDown", (activeIndex ?? -1) + 1],
      ["ArrowUp", (activeIndex ?? MENU_ITEMS.length) - 1],
      ["End", MENU_ITEMS.length - 1],
      ["Home", 0],
    ]).get(event.key);

    if (target !== undefined) {
      event.preventDefault();
      focusItem(target);
    }
  };

  const onTrailingKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      menuRef.current?.showPopover();
      focusItem(0);
    }
  };

  const doneLabels = { ...DONE_LABEL, save: doneLabel } satisfies Record<ActionId, string>;
  const confirmedLabel = confirmation ? doneLabels[confirmation.id] : null;

  const palette: SplitStyle = {
    "--split-accent": accent,
    "--split-active": `color-mix(in srgb, ${accent}, white 30%)`,
    "--split-highlight": highlight,
    "--split-highlight-ink": highlightInk,
    "--split-hover": `color-mix(in srgb, ${accent}, white 16%)`,
    "--split-ink": ink,
    "--split-menu": menuColor,
    "--split-menu-ink": menuInk,
    "--split-open": `color-mix(in srgb, ${accent}, white 50%)`,
  };

  return (
    <>
      <div
        className="group/split inline-flex h-14 gap-0.5 select-none"
        data-open={open}
        style={{ ...palette, anchorName }}
      >
        <button
          type="button"
          aria-label={confirmedLabel ?? label}
          onClick={() => {
            confirm("save");
          }}
          className="group/leading relative isolate flex cursor-pointer items-center justify-center gap-2 rounded-l-full text-[17px] font-medium whitespace-nowrap text-(--split-ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--split-open)"
          style={{ width }}
        >
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 -z-10 rounded-l-full bg-(--split-accent) transition-colors duration-200 group-hover/leading:bg-(--split-hover) group-active/leading:bg-(--split-active)"
            style={{ ...notchMask, width: width + SEAM + TRAILING_RADIUS }}
          />
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={confirmedLabel ?? "idle"}
              className="flex items-center gap-2"
              initial={{ filter: "blur(4px)", opacity: 0, y: 10 }}
              animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
              exit={{ filter: "blur(4px)", opacity: 0, y: -10 }}
              transition={{ bounce: 0.25, duration: 0.35, type: "spring" }}
            >
              {confirmation ? (
                <Check className="size-5" strokeWidth={2.5} />
              ) : (
                <Save className="size-5" strokeWidth={2.25} />
              )}
              {confirmedLabel ?? label}
            </motion.span>
          </AnimatePresence>
        </button>
        <motion.button
          type="button"
          popoverTarget={menuId}
          aria-label="More save options"
          aria-haspopup="menu"
          aria-expanded={open}
          onKeyDown={onTrailingKeyDown}
          className="relative z-10 grid cursor-pointer place-items-center rounded-r-[28px] bg-(--split-accent) text-(--split-ink) transition-colors duration-300 group-data-[open=true]/split:bg-(--split-open) hover:bg-(--split-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--split-open) active:bg-(--split-active)"
          style={{
            borderBottomLeftRadius: cornerRadius,
            borderTopLeftRadius: cornerRadius,
            height: TRAILING_SIZE,
            scale,
            width: TRAILING_SIZE,
          }}
        >
          <motion.span className="grid" style={{ rotate: chevronRotate, x: chevronShift }}>
            <ChevronDown className="size-6" strokeWidth={2.5} />
          </motion.span>
        </motion.button>
      </div>
      <div
        ref={menuRef}
        id={menuId}
        popover="auto"
        role="menu"
        tabIndex={-1}
        aria-label="Save options"
        onToggle={onToggle}
        onKeyDown={onMenuKeyDown}
        style={{
          ...palette,
          left: "anchor(left)",
          positionAnchor: anchorName,
          top: "anchor(bottom)",
        }}
        className="m-0 mt-1.5 w-56 origin-top-left -translate-y-1 scale-[0.9] rounded-[6px_6px_24px_24px] border-0 bg-(--split-menu) p-1.5 text-(--split-menu-ink) opacity-0 shadow-[0_12px_32px_-8px_rgb(0_0_0/0.6)] transition-[opacity,scale,translate,display,overlay] transition-discrete duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] [inset:auto] open:translate-y-0 open:scale-100 open:opacity-100 starting:open:-translate-y-1 starting:open:scale-[0.9] starting:open:opacity-0"
      >
        {MENU_ITEMS.map((item, index) => (
          <button
            key={item.id}
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
            type="button"
            role="menuitem"
            tabIndex={-1}
            data-active={activeIndex === index}
            onPointerEnter={() => {
              focusItem(index);
            }}
            onFocus={() => {
              setActiveIndex(index);
            }}
            onClick={() => {
              choose(item.id);
            }}
            className="flex h-12 w-full cursor-pointer items-center gap-3 rounded-[4px] px-3 text-left text-[15px] transition-[background-color,color,border-radius] duration-200 outline-none first:rounded-t-[4px] last:rounded-b-[20px] data-[active=true]:rounded-[16px] data-[active=true]:bg-(--split-highlight) data-[active=true]:text-(--split-highlight-ink)"
          >
            <item.icon className="size-5" strokeWidth={2} />
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
};
