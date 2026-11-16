"use client";

// Sakuga Chips: a tag input. Type a tag and press Enter and it pops into the row with a puff under it
// and a hollow ポン. Remove one and a crescent cuts it in two with シュッ: it flashes ink, the halves
// slip apart and shrink away with a few chips of crystal, and the tags after it slide over to close
// the gap, stretching as they go. A tag that is already there just shakes its head.
// The value changes at once; every reaction starts from the value that came back, so a parent that
// turns a change down sees none.

import { useLayoutEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent, PointerEvent } from "react";

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
import { FONT_BODY, SakugaStyle, useFrame } from "./sakuga-react";

export interface SakugaChipsProps {
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: string[]) => void;
  // with a name, every tag is sent with its form under it
  name?: string;
  // what a screen reader calls the field; aria-labelledby, when given, names it instead
  label?: string;
  "aria-labelledby"?: string;
  // goes on the text box, for a <label htmlFor>
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  // the most tags it takes
  max?: number;
  className?: string;
}

const NONE: readonly string[] = [];

// how long the tags after a cut one wait before they close the gap
const HOLD = 0.2;
const LAG = 0.035;
// the text box sets off this much later again, clear of the last tag's stretched tail
const TRAIL = 0.05;
// about how long a tag takes to get there
const LAND = 0.22;
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
  // when the wait is over it is simply there, with no slide
  jump: boolean;
  still: boolean;
}

const makeMotion = (): Motion => ({
  jump: false,
  pop: new Spring(1, 520, 18),
  squash: new Spring(1, 600, 13),
  still: true,
  sx: new Spring(0, 320, 23),
  sy: new Spring(0, 320, 23),
  tilt: new Spring(0, 260, 10),
  wait: 0,
});

interface Place {
  left: number;
  top: number;
  width: number;
  height: number;
}

// the copy of a tag that is being cut
interface Ghost {
  el: HTMLElement;
  upper: HTMLElement;
  lower: HTMLElement;
  age: number;
  part: Spring;
  size: Spring;
}

// what a key or a press has just asked of the value
interface Ask {
  added: ReadonlySet<string>;
  removed: string | null;
  // what the text box holds once the tags are in
  rest: string;
  height: number;
}

const near = (s: Spring, to: number, by: number) =>
  Math.abs(s.x - to) < by && Math.abs(s.v) < by * 10;

// put a tag where its springs say; the stretch comes from its speed and trails behind it
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
const cutApart = (g: Ghost, dt: number) => {
  g.age += dt;
  g.el.toggleAttribute("data-inv", g.age < FLASH);
  const o = g.age < FLASH ? 0 : g.part.step(dt);
  if (g.age >= GONE) {
    g.size.to = 0;
  }
  const s = Math.max(0, g.size.step(dt));
  g.upper.style.transform = `translate(${(o * 7).toFixed(2)}px, ${(o * -5).toFixed(2)}px) rotate(${(o * -6).toFixed(2)}deg) scale(${s.toFixed(3)})`;
  g.lower.style.transform = `translate(${(o * -5).toFixed(2)}px, ${(o * 6).toFixed(2)}px) rotate(${(o * 5).toFixed(2)}deg) scale(${s.toFixed(3)})`;
  return g.age >= GONE && s < 0.04;
};

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

// a tag's key is the tag; a value handed in with the same tag twice still gets one key each
const keysOf = (tags: readonly string[]) => {
  const seen = new Map<string, number>();
  return tags.map((tag) => {
    const n = seen.get(tag) ?? 0;
    seen.set(tag, n + 1);
    return { key: n === 0 ? tag : `${tag}\n${n}`, tag };
  });
};

const CHIP =
  "inline-flex max-w-full items-center gap-[2px] rounded-[9px] bg-(--sk-card) py-[2px] pr-[3px] pl-[10px] text-[14px] leading-[1.2] font-bold text-(--sk-ink) shadow-[2.5px_3px_0_var(--sk-soft)] [border:2.4px_solid_var(--sk-ink)]";
const CROSS =
  "grid h-[21px] w-[21px] flex-none place-items-center rounded-full text-(--sk-ink) group-data-inv:text-(--sk-card)";
// the two sides of the cut; they reach past the tag so its shadow is kept
const HALF =
  "absolute inset-0 group-data-inv:bg-(--sk-ink) group-data-inv:text-(--sk-card) will-change-transform";
const UPPER =
  "[clip-path:polygon(-12px_-12px,calc(100%+12px)_-12px,calc(100%+12px)_14%,100%_14%,0_86%,-12px_86%)]";
const LOWER =
  "[clip-path:polygon(-12px_86%,0_86%,100%_14%,calc(100%+12px)_14%,calc(100%+12px)_calc(100%+12px),-12px_calc(100%+12px))]";
// the ink line down each cut face
const FACE =
  "pointer-events-none absolute h-[4.8px] origin-left bg-(--sk-ink) group-data-inv:bg-(--sk-card)";

