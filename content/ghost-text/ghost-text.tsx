"use client";

import { useEffect, useRef, useState } from "react";
import type { FC } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/**
 * Ghost text — Cursor-style inline completion. Type on the active line;
 * pause and a gray ghost continuation appears ahead of the caret. Tab
 * absorbs it one word at a time (each word settles from ghost to solid),
 * Esc waves it off, and typing through a matching character consumes it.
 */

const CONTEXT_LINES = [
  "async function searchNotes(query: string) {",
  "  const notes = await db.notes.list();",
];

/** Suggestion bank — matched against the active line's trailing content. */
const SUGGESTIONS: { test: RegExp; text: string }[] = [
  {
    test: /return$/u,
    text: " notes.filter((note) => note.title.includes(query));",
  },
  {
    test: /const\s+\w*$/u,
    text: "ranked = rankByRelevance(notes, query);",
  },
  {
    test: /if\s*\($/u,
    text: "!query.trim()) return notes;",
  },
  {
    test: /\.$/u,
    text: "toLowerCase().includes(query.toLowerCase());",
  },
];

const SUGGEST_DELAY_MS = 550;

const DEFAULT_SUGGESTION = "return notes.filter((note) => note.title.includes(query));";

const suggestFor = (line: string): string | null => {
  if (line.endsWith(" ") && line.trim().length > 0) {
    return null;
  }
  for (const s of SUGGESTIONS) {
    if (s.test.test(line)) {
      return s.text;
    }
  }
  if (line.trim() === "") {
    return `  ${DEFAULT_SUGGESTION}`;
  }
  return null;
};

const KEYWORD = /\b(?:async|function|const|await|return|if)\b/gu;

/** Minimal keyword tinting for the static context lines. */
const Highlighted: FC<{ line: string }> = ({ line }) => {
  const parts: { kw: boolean; start: number; text: string }[] = [];
  let last = 0;
  for (const match of line.matchAll(KEYWORD)) {
    const { index } = match;
    if (index > last) {
      parts.push({ kw: false, start: last, text: line.slice(last, index) });
    }
    parts.push({ kw: true, start: index, text: match[0] });
    last = index + match[0].length;
  }
  if (last < line.length) {
    parts.push({ kw: false, start: last, text: line.slice(last) });
  }
  return (
    <>
      {parts.map((part) => (
        <span key={part.start} className={part.kw ? "text-[#c792ea]" : "text-[#c3cad6]"}>
          {part.text}
        </span>
      ))}
    </>
  );
};

/** A chunk of ghost that was just accepted — settles from gray to solid. */
interface AcceptedChunk {
  id: number;
  text: string;
}

export const GhostText = () => {
  const [typed, setTyped] = useState("  ");
  const [accepted, setAccepted] = useState<AcceptedChunk[]>([]);
  const [ghost, setGhost] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const chunkIdRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Synchronous mirrors — keydown events can arrive faster than re-renders,
  // so all string math happens on refs and state is just the render mirror.
  const lineRef = useRef("  ");
  const ghostRef = useRef<string | null>(null);
  const reduceMotion = useReducedMotion();

  const putGhost = (value: string | null) => {
    ghostRef.current = value;
    setGhost(value);
  };

  // Debounced suggestion after a typing pause.
  const scheduleSuggestion = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      if (ghostRef.current === null) {
        putGhost(suggestFor(lineRef.current));
      }
    }, SUGGEST_DELAY_MS);
  };

  useEffect(() => {
    inputRef.current?.focus();
    debounceRef.current = setTimeout(() => {
      const suggestion = suggestFor(lineRef.current);
      ghostRef.current = suggestion;
      setGhost(suggestion);
    }, SUGGEST_DELAY_MS);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleKey = (event: React.KeyboardEvent) => {
    if (event.key === "Tab") {
      event.preventDefault();
      const g = ghostRef.current;
      if (!g) {
        return;
      }
      const match = /^\s*\S+\s?/u.exec(g);
      const chunk = match ? match[0] : g;
      lineRef.current += chunk;
      chunkIdRef.current += 1;
      const id = chunkIdRef.current;
      setAccepted((current) => [...current, { id, text: chunk }]);
      const rest = g.slice(chunk.length);
      putGhost(rest.length > 0 ? rest : null);
      scheduleSuggestion();
      return;
    }
    if (event.key === "Escape") {
      putGhost(null);
      return;
    }
    if (event.key === "Backspace") {
      event.preventDefault();
      lineRef.current = lineRef.current.slice(0, -1);
      setTyped(lineRef.current);
      setAccepted([]);
      putGhost(null);
      scheduleSuggestion();
      return;
    }
    if (event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      lineRef.current += event.key;
      setTyped(lineRef.current);
      setAccepted([]);
      // Typing through the ghost consumes it; a mismatch dismisses it.
      const g = ghostRef.current;
      putGhost(g && g.startsWith(event.key) ? g.slice(1) || null : null);
      scheduleSuggestion();
    }
  };

  return (
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- pointer convenience that refocuses the hidden input; keyboard focus reaches that input directly
    <div
      className="w-[600px] cursor-text overflow-hidden rounded-2xl bg-[#0d1017] font-mono text-[13.5px] shadow-2xl shadow-black/60 ring-1 ring-white/10 select-none"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 rounded-md bg-white/[0.06] px-2.5 py-1 font-sans text-[11px] text-white/60">
          search.ts
        </span>
        <span className="ml-auto font-sans text-[10px] text-white/30">
          pause to summon · Tab accepts a word · Esc dismisses
        </span>
      </div>
      <div className="px-4 py-4 leading-[1.85]">
        {CONTEXT_LINES.map((line, index) => (
          <div key={line} className="flex">
            <span className="w-8 shrink-0 text-right text-[11px] leading-[1.85] text-white/20 select-none">
              {index + 1}
            </span>
            <span className="pl-4 whitespace-pre">
              <Highlighted line={line} />
            </span>
          </div>
        ))}
        <div className="flex">
          <span className="w-8 shrink-0 text-right text-[11px] leading-[1.85] text-white/20 select-none">
            {CONTEXT_LINES.length + 1}
          </span>
          <span className="relative pl-4 whitespace-pre">
            <span className="text-[#c3cad6]">{typed}</span>
            {accepted.map((chunk) => (
              <motion.span
                key={chunk.id}
                initial={{ color: "rgba(148,158,178,0.5)", y: 1 }}
                animate={{ color: "rgba(195,202,214,1)", y: 0 }}
                transition={{ duration: 0.3 }}
                className="inline-block whitespace-pre"
              >
                {chunk.text}
              </motion.span>
            ))}
            <motion.span
              aria-hidden
              animate={reduceMotion ? { opacity: 1 } : { opacity: [1, 1, 0, 0] }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 1, repeat: Infinity, times: [0, 0.5, 0.5, 1] }
              }
              className="relative -top-px inline-block h-[1.1em] w-[2px] translate-y-[3px] rounded-sm bg-[#7aa2ff] align-middle"
            />
            <AnimatePresence>
              {ghost && (
                <motion.span
                  key={ghost.length === 0 ? "empty" : "ghost"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  transition={{ duration: 0.25 }}
                  className="whitespace-pre text-[#5a6376] italic"
                >
                  {ghost}
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </div>

        <div className="flex">
          <span className="w-8 shrink-0 text-right text-[11px] leading-[1.85] text-white/20 select-none">
            {CONTEXT_LINES.length + 2}
          </span>
          <span className="pl-4 text-[#c3cad6]">{"}"}</span>
        </div>
      </div>
      <input
        ref={inputRef}
        onKeyDown={handleKey}
        className="absolute h-0 w-0 opacity-0"
        aria-label="Code input"
      />
      <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2 font-sans text-[10px] text-white/30">
        <span>TypeScript</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={ghost ? "on" : "off"}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            className={ghost ? "text-[#7aa2ff]" : ""}
          >
            {ghost ? "✦ suggestion ready" : "✦ idle"}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
};
