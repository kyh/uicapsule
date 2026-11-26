"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "cn";
import { useEffect, useLayoutEffect, useRef } from "react";

import { P, STOCK_PALETTE, isCalm, toRgb } from "./sakuga-core";
import type { Palette, Rgb } from "./sakuga-core";
import { SakugaStyle, useFrame, useMergedRef } from "./sakuga-react";
import type { Styled } from "./sakuga-react";

const noop = () => null;

type SakugaSwitchProps = Styled<SwitchPrimitive.Root.Props> & {
  /** Sprite sheet URL. Only the stock sheet is recolored by `SakugaTheme`. */
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

const getSheet = (src: string, readable = false) => {
  const id = readable ? `cors:${src}` : src;
  let img = sheets.get(id);

  if (!img) {
    const made = new Image();
    made.addEventListener(
      "error",
      () => {
        broken.add(id);
      },
      { once: true },
    );

    if (readable) {
      made.crossOrigin = "anonymous";
    }

    made.src = src;
    sheets.set(id, made);
    img = made;
  }

  return img;
};

const ready = (img: HTMLImageElement) => img.complete && img.naturalWidth > 0;

const SPRITE: readonly Rgb[] = [
  [251, 251, 253],
  [189, 195, 214],
  [144, 154, 251],
  [13, 19, 96],
  [245, 97, 170],
];

const roles = (p: Readonly<Palette>) => [p.fill, p.track, p.primary, p.ink, p.accent];
const tintKey = (p: Readonly<Palette>) => roles(p).join(",");
const STOCK_TINT = tintKey(STOCK_PALETTE);
const RETINT_MS = 150;
const LUT = 64 ** 3;

const nearestShift = (c: Rgb, shifts: readonly Rgb[]) => {
  let best = Infinity;
  let shift: Rgb = [0, 0, 0];

  for (const [i, a] of SPRITE.entries()) {
    for (const [j, b] of SPRITE.entries()) {
      if (j <= i) {
        continue;
      }

      const ab: Rgb = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const len = ab[0] * ab[0] + ab[1] * ab[1] + ab[2] * ab[2];
      const dot = (c[0] - a[0]) * ab[0] + (c[1] - a[1]) * ab[1] + (c[2] - a[2]) * ab[2];
      const t = Math.min(1, Math.max(0, dot / len));

      const dist =
        (c[0] - a[0] - ab[0] * t) ** 2 +
        (c[1] - a[1] - ab[1] * t) ** 2 +
        (c[2] - a[2] - ab[2] * t) ** 2;

      const sa = shifts[i];
      const sb = shifts[j];

      if (dist < best && sa && sb) {
        best = dist;
        shift = [
          sa[0] + (sb[0] - sa[0]) * t,
          sa[1] + (sb[1] - sa[1]) * t,
          sa[2] + (sb[2] - sa[2]) * t,
        ];
      }
    }
  }

  return shift;
};

const recolor = (img: HTMLImageElement, palette: Readonly<Palette>) => {
  const out = document.createElement("canvas");
  out.width = img.naturalWidth;
  out.height = img.naturalHeight;
  const ctx = out.getContext("2d", { willReadFrequently: true });

  if (!ctx) {
    return null;
  }

  ctx.drawImage(img, 0, 0);
  let frame: ImageData;

  try {
    frame = ctx.getImageData(0, 0, out.width, out.height);
  } catch {
    return null;
  }

  const stock = roles(STOCK_PALETTE).map(toRgb);

  const shifts = roles(palette).map((hex, i) => {
    const to = toRgb(hex);
    const from = stock[i] ?? to;

    const d: Rgb = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];

    return d;
  });

  const lr = new Int16Array(LUT);
  const lg = new Int16Array(LUT);
  const lb = new Int16Array(LUT);
  const seen = new Uint8Array(LUT);
  const px = frame.data;

  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] === 0) {
      continue;
    }

    const r = px[i] ?? 0;
    const g = px[i + 1] ?? 0;
    const b = px[i + 2] ?? 0;
    const q = Math.floor(r / 4) * 4096 + Math.floor(g / 4) * 64 + Math.floor(b / 4);

    if (seen[q] === 0) {
      const [dr, dg, db] = nearestShift([r, g, b], shifts);
      lr[q] = dr;
      lg[q] = dg;
      lb[q] = db;
      seen[q] = 1;
    }

    px[i] = r + (lr[q] ?? 0);
    px[i + 1] = g + (lg[q] ?? 0);
    px[i + 2] = b + (lb[q] ?? 0);
  }

  ctx.putImageData(frame, 0, 0);

  return out;
};

let tinted: { key: string; sheet: HTMLCanvasElement; at: number } | null = null;
let untintable = false;

type Sheet = CanvasImageSource | "plain" | null;

const sheetFor = (frames: string) => {
  const key = tintKey(P);

  const stock = getSheet(frames);
  const fallback = ready(stock) ? stock : null;

  if (frames !== FRAMES || key === STOCK_TINT) {
    return fallback;
  }

  if (tinted?.key === key) {
    return tinted.sheet;
  }

  if (untintable || broken.has(`cors:${frames}`)) {
    return "plain";
  }

  const img = getSheet(frames, true);
  const now = performance.now();

  if (!ready(img) || (tinted && now - tinted.at < RETINT_MS)) {
    return tinted?.sheet ?? fallback;
  }

  const sheet = recolor(img, P);

  if (!sheet) {
    untintable = true;

    return "plain";
  }

  tinted = { at: now, key, sheet };

  return sheet;
};

interface Rig {
  acc: number;
  pos: number;
  seq: readonly number[];
  shown: number;
  sheet: Sheet;
  to: boolean | null;
  quiet: boolean;
}

const makeRig = () => {
  const rig: Rig = { acc: 0, pos: 0, quiet: false, seq: [0], sheet: null, shown: -1, to: null };

  return rig;
};

const current = ({ seq, pos }: Rig) => seq[Math.min(seq.length - 1, pos)] ?? 0;

const paint = (
  canvas: HTMLCanvasElement | null,
  sheet: Sheet,
  rig: Rig,
  plain: HTMLElement | null,
) => {
  const c = canvas?.getContext("2d");

  if (!canvas || !c || sheet === null) {
    return;
  }

  rig.sheet = sheet;

  if (sheet === "plain") {
    canvas.style.display = "none";

    if (plain) {
      plain.style.display = "";
    }

    return;
  }

  canvas.style.display = "";

  if (plain) {
    plain.style.display = "none";
  }

  const i = current(rig);
  c.clearRect(0, 0, FW, FH);
  c.drawImage(sheet, (i % COLS) * FW, Math.floor(i / COLS) * FH, FW, FH, 0, 0, FW, FH);
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
      paint(canvas.current, sheetFor(frames), rig, plain.current);
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
      paint(canvas.current, sheetFor(frames), rigRef.current, plain.current);
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

    if (broken.has(frames)) {
      return;
    }

    const sheet = sheetFor(frames);

    if (sheet !== rig.sheet || current(rig) !== rig.shown) {
      paint(canvas.current, sheet, rig, plain.current);
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
