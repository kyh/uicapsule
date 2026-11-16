"use client";

// Sakuga Toggle: a switch whose flip is a drawn animation, not a simulation.
// Turn it on and the knob smears across with a torn tail, slams into the end and throws up a splash
// crown, and the track floods, sloshes and settles with a glint. Turn it off and the dash plays back.
// 43 painted frames on one sprite sheet, played at 30 a second on the shared clock.
// Setting `checked` from code jumps to the end; only a person flipping it (or flip()) plays the drawing.

import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import type { Ref } from "react";

import { isCalm, later } from "./sakuga-core";
import { FONT_BODY, SakugaStyle, useFrame } from "./sakuga-react";

export interface SakugaToggleHandle {
  // what a click does: flip it and play the drawing
  flip: () => void;
}

interface SakugaToggleProps {
  // what a screen reader calls it; left out when aria-labelledby names it instead
  label?: string;
  id?: string;
  "aria-labelledby"?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  // sent with its form when on, like a checkbox
  name?: string;
  value?: string;
  disabled?: boolean;
  // the sprite sheet: 43 frames, 8 across, 300 by 325 each
  frames?: string;
  className?: string;
  ref?: Ref<SakugaToggleHandle>;
}

const FRAMES =
  "https://d24l2zb4cwkekfpl.public.blob.vercel-storage.com/sakuga-vfx/toggle-frames.20261116.webp";
const N = 43;
const FPS = 30;
const FW = 300;
const FH = 325;
const COLS = 8;
const ON: readonly number[] = Array.from({ length: N }, (_, i) => i);
const OFF: readonly number[] = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];

// one decoded image per sheet for every toggle on the page
const sheets = new Map<string, HTMLImageElement>();
// the sheets that failed to load: those toggles keep their plain switch
const broken = new Set<string>();
const getSheet = (src: string) => {
  let img = sheets.get(src);
  if (!img) {
    img = new Image();
    img.addEventListener("error", () => broken.add(src), { once: true });
    img.src = src;
    sheets.set(src, img);
  }
  return img;
};

interface Film {
  acc: number;
  pos: number;
  seq: readonly number[];
  shown: number;
}

const current = ({ seq, pos }: Film) => seq[Math.min(seq.length - 1, pos)] ?? 0;

// put the film's current frame on the canvas, once the sheet has arrived, and take the plain switch away
const paint = (
  canvas: HTMLCanvasElement | null,
  img: HTMLImageElement,
  film: Film,
  plain: HTMLElement | null,
) => {
  const c = canvas?.getContext("2d");
  if (!c || !img.complete || !img.naturalWidth) {
    return;
  }
  if (plain) {
    plain.style.display = "none";
  }
  const i = current(film);
  c.clearRect(0, 0, FW, FH);
  c.drawImage(img, (i % COLS) * FW, Math.floor(i / COLS) * FH, FW, FH, 0, 0, FW, FH);
  film.shown = i;
};

// the drawing is bigger than the button: the margin keeps room for all of it
const HOST = `relative isolate mx-[21px] mt-[89px] mb-[20px] inline-block h-[54px] w-[108px] align-middle text-[15px] leading-[1.4] font-medium text-(--sk-ink) [-webkit-tap-highlight-color:transparent] ${FONT_BODY}`;
const SWITCH =
  "relative [display:block] h-[54px] w-[108px] cursor-pointer rounded-[27px] border-0 bg-none p-0 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-[2.5px] focus-visible:outline-offset-[3px] focus-visible:outline-(--sk-acc) focus-visible:outline-solid";
const CANVAS =
  "pointer-events-none absolute top-1/2 left-1/2 mt-[-115.6px] ml-[-75px] h-[162.5px] w-[150px] max-w-none";

// The switch with no painting: what shows until the sheet arrives, and for good if it never does.
// Measured off the sheet's two rest frames: the track is 106 wide, 54 tall off and 42 tall on,
// the knob 43 across.
const PLAIN = "pointer-events-none absolute inset-0";
const TRACK = "absolute left-px w-[106px] rounded-full [border:var(--sk-bw)_solid_var(--sk-ink)]";
const KNOB =
  "absolute top-[5.5px] h-[43px] w-[43px] rounded-full bg-(--sk-card) [border:var(--sk-bw)_solid_var(--sk-ink)]";

