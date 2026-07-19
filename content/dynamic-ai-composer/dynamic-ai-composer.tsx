"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, Check, Mic, Plus, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion, useAnimate, type Transition } from "motion/react";

type Mode = "idle" | "input" | "listening" | "thinking" | "responding";

type Exchange = {
  prompt: string;
  words: string[];
};

const VOICE_PROMPTS = [
  "What makes a voice interface feel alive?",
  "How should an input morph between states?",
] as const;

const RESPONSES = [
  "Great voice UI breathes with you. The waveform should track real amplitude, the container should swell slightly as you speak, and silence should feel like the interface leaning in — not a dead sensor waiting for a timeout.",
  "One container, many shapes. Keep the border radius continuous, crossfade contents through a light blur, and let a spring drive every size change so each state feels like the same object stretching, never a cut between screens.",
  "Morphing earns trust when nothing teleports. Anchor the capsule in place, animate width and height from the same origin, and stagger content in a beat after the container settles so the shape reads first and the details second.",
] as const;

const SPRING: Transition = { type: "spring", duration: 0.55, bounce: 0.3 };

const WIDTHS: Record<Mode, string> = {
  idle: "w-[260px]",
  input: "w-[min(400px,calc(100vw-48px))]",
  listening: "w-[300px]",
  thinking: "w-[200px]",
  responding: "w-[min(420px,calc(100vw-48px))]",
};

const pickIndex = (length: number) => Math.floor(Math.random() * length);

const BAR_COUNT = 21;

const ListeningWave = () => (
  <div className="flex h-8 flex-1 items-center justify-center gap-[3px]">
    {Array.from({ length: BAR_COUNT }, (_, index) => {
      const envelope = 0.3 + 0.7 * Math.sin((index / (BAR_COUNT - 1)) * Math.PI);
      const wobble = 0.45 + (Math.sin(index * 12.9898) * 0.5 + 0.5) * 0.55;
      return (
        <motion.div
          key={index}
          className="h-7 w-[3px] rounded-full bg-white"
          animate={{ scaleY: [0.12, envelope * wobble, 0.22, envelope, 0.12] }}
          transition={{
            duration: 0.9 + (index % 5) * 0.13,
            repeat: Infinity,
            ease: "easeInOut",
            delay: (index % 7) * 0.07,
          }}
        />
      );
    })}
  </div>
);

const ThinkingSweep = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[24px]">
    <motion.div
      className="absolute inset-[-150%] bg-[conic-gradient(from_0deg,transparent_0%,transparent_62%,#a78bfa_80%,#67e8f9_90%,transparent_100%)]"
      animate={{ rotate: 360 }}
      transition={{ duration: 1.6, ease: "linear", repeat: Infinity }}
    />
    <div className="absolute inset-[1.5px] rounded-[22.5px] bg-neutral-900" />
  </div>
);

