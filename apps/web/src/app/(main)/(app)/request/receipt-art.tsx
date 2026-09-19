"use client";

import { motion, useReducedMotion } from "motion/react";
import type { Transition } from "motion/react";

interface ArtProps {
  reducedMotion: boolean;
}

const entrance = (delay = 0, duration = 0.8): Transition => ({
  delay: 0.35 + delay,
  duration,
  ease: [0.22, 1, 0.36, 1],
});

const Portal = ({ reducedMotion }: ArtProps) => (
  <>
    {[82, 66, 50, 34, 18].map((size, index) => (
      <motion.rect
        key={size}
        x={60 - size / 2}
        y={60 - size / 2}
        width={size}
        height={size}
        rx="2"
        style={{ originX: "60px", originY: "60px", transformBox: "view-box" }}
        initial={reducedMotion ? false : { opacity: 0, rotate: -70, scale: 0.85 }}
        animate={{ opacity: 1, rotate: index * 12, scale: 1 }}
        transition={entrance(index * 0.13, 1.4)}
      />
    ))}
  </>
);

const Prism = ({ reducedMotion }: ArtProps) => (
  <>
    {[
      { d: "M60 14 99 36 60 58 21 36Z M60 14V58", y: -20 },
      { d: "M21 36V82L60 106V58 M21 82 60 60", y: 20 },
      { d: "M99 36V82L60 106 M99 82 60 60", y: 20 },
    ].map(({ d, y }, index) => (
      <motion.path
        key={d}
        d={d}
        initial={reducedMotion ? false : { opacity: 0, y }}
        animate={{ opacity: 1, y: 0 }}
        transition={entrance(index * 0.2, 1.1)}
      />
    ))}
    {[0, 1, 2].map((layer) => (
      <motion.path
        key={layer}
        d={`M21 ${48 + layer * 11} 60 ${70 + layer * 11} 99 ${48 + layer * 11}`}
        initial={reducedMotion ? false : { opacity: 0, y: -9 }}
        animate={{ opacity: 0.45, y: 0 }}
        transition={entrance(0.8 + layer * 0.1)}
      />
    ))}
  </>
);

