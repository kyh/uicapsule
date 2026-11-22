"use client";

import { cn } from "cn";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ChangeEvent,
  ComponentProps,
  KeyboardEvent,
  PointerEvent,
  ReactNode,
  RefObject,
} from "react";

import {
  Spring,
  at,
  clock,
  hollow,
  isCalm,
  later,
  puff,
  rnd,
  sfx,
  shards,
  slash,
  ticks,
  wob,
} from "./sakuga-core";
import { FONT_BODY, SakugaStyle, useFrame, useMergedRef } from "./sakuga-react";

type SakugaChipsProps = Omit<ComponentProps<"span">, "defaultValue" | "onChange"> & {
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: string[]) => void;
  name?: string;
  disabled?: boolean;
  max?: number;
};

interface Chips {
  keyed: readonly { key: string; tag: string }[];
  disabled: boolean;
  fieldRef: RefObject<HTMLDivElement | null>;
  chipElsRef: RefObject<Map<string, HTMLElement>>;
  entryRef: RefObject<HTMLInputElement | null>;
  cutLayerRef: RefObject<HTMLSpanElement | null>;
  remove: (key: string) => void;
  change: (e: ChangeEvent<HTMLInputElement>) => void;
  keyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  focus: () => void;
  pointerDown: (e: PointerEvent<HTMLElement>) => void;
}

const ChipsContext = createContext<Chips | null>(null);
const ChipContext = createContext<{ key: string; tag: string } | null>(null);

const useChips = () => {
  const chips = use(ChipsContext);

  if (!chips) {
    throw new Error("Sakuga chips parts go inside a SakugaChips");
  }

  return chips;
};

const useChip = () => {
  const chip = use(ChipContext);

  if (!chip) {
    throw new Error("A SakugaChip is drawn by a SakugaChipsList");
  }

  return chip;
};

const NONE: readonly string[] = [];

const HOLD = 0.2;
const LAG = 0.035;
const TRAIL = 0.05;
const LAND = 0.22;
const FLASH = 0.06;
const GONE = 0.14;

interface Motion {
  sx: Spring;
  sy: Spring;
  pop: Spring;
  squash: Spring;
  tilt: Spring;
  wait: number;
  jump: boolean;
  still: boolean;
}

const makeMotion = () => {
  const motion: Motion = {
    jump: false,
    pop: new Spring(1, 520, 18),
    squash: new Spring(1, 600, 13),
    still: true,
    sx: new Spring(0, 320, 23),
    sy: new Spring(0, 320, 23),
    tilt: new Spring(0, 260, 10),
    wait: 0,
  };

  return motion;
};