export const DynamicAiComposer = () => {
  const [mode, setMode] = useState<Mode>("idle");
  const [draft, setDraft] = useState("");
  const [exchange, setExchange] = useState<Exchange | null>(null);
  const [streamedCount, setStreamedCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [scope, animateShake] = useAnimate();

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const timeoutsRef = useRef(new Set<ReturnType<typeof setTimeout>>());

  // Timers are tracked so unmount can cancel the in-flight stream; each one drops
  // itself from the set as it fires so a long session cannot accumulate dead ids.
  const queue = useCallback((callback: () => void, delay: number) => {
    const id = setTimeout(() => {
      timeoutsRef.current.delete(id);
      callback();
    }, delay);
    timeoutsRef.current.add(id);
  }, []);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (mode === "input") {
      textareaRef.current?.focus();
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== "listening") return;
    setElapsed(0);
    const interval = setInterval(() => {
      setElapsed((previous) => previous + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [mode]);

  const submit = useCallback(
    (prompt: string) => {
      const response = RESPONSES[pickIndex(RESPONSES.length)];
      if (!response) return;
      const words = response.split(" ");
      setExchange({ prompt, words });
      setStreamedCount(0);
      setMode("thinking");

      queue(() => {
        setMode("responding");
        const step = (index: number) => {
          setStreamedCount(index + 1);
          if (index + 1 < words.length) {
            queue(() => step(index + 1), 60 + ((index * 37) % 60));
          }
        };
        queue(() => step(0), 250);
      }, 1500);
    },
    [queue],
  );

  const handleSend = useCallback(() => {
    const prompt = draft.trim();
    if (!prompt) {
      animateShake(scope.current, { x: [0, -10, 10, -6, 6, 0] }, { duration: 0.4 });
      return;
    }
    setDraft("");
    submit(prompt);
  }, [animateShake, draft, scope, submit]);

  const handleVoiceConfirm = useCallback(() => {
    const prompt = VOICE_PROMPTS[pickIndex(VOICE_PROMPTS.length)];
    if (!prompt) return;
    submit(prompt);
  }, [submit]);

  const reset = useCallback(() => {
    setExchange(null);
    setStreamedCount(0);
    setMode("idle");
  }, []);

  const isStreamDone = exchange !== null && streamedCount >= exchange.words.length;

  // The gradient glow marks activity: every state change fires one pulse, and
  // loading states (thinking, streaming a response) keep pulsing until done.
  const isLoading = mode === "thinking" || (mode === "responding" && !isStreamDone);
  const glowKey = `${mode}-${isLoading ? "loading" : "settled"}`;

  const content = (() => {
    switch (mode) {
      case "idle":
        return (
          <div className="flex h-12 items-center gap-1 pr-2 pl-4">
            <button
              type="button"
              onClick={() => setMode("input")}
              className="flex h-full flex-1 items-center gap-2.5 text-left"
            >
              <Sparkles className="size-4 text-white/50" />
              <span className="text-sm text-white/45">Ask anything</span>
            </button>
            <button
              type="button"
              aria-label="Start voice input"
              onClick={() => setMode("listening")}
              className="grid size-8 place-items-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Mic className="size-4" />
            </button>
          </div>
        );
      case "input":
        return (
          <div className="flex flex-col">
            <textarea
              ref={textareaRef}
              rows={2}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
                if (event.key === "Escape") {
                  setMode("idle");
                }
              }}
              placeholder="Ask anything…"
              className="w-full resize-none bg-transparent px-4 pt-3.5 text-sm leading-6 text-white outline-none placeholder:text-white/40"
            />
            <div className="flex items-center gap-1 p-2">
              <button
                type="button"
                aria-label="Add attachment"
                className="grid size-8 place-items-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Plus className="size-4" />
              </button>
              <div className="flex-1" />
              <button
                type="button"
                aria-label="Start voice input"
                onClick={() => setMode("listening")}
                className="grid size-8 place-items-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Mic className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Send message"
                onClick={handleSend}
                className="grid size-8 place-items-center rounded-full bg-white text-neutral-900 transition-transform hover:scale-105 active:scale-95"
              >
                <ArrowUp className="size-4" />
              </button>
            </div>
          </div>
        );
      case "listening":
        return (
          <div className="flex h-12 items-center gap-2 px-2">
            <button
              type="button"
              aria-label="Cancel voice input"
              onClick={() => setMode("idle")}
              className="grid size-8 shrink-0 place-items-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="size-4" />
            </button>
            <ListeningWave />
            <span className="w-8 shrink-0 text-center text-xs tabular-nums text-white/50">
              {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
            </span>
            <button
              type="button"
              aria-label="Confirm voice input"
              onClick={handleVoiceConfirm}
              className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-neutral-900 transition-transform hover:scale-105 active:scale-95"
            >
              <Check className="size-4" />
            </button>
          </div>
        );
      case "thinking":
        return (
          <div className="flex h-12 items-center justify-center gap-2.5 px-4">
            <Sparkles className="size-4 text-violet-300" />
            <motion.span
              className="bg-[linear-gradient(90deg,rgba(255,255,255,0.25)_0%,rgba(255,255,255,0.95)_50%,rgba(255,255,255,0.25)_100%)] bg-[length:200%_100%] bg-clip-text text-sm text-transparent"
              animate={{ backgroundPosition: ["150% 0%", "-150% 0%"] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
            >
              Thinking…
            </motion.span>
          </div>
        );
      case "responding":
        return (
          <div className="flex flex-col gap-2 px-4 py-3.5">
            <p className="flex items-center gap-2 text-xs text-white/40">
              <Sparkles className="size-3 shrink-0 text-violet-300/70" />
              <span className="truncate">{exchange?.prompt}</span>
            </p>
            <p className="min-h-12 text-sm leading-6 text-white/90">
              {exchange?.words.slice(0, streamedCount).map((word, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, filter: "blur(4px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  transition={{ duration: 0.3 }}
                >
                  {word}{" "}
                </motion.span>
              ))}
            </p>
            <AnimatePresence>
              {isStreamDone && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-end"
                >
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-full px-3 py-1.5 text-xs text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    Ask again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
    }
  })();

  return (
    <div ref={scope} className="relative">
      <AnimatePresence>
        <motion.div
          key={glowKey}
          aria-hidden
          className="pointer-events-none absolute -inset-2 rounded-[32px] bg-[conic-gradient(from_0deg,#60a5fa,#a78bfa,#f472b6,#38bdf8,#60a5fa)] blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.55, 0] }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
          transition={{ duration: 1.2, ease: "easeInOut", repeat: isLoading ? Infinity : 0 }}
        />
      </AnimatePresence>

      <motion.div
        layout
        style={{ borderRadius: 24 }}
        transition={SPRING}
        className={`relative overflow-hidden bg-neutral-900 shadow-2xl shadow-black/50 ring-1 ring-white/10 ${WIDTHS[mode]}`}
      >
        {mode === "thinking" && <ThinkingSweep />}
        <motion.div
          key={mode}
          className="relative"
          initial={{ opacity: 0, scale: 0.92, filter: "blur(6px)" }}
          animate={{
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
            transition: { ...SPRING, delay: 0.05 },
          }}
        >
          {content}
        </motion.div>
      </motion.div>
    </div>
  );
};
