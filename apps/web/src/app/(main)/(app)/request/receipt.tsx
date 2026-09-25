"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useMediaQuery } from "@repo/ui/hooks/use-media-query";
import { cn } from "cn";
import { ArrowUpRightIcon } from "lucide-react";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  useVelocity,
} from "motion/react";
import type { Transition } from "motion/react";

import { nextReceiptArt, ReceiptArt } from "./receipt-art";
import type { ReceiptArtVariant } from "./receipt-art";
import { ReceiptSpec, ReceiptSpecNotes } from "./receipt-spec";
import type { ReceiptLayout } from "./receipt-spec";
import { useTearStub } from "./use-tear-stub";
import { TILT, useTilt } from "./use-tilt";

export interface Filed {
  art: ReceiptArtVariant;
  attachments: number;
  filedAt: string;
  links: number;
  name: string;
  number?: number;
  url: string;
}

const HOLE_RADIUS = 11;

// The stub arrives folded face-down over the ticket and turns open on its seam, like a booklet cover.
// `fold` is degrees from open; everything else in the flip is derived from it and its velocity.
// Also the stub's first-paint `[--fold:180]` class; Tailwind needs the literal.
const FOLDED = 180;
const FLIP: Transition = { bounce: 0.14, delay: 0.55, type: "spring", visualDuration: 1.3 };

const reveal = {
  hidden: { filter: "blur(4px)", opacity: 0 },
  shown: { filter: "blur(0px)", opacity: 1 },
};
const revealTransition: Transition = { duration: 0.3, ease: "easeOut" };
const CORNERS = [
  "top-2 left-2 border-t border-l",
  "top-2 right-2 border-t border-r",
  "bottom-2 left-2 border-b border-l",
  "bottom-2 right-2 border-b border-r",
];

const ReceiptRow = ({ label, value }: { label: string; value: string }) => (
  <motion.div
    variants={reveal}
    transition={revealTransition}
    className="flex items-baseline gap-2 font-mono text-xs"
  >
    <dt className="text-muted-foreground shrink-0">{label}</dt>
    <span aria-hidden className="border-border mb-1 flex-1 border-b border-dotted" />
    <dd className="truncate">{value}</dd>
  </motion.div>
);

// Each half punches its own seam corners and a row of perforations along its seam edge;
// together they read as holes through the ticket, and each half keeps its semicircles once torn.
// The shell is border-colored and punched 1px tighter than its content, so the rim follows the hole.
const HOLE_MASK =
  "radial-gradient(circle at var(--hole-a), transparent var(--hole-r), black calc(var(--hole-r) + 0.5px)), radial-gradient(circle at var(--hole-b), transparent var(--hole-r), black calc(var(--hole-r) + 0.5px)), radial-gradient(circle at var(--perf-at), transparent var(--perf-r), black calc(var(--perf-r) + 0.5px))";
const holeStyle = {
  maskComposite: "intersect",
  maskImage: HOLE_MASK,
  maskPosition: "0 0, 0 0, var(--perf-pos)",
  maskRepeat: "no-repeat, no-repeat, var(--perf-repeat)",
  maskSize: "auto, auto, var(--perf-size)",
};
const PERF =
  "[--perf-size:32px_100%] [--perf-repeat:repeat-x] sm:[--perf-size:100%_32px] sm:[--perf-repeat:repeat-y]";

const TicketShell = ({ className, children }: { className: string; children: ReactNode }) => (
  <div
    style={holeStyle}
    className={cn(
      "bg-border rounded-lg p-px [--hole-r:10px] [--perf-r:3px] [--perf-pos:0_0]",
      PERF,
      className,
    )}
  >
    {children}
  </div>
);

const offsetWithin = (element: HTMLElement, root: HTMLElement) => {
  let x = 0;
  let y = 0;
  let node: Element | null = element;
  while (node instanceof HTMLElement && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent;
  }
  return { x, y };
};