interface Place {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Ghost {
  el: HTMLElement;
  upper: HTMLElement;
  lower: HTMLElement;
  age: number;
  part: Spring;
  size: Spring;
  plain: boolean;
}

interface Ask {
  added: ReadonlySet<string>;
  removed: string | null;
  rest: string;
  height: number;
}

const near = (s: Spring, to: number, by: number) =>
  Math.abs(s.x - to) < by && Math.abs(s.v) < by * 10;

const pose = (el: HTMLElement, m: Motion, smear = 0.0004) => {
  if (
    near(m.sx, 0, 0.05) &&
    near(m.sy, 0, 0.05) &&
    near(m.pop, 1, 0.001) &&
    near(m.squash, 1, 0.001) &&
    near(m.tilt, 0, 0.02) &&
    m.wait <= 0
  ) {
    m.still = true;
    el.style.transform = "";

    return;
  }

  const stretch = 1 + Math.min(0.3, Math.abs(m.sx.v) * smear);
  const trail = (-Math.sign(m.sx.v) * (stretch - 1) * el.offsetWidth) / 2;
  const p = m.pop.x;
  const q = m.squash.x;
  el.style.transform = `translate(${(m.sx.x + trail).toFixed(2)}px, ${m.sy.x.toFixed(2)}px) rotate(${m.tilt.x.toFixed(2)}deg) scale(${(p * stretch * (1 + (1 - q) * 0.5)).toFixed(3)}, ${((p * q) / Math.sqrt(stretch)).toFixed(3)})`;
};

const advance = (m: Motion, dt: number) => {
  if (m.wait > 0) {
    m.wait -= dt;
  } else if (m.jump) {
    m.jump = false;
    m.sx.x = 0;
    m.sy.x = 0;
  } else {
    m.sx.step(dt);
    m.sy.step(dt);
  }

  m.pop.step(dt);
  m.squash.step(dt);
  m.tilt.step(dt);
};

const sendBack = (
  el: HTMLElement,
  m: Motion,
  old: { left: number; top: number },
  wait: number,
  smear?: number,
) => {
  const dx = old.left - el.offsetLeft;
  const dy = old.top - el.offsetTop;

  if (dx === 0 && dy === 0) {
    return false;
  }

  m.sx.x = dx;
  m.sy.x = dy;
  m.wait = wait;
  m.still = false;
  pose(el, m, smear);

  return true;
};

const cutApart = (g: Ghost, dt: number) => {
  g.age += dt;
  const flash = g.plain ? 0 : FLASH;
  const gone = g.plain ? 0 : GONE;
  g.el.toggleAttribute("data-inv", g.age < flash);
  const o = g.plain || g.age < flash ? 0 : g.part.step(dt);

  if (g.age >= gone) {
    g.size.to = 0;
  }

  const s = Math.max(0, g.size.step(dt));
  g.upper.style.transform = `translate(${(o * 7).toFixed(2)}px, ${(o * -5).toFixed(2)}px) rotate(${(o * -6).toFixed(2)}deg) scale(${s.toFixed(3)})`;
  g.lower.style.transform = `translate(${(o * -5).toFixed(2)}px, ${(o * 6).toFixed(2)}px) rotate(${(o * 5).toFixed(2)}deg) scale(${s.toFixed(3)})`;

  return g.age >= gone && s < 0.04;
};

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

const keysOf = (tags: readonly string[]) => {
  const seen = new Map<string, number>();

  return tags.map((tag) => {
    const n = seen.get(tag) ?? 0;
    seen.set(tag, n + 1);

    return { key: n === 0 ? tag : `${tag}\n${n}`, tag };
  });
};

const CHIP =
  "inline-flex max-w-full items-center gap-[2px] rounded-[9px] bg-(--sk-card) py-[2px] pr-[3px] pl-[10px] text-[14px] leading-[1.2] font-bold text-(--sk-ink) border-[2.4px] border-(--sk-ink) shadow-[2.5px_3px_0_var(--sk-soft)]";

const CROSS =
  "grid h-[21px] w-[21px] flex-none place-items-center rounded-full text-(--sk-ink) group-data-inv:text-(--sk-card)";

const HALF =
  "absolute inset-0 group-data-inv:bg-(--sk-ink) group-data-inv:text-(--sk-card) will-change-transform";

const UPPER =
  "[clip-path:polygon(-12px_-12px,calc(100%+12px)_-12px,calc(100%+12px)_14%,100%_14%,0_86%,-12px_86%)]";

const LOWER =
  "[clip-path:polygon(-12px_86%,0_86%,100%_14%,calc(100%+12px)_14%,calc(100%+12px)_calc(100%+12px),-12px_calc(100%+12px))]";

const FACE =
  "pointer-events-none absolute h-[4.8px] origin-left bg-(--sk-ink) group-data-inv:bg-(--sk-card)";

const halfOf = (chip: HTMLElement, side: string, place: Place, plain: boolean) => {
  const half = chip.cloneNode(true);

  if (!(half instanceof HTMLElement)) {
    return null;
  }

  delete half.dataset.chip;
  half.style.transform = "";
  half.classList.add(...HALF.split(" "), side);
  const rise = place.height * 0.72;
  const face = document.createElement("span");
  face.className = FACE;
  face.style.left = "-2.4px";
  face.style.top = `${(place.height * 0.86 - 4.8).toFixed(2)}px`;
  face.style.width = `${Math.hypot(place.width, rise).toFixed(2)}px`;
  face.style.transform = `rotate(${(-Math.atan2(rise, place.width)).toFixed(4)}rad)`;

  if (!plain) {
    half.append(face);
  }

  return half;
};

const cutCopy = (layer: HTMLElement, chip: HTMLElement, place: Place) => {
  const el = document.createElement("span");
  const plain = isCalm();
  const upper = halfOf(chip, UPPER, place, plain);
  const lower = halfOf(chip, LOWER, place, plain);

  if (!upper || !lower) {
    return null;
  }

  el.className = "group absolute";
  el.inert = true;

  if (!plain) {
    el.dataset.inv = "";
  }

  el.style.left = `${place.left}px`;
  el.style.top = `${place.top}px`;
  el.style.width = `${place.width}px`;
  el.style.height = `${place.height}px`;
  el.append(upper, lower);
  layer.append(el);
  const part = new Spring(0, 300, 14);
  part.to = 1;

  return { age: 0, el, lower, part, plain, size: new Spring(1, 500, 26), upper };
};

const Cross = () => (
  <svg
    aria-hidden
    viewBox="0 0 10 10"
    className="h-[9px] w-[9px] overflow-visible fill-none stroke-current stroke-[2.6] [stroke-linecap:round]"
  >
    <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" />
  </svg>
);

const SakugaChips = ({
  value,
  defaultValue = NONE,
  onValueChange,
  name,
  disabled = false,
  max,
  className,
  children,
  ...props
}: SakugaChipsProps) => {
  const [own, setOwn] = useState<readonly string[]>(defaultValue);
  const tags = value ?? own;
  const keyed = keysOf(tags);

  const field = useRef<HTMLDivElement>(null);
  const entry = useRef<HTMLInputElement>(null);
  const cutLayer = useRef<HTMLSpanElement>(null);
  const status = useRef<HTMLOutputElement>(null);
  const chipEls = useRef(new Map<string, HTMLElement>());
  const chips = useRef<Map<string, HTMLElement> | null>(null);
  const motions = useRef(new Map<string, Motion>());
  const ghosts = useRef(new Set<Ghost>());
  const before = useRef<Map<string, Place> | null>(null);
  const boxBefore = useRef<{ left: number; top: number } | null>(null);
  const asked = useRef<Ask | null>(null);
  const follow = useRef(makeMotion());
  const give = useRef(new Spring(1, 700, 16));
  const shake = useRef(new Spring(0, 700, 14));
  const quiet = useRef(false);
  const spoke = useRef(-9);
  const ruler = useRef<CanvasRenderingContext2D | null>(null);

  const tell = (text: string) => {
    if (status.current) {
      status.current.textContent = text;
    }
  };

  const speak = () => {
    if (clock.now - spoke.current < 0.9) {
      return false;
    }

    spoke.current = clock.now;

    return true;
  };

  const arrive = (el: HTMLElement, m: Motion) => {
    const box = field.current;

    if (!box) {
      return;
    }

    const c = at(el);
    const f = at(box, 0.5, 0);
    m.pop.x = 0.5;
    m.squash.x = 0.74;
    m.still = false;
    pose(el, m);
    puff(c.x, c.y + c.h / 2 + 9, { life: 0.45, n: 3, size: 5, vy: 3 });

    if (speak()) {
      sfx("pon", c.x + 16, f.y - 30, { life: 0.8, rot: 0.06, size: 80, ...hollow() });
    }
  };

  const cutAway = (chip: HTMLElement, place: Place, height: number) => {
    const box = field.current;
    const layer = cutLayer.current;

    if (!box || !layer) {
      return;
    }

    const ghost = cutCopy(layer, chip, place);

    if (!ghost) {
      return;
    }

    ghosts.current.add(ghost);
    box.style.minHeight = `${height}px`;
    const f = at(box, 0, 0);
    const x = f.x + box.clientLeft + place.left + place.width / 2;
    const y = f.y + box.clientTop + place.top + place.height / 2;
    slash(x, y, { ang: -0.36, len: place.width + 64, life: 0.3, thick: 10 });

    if (speak()) {
      sfx("shu", x + 6, f.y - 32, {
        col: "#5a4fd8",
        edge: "#ffffff",
        life: 0.75,
        rot: -0.16,
        size: 92,
      });
    }

    later(FLASH * 1000, () =>
      shards(x + 6, y - 2, {
        arc: 0.9,
        dir: -0.36,
        grav: 300,
        life: 0.5,
        n: 2,
        size: 4,
        speed: 80,
      }),
    );
  };

  const settle = (found: Map<string, HTMLElement>, old: Map<string, HTMLElement>) => {
    const why = asked.current;
    const was = before.current;
    const added: string[] = [];

    for (const [key, el] of found) {
      const m = motions.current.get(key);

      if (m && !old.has(key) && why?.added.has(key)) {
        arrive(el, m);
        added.push(key);
      }
    }

    for (const [key, el] of old) {
      const place = was?.get(key);

      if (!found.has(key) && why?.removed === key && place) {
        cutAway(el, place, why.height);
        tell(`Removed ${key}`);
      }
    }

    if (added.length > 0) {
      for (const g of ghosts.current) {
        g.el.remove();
      }

      ghosts.current.clear();
    }

    if (added.length > 0 && why && entry.current) {
      entry.current.value = why.rest;
      tell(`Added ${added.join(", ")}`);
    }

    return added.length > 0;
  };

  useLayoutEffect(() => {
    const box = field.current;
    const inp = entry.current;

    if (!box || !inp) {
      return;
    }

    const found = new Map<string, HTMLElement>();

    for (const { key } of keyed) {
      const el = chipEls.current.get(key);

      if (el) {
        found.set(key, el);

        if (!motions.current.has(key)) {
          motions.current.set(key, makeMotion());
        }
      }
    }

    const old = chips.current;
    chips.current = found;
    const was = before.current;
    const stood = boxBefore.current;
    const grew = old ? settle(found, old) : false;
    before.current = null;
    boxBefore.current = null;
    asked.current = null;
    let moved = 0;

    for (const [key, el] of found) {
      const m = motions.current.get(key);
      const place = was?.get(key);

      if (m && place && sendBack(el, m, place, HOLD + moved * LAG)) {
        moved += 1;
      }
    }

    const f = follow.current;

    if (grew) {
      f.sx.x = 0;
      f.sy.x = 0;
      f.sx.v = 0;
      f.sy.v = 0;
      f.wait = 0;
      f.jump = false;
      pose(inp, f, 0);
    } else if (stood && sendBack(inp, f, stood, HOLD + moved * LAG + TRAIL, 0)) {
      f.jump = f.sy.x !== 0;
      f.wait += f.jump ? LAND : 0;
    }

    for (const key of motions.current.keys()) {
      if (!found.has(key)) {
        motions.current.delete(key);
      }
    }
  });

  useFrame((dt) => {
    const box = field.current;

    if (box) {
      const y = give.current.step(dt);
      const x = shake.current.step(dt);
      box.style.transform =
        Math.abs(y - 1) < 0.0006 && Math.abs(x) < 0.05
          ? ""
          : `translateX(${x.toFixed(2)}px) scale(${y})`;
    }

    for (const [key, m] of motions.current) {
      const el = chips.current?.get(key);

      if (el && !m.still) {
        advance(m, dt);
        pose(el, m);
      }
    }

    if (entry.current && !follow.current.still) {
      advance(follow.current, dt);
      pose(entry.current, follow.current, 0);
    }

    for (const g of ghosts.current) {
      if (cutApart(g, dt)) {
        g.el.remove();
        ghosts.current.delete(g);
      }
    }

    if (
      box &&
      box.style.minHeight !== "" &&
      ghosts.current.size === 0 &&
      Math.abs(follow.current.sy.x) < 3
    ) {
      box.style.minHeight = "";
    }
  });

  const ask = (next: string[], why: Omit<Ask, "height">) => {
    const places = new Map<string, Place>();

    for (const [key, el] of chips.current ?? []) {
      const m = motions.current.get(key);
      places.set(key, {
        height: el.offsetHeight,
        left: el.offsetLeft + (m?.sx.x ?? 0),
        top: el.offsetTop + (m?.sy.x ?? 0),
        width: el.offsetWidth,
      });
    }

    before.current = places;
    const inp = entry.current;

    if (inp) {
      boxBefore.current = {
        left: inp.offsetLeft + follow.current.sx.x,
        top: inp.offsetTop + follow.current.sy.x,
      };
    }

    asked.current = { ...why, height: field.current?.offsetHeight ?? 0 };
    setOwn(next);
    onValueChange?.(next);
  };

  const jolt = (key: string) => {
    const el = chips.current?.get(key);
    const m = motions.current.get(key);

    if (!el || !m) {
      return;
    }

    const c = at(el);
    m.tilt.x = -9;
    m.squash.x = 0.82;
    m.still = false;
    ticks(c.x, c.y - c.h / 2 - 5, { dir: -Math.PI / 2, fan: 0.5, len: 11, life: 0.4, n: 3, r: 4 });
  };

  const refuse = () => {
    const box = field.current;

    if (!box) {
      return;
    }

    const c = at(box);
    shake.current.x = 7;
    wob(c.x - c.w / 2 - 8, c.y, { dir: -1 });
    wob(c.x + c.w / 2 + 8, c.y, { dir: 1 });
  };

  const add = (words: readonly string[], tail: string) => {
    const next = [...tags];
    const kept: string[] = [];

    for (const word of words) {
      const tag = word.trim();
      const twin = keyed.find((k) => same(k.tag, tag));
      const fits = tag !== "" && !next.some((t) => same(t, tag));

      if (twin) {
        jolt(twin.key);
        tell(`${twin.tag} is already added`);
        kept.push(tag);
      } else if (fits && max !== undefined && next.length >= max) {
        refuse();
        tell(`No more than ${max} tags`);
        kept.push(tag);
      } else if (fits) {
        next.push(tag);
      }
    }

    const rest = [...kept, tail.trim()].filter((word) => word !== "").join(", ");

    if (next.length > tags.length) {
      ask(next, { added: new Set(next.slice(tags.length)), removed: null, rest });
    } else if (entry.current && words.length > 1) {
      entry.current.value = rest;
    }
  };

  const remove = (key: string) => {
    ask(
      keyed.filter((k) => k.key !== key).map((k) => k.tag),
      { added: new Set(), removed: key, rest: "" },
    );

    if (document.activeElement !== entry.current) {
      quiet.current = true;
      entry.current?.focus();
      quiet.current = false;
    }
  };

  const dust = (inp: HTMLInputElement) => {
    const m = ruler.current ?? document.createElement("canvas").getContext("2d");
    ruler.current = m;

    if (!m) {
      return;
    }

    const cs = getComputedStyle(inp);
    m.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const shown = inp.value.slice(0, inp.selectionStart ?? inp.value.length);
    const c = at(inp, 0, 0.5);
    const x = c.x + 2 + Math.min(c.w - 4, m.measureText(shown).width);
    give.current.x = 0.985;
    const size = rnd(4, 6);
    const vx = rnd(-10, 10);
    puff(x, c.y + 10, { life: 0.4, n: 2, size, vx, vy: -22 });

    if (rnd() < 0.35) {
      shards(x, c.y + 6, { life: 0.5, n: 2, size: 3, speed: 110 });
    }
  };

  const change = (e: ChangeEvent<HTMLInputElement>) => {
    const inp = e.currentTarget;

    if (inp.value.includes(",")) {
      const words = inp.value.split(",");
      const tail = words.pop() ?? "";
      add([...words, ""], tail);

      return;
    }

    dust(inp);
  };

  const keyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const inp = e.currentTarget;
    const last = keyed.at(-1);

    if (e.nativeEvent.isComposing) {
      return;
    }

    if (e.key === "Enter" && inp.value.trim() !== "") {
      e.preventDefault();
      add([inp.value], "");
    } else if (e.key === "Backspace" && inp.value === "" && last) {
      e.preventDefault();
      remove(last.key);
    }
  };

