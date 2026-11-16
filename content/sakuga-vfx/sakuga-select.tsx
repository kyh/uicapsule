"use client";

// Sakuga Select: a dropdown. The menu springs out of the trigger the way the tooltip's bubble does,
// the chevron flips over, two puffs leave its far corners and シュッ lands by the trigger. A raised
// highlight slides between the rows, stretching as it goes. Choose a row and it inverts for one
// frame, the menu shrinks back into the trigger, and the new label lands with wedges and one puff.
// Close it without choosing and it just shrinks away.

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

import { Spring, at, clamp, later, puff, sfx, ticks } from "./sakuga-core";
import { FONT_BODY, FONT_DISPLAY, SakugaStyle, useFrame, useSquashy } from "./sakuga-react";

export interface SakugaSelectOption {
  value: string;
  label: string;
}

export interface SakugaSelectProps {
  options?: readonly SakugaSelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  // sent with a form under this name
  name?: string;
  label?: string;
  // shown while no option matches the value
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const STAGES: readonly SakugaSelectOption[] = [
  { label: "Key frames", value: "key" },
  { label: "In-betweens", value: "inbetween" },
  { label: "Clean-up", value: "cleanup" },
  { label: "Paint", value: "paint" },
];

const PRESS = { low: 0.8, wide: 0.3 };
const TRIGGER = `flex w-full min-w-[196px] cursor-pointer touch-manipulation items-center justify-between gap-[14px] rounded-(--sk-r) bg-(--sk-card) py-[11px] pr-[14px] pl-[18px] text-left text-[17px] leading-[1.1] font-extrabold tracking-[-0.01em] text-(--sk-ink) italic shadow-(--sk-sh) [border:var(--sk-bw)_solid_var(--sk-ink)] will-change-transform select-none focus-visible:outline-[2.5px] focus-visible:outline-offset-[3px] focus-visible:outline-(--sk-acc) disabled:cursor-not-allowed disabled:opacity-45 ${FONT_DISPLAY}`;
const MENU =
  "invisible absolute top-[calc(100%+13px)] left-0 z-10 w-max max-w-[min(300px,calc(100vw-32px))] min-w-full origin-[50%_-16px] rounded-[13px] bg-(--sk-card) p-[5px] shadow-(--sk-sh) [border:var(--sk-bw)_solid_var(--sk-ink)] [transform:scale(0)] will-change-transform data-shut:pointer-events-none data-up:top-auto data-up:bottom-[calc(100%+13px)] data-up:origin-[50%_calc(100%+16px)]";
const ROW =
  "relative flex cursor-pointer items-center justify-between gap-[14px] rounded-[9px] px-[12px] py-[9px] text-[15px] leading-[1.2] font-semibold whitespace-nowrap select-none aria-selected:font-extrabold data-inv:bg-(--sk-ink) data-inv:text-(--sk-card)";

export const SakugaSelect = ({
  options = STAGES,
  value,
  defaultValue,
  onValueChange,
  name,
  label = "Stage",
  placeholder = "Choose",
  disabled = false,
  className = "",
}: SakugaSelectProps) => {
  const id = useId();
  const [inner, setInner] = useState(defaultValue ?? options[0]?.value ?? "");
  const current = value ?? inner;
  const picked = options.findIndex((o) => o.value === current);
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const [active, setActive] = useState(Math.max(0, picked));

  const wrap = useRef<HTMLSpanElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const raised = useRef<HTMLSpanElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  const chevron = useRef<SVGSVGElement>(null);
  const sqRef = useSquashy(trigger, PRESS);

  const out = useRef(new Spring(0, 460, 15));
  const flip = useRef(new Spring(0, 420, 13));
  const rowY = useRef(new Spring(0, 320, 23));
  const rowH = useRef(new Spring(0, 320, 26));
  const land = useRef(new Spring(1, 600, 13));
  // what the delayed beats check: is it still open, and is this still the same reaction
  const now = useRef({ open: false, seq: 0, typed: "", typedAt: 0 });

  const rowAt = (i: number) => menu.current?.querySelectorAll<HTMLElement>("[role=option]")[i];

  // point the raised highlight at a row; quiet puts it there without the slide
  const aim = (i: number, quiet = false) => {
    const row = rowAt(i);
    if (!row) {
      return;
    }
    rowY.current.to = row.offsetTop;
    rowH.current.to = row.offsetHeight;
    if (quiet) {
      rowY.current.x = rowY.current.to;
      rowY.current.v = 0;
      rowH.current.x = rowH.current.to;
      rowH.current.v = 0;
    }
    row.scrollIntoView({ block: "nearest" });
  };

  const move = (i: number) => {
    const next = clamp(i, 0, options.length - 1);
    setActive(next);
    aim(next);
  };

  const shrink = () => {
    out.current.to = 0;
    out.current.d = 34;
    flip.current.to = 0;
  };

  const hide = () => {
    if (!now.current.open) {
      return;
    }
    now.current.open = false;
    now.current.typed = "";
    now.current.seq += 1;
    setOpen(false);
    shrink();
  };

  const show = (i = Math.max(0, picked)) => {
    const b = trigger.current;
    const m = menu.current;
    if (disabled || !b || !m || options.length === 0) {
      return;
    }
    const start = clamp(i, 0, options.length - 1);
    const box = b.getBoundingClientRect();
    const below = innerHeight - box.bottom;
    const above = m.offsetHeight + 28 > below && box.top > below;
    now.current.open = true;
    now.current.seq += 1;
    const n = now.current.seq;
    setOpen(true);
    setUp(above);
    setActive(start);
    aim(start, true);
    out.current.to = 1;
    out.current.d = 20;
    flip.current.to = 1;
    if (sqRef.current) {
      sqRef.current.s.v += 2;
    }
    later(120, () => {
      if (n !== now.current.seq) {
        return;
      }
      const q = at(b);
      // where the menu will come to rest, not where the overshoot has it now
      const left = q.x - q.w / 2;
      const right = left + m.offsetWidth;
      const far = above ? -1 : 1;
      const end = q.y + far * (q.h / 2 + 13 + m.offsetHeight);
      puff(left - 9, end - far * 16, { life: 0.8, n: 4, size: 8, vx: -14, vy: -6 });
      puff(right + 13, end - far * 30, { life: 0.7, n: 3, size: 7, vx: 14, vy: -10 });
      sfx("shu", q.x + q.w / 2 + 4, q.y - far * (q.h / 2 + 36), {
        col: "#5a4fd8",
        edge: "#ffffff",
        life: 0.75,
        rot: -0.16,
        size: 88,
      });
    });
  };

  const choose = (i: number) => {
    const option = options[i];
    const row = rowAt(i);
    const b = trigger.current;
    if (!option || !now.current.open) {
      return;
    }
    if (option.value === current || !row || !b) {
      hide();
      return;
    }
    now.current.open = false;
    now.current.typed = "";
    now.current.seq += 1;
    const n = now.current.seq;
    setOpen(false);
    if (value === undefined) {
      setInner(option.value);
    }
    onValueChange?.(option.value);
    // the impact frame, on the row
    row.dataset.inv = "";
    later(190, () => {
      delete row.dataset.inv;
    });
    later(90, () => {
      if (n === now.current.seq) {
        shrink();
      }
    });
    // the menu is back inside the trigger: the new label lands
    later(230, () => {
      if (n !== now.current.seq) {
        return;
      }
      land.current.x = 0.68;
      if (sqRef.current) {
        sqRef.current.s.v += 3;
      }
      const c = at(b, 1, 0);
      const q = at(b);
      ticks(c.x - 8, c.y - 4, { dir: -1.05, fan: 0.36, len: 17, life: 0.5, n: 3, r: 5 });
      puff(q.x - q.w / 2 - 9, q.y + q.h / 2 - 2, { life: 0.6, n: 3, size: 7, vx: -12, vy: -8 });
    });
  };

  // type a few letters to jump to the row that starts with them
  const typeahead = (key: string) => {
    const t = now.current;
    const at0 = performance.now();
    t.typed = at0 - t.typedAt > 500 ? key : t.typed + key;
    t.typedAt = at0;
    const from = t.typed.length === 1 && open ? active + 1 : 0;
    for (let k = 0; k < options.length; k += 1) {
      const i = (from + k) % options.length;
      if (options[i]?.label.toLowerCase().startsWith(t.typed)) {
        if (open) {
          move(i);
        } else {
          show(i);
        }
        return;
      }
    }
  };

  const keys = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) {
      return;
    }
    const last = options.length - 1;
    const { key } = e;
    if (key === "Tab") {
      hide();
      return;
    }
    if (key === "Escape") {
      if (open) {
        e.preventDefault();
        hide();
      }
      return;
    }
    if (key.length === 1 && key !== " ") {
      e.preventDefault();
      typeahead(key.toLowerCase());
      return;
    }
    const steps = new Map([
      ["ArrowDown", active + 1],
      ["ArrowUp", active - 1],
      ["End", last],
      ["Home", 0],
    ]);
    const to = steps.get(key);
    const picks = key === "Enter" || key === " ";
    if (to === undefined && !picks) {
      return;
    }
    e.preventDefault();
    if (!open) {
      show(key === "Home" || key === "End" ? to : undefined);
    } else if (picks) {
      choose(active);
    } else if (to !== undefined) {
      move(to);
    }
  };

  // a press anywhere else closes it
  useEffect(() => {
    if (!open) {
      return;
    }
    const away = (e: PointerEvent) => {
      if (e.target instanceof Node && !wrap.current?.contains(e.target)) {
        hide();
      }
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  });

  useFrame((dt) => {
    sqRef.current?.step(dt);
    const s = out.current;
    const y = Math.max(0, s.step(dt));
    const m = menu.current;
    if (m && wrap.current) {
      const gone = y < 0.004 && s.to === 0;
      // stretched while it travels, squashed as it turns back: the volume stays
      const st = clamp(1 + s.v * 0.012, 0.82, 1.22);
      m.style.transform = `scale(${(y / st).toFixed(4)}, ${(y * st).toFixed(4)}) rotate(${((1 - y) * (up ? 7 : -7)).toFixed(2)}deg)`;
      m.style.visibility = gone ? "hidden" : "visible";
      // over the cards after it while it is out
      wrap.current.style.zIndex = gone ? "" : "30";
    }
    if (chevron.current) {
      chevron.current.style.transform = `rotate(${(flip.current.step(dt) * 180).toFixed(1)}deg)`;
    }
    if (raised.current) {
      const ry = rowY.current;
      const x = ry.step(dt);
      const h = rowH.current.step(dt) + Math.min(14, Math.abs(ry.v) * 0.04);
      raised.current.style.transform = `translateY(${(x - (ry.v < 0 ? 0 : h - rowH.current.x)).toFixed(2)}px)`;
      raised.current.style.height = `${h.toFixed(2)}px`;
    }
    if (text.current) {
      const p = land.current.step(dt);
      text.current.style.transform =
        Math.abs(p - 1) < 0.001 ? "" : `scale(${(1 + (1 - p) * 0.5).toFixed(3)}, ${p.toFixed(3)})`;
    }
  });

  return (
    <span
      ref={wrap}
      className={`relative isolate inline-block align-middle text-[15px] leading-[1.4] font-medium text-(--sk-ink) ${FONT_BODY} ${className}`}
    >
      <SakugaStyle />
      <button
        ref={trigger}
        type="button"
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a native select's menu cannot be drawn or put on a spring; this is the select-only combobox pattern
        role="combobox"
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        aria-controls={`${id}-menu`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={label}
        disabled={disabled}
        className={TRIGGER}
        onBlur={hide}
        onClick={() => (open ? hide() : show())}
        onKeyDown={keys}
        onKeyUp={(e) => {
          // Space clicks a button on the way up; the keys above have already dealt with it
          if (e.key === " ") {
            e.preventDefault();
          }
        }}
      >
        <span ref={text} className="min-w-0 origin-left truncate will-change-transform">
          {options[picked]?.label ?? placeholder}
        </span>
        <svg
          ref={chevron}
          aria-hidden
          viewBox="0 0 20 20"
          className="h-[20px] w-[20px] flex-none fill-none stroke-current stroke-[3.4] will-change-transform [stroke-linecap:round] [stroke-linejoin:round]"
        >
          <path d="M4.5 7.5l5.5 5.5 5.5-5.5" />
        </svg>
      </button>
      <div
        ref={menu}
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- see the trigger: the list is drawn, so it cannot be a native select
        role="listbox"
        id={`${id}-menu`}
        tabIndex={-1}
        aria-label={label}
        data-shut={open ? undefined : ""}
        data-up={up ? "" : undefined}
        className={MENU}
        // keep focus on the trigger, which holds the keys
        onMouseDown={(e) => e.preventDefault()}
      >
        <span
          ref={raised}
          aria-hidden
          className="absolute top-0 right-[5px] left-[5px] rounded-[9px] bg-(--sk-soft) [border:2.4px_solid_var(--sk-ink)] will-change-transform"
        />
        {options.map((o, i) => (
          // oxlint-disable-next-line jsx-a11y/click-events-have-key-events -- focus stays on the trigger, which holds the keys and points here with aria-activedescendant
          <div
            key={o.value}
            // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- see the trigger
            role="option"
            id={`${id}-${i}`}
            tabIndex={-1}
            aria-selected={i === picked}
            className={ROW}
            onClick={() => choose(i)}
            onPointerMove={() => {
              if (open && i !== active) {
                move(i);
              }
            }}
          >
            {o.label}
            <svg
              aria-hidden
              viewBox="0 0 24 18"
              className={`h-[12px] w-[16px] flex-none fill-none stroke-(--sk-acc) stroke-[4.6] [stroke-linecap:round] [stroke-linejoin:round] ${i === picked ? "" : "invisible"}`}
            >
              <path d="M3 9.5l6 6L21 2.5" />
            </svg>
          </div>
        ))}
      </div>
      {name !== undefined && (
        <input type="hidden" name={name} value={current} disabled={disabled} />
      )}
    </span>
  );
};
