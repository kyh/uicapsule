"use client";

import { motion as chartMotion } from "@tanstack/charts/motion";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Ellipsis,
  Info,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { animate, motion, useInView, useMotionValue, useMotionValueEvent } from "motion/react";
import { createContext, use, useEffect, useId, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import { usd } from "./data";
import { GREEN, INK, MUTED, RED, SPRING } from "./tokens";

/** The one renderer every chart shares: keyed springs, entrance on mount. */
export const renderer = chartMotion({ initial: "always", transition: SPRING });

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

/* -------------------------------------------------------------------------- */
/* Card + activation                                                          */
/* -------------------------------------------------------------------------- */

const ActiveContext = createContext(false);

/** True once the surrounding card has scrolled into view. Charts mount then, so
 * every entrance plays where someone can see it. */
export const useActive = () => use(ActiveContext);

/** Wraps one card in the wall and owns its in-view state. It sits ABOVE the
 * chart component, so hooks in a chart's own body (`useCycle`) see it too. */
export const ChartCell = ({ children, id }: { children: ReactNode; id: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const active = useInView(ref, { margin: "0px 0px -12% 0px", once: true });
  return (
    <div ref={ref} data-chart={id} className="break-inside-avoid">
      <ActiveContext value={active}>{children}</ActiveContext>
    </div>
  );
};

export const Card = ({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) => {
  const active = useActive();
  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.97, y: 28 }}
      animate={active ? { opacity: 1, scale: 1, y: 0 } : undefined}
      transition={SPRING}
      className={cx(
        "relative mb-4 overflow-hidden rounded-[22px] bg-white p-5 text-[#0b0b0f] shadow-[0_1px_2px_rgba(16,16,24,0.04),0_8px_24px_-12px_rgba(16,16,24,0.12)] ring-1 ring-black/[0.04]",
        className,
      )}
      style={style}
    >
      {children}
    </motion.article>
  );
};

/** Holds a chart's height until its card is active, then mounts it. */
export const ChartSlot = ({
  height,
  children,
  className,
}: {
  height: number;
  children: ReactNode;
  className?: string;
}) => {
  const active = useActive();
  return (
    <div className={cx("relative", className)} style={{ height }}>
      {active ? children : null}
    </div>
  );
};

/** An absolutely-positioned layer matching a chart's locked plot margins, so
 * HTML callouts can sit at percentages of the plot area. */
export const PlotOverlay = ({
  margin,
  children,
}: {
  margin: { top: number; right: number; bottom: number; left: number };
  children: ReactNode;
}) => (
  <div
    className="pointer-events-none absolute"
    style={{ bottom: margin.bottom, left: margin.left, right: margin.right, top: margin.top }}
  >
    {children}
  </div>
);

/** Auto-advancing index while the card is visible. Hover (via `pin`) holds it. */
export const useCycle = (count: number, ms = 2200, start = 0) => {
  const active = useActive();
  const [index, setIndex] = useState(start);
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (!active || held || count < 2) {
      return;
    }
    const t = setInterval(() => setIndex((i) => (i + 1) % count), ms);
    return () => clearInterval(t);
  }, [active, held, count, ms]);
  const pin = (i: number | null) => {
    if (i === null) {
      setHeld(false);
      return;
    }
    setHeld(true);
    setIndex(i);
  };
  return [index, pin] as const;
};

/* -------------------------------------------------------------------------- */
/* Numbers                                                                    */
/* -------------------------------------------------------------------------- */

/** Counts from 0 (and later from its last value) to `value` once active. */
const defaultFormat = (n: number) => usd(n);

