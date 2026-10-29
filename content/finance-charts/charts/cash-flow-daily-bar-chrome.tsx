"use client";

import { Calendar } from "lucide-react";

import { Chip } from "../lib/kit";

/** A round US flag drawn in CSS: stripes plus a blue canton. */
const UsFlag = () => (
  <span
    aria-hidden
    className="relative inline-block size-4 shrink-0 overflow-hidden rounded-full ring-1 ring-black/[0.06]"
    style={{
      background: "repeating-linear-gradient(180deg, #e0303a 0 2px, #ffffff 2px 4px)",
    }}
  >
    <span className="absolute top-0 left-0 h-[9px] w-[8px] bg-[#2b3f8f]" />
  </span>
);

/** The "USD" currency select shared by the cash-flow style headers. `compact`
 * keeps only the flag, for headers with a long title. */
export const UsdChip = ({ compact = false }: { compact?: boolean }) => (
  <Chip chevron className={compact ? "gap-1 px-2" : undefined}>
    <UsFlag />
    {compact ? <span className="sr-only">USD</span> : "USD"}
  </Chip>
);

/** The "Monthly" / "Weekly" period select; `compact` drops the calendar glyph. */
export const PeriodChip = ({ label, compact = false }: { label: string; compact?: boolean }) => (
  <Chip chevron icon={compact ? undefined : Calendar}>
    {label}
  </Chip>
);
