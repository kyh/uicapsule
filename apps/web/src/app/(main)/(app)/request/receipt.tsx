"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useMediaQuery } from "@repo/ui/hooks/use-media-query";
import { cn } from "cn";
import { ArrowUpRightIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { Transition } from "motion/react";

import { ReceiptArt } from "./receipt-art";
import type { ReceiptArtVariant } from "./receipt-art";
import { ReceiptSpec, ReceiptSpecNotes } from "./receipt-spec";
import type { ReceiptLayout } from "./receipt-spec";
import { useTearStub } from "./use-tear-stub";
import { useTilt } from "./use-tilt";

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

// Each half punches its own seam corners; together they read as holes through the ticket.
// The shell is border-colored and punched 1px tighter than its content, so the rim follows the hole.
const HOLE_MASK =
  "radial-gradient(circle at var(--hole-a), transparent var(--hole-r), black calc(var(--hole-r) + 0.5px)), radial-gradient(circle at var(--hole-b), transparent var(--hole-r), black calc(var(--hole-r) + 0.5px))";
const holeStyle = { maskComposite: "intersect", maskImage: HOLE_MASK };

const TicketShell = ({ className, children }: { className: string; children: ReactNode }) => (
  <div style={holeStyle} className={cn("bg-border rounded-lg p-px [--hole-r:10px]", className)}>
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
  const headRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<HTMLDivElement>(null);
  const {
    bodyRef,
    bridges,
    grabbing,
    handlers,
    intact,
    phase,
    rootRef,
    setFibre,
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

  useLayoutEffect(() => {
    const root = rootRef.current;
    const body = bodyRef.current;
    if (!(root && body)) {
      return;
    }
    const observer = new ResizeObserver(() => {
      const art = artRef.current;
      setLayout({
        art: art
          ? { ...offsetWithin(art, root), height: art.offsetHeight, width: art.offsetWidth }
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

  // The stub hinges open on its seam edge, so the axis follows the layout. Both axes are
  // always named so a breakpoint change mid-life can't leave the old axis folded.
  const fold = {
    hidden: horizontal ? { rotateX: 0, rotateY: -90 } : { rotateX: 90, rotateY: 0 },
    shown: { rotateX: 0, rotateY: 0 },
  };
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
      <div ref={rootRef} className="relative w-full max-w-sm select-none sm:max-w-3xl">
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
              <TicketShell className="flex min-w-0 flex-1 flex-col [--hole-a:0_100%] [--hole-b:100%_100%] max-sm:pb-0 sm:pr-0 sm:[--hole-a:100%_0] sm:[--hole-b:100%_100%]">
                <div
                  style={holeStyle}
                  className="bg-muted text-card-foreground dark:bg-card relative flex min-w-0 flex-1 flex-col rounded-[7px] [--hole-r:11px] [--hole-a:-1px_calc(100%_+_1px)] [--hole-b:calc(100%_+_1px)_calc(100%_+_1px)] sm:[--hole-a:calc(100%_+_1px)_-1px] sm:[--hole-b:calc(100%_+_1px)_calc(100%_+_1px)]"
                >
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
                      <motion.div style={{ x: artX, y: artY }}>
                        <ReceiptArt variant={filed.art} />
                      </motion.div>
                    </motion.div>
                    <dl className="flex min-w-0 flex-col gap-1.5 px-4 pb-4 sm:flex-1 sm:justify-center sm:py-4 sm:pl-2">
                      {rows.map(({ label, value }) =>
                        value === null ? null : (
                          <ReceiptRow key={label} label={label} value={value} />
                        ),
                      )}
                    </dl>
                  </div>
                  <span
                    aria-hidden
                    className="absolute inset-x-4 bottom-0 border-t border-dashed sm:inset-x-auto sm:inset-y-4 sm:right-0 sm:border-t-0 sm:border-l"
                  />
                </div>
              </TicketShell>
            </motion.div>
          </div>
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 size-full overflow-visible"
          >
            {Array.from({ length: bridges }, (_, index) => (
              <g key={index}>
                <path
                  ref={setFibre(index * 2)}
                  className="stroke-muted fill-none opacity-0 [stroke-linecap:round] dark:stroke-card"
                />
                <path
                  ref={setFibre(index * 2 + 1)}
                  className="stroke-primary fill-none opacity-0 [stroke-linecap:round]"
                />
              </g>
            ))}
          </svg>
          <div
            ref={stubRef}
            {...handlers}
            onDragStart={(event) => event.preventDefault()}
            data-grabbing={grabbing || undefined}
            className="flex cursor-grab touch-none flex-col select-none will-change-transform data-grabbing:cursor-grabbing sm:w-60 sm:shrink-0"
          >
            <motion.div
              variants={fold}
              transition={{ bounce: 0.2, delay: 0.3, type: "spring", visualDuration: 0.7 }}
              style={{ transformPerspective: 1200 }}
              className="flex flex-1 origin-top flex-col backface-hidden sm:origin-left"
            >
              <TicketShell className="flex flex-1 flex-col [--hole-a:0_0] [--hole-b:100%_0] max-sm:pt-0 sm:pl-0 sm:[--hole-a:0_0] sm:[--hole-b:0_100%]">
                <div
                  style={holeStyle}
                  className="bg-primary text-primary-foreground relative flex flex-1 flex-col rounded-[7px] [--hole-r:11px] [--hole-a:-1px_-1px] [--hole-b:calc(100%_+_1px)_-1px] sm:[--hole-a:-1px_-1px] sm:[--hole-b:-1px_calc(100%_+_1px)]"
                >
                  <div className="border-primary-foreground/30 flex items-center justify-between border-b border-dashed px-4 py-2.5 font-mono text-[10px] tracking-[0.2em] uppercase">
                    <span className="opacity-70">Stub</span>
                    <span>{number}</span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 px-4 py-4 sm:justify-center">
                    <p className="text-lg font-medium">Filed. Thank you.</p>
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
