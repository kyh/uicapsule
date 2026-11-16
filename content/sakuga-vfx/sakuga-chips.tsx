"use client";

// Sakuga Chips: a tag input. Type a tag and press Enter and it pops into the row with a puff under it
// and a hollow ポン. Remove one and a crescent cuts it in two with シュッ: it flashes ink, the halves
// slip apart and shrink away with a few chips of crystal, and the tags after it slide over to close
// the gap, stretching as they go. A tag that is already there just shakes its head.

import { useLayoutEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent, PointerEvent } from "react";

import {
  Spring,
  at,
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
import { FONT_BODY, SakugaStyle, useFrame } from "./sakuga-react";

export interface SakugaChipsProps {
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: string[]) => void;
  // with a name, every tag is sent with its form under it
  name?: string;
  // what a screen reader calls the field
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  // the most tags it takes
  max?: number;
  className?: string;
}

const DEFAULT_VALUE: readonly string[] = ["Ink", "Paper"];

// how long the tags after a cut one wait before they close the gap
const HOLD = 0.17;
const LAG = 0.035;
// how long a cut tag stays ink, and when its halves start to shrink
const FLASH = 0.06;
const GONE = 0.14;

interface Motion {
  // how far it still is from where the layout has it
  sx: Spring;
  sy: Spring;
  pop: Spring;
  squash: Spring;
  tilt: Spring;
  wait: number;
  still: boolean;
}

const makeMotion = (): Motion => ({
  pop: new Spring(1, 520, 18),
  squash: new Spring(1, 600, 13),
  still: true,
  sx: new Spring(0, 320, 23),
  sy: new Spring(0, 320, 23),
  tilt: new Spring(0, 260, 10),
  wait: 0,
});

interface Ghost {
  id: number;
  tag: string;
  left: number;
  top: number;
  width: number;
}

interface GhostRig {
  age: number;
  part: Spring;
  size: Spring;
}

const near = (s: Spring, to: number, by: number) =>
  Math.abs(s.x - to) < by && Math.abs(s.v) < by * 10;

// put a tag where its springs say; the stretch comes from its speed and trails behind it
const pose = (el: HTMLElement, m: Motion, smear = 0.0007) => {
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
  } else {
    m.sx.step(dt);
    m.sy.step(dt);
  }
  m.pop.step(dt);
  m.squash.step(dt);
  m.tilt.step(dt);
};

// a tag (or the text box) the layout has just moved: put it back where it stood, wait, then let go
const sendBack = (
  el: HTMLElement,
  m: Motion,
  old: { left: number; top: number },
  wait: number,
  smear?: number,
) => {
  const dx = old.left - el.offsetLeft;
  const dy = old.top - el.offsetTop;
  if ((dx === 0 && dy === 0) || isCalm()) {
    return false;
  }
  m.sx.x = dx;
  m.sy.x = dy;
  m.wait = wait;
  m.still = false;
  pose(el, m, smear);
  return true;
};

// the cut tag: ink for the impact frame, then the halves slip along the cut and shrink away.
// True once it is gone.
const cutApart = (el: HTMLElement | undefined, g: GhostRig, dt: number) => {
  const [upper, lower] = el ? [...el.children] : [];
  g.age += dt;
  if (!(el && upper instanceof HTMLElement && lower instanceof HTMLElement)) {
    return g.age > 1;
  }
  el.toggleAttribute("data-inv", g.age < FLASH);
  const o = g.age < FLASH ? 0 : g.part.step(dt);
  if (g.age >= GONE) {
    g.size.to = 0;
  }
  const s = Math.max(0, g.size.step(dt));
  upper.style.transform = `translate(${(o * 7).toFixed(2)}px, ${(o * -5).toFixed(2)}px) rotate(${(o * -6).toFixed(2)}deg) scale(${s.toFixed(3)})`;
  lower.style.transform = `translate(${(o * -5).toFixed(2)}px, ${(o * 6).toFixed(2)}px) rotate(${(o * 5).toFixed(2)}deg) scale(${s.toFixed(3)})`;
  return g.age >= GONE && s < 0.04;
};

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

const CHIP =
  "inline-flex max-w-full items-center gap-[2px] rounded-[9px] bg-(--sk-card) py-[2px] pr-[3px] pl-[10px] text-[14px] leading-[1.2] font-bold text-(--sk-ink) shadow-[2.5px_3px_0_var(--sk-soft)] [border:2.4px_solid_var(--sk-ink)]";
