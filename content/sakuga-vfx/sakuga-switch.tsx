"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "cn";
import { useEffect, useLayoutEffect, useRef } from "react";

import { isCalm } from "./sakuga-core";
import { SakugaStyle, useFrame, useMergedRef } from "./sakuga-react";
import type { Styled } from "./sakuga-react";

const noop = () => null;

type SakugaSwitchProps = Styled<SwitchPrimitive.Root.Props> & {
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

const sheets = new Map<string, HTMLImageElement>();
const broken = new Set<string>();

const getSheet = (src: string) => {
  let img = sheets.get(src);

  if (!img) {
    img = new Image();
    img.addEventListener(
      "error",
      () => {
        broken.add(src);
      },
      { once: true },
    );
    img.src = src;
    sheets.set(src, img);
  }

  return img;
};

interface Rig {
  acc: number;
  pos: number;
  seq: readonly number[];
  shown: number;
  to: boolean | null;
  quiet: boolean;
}

const makeRig = () => {
  const rig: Rig = { acc: 0, pos: 0, quiet: false, seq: [0], shown: -1, to: null };

  return rig;
};

const current = ({ seq, pos }: Rig) => seq[Math.min(seq.length - 1, pos)] ?? 0;

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

const isOn = (root: HTMLElement | null) => root?.getAttribute("aria-checked") === "true";

const settle = (rig: Rig, on: boolean) => {
  rig.seq = [on ? N - 1 : 0];
  rig.pos = 0;
  rig.acc = 0;
  rig.to = on;
};

const ROOT =
  "group/sakuga-switch relative isolate mx-[21px] mt-[89px] mb-[20px] inline-block h-[54px] w-[108px] shrink-0 cursor-pointer rounded-[27px] align-middle [-webkit-tap-highlight-color:transparent] focus-visible:outline-[2.5px] focus-visible:outline-offset-[3px] focus-visible:outline-(--sk-acc) focus-visible:outline-solid data-disabled:cursor-not-allowed data-disabled:opacity-50";

const FILM =
  "pointer-events-none absolute top-1/2 left-1/2 mt-[-115.6px] ml-[-75px] h-[162.5px] w-[150px] max-w-none";

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

    if (checked === undefined) {
      paint(canvas.current, getSheet(frames), rig, plain.current);
    }
  };

  useLayoutEffect(() => {
    settle(rigRef.current, isOn(root.current));
  }, []);

  useEffect(() => {
    const hidden = input.current;
    const form = hidden?.form;

    if (checked !== undefined || !hidden || !form) {
      return noop;
    }

    const back = () => {
      if (hidden.checked !== Boolean(defaultChecked)) {
        rigRef.current.quiet = true;
        hidden.click();
        rigRef.current.quiet = false;
      }
    };

    form.addEventListener("reset", back);

    return () => {
      form.removeEventListener("reset", back);
    };
  }, [checked, defaultChecked]);

  useEffect(() => {
    const img = getSheet(frames);

    const show = () => {
      paint(canvas.current, img, rigRef.current, plain.current);
    };

    rigRef.current.shown = -1;

    if (img.complete) {
      show();

      return noop;
    }

    img.addEventListener("load", show);

    return () => {
      img.removeEventListener("load", show);
    };
  }, [frames]);

  useFrame((dt) => {
    const rig = rigRef.current;
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