export const Num = ({
  value,
  format = defaultFormat,
  className,
  style,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
  style?: CSSProperties;
}) => {
  const active = useActive();
  const mv = useMotionValue(0);
  const [text, setText] = useState(() => format(0));
  useMotionValueEvent(mv, "change", (v) => setText(format(v)));
  useEffect(() => {
    if (!active) {
      return;
    }
    const controls = animate(mv, value, { duration: 1.1, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [active, value, mv]);
  return (
    <span className={cx("tabular-nums", className)} style={style}>
      {text}
    </span>
  );
};

/** A signed change. `text`: colored inline; `pill`: tinted chip; `circle`:
 * arrow-in-a-dot then value; `trend`: trend arrow then value. */
export const Delta = ({
  value,
  suffix = "%",
  prefix = "",
  variant = "text",
  className,
  showSign = true,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  variant?: "text" | "pill" | "circle" | "trend";
  className?: string;
  showSign?: boolean;
}) => {
  const up = value >= 0;
  const color = up ? GREEN : RED;
  let sign = "";
  if (showSign) {
    sign = up ? "+" : "-";
  }
  const body = `${sign}${prefix}${Math.abs(value).toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}${suffix}`;
  if (variant === "pill") {
    return (
      <span
        className={cx(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold tabular-nums",
          className,
        )}
        style={{ backgroundColor: up ? "#dcfce7" : "#fee2e2", color }}
      >
        {body}
      </span>
    );
  }
  if (variant === "circle" || variant === "trend") {
    const icons: Record<"circle" | "trend", [LucideIcon, LucideIcon]> = {
      circle: [ArrowUp, ArrowDown],
      trend: [TrendingUp, TrendingDown],
    };
    const Icon = icons[variant][up ? 0 : 1];
    return (
      <span
        className={cx("inline-flex items-center gap-1 font-semibold tabular-nums", className)}
        style={{ color }}
      >
        {variant === "circle" ? (
          <span
            className="inline-flex size-[1.05em] items-center justify-center rounded-full text-white"
            style={{ backgroundColor: color }}
          >
            <Icon className="size-[0.75em]" strokeWidth={3} />
          </span>
        ) : (
          <Icon className="size-[1em]" strokeWidth={2.5} />
        )}
        {`${prefix}${Math.abs(value).toFixed(2)}${suffix}`}
      </span>
    );
  }
  return (
    <span className={cx("font-semibold tabular-nums", className)} style={{ color }}>
      {body}
    </span>
  );
};

/* -------------------------------------------------------------------------- */
/* Chrome                                                                     */
/* -------------------------------------------------------------------------- */

/** Rounded square holding a white glyph on a tinted gradient. */
export const IconTile = ({
  icon: Icon,
  color,
  size = 32,
  className,
}: {
  icon: LucideIcon;
  color: string;
  size?: number;
  className?: string;
}) => (
  <span
    className={cx("inline-flex shrink-0 items-center justify-center rounded-[10px]", className)}
    style={{
      background: `linear-gradient(160deg, color-mix(in oklab, ${color} 70%, white), ${color})`,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 4px 10px -4px ${color}`,
      height: size,
      width: size,
    }}
  >
    <Icon
      className="text-white"
      style={{ height: size * 0.5, width: size * 0.5 }}
      strokeWidth={2.4}
    />
  </span>
);

export const MoreButton = ({ className }: { className?: string }) => (
  <button
    type="button"
    aria-label="More"
    className={cx(
      "inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-black/[0.08] text-[#8a8a93] transition-colors hover:bg-black/[0.03]",
      className,
    )}
  >
    <Ellipsis className="size-4" />
  </button>
);

/** Outline chip: a select, a filter, a "View data" link. */
export const Chip = ({
  children,
  icon: Icon,
  chevron,
  className,
  style,
}: {
  children: ReactNode;
  icon?: LucideIcon;
  chevron?: boolean;
  className?: string;
  style?: CSSProperties;
}) => (
  <span
    className={cx(
      "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-2.5 text-[12px] font-medium text-[#3a3a42]",
      className,
    )}
    style={style}
  >
    {Icon ? <Icon className="size-3.5" /> : null}
    {children}
    {chevron ? <ChevronDown className="size-3.5 text-[#8a8a93]" /> : null}
  </span>
);

/** Card title row: optional icon tile, title + subtitle, trailing actions. */
export const CardHeader = ({
  icon,
  color,
  title,
  subtitle,
  actions,
  className,
}: {
  icon?: LucideIcon;
  color?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) => (
  <div className={cx("flex items-start justify-between gap-3", className)}>
    <div className="flex min-w-0 items-center gap-2.5">
      {icon ? <IconTile icon={icon} color={color ?? INK} /> : null}
      <div className="min-w-0">
        <h3 className="truncate text-[15px] font-semibold tracking-[-0.01em]">{title}</h3>
        {subtitle ? (
          <p className="mt-0.5 truncate text-[12px]" style={{ color: MUTED }}>
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
    {actions ? <div className="flex shrink-0 items-center gap-1.5">{actions}</div> : null}
  </div>
);

/** Small muted label with an optional info glyph. */
export const Label = ({
  children,
  info,
  className,
}: {
  children: ReactNode;
  info?: boolean;
  className?: string;
}) => (
  <p
    className={cx("inline-flex items-center gap-1 text-[12px]", className)}
    style={{ color: MUTED }}
  >
    {children}
    {info ? <Info className="size-3" /> : null}
  </p>
);

/** Pill tabs with a sprung thumb. Drive `value`/`onChange` from `useCycle` to auto-advance. */
export const Segmented = ({
  options,
  value,
  onChange,
  className,
  size = "md",
}: {
  options: readonly string[];
  value: number;
  onChange?: (i: number) => void;
  className?: string;
  size?: "sm" | "md";
}) => {
  const id = useId();
  return (
    <div
      className={cx(
        "flex rounded-full bg-[#f2f2f5] p-0.5",
        size === "sm" ? "text-[11px]" : "text-[13px]",
        className,
      )}
    >
      {options.map((o, i) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange?.(i)}
          className={cx(
            "relative flex-1 rounded-full font-medium transition-colors",
            size === "sm" ? "px-2.5 py-1" : "px-3 py-1.5",
          )}
          style={{ color: i === value ? INK : MUTED }}
        >
          {i === value ? (
            <motion.span
              layoutId={`${id}-thumb`}
              transition={SPRING}
              className="absolute inset-0 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] ring-1 ring-black/[0.04]"
            />
          ) : null}
          <span className="relative">{o}</span>
        </button>
      ))}
    </div>
  );
};

/** Inline legend: swatch + label. */
export const Legend = ({
  items,
  className,
  swatch = "dot",
}: {
  items: readonly { label: string; color: string }[];
  className?: string;
  swatch?: "dot" | "square" | "bar";
}) => (
  <div className={cx("flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]", className)}>
    {items.map((it) => (
      <span key={it.label} className="inline-flex items-center gap-1.5 text-[#3a3a42]">
        <span
          className={cx(
            swatch === "dot" && "size-2 rounded-full",
            swatch === "square" && "size-2.5 rounded-[3px]",
            swatch === "bar" && "h-1 w-3 rounded-full",
          )}
          style={{ backgroundColor: it.color }}
        />
        {it.label}
      </span>
    ))}
  </div>
);

/** A floating callout that springs to wherever `left`/`top` (percent of its
 * positioned parent) point. `dark` matches the black tooltips. */
export const Bubble = ({
  left,
  top,
  children,
  dark,
  align = "center",
  className,
}: {
  left: number;
  top: number;
  children: ReactNode;
  dark?: boolean;
  align?: "center" | "left" | "right";
  className?: string;
}) => {
  const shift = { center: "-50%", left: "0%", right: "-100%" }[align];
  return (
    <motion.div
      initial={false}
      animate={{ left: `${left}%`, top: `${top}%` }}
      transition={SPRING}
      className="pointer-events-none absolute z-10"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={SPRING}
        style={{ x: shift }}
        className={cx(
          "w-max rounded-xl px-2.5 py-1.5 text-[12px] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.25)]",
          dark ? "bg-[#18181b] text-white" : "bg-white text-[#0b0b0f] ring-1 ring-black/[0.06]",
          className,
        )}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

/** Muted sub-row text helper. */
export const muted = { color: MUTED } as const;
