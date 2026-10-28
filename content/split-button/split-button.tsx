"use client";

import { useEffect, useEffectEvent, useId, useRef, useState } from "react";
import type { KeyboardEvent, ToggleEvent } from "react";
import { Check, ChevronDown, Copy, Pencil, Save, Upload } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

type ActionId = "save" | "save-as" | "copy" | "export";

const MENU_ITEMS = [
  { icon: Pencil, id: "save-as", label: "Save as" },
  { icon: Copy, id: "copy", label: "Save a copy" },
  { icon: Upload, id: "export", label: "Export" },
] as const satisfies readonly { id: ActionId; label: string; icon: typeof Save }[];

const DONE_LABEL: Record<ActionId, string> = {
  copy: "Copied",
  export: "Exported",
  save: "Saved",
  "save-as": "Saved as",
};

const CONFIRM_MS = 1600;

// M3 Expressive's fast spatial spring, approximated: a touch of overshoot so the
// corner morph reads as physical rather than eased.
const SPRING = "ease-[cubic-bezier(0.34,1.56,0.64,1)]";

// seq makes a repeat of the same action a new value, restarting the timer.
interface Confirmation {
  id: ActionId;
  seq: number;
}

type Step = readonly [atMs: number, run: () => void];

interface SplitButtonProps {
  /** Loops a scripted tour until the first real pointer or key input. */
  autoPlay?: boolean;
}