export const Receipt = ({ filed }: { filed: Filed }) => {
  const horizontal = useMediaQuery();
  const reducedMotion = useReducedMotion() === true;
  const [layout, setLayout] = useState<ReceiptLayout | null>(null);
  const [art, setArt] = useState({ swapped: false, variant: filed.art });
  const handleNextArt = () =>
    setArt((current) => ({ swapped: true, variant: nextReceiptArt(current.variant) }));
  const headRef = useRef<HTMLDivElement>(null);
  const confirmationRef = useRef<HTMLHeadingElement>(null);
  const artRef = useRef<HTMLDivElement>(null);
  const {
    bodyRef,
    bridges,
    grabbing,
    handlers,
    intact,
    phase,
    rootRef,
    stubRef,
    tear: handleTear,
    torn,
  } = useTearStub({
    height: layout?.height ?? 0,
    horizontal,
    inset: HOLE_RADIUS + 1,
    reducedMotion,
    seam: layout?.seam ?? 0,
    width: layout?.width ?? 0,
  });

  // The form that held focus unmounts on submit; land assistive tech on the confirmation.
  useEffect(() => {
    confirmationRef.current?.focus({ preventScroll: true });
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const body = bodyRef.current;
    if (!(root && body)) {
      return;
    }
    const observer = new ResizeObserver(() => {
      const artBox = artRef.current;
      setLayout({
        art: artBox
          ? {
              ...offsetWithin(artBox, root),
              height: artBox.offsetHeight,
              width: artBox.offsetWidth,
            }
          : null,
        head: headRef.current?.offsetHeight ?? 0,
        height: root.offsetHeight,
        seam: horizontal ? body.offsetWidth : body.offsetHeight,
        width: root.offsetWidth,
      });
    });
    observer.observe(root);
    observer.observe(body);
    return () => observer.disconnect();
  }, [bodyRef, horizontal, rootRef]);

  const { aimX, aimY, artX, artY, plane, tiltX, tiltY } = useTilt({
    disabled: reducedMotion || grabbing,
    rootRef,
  });

  const fold = useMotionValue(reducedMotion ? 0 : FOLDED);
  useEffect(() => {
    if (reducedMotion) {
      fold.jump(0);
      return;
    }
    const controls = animate(fold, 0, FLIP);
    return () => controls.stop();
  }, [fold, reducedMotion]);
  // The stub hinges on its seam edge. The axis is picked by CSS per breakpoint, not by a media
  // query hook, so the first paint is already correct instead of flipping axes on hydration.
  const flipRef = useRef<HTMLDivElement>(null);
  useMotionValueEvent(fold, "change", (angle) => {
    flipRef.current?.style.setProperty("--fold", String(angle));
  });
  // Blur tracks angular speed, so it only smears the page mid-swing.
  const flipFilter = useTransform(
    useVelocity(fold),
    (speed) => `blur(${Math.min(Math.abs(speed) / 240, 5).toFixed(2)}px)`,
  );
  const faceShade = useTransform(fold, [0, 90], [0, 1]);
  const backShade = useTransform(fold, [90, 180], [0.85, 0.2]);
  const castShadow = useTransform(fold, [0, 40, 110, 180], [0, 0.95, 0.6, 0]);
  const rows: { label: string; value: string | null }[] = [
    { label: "Name", value: filed.name },
    { label: "Links", value: filed.links > 0 ? String(filed.links) : null },
    { label: "Attachments", value: filed.attachments > 0 ? String(filed.attachments) : null },
    { label: "Issue", value: filed.number === undefined ? null : `#${filed.number}` },
    { label: "Filed", value: filed.filedAt },
  ];
  const number = filed.number === undefined ? "Filed" : `No. ${filed.number}`;

  return (
    <div className="flex flex-col gap-12">
      <div
        ref={rootRef}
        style={{ perspective: TILT.perspective }}
        className="relative w-full max-w-sm select-none sm:max-w-3xl"
      >
        {layout ? (
          <ReceiptSpec
            layout={layout}
            horizontal={horizontal}
            torn={torn}
            reducedMotion={reducedMotion}
          />
        ) : null}
        <motion.div
          initial={reducedMotion ? false : "hidden"}
          animate="shown"
          style={{ transform: plane }}
          className="relative flex w-full flex-col sm:flex-row"
        >
          <div ref={bodyRef} className="flex min-w-0 flex-col sm:flex-1">
            <motion.div
              variants={{
                hidden: { opacity: 0 },
                shown: {
                  opacity: 1,
                  transition: { delayChildren: 0.15, duration: 0.3, staggerChildren: 0.08 },
                },
              }}
              className="flex min-w-0 flex-1 flex-col"
            >
              <TicketShell className="flex min-w-0 flex-1 flex-col [--hole-a:0_100%] [--hole-b:100%_100%] [--perf-at:50%_100%] max-sm:pb-0 sm:pr-0 sm:[--hole-a:100%_0] sm:[--hole-b:100%_100%] sm:[--perf-at:100%_50%]">
                <div
                  style={holeStyle}
                  className={cn(
                    "bg-muted text-card-foreground dark:bg-card relative flex min-w-0 flex-1 flex-col rounded-[7px] [--hole-r:11px] [--hole-a:-1px_calc(100%_+_1px)] [--hole-b:calc(100%_+_1px)_calc(100%_+_1px)] [--perf-r:4px] [--perf-at:50%_calc(100%_+_1px)] [--perf-pos:-1px_0] sm:[--hole-a:calc(100%_+_1px)_-1px] sm:[--hole-b:calc(100%_+_1px)_calc(100%_+_1px)] sm:[--perf-at:calc(100%_+_1px)_50%] sm:[--perf-pos:0_-1px]",
                    PERF,
                  )}
                >
                  <motion.span
                    aria-hidden
                    style={{ opacity: castShadow }}
                    className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-2/3 bg-linear-to-t from-black/45 via-black/12 to-transparent dark:from-black/85 dark:via-black/35 sm:inset-y-0 sm:right-0 sm:left-auto sm:h-auto sm:w-2/3 sm:bg-linear-to-l"
                  />
                  <motion.div
                    ref={headRef}
                    variants={reveal}
                    transition={revealTransition}
                    className="flex items-center justify-between border-b border-dashed px-4 py-2.5 font-mono text-[10px] tracking-[0.2em] uppercase"
                  >
                    <span className="text-muted-foreground">Component request</span>
                    <span>{number}</span>
                  </motion.div>
                  <div className="flex flex-1 flex-col sm:flex-row">
                    <motion.div
                      ref={artRef}
                      variants={reveal}
                      transition={revealTransition}
                      className="relative m-3 flex aspect-[4/3] items-center justify-center bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] bg-[size:8px_8px] sm:aspect-square sm:w-72 sm:shrink-0"
                    >
                      {CORNERS.map((corner) => (
                        <span
                          key={corner}
                          aria-hidden
                          className={cn("border-foreground/40 absolute size-2", corner)}
                        />
                      ))}
                      <button
                        type="button"
                        aria-label="Show another artwork"
                        onClick={handleNextArt}
                        className="focus-visible:ring-ring/50 cursor-pointer rounded-md outline-none focus-visible:ring-3"
                      >
                        <motion.div style={{ x: artX, y: artY }}>
                          <ReceiptArt
                            variant={art.variant}
                            tempo={art.swapped ? "swap" : "arrive"}
                          />
                        </motion.div>
                      </button>
                    </motion.div>
                    <dl className="flex min-w-0 flex-col gap-1.5 px-4 pb-4 sm:flex-1 sm:justify-center sm:py-4 sm:pl-2">
                      {rows.map(({ label, value }) =>
                        value === null ? null : (
                          <ReceiptRow key={label} label={label} value={value} />
                        ),
                      )}
                    </dl>
                  </div>
                </div>
              </TicketShell>
            </motion.div>
          </div>
          <div
            ref={stubRef}
            {...handlers}
            onDragStart={(event) => event.preventDefault()}
            data-grabbing={grabbing || undefined}
            className="flex cursor-grab touch-none flex-col select-none will-change-transform data-grabbing:cursor-grabbing sm:w-60 sm:shrink-0"
          >
            <motion.div
              ref={flipRef}
              style={{ transformStyle: "preserve-3d" }}
              className={cn(
                "relative flex flex-1 origin-top flex-col [transform:perspective(900px)_rotateX(calc(var(--fold)*1deg))] sm:origin-left sm:[transform:perspective(900px)_rotateY(calc(var(--fold)*-1deg))]",
                reducedMotion ? "[--fold:0]" : "[--fold:180]",
              )}
            >
              <motion.div
                aria-hidden
                style={{ filter: flipFilter }}
                className="bg-primary absolute inset-0 overflow-hidden rounded-lg backface-hidden [transform:rotateX(180deg)] sm:[transform:rotateY(180deg)]"
              >
                <div className="text-primary-foreground/25 absolute inset-0 flex items-center justify-center font-mono text-[10px] tracking-[0.4em] uppercase">
                  {number}
                </div>
                <motion.div
                  style={{ opacity: backShade }}
                  className="absolute inset-0 bg-linear-to-b from-black/70 to-black/10 sm:bg-linear-to-r"
                />
              </motion.div>
              <motion.div
                style={{ filter: flipFilter }}
                className="relative flex flex-1 flex-col backface-hidden"
              >
                <TicketShell className="flex flex-1 flex-col [--hole-a:0_0] [--hole-b:100%_0] [--perf-at:50%_0] max-sm:pt-0 sm:pl-0 sm:[--hole-a:0_0] sm:[--hole-b:0_100%] sm:[--perf-at:0_50%]">
                  <div
                    style={holeStyle}
                    className={cn(
                      "bg-primary text-primary-foreground relative flex flex-1 flex-col rounded-[7px] [--hole-r:11px] [--hole-a:-1px_-1px] [--hole-b:calc(100%_+_1px)_-1px] [--perf-r:4px] [--perf-at:50%_-1px] [--perf-pos:-1px_0] sm:[--hole-a:-1px_-1px] sm:[--hole-b:-1px_calc(100%_+_1px)] sm:[--perf-at:-1px_50%] sm:[--perf-pos:0_-1px]",
                      PERF,
                    )}
                  >
                    <div className="border-primary-foreground/30 flex items-center justify-between border-b border-dashed px-4 py-2.5 font-mono text-[10px] tracking-[0.2em] uppercase">
                      <span className="opacity-70">Stub</span>
                      <span>{number}</span>
                    </div>
                    <div className="flex flex-1 flex-col gap-2 px-4 py-4 sm:justify-center">
                      <h2
                        ref={confirmationRef}
                        tabIndex={-1}
                        className="text-lg font-medium outline-none"
                      >
                        Filed. Thank you.
                      </h2>
                      <p className="text-xs leading-relaxed opacity-85">
                        It&apos;s public on GitHub now. If it&apos;s accepted it gets a{" "}
                        <code>ready</code> label, then it gets built.
                      </p>
                    </div>
                    <div className="px-4 pb-4">
                      <a
                        href={filed.url}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 flex h-9 items-center justify-center gap-1 rounded-full text-sm font-medium transition-colors"
                      >
                        Follow it on GitHub
                        <ArrowUpRightIcon className="size-3.5" aria-hidden />
                      </a>
                    </div>
                    {torn ? null : (
                      <button
                        type="button"
                        onClick={handleTear}
                        className="focus-visible:ring-primary-foreground/60 sr-only rounded-full focus-visible:not-sr-only focus-visible:absolute focus-visible:top-2 focus-visible:right-2 focus-visible:px-2 focus-visible:py-1 focus-visible:font-mono focus-visible:text-[10px] focus-visible:tracking-[0.2em] focus-visible:uppercase focus-visible:ring-2 focus-visible:outline-none"
                      >
                        Tear off the stub
                      </button>
                    )}
                  </div>
                </TicketShell>
                <motion.div
                  aria-hidden
                  style={{ opacity: faceShade }}
                  className="pointer-events-none absolute inset-0 rounded-lg bg-linear-to-b from-black/70 to-black/5 sm:bg-linear-to-r"
                />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
      {layout ? (
        <ReceiptSpecNotes
          bridges={bridges}
          number={number}
          reducedMotion={reducedMotion}
          telemetry={{ aimX, aimY, intact, phase, tiltX, tiltY }}
        />
      ) : null}
    </div>
  );
};
