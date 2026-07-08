"use client";

import { useRef, useState, type FC } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform } from "motion/react";
import { CreditCard, FilePenLine, Terminal, Trash2, Check, X } from "lucide-react";

/**
 * Swipe approvals — the agent permission queue as a card stack. Swipe
 * right to approve a tool call, left to reject it; velocity counts, the
 * stamp fades in with the drag, and the stack breathes forward as cards
 * commit.
 */

type ToolCall = {
  id: string;
  icon: FC<{ className?: string }>;
  tool: string;
  detail: string;
  risk: "low" | "medium" | "high";
};

const CALLS: ToolCall[] = [
  {
    id: "run-tests",
    icon: Terminal,
    tool: "Run command",
    detail: "pnpm test --filter api",
    risk: "low",
  },
  {
    id: "write-auth",
    icon: FilePenLine,
    tool: "Write file",
    detail: "src/auth/session.ts · 84 lines",
    risk: "medium",
  },
  {
    id: "refund",
    icon: CreditCard,
    tool: "Stripe API",
    detail: "refund charge_9f3k · $42.00",
    risk: "high",
  },
  {
    id: "delete-branch",
    icon: Trash2,
    tool: "Delete branch",
    detail: "origin/old-ui (34 commits)",
    risk: "high",
  },
];

const RISK_STYLES: Record<ToolCall["risk"], string> = {
  low: "bg-emerald-400/10 text-emerald-300",
  medium: "bg-amber-400/10 text-amber-300",
  high: "bg-red-400/10 text-red-300",
};

const COMMIT_DISTANCE = 130;

type Decision = "approved" | "rejected";

const TopCard: FC<{
  call: ToolCall;
  onDecide: (decision: Decision) => void;
}> = ({ call, onDecide }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-13, 13]);
  const approveOpacity = useTransform(x, [30, COMMIT_DISTANCE], [0, 1]);
  const rejectOpacity = useTransform(x, [-COMMIT_DISTANCE, -30], [1, 0]);
  const Icon = call.icon;

  return (
    <motion.div
      style={{ x, rotate }}
      drag="x"
      dragElastic={0.7}
      dragSnapToOrigin
      whileDrag={{ cursor: "grabbing" }}
      onDragEnd={(_, info) => {
        const projected = info.offset.x + info.velocity.x * 0.18;
        if (projected > COMMIT_DISTANCE) onDecide("approved");
        else if (projected < -COMMIT_DISTANCE) onDecide("rejected");
      }}
      className="absolute inset-0 cursor-grab touch-none rounded-2xl bg-[#191b23] p-6 shadow-2xl shadow-black/60 ring-1 ring-white/12"
    >
      <div className="flex items-start justify-between">
        <div className="flex size-11 items-center justify-center rounded-xl bg-white/[0.07]">
          <Icon className="size-5 text-white/80" />
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase ${RISK_STYLES[call.risk]}`}
        >
          {call.risk} risk
        </span>
      </div>

      <p className="mt-5 text-[16px] font-semibold text-white">{call.tool}</p>
      <p className="mt-1.5 rounded-lg bg-black/35 px-3 py-2 font-mono text-[12px] text-white/65">
        {call.detail}
      </p>

      <p className="mt-4 text-[11px] text-white/35">
        Agent wants to run this now · swipe to decide
      </p>

      {/* Stamps */}
      <motion.span
        style={{ opacity: approveOpacity }}
        className="absolute top-5 left-5 -rotate-12 rounded-md border-2 border-emerald-400 px-2.5 py-1 text-[13px] font-black tracking-widest text-emerald-400 uppercase"
      >
        Approve
      </motion.span>
      <motion.span
        style={{ opacity: rejectOpacity }}
        className="absolute top-5 right-5 rotate-12 rounded-md border-2 border-red-400 px-2.5 py-1 text-[13px] font-black tracking-widest text-red-400 uppercase"
      >
        Reject
      </motion.span>
    </motion.div>
  );
};

export const SwipeApprovals = () => {
  const [queue, setQueue] = useState<ToolCall[]>(CALLS);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const lastDecisionRef = useRef<Decision>("approved");

  const decide = (decision: Decision) => {
    const top = queue[0];
    if (!top) return;
    lastDecisionRef.current = decision;
    setDecisions((current) => ({ ...current, [top.id]: decision }));
    setQueue((current) => current.slice(1));
  };

  const reset = () => {
    setQueue(CALLS);
    setDecisions({});
  };

  const approvedCount = Object.values(decisions).filter((d) => d === "approved").length;
  const rejectedCount = Object.values(decisions).filter((d) => d === "rejected").length;

  return (
    <div className="w-[420px] rounded-3xl bg-[#101116] p-7 shadow-2xl shadow-black/60 ring-1 ring-white/10 select-none">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[14px] font-semibold text-white">Agent requests</p>
          <p className="text-[11px] text-white/40">
            {queue.length > 0 ? `${String(queue.length)} pending approval` : "queue clear"}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] tabular-nums">
          <span className="text-emerald-300">{approvedCount} ✓</span>
          <span className="text-red-300">{rejectedCount} ✕</span>
        </div>
      </div>

      {/* Stack */}
      <div className="relative h-[224px]">
        <AnimatePresence>
          {queue.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.07]"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-emerald-400/15">
                <Check className="size-5 text-emerald-300" />
              </span>
              <p className="text-[13px] text-white/70">
                All reviewed — {approvedCount} approved, {rejectedCount} rejected
              </p>
              <button
                type="button"
                onClick={reset}
                className="rounded-full bg-white/[0.08] px-4 py-1.5 text-[11px] font-medium text-white/75 transition-colors hover:bg-white/[0.13]"
              >
                Replay queue
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back cards */}
        {queue.slice(1, 3).map((call, index) => (
          <motion.div
            key={call.id}
            animate={{ scale: 1 - (index + 1) * 0.05, y: (index + 1) * 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            style={{ zIndex: -index - 1 }}
            className="absolute inset-0 rounded-2xl bg-[#15171e] ring-1 ring-white/[0.07]"
          />
        ))}

        {/* Top card flies out in the decided direction */}
        <AnimatePresence>
          {queue[0] && (
            <motion.div
              key={queue[0].id}
              initial={{ scale: 0.95, y: 16, opacity: 0.9 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{
                x: lastDecisionRef.current === "approved" ? 520 : -520,
                rotate: lastDecisionRef.current === "approved" ? 18 : -18,
                opacity: 0,
                transition: { duration: 0.32, ease: "easeIn" },
              }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="absolute inset-0"
            >
              <TopCard call={queue[0]} onDecide={decide} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Buttons for the swipe-averse */}
      <div className="mt-6 flex justify-center gap-4">
        <button
          type="button"
          aria-label="Reject"
          disabled={queue.length === 0}
          onClick={() => decide("rejected")}
          className="flex size-12 items-center justify-center rounded-full bg-red-400/12 text-red-300 transition-all hover:bg-red-400/20 active:scale-90 disabled:opacity-30"
        >
          <X className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Approve"
          disabled={queue.length === 0}
          onClick={() => decide("approved")}
          className="flex size-12 items-center justify-center rounded-full bg-emerald-400/12 text-emerald-300 transition-all hover:bg-emerald-400/20 active:scale-90 disabled:opacity-30"
        >
          <Check className="size-5" />
        </button>
      </div>
    </div>
  );
};
