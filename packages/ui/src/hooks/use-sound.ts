"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Tiny synthesized UI sound kit with a global mute.
 *
 * No audio assets — every sound is a short WebAudio gesture (oscillator
 * or noise burst), so capsules can click/tick/ding without shipping
 * files. Mute is app-global: one store, persisted to localStorage,
 * every subscriber re-renders on change.
 *
 * ```ts
 * const { play, muted, setMuted } = useSound();
 * play("tick");
 * ```
 */

export type SoundName = "tick" | "click" | "pop" | "ding" | "success" | "error";

const STORAGE_KEY = "uicapsule:sound-muted";

// ——— global mute store ———
let muted = false;
let hydrated = false;
const listeners = new Set<() => void>();

const hydrate = () => {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    muted = window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // storage unavailable (private mode) — default to unmuted
  }
};

const setGlobalMuted = (value: boolean) => {
  muted = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    // non-fatal
  }
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// ——— synthesis ———
let context: AudioContext | null = null;

const getContext = () => {
  if (typeof window === "undefined") return null;
  context ??= new AudioContext();
  if (context.state === "suspended") void context.resume();
  return context;
};

type Voice = (ctx: AudioContext, out: GainNode, now: number) => void;

const tone = (
  ctx: AudioContext,
  out: GainNode,
  now: number,
  options: {
    type: OscillatorType;
    from: number;
    to?: number;
    duration: number;
    gain: number;
    delay?: number;
  },
) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const start = now + (options.delay ?? 0);
  const end = start + options.duration;
  osc.type = options.type;
  osc.frequency.setValueAtTime(options.from, start);
  if (options.to !== undefined) osc.frequency.exponentialRampToValueAtTime(options.to, end);
  gain.gain.setValueAtTime(options.gain, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(gain).connect(out);
  osc.start(start);
  osc.stop(end + 0.02);
};

const noiseBurst = (ctx: AudioContext, out: GainNode, now: number, duration: number, gain: number) => {
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  }
  const source = ctx.createBufferSource();
  const gainNode = ctx.createGain();
  source.buffer = buffer;
  gainNode.gain.setValueAtTime(gain, now);
  source.connect(gainNode).connect(out);
  source.start(now);
};

const VOICES: Record<SoundName, Voice> = {
  /** picker/detent step — barely-there blip */
  tick: (ctx, out, now) => {
    tone(ctx, out, now, { type: "square", from: 1800, duration: 0.02, gain: 0.05 });
  },
  /** button press — soft mechanical tap */
  click: (ctx, out, now) => {
    noiseBurst(ctx, out, now, 0.018, 0.12);
    tone(ctx, out, now, { type: "sine", from: 520, to: 320, duration: 0.05, gain: 0.1 });
  },
  /** element lands/attaches — pitch-drop thunk */
  pop: (ctx, out, now) => {
    tone(ctx, out, now, { type: "sine", from: 480, to: 180, duration: 0.09, gain: 0.22 });
  },
  /** notification — two partials, bell-ish */
  ding: (ctx, out, now) => {
    tone(ctx, out, now, { type: "sine", from: 880, duration: 0.35, gain: 0.14 });
    tone(ctx, out, now, { type: "sine", from: 1320, duration: 0.25, gain: 0.06 });
  },
  /** action confirmed — rising major third */
  success: (ctx, out, now) => {
    tone(ctx, out, now, { type: "sine", from: 660, duration: 0.12, gain: 0.12 });
    tone(ctx, out, now, { type: "sine", from: 830, duration: 0.18, gain: 0.12, delay: 0.09 });
  },
  /** rejection — low buzzy dyad */
  error: (ctx, out, now) => {
    tone(ctx, out, now, { type: "square", from: 220, duration: 0.16, gain: 0.07 });
    tone(ctx, out, now, { type: "square", from: 185, duration: 0.16, gain: 0.07, delay: 0.02 });
  },
};

/**
 * Play a named UI sound, respecting the global mute. Safe to call from
 * any event handler; silently no-ops on the server or if WebAudio is
 * unavailable.
 */
export const playSound = (name: SoundName, volume = 1) => {
  hydrate();
  if (muted) return;
  const ctx = getContext();
  if (!ctx) return;
  const out = ctx.createGain();
  out.gain.value = clampVolume(volume);
  out.connect(ctx.destination);
  VOICES[name](ctx, out, ctx.currentTime);
};

const clampVolume = (volume: number) => Math.min(1, Math.max(0, volume));

/** React binding: `play` + reactive global `muted` state. */
export const useSound = () => {
  hydrate();
  const isMuted = useSyncExternalStore(
    subscribe,
    () => muted,
    () => false,
  );
  const play = useCallback((name: SoundName, volume?: number) => {
    playSound(name, volume);
  }, []);
  const setMuted = useCallback((value: boolean) => {
    setGlobalMuted(value);
  }, []);
  const toggleMuted = useCallback(() => {
    setGlobalMuted(!muted);
  }, []);
  return { play, muted: isMuted, setMuted, toggleMuted };
};