// one side of a cut tag: a copy of the tag clipped to that side of the cut, with a line on its face
const halfOf = (chip: HTMLElement, side: string, place: Place) => {
  const half = chip.cloneNode(true);
  if (!(half instanceof HTMLElement)) {
    return null;
  }
  delete half.dataset.chip;
  half.style.transform = "";
  half.className = `${CHIP} ${HALF} ${side}`;
  const rise = place.height * 0.72;
  const face = document.createElement("span");
  face.className = FACE;
  // the clip is measured from the border's outer edge, a child from its inner one
  face.style.left = "-2.4px";
  face.style.top = `${(place.height * 0.86 - 4.8).toFixed(2)}px`;
  face.style.width = `${Math.hypot(place.width, rise).toFixed(2)}px`;
  face.style.transform = `rotate(${(-Math.atan2(rise, place.width)).toFixed(4)}rad)`;
  half.append(face);
  return half;
};

// leave a copy of a tag where it stood, in two halves
const cutCopy = (layer: HTMLElement, chip: HTMLElement, place: Place): Ghost | null => {
  const el = document.createElement("span");
  const upper = halfOf(chip, UPPER, place);
  const lower = halfOf(chip, LOWER, place);
  if (!upper || !lower) {
    return null;
  }
  el.className = "group absolute";
  el.inert = true;
  // it is born on the impact frame
  el.dataset.inv = "";
  el.style.left = `${place.left}px`;
  el.style.top = `${place.top}px`;
  el.style.width = `${place.width}px`;
  el.style.height = `${place.height}px`;
  el.append(upper, lower);
  layer.append(el);
  const part = new Spring(0, 300, 14);
  part.to = 1;
  return { age: 0, el, lower, part, size: new Spring(1, 500, 26), upper };
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

export const SakugaChips = ({
  value,
  defaultValue = NONE,
  onValueChange,
  name,
  label = "Tags",
  "aria-labelledby": labelledBy,
  id,
  placeholder = "Add a tag",
  disabled = false,
  max,
  className = "",
}: SakugaChipsProps) => {
  const [own, setOwn] = useState<readonly string[]>(defaultValue);
  const tags = value ?? own;
  const keyed = keysOf(tags);

  const field = useRef<HTMLDivElement>(null);
  const entry = useRef<HTMLInputElement>(null);
  const cutLayer = useRef<HTMLSpanElement>(null);
  const status = useRef<HTMLOutputElement>(null);
  const chips = useRef<Map<string, HTMLElement> | null>(null);
  const motions = useRef(new Map<string, Motion>());
  const ghosts = useRef(new Set<Ghost>());
  // where every tag and the text box stood just before a change, and what the change asked for
  const before = useRef<Map<string, Place> | null>(null);
  const boxBefore = useRef<{ left: number; top: number } | null>(null);
  const asked = useRef<Ask | null>(null);
  // the text box follows the tags over
  const follow = useRef(makeMotion());
  const give = useRef(new Spring(1, 700, 16));
  const shake = useRef(new Spring(0, 700, 14));
  const quiet = useRef(false);
  // when the control last said a word: one at a time
  const spoke = useRef(-9);
  const ruler = useRef<CanvasRenderingContext2D | null>(null);

  const tell = (text: string) => {
    if (status.current) {
      status.current.textContent = text;
    }
  };

  // true if a word may land now
  const speak = () => {
    if (clock.now - spoke.current < 0.9) {
      return false;
    }
    spoke.current = clock.now;
    return true;
  };

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
    pose(el, m);
    puff(c.x, c.y + c.h / 2 + 9, { life: 0.45, n: 3, size: 5, vy: 3 });
    if (speak()) {
      sfx("pon", c.x + 16, f.y - 30, { life: 0.8, rot: 0.06, size: 80, ...hollow() });
    }
  };

  // a tag has gone: a crescent cuts the copy left where it stood
  const cutAway = (chip: HTMLElement, place: Place, height: number) => {
    const box = field.current;
    const layer = cutLayer.current;
    if (!box || !layer || isCalm()) {
      return;
    }
    const ghost = cutCopy(layer, chip, place);
    if (!ghost) {
      return;
    }
    ghosts.current.add(ghost);
    // the field keeps its height until the cut one has gone, so it is never cut outside it
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
    // the chips fly off the way the cut went, clear of the rows below
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

  // the tags that came with this render and the ones that went
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
      // nothing is left half cut under a tag that has just landed
      for (const g of ghosts.current) {
        g.el.remove();
      }
      ghosts.current.clear();
    }
    if (added.length > 0 && why && entry.current) {
      // they are in: now the text box lets go of them
      entry.current.value = why.rest;
      tell(`Added ${added.join(", ")}`);
    }
    return added.length > 0;
  };

  // after every render: find the tags, start the new ones, and send the moved ones back to where
  // they were so their springs can bring them over
  useLayoutEffect(() => {
    const box = field.current;
    const inp = entry.current;
    if (!box || !inp) {
      return;
    }
    const found = new Map<string, HTMLElement>();
    for (const el of box.querySelectorAll<HTMLElement>("[data-chip]")) {
      const key = el.dataset.chip ?? "";
      found.set(key, el);
      if (!motions.current.has(key)) {
        motions.current.set(key, makeMotion());
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
        // each one sets off a beat after the one before it
        moved += 1;
      }
    }
    const f = follow.current;
    if (grew) {
      // a tag has landed where the text box was: the box is simply at its new place
      f.sx.x = 0;
      f.sy.x = 0;
      f.sx.v = 0;
      f.sy.v = 0;
      f.wait = 0;
      f.jump = false;
      pose(inp, f, 0);
    } else if (stood && sendBack(inp, f, stood, HOLD + moved * LAG + TRAIL, 0)) {
      // along its row the box slides after the tags. To another row it would have to cross them,
      // so it waits where it is until they have landed and is then simply there
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
    // the field lets go of its height once the cut tag has gone and the text box is back on its row
    if (
      box &&
      box.style.minHeight !== "" &&
      ghosts.current.size === 0 &&
      Math.abs(follow.current.sy.x) < 3
    ) {
      box.style.minHeight = "";
    }
  });

  // ask for a new value, noting where everything stands so the layout effect can react to what
  // comes back
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

  // it is already there: the one that is shakes its head
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

  // add what was typed, all in one change; `tail` is what stays in the text box after it.
  // Words that cannot go in stay in the box too.
  const add = (words: readonly string[], tail: string) => {
    const next = [...tags];
    const kept: string[] = [];
    for (const word of words) {
      const tag = word.trim();
      const twin = keyed.find((k) => same(k.tag, tag));
      // a word typed twice in one go goes in once
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
    if (rnd() < 0.35) {
      shards(x, c.y + 6, { life: 0.5, n: 2, size: 3, speed: 110 });
    }
  };

  const change = (e: ChangeEvent<HTMLInputElement>) => {
    const inp = e.currentTarget;
    if (inp.value.includes(",")) {
      // a comma ends a tag; what follows the last one stays in the box
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
    // Enter that ends an IME composition belongs to the composition
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

  // a press on the field's own paper goes to the box, and a press on a tag does not take focus from it
  const pointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.target !== entry.current && !disabled) {
      e.preventDefault();
      if (!(e.target instanceof Element && e.target.closest("button"))) {
        entry.current?.focus();
      }
    }
  };

  return (
    <span
      className={`relative isolate inline-block w-[270px] max-w-full align-middle text-[15px] leading-[1.4] font-medium text-(--sk-ink) ${FONT_BODY} ${className}`}
    >
      <SakugaStyle />
      <div
        ref={field}
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a fieldset keeps its own minimum width and cannot be the wrapping row the tags and the text box share
        role="group"
        aria-label={labelledBy === undefined ? label : undefined}
        aria-labelledby={labelledBy}
        className={`relative flex cursor-text flex-wrap content-start items-center gap-x-[7px] gap-y-[8px] rounded-(--sk-r) bg-(--sk-card) px-[11px] py-[10px] shadow-(--sk-sh) will-change-transform [border:var(--sk-bw)_solid_var(--sk-ink)] has-[input:focus-visible]:outline-[2.5px] has-[input:focus-visible]:outline-offset-[3px] has-[input:focus-visible]:outline-(--sk-acc) has-[input:focus-visible]:outline-solid ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
        onPointerDown={pointerDown}
      >
        {keyed.map(({ key, tag }) => (
          <span key={key} data-chip={key} className={`${CHIP} will-change-transform`}>
            <span className="truncate">{tag}</span>
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              disabled={disabled}
              className={`${CROSS} cursor-pointer hover:bg-(--sk-soft) focus-visible:outline-[2.5px] focus-visible:outline-offset-[1px] focus-visible:outline-(--sk-acc) disabled:cursor-not-allowed`}
              onClick={() => remove(key)}
            >
              <Cross />
            </button>
          </span>
        ))}
        <input
          ref={entry}
          id={id}
          type="text"
          aria-label={labelledBy === undefined ? label : undefined}
          aria-labelledby={labelledBy}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          enterKeyHint="done"
          className="h-[30px] w-0 min-w-[84px] flex-1 bg-transparent px-[2px] text-[16px] font-semibold text-(--sk-ink) caret-(--sk-ink) outline-none placeholder:text-(--sk-dim) disabled:cursor-not-allowed"
          onChange={change}
          onKeyDown={keyDown}
          onFocus={focus}
        />
        {/* the cut copies are put here by hand, where their tags stood, out of the flow */}
        <span ref={cutLayer} aria-hidden className="pointer-events-none absolute inset-0 z-10" />
      </div>
      {name !== undefined &&
        keyed.map(({ key, tag }) => (
          <input key={key} type="hidden" name={name} value={tag} disabled={disabled} />
        ))}
      <output ref={status} className="sr-only" />
    </span>
  );
};