  const focus = () => {
    const box = field.current;

    if (!box || quiet.current) {
      return;
    }

    const c = at(box, 1, 0);
    give.current.x = 1.04;
    ticks(c.x - 6, c.y - 4, { dir: -1.05, fan: 0.36, len: 17, life: 0.5, n: 3, r: 5 });
  };

  const pointerDown = (e: PointerEvent<HTMLElement>) => {
    if (e.target !== entry.current && !disabled) {
      e.preventDefault();

      if (!(e.target instanceof Element && e.target.closest("button"))) {
        entry.current?.focus();
      }
    }
  };

  const controlled = value !== undefined;
  const initial = useRef(defaultValue);
  useEffect(() => {
    const form = status.current?.form;

    if (!form || controlled) {
      return;
    }

    const restore = () => setOwn(initial.current);
    form.addEventListener("reset", restore);

    return () => form.removeEventListener("reset", restore);
  }, [controlled]);

  const live = useRef({ change, focus, keyDown, pointerDown, remove });
  useLayoutEffect(() => {
    live.current = { change, focus, keyDown, pointerDown, remove };
  });

  const parts = useMemo<Chips>(
    () => ({
      change: (e) => live.current.change(e),
      chipElsRef: chipEls,
      cutLayerRef: cutLayer,
      disabled,
      entryRef: entry,
      fieldRef: field,
      focus: () => live.current.focus(),
      keyDown: (e) => live.current.keyDown(e),
      keyed,
      pointerDown: (e) => live.current.pointerDown(e),
      remove: (key) => live.current.remove(key),
    }),
    [disabled, keyed],
  );

