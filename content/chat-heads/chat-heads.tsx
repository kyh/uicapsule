"use client";

import { useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { AnimatePresence, motion, useAnimation } from "motion/react";

const STAGE_WIDTH = 340;
const STAGE_HEIGHT = 620;
const HEAD = 62;
const EDGE_PAD = 10;
const DISMISS_X = STAGE_WIDTH / 2;
const DISMISS_Y = STAGE_HEIGHT - 86;
const MAGNET_RADIUS = 110;

const FEED = [
  ["Weekend plans 🏔️", "Riley: trailhead at 7?"],
  ["design-crit", "Mia: shipping the tokens PR"],
  ["Nova", "sent you 3 photos"],
  ["lobby", "Sam: capsule 014 is wild"],
];

export const ChatHeads = () => {
  const controls = useAnimation();
  const positionRef = useRef({ x: STAGE_WIDTH - HEAD - EDGE_PAD, y: 120 });
  const [dragging, setDragging] = useState(false);
  const [nearDismiss, setNearDismiss] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [unread, setUnread] = useState(3);

  const headCenter = (offsetX: number, offsetY: number) => ({
    x: positionRef.current.x + offsetX + HEAD / 2,
    y: positionRef.current.y + offsetY + HEAD / 2,
  });

  const settle = (offsetX: number, offsetY: number, velocityX: number, velocityY: number) => {
    setDragging(false);
    const center = headCenter(offsetX, offsetY);

    if (Math.hypot(center.x - DISMISS_X, center.y - DISMISS_Y) < MAGNET_RADIUS) {
      // Swallowed by the X.
      positionRef.current = { x: DISMISS_X - HEAD / 2, y: DISMISS_Y - HEAD / 2 };
      void controls
        .start({
          x: positionRef.current.x,
          y: positionRef.current.y,
          scale: 0.15,
          opacity: 0,
          transition: { type: "spring", duration: 0.35, bounce: 0 },
        })
        .then(() => setDismissed(true));
      setNearDismiss(false);
      return;
    }

    const projectedX = positionRef.current.x + offsetX + velocityX * 0.16;
    const projectedY = positionRef.current.y + offsetY + velocityY * 0.16;
    const snapX =
      projectedX + HEAD / 2 < STAGE_WIDTH / 2 ? EDGE_PAD : STAGE_WIDTH - HEAD - EDGE_PAD;
    const snapY = Math.min(STAGE_HEIGHT - HEAD - 120, Math.max(56, projectedY));
    positionRef.current = { x: snapX, y: snapY };
    void controls.start({
      x: snapX,
      y: snapY,
      transition: { type: "spring", duration: 0.55, bounce: 0.35 },
    });
  };

  const restore = () => {
    setDismissed(false);
    setUnread(3);
    positionRef.current = { x: STAGE_WIDTH - HEAD - EDGE_PAD, y: 120 };
    void controls.start({
      x: positionRef.current.x,
      y: positionRef.current.y,
      scale: [0.3, 1],
      opacity: 1,
      transition: { type: "spring", duration: 0.5, bounce: 0.45 },
    });
  };

  return (
    <div
      className="relative overflow-hidden rounded-[44px] bg-[#0e0f14] shadow-2xl shadow-black/60 ring-8 ring-black select-none"
      style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT }}
    >
      {/* Backdrop: a chat list */}
      <div className="px-5 pt-12">
        <p className="text-[22px] font-bold text-white">Chats</p>
        <div className="mt-3 space-y-1">
          {FEED.map(([title, line]) => (
            <div key={title} className="flex items-center gap-3 rounded-2xl p-2.5">
              <div className="size-11 shrink-0 rounded-full bg-gradient-to-b from-[#3d4552] to-[#23272e]" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-white/90">{title}</p>
                <p className="truncate text-[12px] text-white/40">{line}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dismiss target */}
      <AnimatePresence>
        {dragging && (
          <motion.div
            key="dismiss"
            initial={{ opacity: 0, y: 30, scale: 0.6 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: nearDismiss ? 1.35 : 1,
            }}
            exit={{ opacity: 0, y: 30, scale: 0.6 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.3 }}
            className="absolute z-20 grid size-14 place-items-center rounded-full bg-black/60 ring-2 ring-white/40 backdrop-blur-md"
            style={{ left: DISMISS_X - 28, top: DISMISS_Y - 28 }}
          >
            <X className="size-6 text-white" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat head */}
      {!dismissed && (
        <motion.div
          drag
          dragMomentum={false}
          dragElastic={0.1}
          initial={{ x: positionRef.current.x, y: positionRef.current.y }}
          animate={controls}
          onDragStart={() => {
            setDragging(true);
            setUnread(0);
          }}
          onDrag={(_, info) => {
            const center = headCenter(info.offset.x, info.offset.y);
            setNearDismiss(Math.hypot(center.x - DISMISS_X, center.y - DISMISS_Y) < MAGNET_RADIUS);
          }}
          onDragEnd={(_, info) =>
            settle(info.offset.x, info.offset.y, info.velocity.x, info.velocity.y)
          }
          className="absolute top-0 left-0 z-30 cursor-grab active:cursor-grabbing"
          style={{ width: HEAD, height: HEAD }}
        >
          <div className="relative size-full">
            <div className="grid size-full place-items-center rounded-full bg-gradient-to-b from-[#f0a58f] to-[#c76b52] shadow-xl shadow-black/50 ring-2 ring-white/20">
              <span className="text-[18px] font-semibold text-white">NV</span>
            </div>
            <AnimatePresence>
              {unread > 0 && (
                <motion.span
                  key="badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", duration: 0.35, bounce: 0.5 }}
                  className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-[#0a84ff] text-[11px] font-bold text-white ring-2 ring-[#0e0f14]"
                >
                  {unread}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Restore */}
      <AnimatePresence>
        {dismissed && (
          <motion.button
            key="restore"
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            onClick={restore}
            className="absolute bottom-16 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[12px] font-medium text-white ring-1 ring-white/15 backdrop-blur-md"
          >
            <MessageCircle className="size-4" /> Bring Nova back
          </motion.button>
        )}
      </AnimatePresence>

      <p className="pointer-events-none absolute inset-x-0 bottom-5 text-center text-[11px] text-white/30">
        Flick the head · drag it to the X to dismiss
      </p>
    </div>
  );
};
