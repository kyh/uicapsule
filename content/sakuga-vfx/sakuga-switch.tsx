"use client";

// Sakuga Switch: a switch whose flip is a drawn animation, not a simulation.
// Turn it on and the knob smears across with a torn tail, slams into the end and throws up a splash
// crown, and the track floods, sloshes and settles with a glint. Turn it off and the dash plays back.
// 43 painted frames on one sprite sheet, played at 30 a second on the shared clock.
// Base UI's Switch owns the state, the form input and the ARIA. Only a person flipping it plays the
// film: a `checked` set from code jumps to the end.

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "cn";
import { useEffect, useLayoutEffect, useRef } from "react";

import { isCalm } from "./sakuga-core";
import { SakugaStyle, useFrame } from "./sakuga-react";

type SakugaSwitchProps = Omit<SwitchPrimitive.Root.Props, "className"> & {
  className?: string;
  // the sprite sheet: 43 frames, 8 across, 300 by 325 each
  frames?: string;
};

const FRAMES =
  "https://d24l2zb4cwkekfpl.public.blob.vercel-storage.com/sakuga-vfx/toggle-frames.20261116.webp";
const N = 43;
const FPS = 30;
const FW = 300;
const FH = 325;
const COLS = 8;
const ON: readonly number[] = Array.from({ length: N }, (_, i) => i);
const OFF: readonly number[] = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];

// one decoded image per sheet for every switch on the page
const sheets = new Map<string, HTMLImageElement>();
// the sheets that failed to load: those switches keep their plain switch
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
  // what the film is showing, or heading for; null until it has looked at the switch
  to: boolean | null;
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

// the switch's own word on what it is: the drawing never disagrees with aria-checked
const isOn = (canvas: HTMLCanvasElement | null) =>
  canvas?.closest('[role="switch"]')?.getAttribute("aria-checked") === "true";

// straight to the rest frame of a state, no animation
const settle = (film: Film, on: boolean) => {
  film.seq = [on ? N - 1 : 0];
  film.pos = 0;
  film.acc = 0;
  film.to = on;
};

// the drawing is bigger than the button: the margin keeps room for all of it
const ROOT =
  "group/sakuga-switch relative isolate mx-[21px] mt-[89px] mb-[20px] inline-block h-[54px] w-[108px] shrink-0 cursor-pointer rounded-[27px] align-middle [-webkit-tap-highlight-color:transparent] focus-visible:outline-[2.5px] focus-visible:outline-offset-[3px] focus-visible:outline-(--sk-acc) focus-visible:outline-solid data-disabled:cursor-not-allowed data-disabled:opacity-50";
const CANVAS =
  "pointer-events-none absolute top-1/2 left-1/2 mt-[-115.6px] ml-[-75px] h-[162.5px] w-[150px] max-w-none";

// The switch with no painting: what shows until the sheet arrives, and for good if it never does.
// Measured off the sheet's two rest frames: the track is 106 wide, 54 tall off and 42 tall on,
// the knob 43 across.
const PLAIN = "pointer-events-none absolute inset-0";
const TRACK =
  "absolute top-0 left-px h-[54px] w-[106px] rounded-full bg-(--sk-track) [border:var(--sk-bw)_solid_var(--sk-ink)] group-data-checked/sakuga-switch:top-[6px] group-data-checked/sakuga-switch:h-[42px] group-data-checked/sakuga-switch:bg-(--sk-pri)";
const THUMB =
  "absolute top-[5.5px] left-[5.5px] h-[43px] w-[43px] rounded-full bg-(--sk-card) [border:var(--sk-bw)_solid_var(--sk-ink)] data-checked:left-[63.5px]";

const SakugaSwitch = ({
  className,
  frames = FRAMES,
  checked,
  onCheckedChange,
  ...props
}: SakugaSwitchProps) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const plain = useRef<HTMLSpanElement>(null);
  const film = useRef<Film>({ acc: 0, pos: 0, seq: [0], shown: -1, to: null });

  // Base UI only calls this for a person's flip, so this is where the film starts
  const change = (next: boolean, details: SwitchPrimitive.Root.ChangeEventDetails) => {
    onCheckedChange?.(next, details);
    if (details.isCanceled) {
      return;
    }
    const f = film.current;
    const seq = next ? ON : OFF;
    f.seq = seq;
    f.pos = isCalm() ? seq.length - 1 : 0;
    f.acc = 0;
    f.to = next;
    // an owner can still refuse the change, so only its own state draws before the answer
    if (checked === undefined) {
      paint(canvas.current, getSheet(frames), f, plain.current);
    }
  };

  // where it starts: the rest frame, no animation
  useLayoutEffect(() => {
    settle(film.current, isOn(canvas.current));
  }, []);

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

  useFrame((dt) => {
    const f = film.current;
    // set from code, reset by its form, or a flip its owner refused: straight to where it really is
    const on = isOn(canvas.current);
    if (on !== f.to) {
      settle(f, on);
    }
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
    <>
      <SakugaStyle />
      <SwitchPrimitive.Root
        data-slot="sakuga-switch"
        className={cn(ROOT, className)}
        checked={checked}
        onCheckedChange={change}
        {...props}
      >
        <span ref={plain} aria-hidden data-slot="sakuga-switch-plain" className={PLAIN}>
          <span data-slot="sakuga-switch-track" className={TRACK} />
          <SwitchPrimitive.Thumb data-slot="sakuga-switch-thumb" className={THUMB} />
        </span>
        <canvas
          ref={canvas}
          width={FW}
          height={FH}
          aria-hidden
          data-slot="sakuga-switch-film"
          className={CANVAS}
        />
      </SwitchPrimitive.Root>
    </>
  );
};

export { SakugaSwitch };
