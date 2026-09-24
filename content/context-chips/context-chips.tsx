"use client";

import { useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "motion/react";

/**
 * Context chips — the @-mention. Type @ (or hit the button), pick a file,
 * and its chip flies out of the picker into the composer rail via shared
 * layout, squishing in as a token. The context meter fills as chips land;
 * older chips collapse into a +N stack when the rail crowds.
 */

interface FileRef {
  id: string;
  name: string;
  kind: "ts" | "md" | "css" | "json";
  tokens: number;
}

const FILES: FileRef[] = [
  { id: "f1", kind: "ts", name: "search.ts", tokens: 1240 },
  { id: "f2", kind: "md", name: "README.md", tokens: 860 },
  { id: "f3", kind: "css", name: "globals.css", tokens: 640 },
  { id: "f4", kind: "json", name: "schema.json", tokens: 1580 },
  { id: "f5", kind: "ts", name: "use-session.ts", tokens: 990 },
];

const KIND_COLORS: Record<FileRef["kind"], string> = {
  css: "text-violet-300 bg-violet-400/10",
  json: "text-amber-300 bg-amber-400/10",
  md: "text-white/70 bg-white/[0.08]",
  ts: "text-sky-300 bg-sky-400/10",
};

const CONTEXT_LIMIT = 8000;
const VISIBLE_CHIPS = 3;

export const ContextChips = () => {
  const [attached, setAttached] = useState<FileRef[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const available = FILES.filter((file) => !attached.some((a) => a.id === file.id));
  const usedTokens = attached.reduce((sum, file) => sum + file.tokens, 0);
  const overflowCount = Math.max(0, attached.length - VISIBLE_CHIPS);
  const visible = attached.slice(overflowCount);

  const attach = (file: FileRef) => {
    setAttached((current) => [...current, file]);
    // Swallow the trailing "@" that opened the picker.
    setText((current) => (current.endsWith("@") ? current.slice(0, -1) : current));
    if (available.length <= 1) {
      setPickerOpen(false);
    }
    inputRef.current?.focus();
  };

  const detach = (id: string) => {
    setAttached((current) => current.filter((file) => file.id !== id));
  };

  return (
    <MotionConfig reducedMotion="user">
      <LayoutGroup>
        <div className="w-[520px] select-none">
          <AnimatePresence>
            {pickerOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 }, y: 8 }}
                transition={{ damping: 32, stiffness: 450, type: "spring" }}
                className="mb-3 rounded-2xl bg-[#161821] p-2 shadow-2xl shadow-black/60 ring-1 ring-white/10"
              >
                <p className="px-3 pt-1.5 pb-2 text-[10px] font-semibold tracking-[0.16em] text-white/35 uppercase">
                  Attach context
                </p>
                {available.length === 0 && (
                  <p className="px-3 pb-2 text-[12px] text-white/40">Everything’s attached.</p>
                )}
                {available.map((file) => (
                  <motion.button
                    key={file.id}
                    layoutId={`chip-${file.id}`}
                    type="button"
                    onClick={() => attach(file)}
                    transition={{ damping: 26, stiffness: 420, type: "spring" }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors hover:bg-white/[0.06]"
                  >
                    <span
                      className={`rounded-md px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${KIND_COLORS[file.kind]}`}
                    >
                      {file.kind}
                    </span>
                    <span className="flex-1 truncate font-mono text-[12.5px] text-white/85">
                      {file.name}
                    </span>
                    <span className="text-[10px] text-white/35 tabular-nums">
                      ~{(file.tokens / 1000).toFixed(1)}k tok
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="rounded-2xl bg-[#101116] p-4 shadow-2xl shadow-black/60 ring-1 ring-white/10">
            {attached.length > 0 && (
              <div className="mb-3 flex items-center gap-1.5">
                <AnimatePresence>
                  {overflowCount > 0 && (
                    <motion.span
                      key="overflow"
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      className="relative z-10 flex h-[26px] items-center rounded-lg bg-white/[0.1] px-2 text-[11px] font-semibold text-white/70 tabular-nums"
                    >
                      +{overflowCount}
                      <span className="absolute inset-0 -z-10 translate-x-[3px] translate-y-[2px] rounded-lg bg-white/[0.05]" />
                      <span className="absolute inset-0 -z-20 translate-x-[6px] translate-y-[4px] rounded-lg bg-white/[0.03]" />
                    </motion.span>
                  )}
                </AnimatePresence>
                {visible.map((file) => (
                  <motion.span
                    key={file.id}
                    layoutId={`chip-${file.id}`}
                    transition={{ damping: 26, stiffness: 420, type: "spring" }}
                    className="flex h-[26px] items-center gap-1.5 rounded-lg bg-white/[0.07] pr-1 pl-2 ring-1 ring-white/[0.09]"
                  >
                    <span
                      className={`rounded px-1 py-px font-mono text-[8px] font-bold uppercase ${KIND_COLORS[file.kind]}`}
                    >
                      {file.kind}
                    </span>
                    <span className="max-w-[110px] truncate font-mono text-[11px] text-white/80">
                      {file.name}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${file.name}`}
                      onClick={() => detach(file.id)}
                      className="flex size-[16px] items-center justify-center rounded text-[10px] text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
                    >
                      ✕
                    </button>
                  </motion.span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                aria-label="Message"
                value={text}
                onChange={(event) => {
                  setText(event.target.value);
                  if (event.target.value.endsWith("@") && available.length > 0) {
                    setPickerOpen(true);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setPickerOpen(false);
                  }
                }}
                placeholder={
                  attached.length > 0 ? "Ask about these files…" : "Type @ to attach context…"
                }
                className="h-9 flex-1 bg-transparent text-[14px] text-white placeholder:text-white/30 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setPickerOpen((open) => !open && available.length > 0)}
                className={`flex h-8 items-center gap-1 rounded-full px-3 text-[12px] font-medium transition-colors ${
                  pickerOpen
                    ? "bg-white text-black"
                    : "bg-white/[0.07] text-white/65 hover:bg-white/[0.12]"
                }`}
              >
                @ <span className="hidden sm:inline">Attach</span>
              </button>
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-full bg-[#6384ff] text-white transition-transform active:scale-90"
                aria-label="Send"
              >
                <svg viewBox="0 0 24 24" className="size-4 fill-current">
                  <path d="M3.4 20.4 20.85 12 3.4 3.6l.01 6.53L15 12 3.41 13.87l-.01 6.53Z" />
                </svg>
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2.5">
              <div className="h-[4px] flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                <motion.div
                  animate={{
                    backgroundColor:
                      usedTokens > CONTEXT_LIMIT * 0.75
                        ? "rgba(251,146,60,0.9)"
                        : "rgba(125,211,252,0.8)",
                    width: `${String(Math.min(100, (usedTokens / CONTEXT_LIMIT) * 100))}%`,
                  }}
                  transition={{ damping: 28, stiffness: 260, type: "spring" }}
                  className="h-full rounded-full"
                />
              </div>
              <span className="text-[10px] text-white/35 tabular-nums">
                {(usedTokens / 1000).toFixed(1)}k / {CONTEXT_LIMIT / 1000}k tokens
              </span>
            </div>
          </div>
        </div>
      </LayoutGroup>
    </MotionConfig>
  );
};
