"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, ChevronLeft, Video } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

type Message = {
  id: number;
  text: string;
  sent: boolean;
  reaction?: string;
};

const INITIAL_MESSAGES: Message[] = [
  { id: 1, text: "Ready to see the send animation?", sent: false },
  { id: 2, text: "Born ready", sent: true },
  { id: 3, text: "Type something — or long-press a bubble for tapbacks", sent: false },
];

const SUGGESTIONS = ["On my way!", "Ship it 🚀", "😂😂😂"];
const TAPBACKS = ["❤️", "👍", "😂", "‼️", "❓"];
const LONG_PRESS_MS = 380;

export const ImessageSend = () => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");
  const [reactingTo, setReactingTo] = useState<number | null>(null);
  const nextIdRef = useRef(100);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef(false);

  useEffect(() => {
    return () => {
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    };
  }, []);

  const send = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const id = nextIdRef.current;
    nextIdRef.current += 1;
    setMessages((previous) => [...previous.slice(-7), { id, text: trimmed, sent: true }]);
    setDraft("");
  }, []);

  const startPress = useCallback((id: number) => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    longPressFiredRef.current = false;
    pressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      setReactingTo(id);
    }, LONG_PRESS_MS);
  }, []);

  const cancelPress = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, []);

  const react = useCallback((id: number, emoji: string) => {
    setMessages((previous) =>
      previous.map((message) =>
        message.id === id
          ? { ...message, reaction: message.reaction === emoji ? undefined : emoji }
          : message,
      ),
    );
    setReactingTo(null);
  }, []);

  const draftId = nextIdRef.current;

  return (
    <div
      className="relative flex h-[620px] w-[340px] flex-col overflow-hidden rounded-[44px] bg-black shadow-2xl shadow-black/60 ring-8 ring-black select-none"
      onClick={() => {
        if (longPressFiredRef.current) {
          longPressFiredRef.current = false;
          return;
        }
        setReactingTo(null);
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 bg-[#0d0d0f]/90 px-4 pt-5 pb-3">
        <ChevronLeft className="size-5 text-sky-400" />
        <div className="grid size-9 place-items-center rounded-full bg-gradient-to-b from-[#f0a58f] to-[#c76b52] text-[13px] font-semibold text-white">
          NV
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-semibold text-white">Nova</p>
          <p className="text-[11px] text-white/40">iMessage</p>
        </div>
        <Video className="size-5 text-sky-400" />
      </div>

      {/* Thread */}
      <div className="flex flex-1 flex-col justify-end gap-1.5 overflow-hidden px-4 pb-3">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            layout="position"
            className={`flex ${message.sent ? "justify-end" : "justify-start"}`}
          >
            <div className="relative max-w-[230px]">
              <motion.div
                layoutId={message.sent ? `bubble-${message.id}` : undefined}
                transition={{ type: "spring", duration: 0.5, bounce: 0.25 }}
                onPointerDown={() => startPress(message.id)}
                onPointerUp={cancelPress}
                onPointerLeave={cancelPress}
                style={{ borderRadius: 18 }}
                className={`px-3.5 py-2 text-[14px] leading-snug ${
                  message.sent ? "bg-[#0a84ff] text-white" : "bg-[#26262a] text-white"
                }`}
              >
                {message.text}
              </motion.div>

              {/* Tapback badge */}
              <AnimatePresence>
                {message.reaction && (
                  <motion.span
                    key={message.reaction}
                    initial={{ scale: 0, y: 6 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", duration: 0.4, bounce: 0.55 }}
                    className={`absolute -top-4 grid size-7 place-items-center rounded-full bg-[#3a3a3f] text-[13px] shadow-lg ring-2 ring-black ${
                      message.sent ? "-left-3" : "-right-3"
                    }`}
                  >
                    {message.reaction}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Tapback picker */}
              <AnimatePresence>
                {reactingTo === message.id && (
                  <motion.div
                    key="picker"
                    initial={{ opacity: 0, scale: 0.4, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.4, y: 6 }}
                    transition={{ type: "spring", duration: 0.38, bounce: 0.4 }}
                    style={{ transformOrigin: message.sent ? "bottom right" : "bottom left" }}
                    className={`absolute -top-11 z-20 flex gap-1 rounded-full bg-[#2c2c30] px-2.5 py-1.5 shadow-2xl ring-1 ring-white/10 ${
                      message.sent ? "right-0" : "left-0"
                    }`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {TAPBACKS.map((emoji) => (
                      <motion.button
                        type="button"
                        key={emoji}
                        whileHover={{ scale: 1.3, y: -2 }}
                        whileTap={{ scale: 0.85 }}
                        onClick={() => react(message.id, emoji)}
                        className="text-[17px]"
                      >
                        {emoji}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Suggestions */}
      <div className="flex gap-2 px-4 pb-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            type="button"
            key={suggestion}
            onClick={() => send(suggestion)}
            className="rounded-full bg-white/[0.07] px-3 py-1.5 text-[12px] text-white/70 ring-1 ring-white/10 transition-colors hover:bg-white/[0.12] hover:text-white"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Composer */}
      <div className="flex items-center gap-2 border-t border-white/10 bg-[#0d0d0f]/90 px-4 pt-2.5 pb-6">
        <div className="relative flex h-9 flex-1 items-center rounded-full bg-[#1c1c20] px-4 ring-1 ring-white/10">
          {draft ? (
            <motion.span
              key={draftId}
              layoutId={`bubble-${draftId}`}
              transition={{ type: "spring", duration: 0.5, bounce: 0.25 }}
              style={{ borderRadius: 18 }}
              className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[14px] text-white"
            >
              {draft}
            </motion.span>
          ) : null}
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") send(draft);
            }}
            placeholder="iMessage"
            className="w-full bg-transparent text-[14px] text-transparent caret-sky-400 outline-none placeholder:text-white/35"
          />
        </div>
        <motion.button
          type="button"
          aria-label="Send"
          onClick={() => send(draft)}
          whileTap={{ scale: 0.85 }}
          animate={{
            backgroundColor: draft.trim() ? "#0a84ff" : "#26262a",
            scale: draft.trim() ? 1 : 0.92,
          }}
          className="grid size-8 shrink-0 place-items-center rounded-full text-white"
        >
          <ArrowUp className="size-4" strokeWidth={3} />
        </motion.button>
      </div>
    </div>
  );
};