const Ribbon = ({ reducedMotion }: ArtProps) => (
  <>
    {[0, 1, 2, 3, 4, 5, 6].map((strand) => (
      <motion.path
        key={strand}
        d={`M18 ${30 + strand * 5} C70 ${-7 + strand * 5}, 50 ${97 - strand * 5}, 102 ${60 - strand * 5} M18 ${60 + strand * 5} C70 ${23 + strand * 5}, 50 ${127 - strand * 5}, 102 ${90 - strand * 5}`}
        initial={reducedMotion ? false : { opacity: 0, x: strand % 2 === 0 ? -18 : 18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={entrance(strand * 0.12, 1.3)}
      />
    ))}
  </>
);

const Fan = ({ reducedMotion }: ArtProps) => (
  <>
    {[-72, -48, -24, 0, 24, 48, 72].map((angle, index) => (
      <motion.path
        key={angle}
        d="M60 90 51 34Q60 30 69 34Z"
        style={{ originX: "60px", originY: "90px", transformBox: "view-box" }}
        initial={reducedMotion ? false : { opacity: 0, rotate: -90 }}
        animate={{ opacity: 1, rotate: angle }}
        transition={entrance(index * 0.09, 1.4)}
      />
    ))}
    <motion.path
      d="m56 90 4-4 4 4-4 4Z"
      fill="currentColor"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={entrance(0.85)}
    />
  </>
);

const Staircase = ({ reducedMotion }: ArtProps) => (
  <>
    {[0, 1, 2, 3, 4].map((step) => (
      <motion.g
        key={step}
        initial={reducedMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={entrance(step * 0.18, 0.9)}
      >
        <path
          d={`M${13 + step * 16} ${83 - step * 13}l18-10 14 8-18 10Z m0 0v12l14 8 18-10V${81 - step * 13} m-18 10v12`}
        />
      </motion.g>
    ))}
  </>
);

const Hourglass = ({ reducedMotion }: ArtProps) => (
  <>
    <motion.path
      d="M29 20H91L60 60 91 100H29L60 60Z M24 14H96 M24 106H96"
      initial={reducedMotion ? false : { opacity: 0, scaleY: 0.75 }}
      animate={{ opacity: 1, scaleY: 1 }}
      style={{ originX: "60px", originY: "60px", transformBox: "view-box" }}
      transition={entrance(0, 1)}
    />
    {[0, 1, 2, 3].map((grain) => (
      <motion.path
        key={grain}
        d={`M60 ${72 + grain * 7}l${4 + grain * 5} 5H${56 - grain * 5}Z`}
        initial={reducedMotion ? false : { opacity: 0, y: -45 - grain * 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={entrance(0.5 + (3 - grain) * 0.2, 1)}
      />
    ))}
  </>
);

const CONSTELLATION_POINTS = [
  { x: 22, y: 72 },
  { x: 37, y: 29 },
  { x: 62, y: 53 },
  { x: 88, y: 21 },
  { x: 101, y: 77 },
  { x: 63, y: 99 },
];

const Constellation = ({ reducedMotion }: ArtProps) => (
  <>
    <motion.path
      d="M22 72 37 29 62 53 88 21 101 77 63 99 22 72 62 53 101 77 M62 53 63 99"
      strokeOpacity="0.45"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={entrance(0.7, 1.2)}
    />
    {CONSTELLATION_POINTS.map(({ x, y }, index) => (
      <motion.path
        key={x}
        d={`M${x - 5} ${y}h10 M${x} ${y - 5}v10`}
        style={{ originX: `${x}px`, originY: `${y}px`, transformBox: "view-box" }}
        initial={reducedMotion ? false : { opacity: 0, rotate: -90, scale: 0.65 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        transition={entrance(index * 0.14, 0.8)}
      />
    ))}
  </>
);

const Waveform = ({ reducedMotion }: ArtProps) => (
  <>
    {[18, 34, 58, 82, 64, 38, 54, 76, 48, 28, 12].map((height, index) => (
      <motion.path
        key={height}
        d={`M${15 + index * 9} ${60 - height / 2}v${height}`}
        style={{ originX: "60px", originY: "60px", transformBox: "view-box" }}
        initial={reducedMotion ? false : { opacity: 0, scaleY: 0.15 }}
        animate={{ opacity: 1, scaleY: reducedMotion ? 1 : [1, 0.55, 1] }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : {
                opacity: entrance(index * 0.055),
                scaleY: {
                  delay: 0.35 + index * 0.075,
                  duration: 2.2,
                  ease: "easeInOut",
                  repeat: 1,
                },
              }
        }
      />
    ))}
  </>
);

const Bloom = ({ reducedMotion }: ArtProps) => (
  <>
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, index) => (
      <g key={angle} transform={`rotate(${angle} 60 60)`}>
        <motion.path
          d="M60 60 47 32 60 12 73 32Z M60 12V60"
          style={{ originX: "60px", originY: "60px", transformBox: "view-box" }}
          initial={reducedMotion ? false : { opacity: 0, rotate: -35, scaleY: 0.55 }}
          animate={{ opacity: 1, rotate: 0, scaleY: 1 }}
          transition={entrance(index * 0.1, 1.25)}
        />
      </g>
    ))}
  </>
);

const Tiles = ({ reducedMotion }: ArtProps) => (
  <>
    {[0, 1, 2].flatMap((row) =>
      [0, 1, 2].map((column) => {
        const x = 60 + (column - row) * 20;
        const y = 30 + (column + row) * 15;
        return (
          <motion.path
            key={`${row}-${column}`}
            d={`M${x} ${y - 12}l18 12-18 12-18-12Z M${x - 18} ${y}l18 3 18-3 M${x} ${y + 3}v9`}
            style={{ originX: `${x}px`, originY: `${y}px`, transformBox: "view-box" }}
            initial={reducedMotion ? false : { opacity: 0, rotate: 30, y: -16 }}
            animate={{ opacity: 1, rotate: 0, y: 0 }}
            transition={entrance((row + column) * 0.14 + row * 0.07, 1.1)}
          />
        );
      }),
    )}
  </>
);

const ARTWORKS = {
  bloom: Bloom,
  constellation: Constellation,
  fan: Fan,
  hourglass: Hourglass,
  portal: Portal,
  prism: Prism,
  ribbon: Ribbon,
  staircase: Staircase,
  tiles: Tiles,
  waveform: Waveform,
};

export type ReceiptArtVariant = keyof typeof ARTWORKS;

const isReceiptArtVariant = (value: string): value is ReceiptArtVariant =>
  Object.hasOwn(ARTWORKS, value);

export const receiptArtVariants = Object.keys(ARTWORKS).filter(isReceiptArtVariant);

export const getRandomReceiptArt = (): ReceiptArtVariant =>
  receiptArtVariants[Math.floor(Math.random() * receiptArtVariants.length)] ?? "portal";

export const ReceiptArt = ({ variant }: { variant: ReceiptArtVariant }) => {
  const reducedMotion = useReducedMotion() === true;
  const Artwork = ARTWORKS[variant];

  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="size-36"
      data-receipt-art={variant}
    >
      <Artwork reducedMotion={reducedMotion} />
    </svg>
  );
};