  return (
    <span
      data-slot="sakuga-chips"
      data-disabled={disabled ? "" : undefined}
      className={cn(
        "relative isolate inline-block w-[270px] max-w-full align-middle text-[15px] leading-[1.4] font-medium text-(--sk-ink)",
        FONT_BODY,
        className,
      )}
      {...props}
    >
      <SakugaStyle />
      <ChipsContext value={parts}>{children}</ChipsContext>
      {name !== undefined &&
        keyed.map(({ key, tag }) => (
          <input key={key} type="hidden" name={name} value={tag} disabled={disabled} />
        ))}
      <output ref={status} className="sr-only" />
    </span>
  );
};

const SakugaChipRemove = ({ className, children, onClick, ...props }: ComponentProps<"button">) => {
  const { disabled, remove } = useChips();
  const { key, tag } = useChip();

  return (
    <button
      type="button"
      data-slot="sakuga-chip-remove"
      aria-label={`Remove ${tag}`}
      disabled={disabled}
      data-disabled={disabled ? "" : undefined}
      className={cn(
        CROSS,
        "cursor-pointer hover:bg-(--sk-soft) focus-visible:outline-[2.5px] focus-visible:outline-offset-[1px] focus-visible:outline-(--sk-acc) data-disabled:cursor-not-allowed",
        className,
      )}
      {...props}
      onClick={(e) => {
        onClick?.(e);

        if (!e.defaultPrevented) {
          remove(key);
        }
      }}
    >
      {children ?? <Cross />}
    </button>
  );
};