export const SplitButton = ({ autoPlay = false }: SplitButtonProps) => {
  const domId = useId().replaceAll(/[^\w-]/gu, "");
  const anchorName = `--split-${domId}`;
  const menuId = `split-menu-${domId}`;

  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const confirmSeq = useRef(0);

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [pressed, setPressed] = useState<"leading" | "trailing" | null>(null);
  const [touring, setTouring] = useState(autoPlay);

  const confirm = (id: ActionId) => {
    confirmSeq.current += 1;
    setConfirmation({ id, seq: confirmSeq.current });
  };

  const confirmFromTour = useEffectEvent(confirm);

  const choose = (id: ActionId) => {
    menuRef.current?.hidePopover();
    confirm(id);
  };

  useEffect(() => {
    if (!confirmation) {
      return;
    }
    const timer = window.setTimeout(() => setConfirmation(null), CONFIRM_MS);
    return () => window.clearTimeout(timer);
  }, [confirmation]);

  useEffect(() => {
    if (!touring) {
      return;
    }
    const menu = menuRef.current;
    const steps: Step[] = [
      [1200, () => setPressed("leading")],
      [
        1380,
        () => {
          setPressed(null);
          confirmFromTour("save");
        },
      ],
      [3600, () => setPressed("trailing")],
      [
        3760,
        () => {
          setPressed(null);
          menu?.showPopover();
        },
      ],
      [4300, () => setActiveIndex(0)],
      [4800, () => setActiveIndex(1)],
      [5300, () => setActiveIndex(2)],
      [5800, () => setActiveIndex(1)],
      [
        6600,
        () => {
          menu?.hidePopover();
          confirmFromTour("copy");
        },
      ],
    ];
    const LOOP_MS = 9200;

    let timers: number[] = [];
    const cycle = () => {
      timers = [
        ...steps.map(([at, run]) => window.setTimeout(run, at)),
        window.setTimeout(cycle, LOOP_MS),
      ];
    };
    cycle();
    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, [touring]);

  const stopTour = () => {
    if (touring) {
      setTouring(false);
      setPressed(null);
    }
  };

  const onToggle = (event: ToggleEvent<HTMLDivElement>) => {
    const isOpen = event.newState === "open";
    setOpen(isOpen);
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

  const confirmedLabel = confirmation ? DONE_LABEL[confirmation.id] : null;

  return (
    <div className="contents" onPointerDownCapture={stopTour} onKeyDownCapture={stopTour}>
      <div
        className="group/split inline-flex h-14 gap-0.5 select-none"
        data-open={open}
        style={{ anchorName }}
      >
        <button
          type="button"
          aria-label={confirmedLabel ?? "Save"}
          data-pressed={pressed === "leading"}
          onClick={() => confirm("save")}
          className={`flex w-36 cursor-pointer items-center justify-center gap-2 rounded-l-full rounded-r-[6px] bg-[#a8c7fa] text-[17px] font-medium text-[#062e6f] transition-[border-radius,background-color] duration-300 outline-none ${SPRING} hover:rounded-r-[12px] hover:bg-[#b6d0fb] focus-visible:ring-2 focus-visible:ring-[#d3e3fd] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131314] active:rounded-r-[20px] data-[pressed=true]:rounded-r-[20px] data-[pressed=true]:bg-[#c2d7fc]`}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={confirmedLabel ?? "idle"}
              className="flex items-center gap-2"
              initial={{ filter: "blur(4px)", opacity: 0, y: 10 }}
              animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
              exit={{ filter: "blur(4px)", opacity: 0, y: -10 }}
              transition={{ bounce: 0.25, duration: 0.35, type: "spring" }}
            >
              {confirmedLabel ? (
                <Check className="size-5" strokeWidth={2.5} />
              ) : (
                <Save className="size-5" strokeWidth={2.25} />
              )}
              {confirmedLabel ?? "Save"}
            </motion.span>
          </AnimatePresence>
        </button>
        <button
          type="button"
          popoverTarget={menuId}
          aria-label="More save options"
          aria-haspopup="menu"
          aria-expanded={open}
          data-pressed={pressed === "trailing"}
          onKeyDown={onTrailingKeyDown}
          className={`grid w-12 cursor-pointer place-items-center rounded-l-[6px] rounded-r-[28px] bg-[#a8c7fa] text-[#062e6f] transition-[border-radius,width,background-color] duration-300 outline-none ${SPRING} group-data-[open=true]/split:w-14 group-data-[open=true]/split:rounded-l-[28px] group-data-[open=true]/split:bg-[#d3e3fd] group-data-[open=false]/split:hover:rounded-l-[12px] hover:bg-[#b6d0fb] focus-visible:ring-2 focus-visible:ring-[#d3e3fd] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131314] group-data-[open=false]/split:active:rounded-l-[20px] group-data-[open=false]/split:data-[pressed=true]:rounded-l-[20px] data-[pressed=true]:bg-[#c2d7fc]`}
        >
          <ChevronDown
            className={`size-6 -translate-x-0.5 transition-[rotate,translate] duration-400 ${SPRING} group-data-[open=true]/split:translate-x-0 group-data-[open=true]/split:rotate-180`}
            strokeWidth={2.5}
          />
        </button>
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
        style={{ left: "anchor(left)", positionAnchor: anchorName, top: "anchor(bottom)" }}
        className="m-0 mt-1.5 w-56 origin-top -translate-y-2 scale-y-75 rounded-[6px_6px_24px_24px] border-0 bg-[#2b2c30] p-1.5 text-[#e3e3e3] opacity-0 shadow-[0_12px_32px_-8px_rgb(0_0_0/0.6)] transition-[opacity,scale,translate,display,overlay] transition-discrete duration-300 ease-[cubic-bezier(0.2,0,0,1)] [inset:auto] open:translate-y-0 open:scale-y-100 open:opacity-100 starting:open:-translate-y-2 starting:open:scale-y-75 starting:open:opacity-0"
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
            onPointerEnter={() => setActiveIndex(index)}
            onFocus={() => setActiveIndex(index)}
            onClick={() => choose(item.id)}
            className="flex h-12 w-full cursor-pointer items-center gap-3 rounded-[4px] px-3 text-left text-[15px] transition-[background-color,color,border-radius] duration-200 outline-none first:rounded-t-[4px] last:rounded-b-[20px] data-[active=true]:rounded-[16px] data-[active=true]:bg-[#004a77] data-[active=true]:text-[#c2e7ff]"
          >
            <item.icon className="size-5" strokeWidth={2} />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
