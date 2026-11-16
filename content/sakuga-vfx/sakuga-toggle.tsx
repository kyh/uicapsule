"use client";

// Sakuga Toggle: a switch whose flip is a drawn animation, not a simulation.
// Turn it on and the knob smears across with a torn tail, slams into the end and throws up a splash
// crown, and the track floods, sloshes and settles with a glint. Turn it off and the dash plays back.
// 43 painted frames on one sprite sheet, played at 30 a second on the shared clock.
// Setting `checked` from code jumps to the end; only a person flipping it (or flip()) plays the drawing.

import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import type { Ref } from "react";

import { isCalm } from "./sakuga-core";
import { FONT_BODY, SakugaStyle, useFrame } from "./sakuga-react";

export interface SakugaToggleHandle {
  // what a click does: flip it and play the drawing
  flip: () => void;
}

interface SakugaToggleProps {
  // what a screen reader calls it
  label?: string;
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
const getSheet = (src: string) => {
  let img = sheets.get(src);
  if (!img) {
    img = new Image();
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

// put the film's current frame on the canvas, once the sheet has arrived
const paint = (canvas: HTMLCanvasElement | null, img: HTMLImageElement, film: Film) => {
  const c = canvas?.getContext("2d");
  if (!c || !img.complete || !img.naturalWidth) {
    return;
  }
  const i = current(film);
  c.clearRect(0, 0, FW, FH);
  c.drawImage(img, (i % COLS) * FW, Math.floor(i / COLS) * FH, FW, FH, 0, 0, FW, FH);
  film.shown = i;
};

// the drawing is bigger than the button: the margin keeps room for all of it
const HOST = `relative isolate mx-[21px] mt-[89px] mb-[20px] inline-block h-[54px] w-[108px] align-middle text-[15px] leading-[1.4] font-medium text-(--sk-ink) [-webkit-tap-highlight-color:transparent] ${FONT_BODY}`;
const SWITCH =
  "relative block h-[54px] w-[108px] cursor-pointer rounded-[27px] border-0 bg-none p-0 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-[2.5px] focus-visible:outline-offset-[3px] focus-visible:outline-(--sk-acc) focus-visible:outline-solid";
const CANVAS =
  "pointer-events-none absolute top-1/2 left-1/2 mt-[-115.6px] ml-[-75px] h-[162.5px] w-[150px] max-w-none";

export const SakugaToggle = ({
  label = "Toggle",
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
  const canvas = useRef<HTMLCanvasElement>(null);
  const film = useRef<Film>({ acc: 0, pos: 0, seq: [0], shown: -1 });
  // what a person just flipped it to, so that change plays instead of jumping
  const hand = useRef<boolean | null>(null);

  const flip = () => {
    if (disabled) {
      return;
    }
    const next = !on;
    hand.current = next;
    const seq = next ? ON : OFF;
    film.current.seq = seq;
    film.current.pos = isCalm() ? seq.length - 1 : 0;
    film.current.acc = 0;
    paint(canvas.current, getSheet(frames), film.current);
    setInner(next);
    onCheckedChange?.(next);
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
  }, [on]);

  // the first frame, as soon as the sheet has arrived
  useEffect(() => {
    const img = getSheet(frames);
    const show = () => paint(canvas.current, img, film.current);
    film.current.shown = -1;
    if (img.complete) {
      show();
      return;
    }
    img.addEventListener("load", show);
    return () => img.removeEventListener("load", show);
  }, [frames]);

  useFrame((dt) => {
    const f = film.current;
    if (f.pos < f.seq.length - 1) {
      f.acc += dt * FPS;
      while (f.acc >= 1 && f.pos < f.seq.length - 1) {
        f.acc -= 1;
        f.pos += 1;
      }
    }
    if (current(f) !== f.shown) {
      paint(canvas.current, getSheet(frames), f);
    }
  });

  return (
    <span className={`${HOST} ${className}`}>
      <SakugaStyle />
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        disabled={disabled}
        className={SWITCH}
        onClick={flip}
      >
        <canvas ref={canvas} width={FW} height={FH} aria-hidden className={CANVAS} />
      </button>
      {name !== undefined && (
        <input
          type="checkbox"
          hidden
          readOnly
          tabIndex={-1}
          name={name}
          value={value}
          checked={on}
          disabled={disabled}
        />
      )}
    </span>
  );
};