const SakugaChip = ({ className, children, ref, ...props }: ComponentProps<"span">) => {
  const { chipElsRef } = useChips();
  const { key, tag } = useChip();

  const enrol = useCallback(
    (node: HTMLSpanElement | null) => {
      if (!node) {
        return;
      }

      const els = chipElsRef.current;
      els.set(key, node);

      return () => {
        els.delete(key);
      };
    },
    [chipElsRef, key],
  );

  return (
    <span
      ref={useMergedRef(enrol, ref)}
      data-slot="sakuga-chip"
      data-chip={key}
      className={cn(CHIP, "will-change-transform", className)}
      {...props}
    >
      {children ?? (
        <>
          <span className="truncate">{tag}</span>
          <SakugaChipRemove />
        </>
      )}
    </span>
  );
};

const plainChip = () => <SakugaChip />;

const SakugaChipsList = ({
  className,
  children,
  renderChip = plainChip,
  onPointerDown,
  ref,
  "aria-label": label,
  "aria-labelledby": labelledBy,
  ...props
}: ComponentProps<"div"> & {
  renderChip?: (tag: string) => ReactNode;
}) => {
  const { keyed, disabled, fieldRef, cutLayerRef, pointerDown } = useChips();

  return (
    <div
      ref={useMergedRef(fieldRef, ref)}
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a <fieldset> paints its border by the browser's own fieldset rules, which moves pixels along the 3.2px edge; a div with the group role draws like every other card
      role="group"
      data-slot="sakuga-chips-list"
      data-disabled={disabled ? "" : undefined}
      aria-label={labelledBy === undefined ? (label ?? "Tags") : label}
      aria-labelledby={labelledBy}
      className={cn(
        "relative flex cursor-text flex-wrap content-start items-center gap-x-[7px] gap-y-[8px] rounded-(--sk-r) bg-(--sk-card) px-[11px] py-[10px] shadow-(--sk-sh) will-change-transform border-[length:var(--sk-bw)] border-(--sk-ink) has-[input:focus-visible]:outline-[2.5px] has-[input:focus-visible]:outline-offset-[3px] has-[input:focus-visible]:outline-(--sk-acc) has-[input:focus-visible]:outline-solid data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
      {...props}
      onPointerDown={(e) => {
        onPointerDown?.(e);
        pointerDown(e);
      }}
    >
      {keyed.map((chip) => (
        <ChipContext key={chip.key} value={chip}>
          {renderChip(chip.tag)}
        </ChipContext>
      ))}
      {children}
      <span ref={cutLayerRef} aria-hidden className="pointer-events-none absolute inset-0 z-10" />
    </div>
  );
};

const SakugaChipsInput = ({
  className,
  onChange,
  onKeyDown,
  onFocus,
  ref,
  "aria-label": label,
  "aria-labelledby": labelledBy,
  ...props
}: Omit<ComponentProps<"input">, "value" | "defaultValue" | "type">) => {
  const { disabled, entryRef, change, keyDown, focus } = useChips();

  return (
    <input
      ref={useMergedRef(entryRef, ref)}
      type="text"
      data-slot="sakuga-chips-input"
      aria-label={labelledBy === undefined ? (label ?? "Tags") : label}
      aria-labelledby={labelledBy}
      disabled={disabled}
      data-disabled={disabled ? "" : undefined}
      autoComplete="off"
      enterKeyHint="done"
      className={cn(
        "h-[30px] w-0 min-w-[84px] flex-1 bg-transparent px-[2px] text-[16px] font-semibold text-(--sk-ink) caret-(--sk-ink) outline-none placeholder:text-(--sk-dim) data-disabled:cursor-not-allowed",
        className,
      )}
      {...props}
      onChange={(e) => {
        onChange?.(e);
        change(e);
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);

        if (!e.defaultPrevented) {
          keyDown(e);
        }
      }}
      onFocus={(e) => {
        onFocus?.(e);
        focus();
      }}
    />
  );
};

export { SakugaChips, SakugaChipsList, SakugaChip, SakugaChipRemove, SakugaChipsInput };
