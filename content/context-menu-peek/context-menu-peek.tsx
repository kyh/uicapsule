"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, Copy, Languages, Pin, Reply, Trash2, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface Message {
  id: string;
  text: string;
  sent: boolean;
}

const MESSAGES: Message[] = [
  { id: "m1", sent: false, text: "Did you see the new capsule drop?" },
  { id: "m2", sent: true, text: "The context menu one? Just tried it" },
  { id: "m3", sent: false, text: "Hold any bubble — the whole thread melts away behind it" },
  { id: "m4", sent: true, text: "That lift-then-blur timing is so satisfying" },
  { id: "m5", sent: false, text: "Try holding this one 👀" },
];

interface MenuAction {
  id: string;
  label: string;
  icon: LucideIcon;
  destructive?: boolean;
}

const MENU_ACTIONS: MenuAction[] = [
  { icon: Reply, id: "reply", label: "Reply" },
  { icon: Copy, id: "copy", label: "Copy" },
  { icon: Languages, id: "translate", label: "Translate" },
  { icon: Pin, id: "pin", label: "Pin" },
  { destructive: true, icon: Trash2, id: "delete", label: "Delete" },
];

const LONG_PRESS_MS = 400;

export const ContextMenuPeek = () => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
      }
    },
    [],
  );

  const startPress = useCallback((id: string) => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
    pressTimerRef.current = setTimeout(() => setActiveId(id), LONG_PRESS_MS);
  }, []);

  const cancelPress = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, []);

  const dismiss = useCallback(() => setActiveId(null), []);

  return (
    <div className="relative h-[620px] w-[340px] overflow-hidden rounded-[44px] bg-[#000000] shadow-2xl shadow-black/60 ring-8 ring-black select-none">
      <div className="relative z-10 flex items-center gap-3 border-b border-white/10 bg-[#0d0d0f]/90 px-4 pt-5 pb-3">
        <ChevronLeft className="size-5 text-sky-400" />
        <div className="grid size-9 place-items-center rounded-full bg-gradient-to-b from-[#8b93a3] to-[#5b6472] text-[13px] font-semibold text-white">
          KL
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-semibold text-white">Kai Lambert</p>
          <p className="text-[11px] text-white/40">iMessage</p>
        </div>
        <Video className="size-5 text-sky-400" />
      </div>

      <div className="relative flex flex-col gap-1.5 px-4 pt-4">
        {MESSAGES.map((message) => {
          const isActive = activeId === message.id;
          return (
            <div
              key={message.id}
              className={`flex ${message.sent ? "justify-end" : "justify-start"}`}
            >
              <div className={`relative ${isActive ? "z-40" : "z-0"}`}>
                <motion.div
                  onPointerDown={() => startPress(message.id)}
                  onPointerUp={cancelPress}
                  onPointerLeave={cancelPress}
                  animate={isActive ? { scale: 1.04, y: -2 } : { scale: 1, y: 0 }}
                  transition={{ bounce: 0.55, duration: 0.35, type: "spring" }}
                  className={`max-w-[220px] cursor-pointer rounded-[18px] px-3.5 py-2 text-[14px] leading-snug ${
                    message.sent ? "bg-[#0a84ff] text-white" : "bg-[#26262a] text-white"
                  } ${isActive ? "shadow-2xl shadow-black/60" : ""}`}
                >
                  {message.text}
                </motion.div>

                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      key="menu"
                      initial={{ opacity: 0, scale: 0.3, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.3, y: -8 }}
                      transition={{ bounce: 0.3, delay: 0.05, duration: 0.42, type: "spring" }}
                      style={{
                        transformOrigin: message.sent ? "top right" : "top left",
                      }}
                      className={`absolute top-full z-40 mt-2 w-56 overflow-hidden rounded-2xl bg-[#1c1c20]/95 shadow-2xl shadow-black/60 ring-1 ring-white/10 backdrop-blur-xl ${
                        message.sent ? "right-0" : "left-0"
                      }`}
                    >
                      {MENU_ACTIONS.map((action, index) => (
                        <button
                          type="button"
                          key={action.id}
                          onClick={dismiss}
                          className={`flex w-full items-center justify-between px-4 py-2.5 text-[14px] transition-colors hover:bg-white/5 ${
                            action.destructive ? "text-red-400" : "text-white"
                          } ${index > 0 ? "border-t border-white/[0.07]" : ""} ${
                            action.destructive ? "border-t-[6px] border-black/40" : ""
                          }`}
                        >
                          {action.label}
                          <action.icon className="size-4 opacity-70" />
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {activeId && (
          <motion.div
            key="backdrop"
            initial={{ backdropFilter: "blur(0px)", opacity: 0 }}
            animate={{ backdropFilter: "blur(14px)", opacity: 1 }}
            exit={{ backdropFilter: "blur(0px)", opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={dismiss}
            onPointerDown={cancelPress}
            className="absolute inset-0 z-30 bg-black/45"
          />
        )}
      </AnimatePresence>

      <div className="absolute inset-x-0 bottom-0 z-10 flex items-center gap-2 border-t border-white/10 bg-[#0d0d0f]/90 px-4 pt-2.5 pb-5">
        <div className="h-9 flex-1 rounded-full bg-[#1c1c20] px-4 text-[13px] leading-9 text-white/35">
          iMessage
        </div>
      </div>

      <AnimatePresence>
        {!activeId && (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 1 } }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-x-0 bottom-16 z-10 text-center text-[11px] text-white/30"
          >
            Hold a bubble
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};