const CROSS =
  "grid h-[21px] w-[21px] flex-none place-items-center rounded-full text-(--sk-ink) group-data-inv:text-(--sk-card)";
// the two sides of the cut; they reach past the tag so its shadow is kept
const HALF = "group-data-inv:bg-(--sk-ink) group-data-inv:text-(--sk-card) will-change-transform";
const UPPER =
  "[clip-path:polygon(-12px_-12px,calc(100%+12px)_-12px,calc(100%+12px)_14%,-12px_86%)]";
const LOWER =
  "[clip-path:polygon(-12px_86%,calc(100%+12px)_14%,calc(100%+12px)_calc(100%+12px),-12px_calc(100%+12px))]";

const Cross = () => (
  <svg
    aria-hidden
    viewBox="0 0 10 10"
    className="h-[9px] w-[9px] overflow-visible fill-none stroke-current stroke-[2.6] [stroke-linecap:round]"
  >
    <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" />
  </svg>
);

export const SakugaChips = ({
  value,
  defaultValue = DEFAULT_VALUE,
  onValueChange,
  name,
  label = "Tags",
  placeholder = "Add a tag",
  disabled = false,
  max,
  className = "",
}: SakugaChipsProps) => {
  const [own, setOwn] = useState<readonly string[]>(defaultValue);
  const [ghosts, setGhosts] = useState<readonly Ghost[]>([]);
  const [said, setSaid] = useState("");
  const tags = value ?? own;

  const field = useRef<HTMLDivElement>(null);
  const entry = useRef<HTMLInputElement>(null);
  const chips = useRef(new Map<string, HTMLElement>());
  const cut = useRef(new Map<number, HTMLElement>());
  const motions = useRef(new Map<string, Motion>());
  const ghostRigs = useRef(new Map<number, GhostRig>());
  // where every tag was just before a change, and the tags that change added
  const before = useRef<Map<string, { left: number; top: number }> | null>(null);
  const boxBefore = useRef<{ left: number; top: number } | null>(null);
  // the text box follows the tags over
  const follow = useRef(makeMotion());
  const fresh = useRef(new Set<string>());
  const give = useRef(new Spring(1, 700, 16));
  const shake = useRef(new Spring(0, 700, 14));
  const quiet = useRef(false);
  const ids = useRef(0);
  const ruler = useRef<CanvasRenderingContext2D | null>(null);

  // a new tag pops in
  const arrive = (el: HTMLElement, m: Motion) => {
    const box = field.current;
    if (!box || isCalm()) {
      return;
    }
    const c = at(el);
    const f = at(box, 0.5, 0);
    m.pop.x = 0.5;
    m.squash.x = 0.74;
    m.still = false;
    puff(c.x, c.y + c.h / 2 + 9, { life: 0.45, n: 3, size: 5, vy: 3 });
    sfx("pon", c.x + 16, f.y - 30, { life: 0.8, rot: 0.06, size: 80, ...hollow() });
  };

  // after every render: find the tags, start the new ones, and send the moved ones back to where
  // they were so their springs can bring them over
  useLayoutEffect(() => {
    const box = field.current;
    if (!box) {
      return;
    }
    const found = new Map<string, HTMLElement>();
    for (const el of box.querySelectorAll<HTMLElement>("[data-chip]")) {
      found.set(el.dataset.chip ?? "", el);
    }
    chips.current = found;
    const halves = new Map<number, HTMLElement>();
    for (const el of box.querySelectorAll<HTMLElement>("[data-ghost]")) {
      halves.set(Number(el.dataset.ghost), el);
    }
    cut.current = halves;
    const was = before.current;
    before.current = null;
    let moved = 0;
    for (const [tag, el] of found) {
      let m = motions.current.get(tag);
      if (!m) {
        m = makeMotion();
        motions.current.set(tag, m);
      }
      const old = was?.get(tag);
      if (fresh.current.has(tag)) {
        arrive(el, m);
        pose(el, m);
      } else if (old && sendBack(el, m, old, HOLD + moved * LAG)) {
        // each one sets off a beat after the one before it
        moved += 1;
      }
    }
    const inp = entry.current;
    const stood = boxBefore.current;
    boxBefore.current = null;
    // the text box follows the tags over; after an add it only slides along its own row, so it
    // never comes out from under the tag that has just landed where it was
    const added = fresh.current.size > 0;
    if (inp && stood && (!added || stood.top === inp.offsetTop)) {
      sendBack(inp, follow.current, stood, added ? 0 : HOLD + moved * LAG, 0);
    }
    fresh.current.clear();
    for (const tag of motions.current.keys()) {
      if (!found.has(tag)) {
        motions.current.delete(tag);
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
    for (const [tag, m] of motions.current) {
      const el = chips.current.get(tag);
      if (el && !m.still) {
        advance(m, dt);
        pose(el, m);
      }
    }
    if (entry.current && !follow.current.still) {
      advance(follow.current, dt);
      pose(entry.current, follow.current, 0);
    }
    // the field lets go of its height once the cut tag has gone and the text box is back on its row
    if (
      box &&
      box.style.minHeight !== "" &&
      ghostRigs.current.size === 0 &&
      Math.abs(follow.current.sy.x) < 3
    ) {
      box.style.minHeight = "";
    }
    const over: number[] = [];
    for (const [id, g] of ghostRigs.current) {
      if (cutApart(cut.current.get(id), g, dt)) {
        over.push(id);
      }
    }
    if (over.length > 0) {
      for (const id of over) {
        ghostRigs.current.delete(id);
      }

      setGhosts((list) => list.filter((g) => !over.includes(g.id)));
    }
  });

  const commit = (next: string[]) => {
    const places = new Map<string, { left: number; top: number }>();
    for (const [tag, el] of chips.current) {
      const m = motions.current.get(tag);
      places.set(tag, {
        left: el.offsetLeft + (m?.sx.x ?? 0),
        top: el.offsetTop + (m?.sy.x ?? 0),
      });
    }
    before.current = places;
    const inp = entry.current;
    if (inp) {
      boxBefore.current = { left: inp.offsetLeft + follow.current.sx.x, top: inp.offsetTop };
    }
    setOwn(next);
    onValueChange?.(next);
  };

  // it is already there: the one that is shakes its head
  const jolt = (tag: string) => {
    const el = chips.current.get(tag);
    const m = motions.current.get(tag);
    if (!el || !m) {
      return;
    }
    const c = at(el);
    m.tilt.x = -9;
    m.squash.x = 0.82;
    m.still = false;
    // wedges over it, not wobble marks beside it: there the neighbours and the typed text are
    ticks(c.x, c.y - c.h / 2 - 5, { dir: -Math.PI / 2, fan: 0.5, len: 11, life: 0.4, n: 3, r: 4 });
  };

  // it is full: the whole field shakes
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

  // add what was typed; true if all of it went in
  const add = (words: readonly string[]) => {
    const next = [...tags];
    let all = true;
    for (const word of words) {
      const tag = word.trim();
      const twin = next.find((t) => same(t, tag));
      if (twin !== undefined) {
        jolt(twin);
        all = false;
      } else if (max !== undefined && next.length >= max) {
        refuse();
        all = false;
      } else if (tag !== "") {
        next.push(tag);
        fresh.current.add(tag);
      }
    }
    if (next.length > tags.length) {
      setSaid(`Added ${next.slice(tags.length).join(", ")}`);
      commit(next);
    }
    return all;
  };

  const remove = (tag: string) => {
    const el = chips.current.get(tag);
    const box = field.current;
    const m = motions.current.get(tag);
    if (el && box && !isCalm()) {
      // the tag is out of the value at once; what is cut is a copy left where it stood
      ids.current += 1;
      const id = ids.current;
      ghostRigs.current.set(id, {
        age: 0,
        part: new Spring(0, 300, 14),
        size: new Spring(1, 500, 26),
      });
      // the field keeps its height until the cut one has gone, so it is never cut outside it
      box.style.minHeight = `${box.offsetHeight}px`;
      const ghost = {
        id,
        left: el.offsetLeft + (m?.sx.x ?? 0),
        tag,
        top: el.offsetTop + (m?.sy.x ?? 0),
        width: el.offsetWidth,
      };
      setGhosts((list) => [...list, ghost]);
      for (const part of ghostRigs.current.values()) {
        part.part.to = 1;
      }
      const c = at(el);
      const f = at(box, 0.5, 0);
      slash(c.x, c.y, { ang: -0.36, len: c.w + 64, life: 0.4, thick: 10 });
      sfx("shu", c.x + 6, f.y - 32, {
        col: "#5a4fd8",
        edge: "#ffffff",
        life: 0.75,
        rot: -0.16,
        size: 92,
      });
      later(FLASH * 1000, () =>
        shards(c.x, c.y + 4, {
          arc: 2.2,
          dir: Math.PI / 2,
          grav: 380,
          life: 0.6,
          n: 3,
          size: 4,
          speed: 90,
        }),
      );
    }
    setSaid(`Removed ${tag}`);
    commit(tags.filter((t) => t !== tag));
    if (document.activeElement !== entry.current) {
      quiet.current = true;
      entry.current?.focus();
      quiet.current = false;
    }
  };

  // every key kicks up a little dust where the caret is
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
    // size is drawn before vx, the order the input control draws them in
    const size = rnd(4, 6);
    const vx = rnd(-10, 10);
    puff(x, c.y + 10, { life: 0.4, n: 2, size, vx, vy: -22 });
    if (Math.random() < 0.35) {
      shards(x, c.y + 6, { life: 0.5, n: 2, size: 3, speed: 110 });
    }
  };

  const change = (e: ChangeEvent<HTMLInputElement>) => {
    const inp = e.currentTarget;
    if (inp.value.includes(",")) {
      // a comma ends a tag; what follows the last one stays in the box
      const words = inp.value.split(",");
      const rest = words.pop() ?? "";
      const kept = words.filter((word) => !add([word]));
      inp.value = [...kept, rest]
        .map((word) => word.trim())
        .filter((word) => word !== "")
        .join(", ");
      return;
    }
    dust(inp);
  };

  const keyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const inp = e.currentTarget;
    const last = tags.at(-1);
    if (e.key === "Enter" && inp.value.trim() !== "") {
      e.preventDefault();
      if (add([inp.value])) {
        inp.value = "";
      }
    } else if (e.key === "Backspace" && inp.value === "" && last !== undefined) {
      e.preventDefault();
      remove(last);
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

  // a press on the field's own paper goes to the box, and a press on a tag does not take focus from it
  const pointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.target !== entry.current && !disabled) {
      e.preventDefault();
      if (!(e.target instanceof Element && e.target.closest("button"))) {
        entry.current?.focus();
      }
    }
  };

  // the cut copies sit where their tags stood, out of the flow
  const places = new Map(ghosts.map((g) => [g.id, { left: g.left, top: g.top, width: g.width }]));

  return (
    <span
      className={`relative isolate inline-block w-[270px] max-w-full align-middle text-[15px] leading-[1.4] font-medium text-(--sk-ink) ${FONT_BODY} ${className}`}
    >
      <SakugaStyle />
      <div
        ref={field}
        className={`relative flex cursor-text flex-wrap content-start items-center gap-x-[7px] gap-y-[8px] rounded-(--sk-r) bg-(--sk-card) px-[11px] py-[10px] shadow-(--sk-sh) will-change-transform [border:var(--sk-bw)_solid_var(--sk-ink)] ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
        onPointerDown={pointerDown}
      >
        {tags.map((tag) => (
          <span key={tag} data-chip={tag} className={`${CHIP} will-change-transform`}>
            <span className="truncate">{tag}</span>
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              disabled={disabled}
              className={`${CROSS} cursor-pointer hover:bg-(--sk-soft) focus-visible:outline-[2.5px] focus-visible:outline-offset-[1px] focus-visible:outline-(--sk-acc) disabled:cursor-not-allowed`}
              onClick={() => remove(tag)}
            >
              <Cross />
            </button>
          </span>
        ))}
        <input
          ref={entry}
          type="text"
          aria-label={label}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          enterKeyHint="done"
          className="h-[30px] w-0 min-w-[84px] flex-1 bg-transparent px-[2px] text-[16px] font-semibold text-(--sk-ink) caret-(--sk-ink) outline-none placeholder:text-(--sk-dim) disabled:cursor-not-allowed"
          onChange={change}
          onKeyDown={keyDown}
          onFocus={focus}
        />
        {ghosts.map((g) => (
          <span
            key={g.id}
            data-ghost={g.id}
            aria-hidden
            className="group pointer-events-none absolute z-10"
            style={places.get(g.id)}
          >
            <span className={`${CHIP} ${HALF} ${UPPER} w-full`}>
              <span className="truncate">{g.tag}</span>
              <span className={CROSS}>
                <Cross />
              </span>
            </span>
            <span className={`${CHIP} ${HALF} ${LOWER} absolute inset-0`}>
              <span className="truncate">{g.tag}</span>
              <span className={CROSS}>
                <Cross />
              </span>
            </span>
          </span>
        ))}
      </div>
      {name !== undefined &&
        tags.map((tag) => <input key={tag} type="hidden" name={name} value={tag} />)}
      <output className="sr-only">{said}</output>
    </span>
  );
};