export const SakugaToggle = ({
  label = "Toggle",
  id,
  "aria-labelledby": labelledBy,
  checked,
  defaultChecked = false,
  onCheckedChange,
  name,
  value = "on",
  disabled = false,
  frames = FRAMES,
  className = "",
  ref,
}: SakugaToggleProps) => {
  const [inner, setInner] = useState(defaultChecked);
  const on = checked ?? inner;
  const button = useRef<HTMLButtonElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const plain = useRef<HTMLSpanElement>(null);
  const film = useRef<Film>({ acc: 0, pos: 0, seq: [0], shown: -1 });
  // what it really is, as of the last render
  const truth = useRef(on);
  // what it is as of the last flip, so two flips in a row go on and then off
  const live = useRef(on);
  // what a person just flipped it to, so that change plays instead of jumping
  const hand = useRef<boolean | null>(null);
  const flips = useRef(0);

  useLayoutEffect(() => {
    truth.current = on;
    live.current = on;
  });

  const flip = () => {
    if (disabled) {
      return;
    }
    const next = !live.current;
    live.current = next;
    hand.current = next;
    flips.current += 1;
    const n = flips.current;
    const seq = next ? ON : OFF;
    film.current.seq = seq;
    film.current.pos = isCalm() ? seq.length - 1 : 0;
    film.current.acc = 0;
    // an owner can still refuse the change, so only its own state draws before the answer
    if (checked === undefined) {
      paint(canvas.current, getSheet(frames), film.current, plain.current);
    }
    setInner(next);
    onCheckedChange?.(next);
    // by the next frame the owner has answered: if the value did not follow, neither does the drawing
    later(0, () => {
      if (n !== flips.current) {
        return;
      }
      hand.current = null;
      live.current = truth.current;
      if (truth.current !== next) {
        film.current.seq = [truth.current ? N - 1 : 0];
        film.current.pos = 0;
      }
    });
  };

  useImperativeHandle(ref, () => ({ flip }));

  // set from code (or at the start): straight to the end, no animation
  useLayoutEffect(() => {
    if (hand.current === on) {
      hand.current = null;
      return;
    }
    film.current.seq = [on ? N - 1 : 0];
    film.current.pos = 0;
    film.current.acc = 0;
  }, [on]);

  // the first frame, as soon as the sheet has arrived
  useEffect(() => {
    const img = getSheet(frames);
    const show = () => paint(canvas.current, img, film.current, plain.current);
    film.current.shown = -1;
    if (img.complete) {
      show();
      return;
    }
    img.addEventListener("load", show);
    return () => img.removeEventListener("load", show);
  }, [frames]);

  // its form's reset puts it back where it started, without the drawing
  useEffect(() => {
    const form = button.current?.form;
    if (!form) {
      return;
    }
    const back = () => setInner(defaultChecked);
    form.addEventListener("reset", back);
    return () => form.removeEventListener("reset", back);
  }, [defaultChecked]);

  useFrame((dt) => {
    const f = film.current;
    if (f.pos < f.seq.length - 1) {
      f.acc += dt * FPS;
      while (f.acc >= 1 && f.pos < f.seq.length - 1) {
        f.acc -= 1;
        f.pos += 1;
      }
    }
    if (current(f) !== f.shown && !broken.has(frames)) {
      paint(canvas.current, getSheet(frames), f, plain.current);
    }
  });

  return (
    <span className={`${HOST} ${className}`}>
      <SakugaStyle />
      <button
        ref={button}
        id={id}
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={labelledBy === undefined ? label : undefined}
        aria-labelledby={labelledBy}
        disabled={disabled}
        className={SWITCH}
        onClick={flip}
      >
        <span ref={plain} aria-hidden className={PLAIN}>
          <span
            className={`${TRACK} ${on ? "top-[6px] h-[42px] bg-(--sk-pri)" : "top-0 h-[54px] bg-(--sk-track)"}`}
          />
          <span className={`${KNOB} ${on ? "left-[63.5px]" : "left-[5.5px]"}`} />
        </span>
        <canvas ref={canvas} width={FW} height={FH} aria-hidden className={CANVAS} />
      </button>
      {name !== undefined && on && !disabled && <input type="hidden" name={name} value={value} />}
    </span>
  );
};
