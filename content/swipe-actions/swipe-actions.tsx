"use client";

import { useState } from "react";
import type { FC } from "react";
import { Flag, Trash2 } from "lucide-react";
import { AnimatePresence, motion, useAnimation, useMotionValue, useTransform } from "motion/react";

interface Email {
  id: string;
  sender: string;
  subject: string;
  snippet: string;
  time: string;
  unread: boolean;
}

const EMAILS: Email[] = [
  {
    id: "e1",
    sender: "Riley Chen",
    snippet: "The swipe hysteresis feels right now — buttons stop flickering at the threshold…",
    subject: "Capsule review notes",
    time: "9:41 AM",
    unread: true,
  },
  {
    id: "e2",
    sender: "Figma",
    snippet: "UI Capsule — gallery refresh. Open in Figma to start editing together.",
    subject: "Nova invited you to a file",
    time: "8:12 AM",
    unread: true,
  },
  {
    id: "e3",
    sender: "Mia Torres",
    snippet: "Agreed, one spring config for every size change. Shipping the PR tonight.",
    subject: "Re: Motion tokens",
    time: "Yesterday",
    unread: false,
  },
  {
    id: "e4",
    sender: "Vercel",
    snippet: "uicapsule.com is live. 42 routes built in 38s.",
    subject: "Deployment ready",
    time: "Yesterday",
    unread: false,
  },
  {
    id: "e5",
    sender: "Sam Okafor",
    snippet: "Partial swipe pins the buttons. Rip it all the way across to delete.",
    subject: "Swipe it left 👈",
    time: "Monday",
    unread: true,
  },
];

const BUTTONS_WIDTH = 144;
const OPEN_THRESHOLD = -72;
const COMMIT_THRESHOLD = -240;

interface RowProps {
  email: Email;
  onDelete: (id: string) => void;
  onToggleRead: (id: string) => void;
}

const Row: FC<RowProps> = ({ email, onDelete, onToggleRead }) => {
  const controls = useAnimation();
  const x = useMotionValue(0);
  // Only the side the row is sliding away from may show, or a right swipe flashes the red actions;
  // the row also settles home without overshoot for the same reason.
  const readOpacity = useTransform(x, (value) => (value > 0 ? 1 : 0));
  const actionsOpacity = useTransform(x, (value) => (value < 0 ? 1 : 0));
  const [open, setOpen] = useState(false);

  const settle = (offset: number, velocity: number) => {
    const projected = offset + velocity * 0.18;
    if (projected < COMMIT_THRESHOLD) {
      void controls.start({ transition: { duration: 0.22, ease: "easeIn" }, x: -400 });
      setTimeout(() => onDelete(email.id), 180);
      return;
    }
    if (projected < OPEN_THRESHOLD) {
      setOpen(true);
      void controls.start({
        transition: { bounce: 0.2, duration: 0.4, type: "spring" },
        x: -BUTTONS_WIDTH,
      });
      return;
    }
    if (projected > 60) {
      onToggleRead(email.id);
    }
    setOpen(false);
    void controls.start({ transition: { bounce: 0, duration: 0.4, type: "spring" }, x: 0 });
  };

  return (
    <motion.div
      layout
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="relative overflow-hidden"
    >
      <motion.div
        style={{ opacity: readOpacity }}
        className="absolute inset-y-0 left-0 flex w-28 items-center bg-[#0a84ff] pl-5"
      >
        <span className="text-[12px] font-semibold text-white">
          {email.unread ? "Read" : "Unread"}
        </span>
      </motion.div>

      <motion.div style={{ opacity: actionsOpacity }} className="absolute inset-y-0 right-0 flex">
        <button
          type="button"
          aria-label="Flag"
          onClick={() => settle(0, 0)}
          className="flex w-[72px] items-center justify-center bg-[#ff9500] text-white"
        >
          <Flag className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Delete"
          onClick={() => {
            void controls.start({ transition: { duration: 0.22, ease: "easeIn" }, x: -400 });
            setTimeout(() => onDelete(email.id), 180);
          }}
          className="flex w-[72px] items-center justify-center bg-[#ff3b30] text-white"
        >
          <Trash2 className="size-5" />
        </button>
      </motion.div>

      <motion.div
        drag="x"
        style={{ x }}
        dragConstraints={{ left: -320, right: 96 }}
        dragElastic={0.06}
        animate={controls}
        onDragEnd={(_, info) =>
          settle(info.offset.x + (open ? -BUTTONS_WIDTH : 0), info.velocity.x)
        }
        className="relative cursor-grab bg-[#111113] px-5 py-3.5 active:cursor-grabbing"
      >
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {email.unread && <span className="size-2 shrink-0 rounded-full bg-[#0a84ff]" />}
            <p className="truncate text-[14px] font-semibold text-white">{email.sender}</p>
          </div>
          <p className="shrink-0 text-[12px] text-white/35 tabular-nums">{email.time}</p>
        </div>
        <p className="mt-0.5 truncate text-[13px] text-white/80">{email.subject}</p>
        <p className="mt-0.5 line-clamp-1 text-[12px] leading-snug text-white/40">
          {email.snippet}
        </p>
      </motion.div>
    </motion.div>
  );
};

export const SwipeActions = () => {
  const [emails, setEmails] = useState<Email[]>(EMAILS);

  const handleDelete = (id: string) => {
    setEmails((previous) => previous.filter((email) => email.id !== id));
  };

  const handleToggleRead = (id: string) => {
    setEmails((previous) =>
      previous.map((email) => (email.id === id ? { ...email, unread: !email.unread } : email)),
    );
  };

  return (
    <div className="w-[380px] overflow-hidden rounded-[28px] bg-[#111113] shadow-2xl shadow-black/60 ring-1 ring-white/10 select-none">
      <div className="flex items-baseline justify-between px-5 pt-5 pb-3">
        <p className="text-[22px] font-bold text-white">Inbox</p>
        <p className="text-[12px] text-white/40">
          {emails.filter((email) => email.unread).length} unread
        </p>
      </div>

      <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
        <AnimatePresence initial={false}>
          {emails.map((email) => (
            <Row
              key={email.id}
              email={email}
              onDelete={handleDelete}
              onToggleRead={handleToggleRead}
            />
          ))}
        </AnimatePresence>
      </div>

      {emails.length === 0 ? (
        <p className="px-5 py-10 text-center text-[13px] text-white/35">
          Inbox zero. Refresh to restart the demo.
        </p>
      ) : (
        <p className="px-5 py-4 text-center text-[11px] text-white/30">
          Swipe left for actions · rip across to delete · swipe right to mark read
        </p>
      )}
    </div>
  );
};
