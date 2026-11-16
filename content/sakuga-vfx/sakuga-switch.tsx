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
import { SakugaStyle, useFrame, useMergedRef } from "./sakuga-react";
import type { Styled } from "./sakuga-react";

type SakugaSwitchProps = Styled<SwitchPrimitive.Root.Props> & {
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

// The film: which frames it is playing and how far in it is.
interface Rig {
  acc: number;
  pos: number;
  seq: readonly number[];
  shown: number;
  // what the film is showing, or heading for; null until it has looked at the switch
  to: boolean | null;
  // set while its form's reset puts it back, so that change jumps like any other from code
  quiet: boolean;
}

const makeRig = (): Rig => ({ acc: 0, pos: 0, quiet: false, seq: [0], shown: -1, to: null });

const current = ({ seq, pos }: Rig) => seq[Math.min(seq.length - 1, pos)] ?? 0;

// put the film's current frame on the canvas, once the sheet has arrived, and take the plain switch away
const paint = (
  canvas: HTMLCanvasElement | null,
  img: HTMLImageElement,
  rig: Rig,
  plain: HTMLElement | null,
) => {
  const c = canvas?.getContext("2d");
  if (!c || !img.complete || !img.naturalWidth) {
    return;
  }
  if (plain) {
    plain.style.display = "none";
  }
  const i = current(rig);
  c.clearRect(0, 0, FW, FH);
  c.drawImage(img, (i % COLS) * FW, Math.floor(i / COLS) * FH, FW, FH, 0, 0, FW, FH);
  rig.shown = i;
};

// the switch's own word on what it is: the drawing never disagrees with aria-checked
const isOn = (root: HTMLElement | null) => root?.getAttribute("aria-checked") === "true";

// straight to the rest frame of a state, no animation
const settle = (rig: Rig, on: boolean) => {
  rig.seq = [on ? N - 1 : 0];
  rig.pos = 0;
  rig.acc = 0;
  rig.to = on;
};

// the drawing is bigger than the switch: the margin keeps room for all of it
const ROOT =
  "group/sakuga-switch relative isolate mx-[21px] mt-[89px] mb-[20px] inline-block h-[54px] w-[108px] shrink-0 cursor-pointer rounded-[27px] align-middle [-webkit-tap-highlight-color:transparent] focus-visible:outline-[2.5px] focus-visible:outline-offset-[3px] focus-visible:outline-(--sk-acc) focus-visible:outline-solid data-disabled:cursor-not-allowed data-disabled:opacity-50";
const FILM =
  "pointer-events-none absolute top-1/2 left-1/2 mt-[-115.6px] ml-[-75px] h-[162.5px] w-[150px] max-w-none";

// The switch with no painting: what shows until the sheet arrives, and for good if it never does.
// Measured off the sheet's two rest frames: the track is 106 wide, 54 tall off and 42 tall on,
// the knob 43 across.
const PLAIN = "pointer-events-none absolute inset-0";
const TRACK =
  "absolute top-0 left-px h-[54px] w-[106px] rounded-full border-[length:var(--sk-bw)] border-(--sk-ink) bg-(--sk-track) group-data-checked/sakuga-switch:top-[6px] group-data-checked/sakuga-switch:h-[42px] group-data-checked/sakuga-switch:bg-(--sk-pri)";
const THUMB =
  "absolute top-[5.5px] left-[5.5px] h-[43px] w-[43px] rounded-full border-[length:var(--sk-bw)] border-(--sk-ink) bg-(--sk-card) data-checked:left-[63.5px]";

const SakugaSwitch = ({
  className,
  frames = FRAMES,
  checked,
  defaultChecked,
  onCheckedChange,
  inputRef,
  ref,
  ...props
}: SakugaSwitchProps) => {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const plain = useRef<HTMLSpanElement>(null);
  const rigRef = useRef(makeRig());
  const input = useRef<HTMLInputElement>(null);
  const setRoot = useMergedRef<HTMLElement>(root, ref);
  const setInput = useMergedRef(input, inputRef);

  // Base UI only calls this for a person's flip, so this is where the film starts
  const change = (next: boolean, details: SwitchPrimitive.Root.ChangeEventDetails) => {
    onCheckedChange?.(next, details);
    const rig = rigRef.current;
    if (details.isCanceled || rig.quiet) {
      return;
    }
    const seq = next ? ON : OFF;
    rig.seq = seq;
    rig.pos = isCalm() ? seq.length - 1 : 0;
    rig.acc = 0;
    rig.to = next;
    // an owner can still refuse the change, so only its own state draws before the answer
    if (checked === undefined) {
      paint(canvas.current, getSheet(frames), rig, plain.current);
    }
  };

  // where it starts: the rest frame, no animation
  useLayoutEffect(() => {
    settle(rigRef.current, isOn(root.current));
  }, []);

  // Base UI leaves a form's reset to the browser, which moves only the hidden input, so the control
  // would go on showing the old state. Put it back through that input, quietly, just before.
  useEffect(() => {
    const hidden = input.current;
    const form = hidden?.form;
    if (checked !== undefined || !hidden || !form) {
      return;
    }
    const back = () => {
      if (hidden.checked !== Boolean(defaultChecked)) {
        rigRef.current.quiet = true;
        hidden.click();
        rigRef.current.quiet = false;
      }
    };
    form.addEventListener("reset", back);
    return () => form.removeEventListener("reset", back);
  }, [checked, defaultChecked]);

  // the first frame, as soon as the sheet has arrived
  useEffect(() => {
    const img = getSheet(frames);
    const show = () => paint(canvas.current, img, rigRef.current, plain.current);
    rigRef.current.shown = -1;
    if (img.complete) {
      show();
      return;
    }
    img.addEventListener("load", show);
    return () => img.removeEventListener("load", show);
  }, [frames]);

  useFrame((dt) => {
    const rig = rigRef.current;
    // set from code, reset by its form, or a flip its owner refused: straight to where it really is
    const on = isOn(root.current);
    if (on !== rig.to) {
      settle(rig, on);
    }
    if (rig.pos < rig.seq.length - 1) {
      rig.acc += dt * FPS;
      while (rig.acc >= 1 && rig.pos < rig.seq.length - 1) {
        rig.acc -= 1;
        rig.pos += 1;
      }
    }
    if (current(rig) !== rig.shown && !broken.has(frames)) {
      paint(canvas.current, getSheet(frames), rig, plain.current);
    }
  });

  return (
    <>
      <SakugaStyle />
      <SwitchPrimitive.Root
        ref={setRoot}
        inputRef={setInput}
        data-slot="sakuga-switch"
        className={cn(ROOT, className)}
        checked={checked}
        defaultChecked={defaultChecked}
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
          className={FILM}
        />
      </SwitchPrimitive.Root>
    </>
  );
};

export { SakugaSwitch };
