"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FC } from "react";
import {
  Activity,
  BookOpen,
  Calculator,
  CalendarDays,
  Camera,
  Clock,
  CloudSun,
  Compass,
  Folder,
  Heart,
  House,
  ListChecks,
  Mail,
  Map,
  MessageCircle,
  Minus,
  Music2,
  NotebookPen,
  Phone,
  Podcast,
  Settings,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { PhoneFrame } from "./phone-frame";

interface AppItem {
  id: string;
  label: string;
  icon: LucideIcon;
  background: string;
  iconClass: string;
}

const APPS: AppItem[] = [
  {
    background: "bg-gradient-to-b from-[#5ff777] to-[#0eb531]",
    icon: MessageCircle,
    iconClass: "text-white",
    id: "messages",
    label: "Messages",
  },
  {
    background: "bg-white",
    icon: CalendarDays,
    iconClass: "text-red-500",
    id: "calendar",
    label: "Calendar",
  },
  {
    background: "bg-gradient-to-b from-[#fda4af] to-[#e11d48]",
    icon: Camera,
    iconClass: "text-white",
    id: "photos",
    label: "Photos",
  },
  {
    background: "bg-gradient-to-b from-[#3f4650] to-[#16181d]",
    icon: Clock,
    iconClass: "text-white",
    id: "clock",
    label: "Clock",
  },
  {
    background: "bg-gradient-to-b from-[#4aa8f0] to-[#1d63d8]",
    icon: CloudSun,
    iconClass: "text-white",
    id: "weather",
    label: "Weather",
  },
  {
    background: "bg-gradient-to-b from-[#8ce99a] to-[#2f9e44]",
    icon: Map,
    iconClass: "text-white",
    id: "maps",
    label: "Maps",
  },
  {
    background: "bg-gradient-to-b from-[#74c0fc] to-[#1971c2]",
    icon: Mail,
    iconClass: "text-white",
    id: "mail",
    label: "Mail",
  },
  {
    background: "bg-gradient-to-b from-[#fff3bf] to-[#fcc419]",
    icon: NotebookPen,
    iconClass: "text-amber-900",
    id: "notes",
    label: "Notes",
  },
  {
    background: "bg-gradient-to-b from-[#ff8787] to-[#e8390e]",
    icon: Music2,
    iconClass: "text-white",
    id: "music",
    label: "Music",
  },
  {
    background: "bg-gradient-to-b from-[#343a40] to-[#0b0c0e]",
    icon: Wallet,
    iconClass: "text-white",
    id: "wallet",
    label: "Wallet",
  },
  {
    background: "bg-white",
    icon: Heart,
    iconClass: "text-pink-500",
    id: "health",
    label: "Health",
  },
  {
    background: "bg-gradient-to-b from-[#b197fc] to-[#6741d9]",
    icon: Podcast,
    iconClass: "text-white",
    id: "podcasts",
    label: "Podcasts",
  },
  {
    background: "bg-gradient-to-b from-[#ced4da] to-[#868e96]",
    icon: Settings,
    iconClass: "text-neutral-700",
    id: "settings",
    label: "Settings",
  },
  {
    background: "bg-gradient-to-b from-[#a5d8ff] to-[#1c7ed6]",
    icon: Folder,
    iconClass: "text-white",
    id: "files",
    label: "Files",
  },
  {
    background: "bg-gradient-to-b from-[#2b2d31] to-[#101113]",
    icon: Activity,
    iconClass: "text-lime-400",
    id: "fitness",
    label: "Fitness",
  },
  {
    background: "bg-white",
    icon: ListChecks,
    iconClass: "text-orange-500",
    id: "reminders",
    label: "Reminders",
  },
  {
    background: "bg-gradient-to-b from-[#ffa94d] to-[#f76707]",
    icon: BookOpen,
    iconClass: "text-white",
    id: "books",
    label: "Books",
  },
  {
    background: "bg-gradient-to-b from-[#2b2d31] to-[#101113]",
    icon: TrendingUp,
    iconClass: "text-emerald-400",
    id: "stocks",
    label: "Stocks",
  },
  {
    background: "bg-gradient-to-b from-[#495057] to-[#212529]",
    icon: Calculator,
    iconClass: "text-orange-400",
    id: "calculator",
    label: "Calculator",
  },
  {
    background: "bg-white",
    icon: House,
    iconClass: "text-amber-500",
    id: "home",
    label: "Home",
  },
];

const DOCK: AppItem[] = [
  {
    background: "bg-gradient-to-b from-[#5ff777] to-[#0eb531]",
    icon: Phone,
    iconClass: "text-white",
    id: "phone",
    label: "Phone",
  },
  {
    background: "bg-white",
    icon: Compass,
    iconClass: "text-sky-500",
    id: "safari",
    label: "Safari",
  },
  {
    background: "bg-gradient-to-b from-[#4aa8f0] to-[#1d63d8]",
    icon: MessageCircle,
    iconClass: "text-white",
    id: "dock-messages",
    label: "Messages",
  },
  {
    background: "bg-gradient-to-b from-[#ff8787] to-[#e8390e]",
    icon: Music2,
    iconClass: "text-white",
    id: "dock-music",
    label: "Music",
  },
];

const COLUMNS = 4;
const LONG_PRESS_MS = 450;

const wobbleSeed = (id: string) => {
  let hash = 0;
  for (const char of id) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % 997;
  }
  return hash / 997;
};

const AppIcon: FC<{ app: AppItem }> = ({ app }) => (
  <div
    className={`grid size-14 place-items-center rounded-[15px] shadow-lg shadow-black/25 ${app.background}`}
  >
    <app.icon className={`size-7 ${app.iconClass}`} strokeWidth={2.2} />
  </div>
);

export const JiggleMode = () => {
  const [order, setOrder] = useState<string[]>(APPS.map((app) => app.id));
  const [editing, setEditing] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wallpaperPressWhileEditingRef = useRef(false);
  const reduceMotion = useReducedMotion() ?? false;
  const jiggling = editing && !reduceMotion;

  useEffect(
    () => () => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
      }
    },
    [],
  );

  const startPress = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
    pressTimerRef.current = setTimeout(() => setEditing(true), LONG_PRESS_MS);
  }, []);

  const cancelPress = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, []);

  const removeApp = useCallback((id: string) => {
    setOrder((previous) => previous.filter((entry) => entry !== id));
  }, []);

  const reorderTo = useCallback(
    (id: string, pointX: number, pointY: number) => {
      const grid = gridRef.current;
      if (!grid) {
        return;
      }
      const rect = grid.getBoundingClientRect();
      const cellWidth = rect.width / COLUMNS;
      const rows = Math.ceil(order.length / COLUMNS);
      const cellHeight = rect.height / rows;
      const column = Math.min(
        COLUMNS - 1,
        Math.max(0, Math.floor((pointX - rect.left) / cellWidth)),
      );
      const row = Math.min(rows - 1, Math.max(0, Math.floor((pointY - rect.top) / cellHeight)));
      const target = Math.min(order.length - 1, row * COLUMNS + column);
      const current = order.indexOf(id);
      if (current === -1 || target === current) {
        return;
      }
      setOrder((previous) => {
        const next = previous.filter((entry) => entry !== id);
        next.splice(target, 0, id);
        return next;
      });
    },
    [order],
  );

  const apps = order
    .map((id) => APPS.find((app) => app.id === id))
    .filter((app): app is AppItem => app !== undefined);

  return (
    <PhoneFrame tone="ochre" className="bg-[#1a1209]">
      <div aria-hidden className="absolute inset-0">
        <div className="absolute -top-20 -left-24 size-72 rounded-full bg-[#d97706]/45 blur-3xl" />
        <div className="absolute right-[-60px] bottom-24 size-80 rounded-full bg-[#ea580c]/25 blur-3xl" />
        <div className="absolute bottom-[-80px] left-[-40px] size-64 rounded-full bg-[#be185d]/25 blur-3xl" />
      </div>

      <div
        className="absolute inset-0"
        onPointerDown={() => {
          wallpaperPressWhileEditingRef.current = editing;
          if (!editing) {
            startPress();
          }
        }}
        onPointerUp={() => {
          cancelPress();
          if (wallpaperPressWhileEditingRef.current && !draggingId) {
            setEditing(false);
          }
          wallpaperPressWhileEditingRef.current = false;
        }}
        onPointerLeave={() => {
          cancelPress();
          wallpaperPressWhileEditingRef.current = false;
        }}
      />

      <div className="pointer-events-none relative flex h-[52px] items-center justify-between px-8 text-[14px] font-semibold text-white">
        <span>9:41</span>
        <AnimatePresence>
          {editing && (
            <motion.button
              type="button"
              key="done"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => {
                setEditing(false);
                setDraggingId(null);
              }}
              className="pointer-events-auto rounded-full bg-white/20 px-3.5 py-1 text-[13px] font-semibold text-white backdrop-blur-sm"
            >
              Done
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div ref={gridRef} className="relative mx-auto mt-3 grid w-[308px] grid-cols-4 gap-y-6">
        <AnimatePresence mode="popLayout">
          {apps.map((app) => {
            const seed = wobbleSeed(app.id);
            const wobble = 2 + seed * 1.2;
            return (
              <motion.div
                key={app.id}
                layout={draggingId !== app.id}
                exit={{ opacity: 0, scale: 0.4 }}
                transition={{ bounce: 0.25, duration: 0.45, type: "spring" }}
                className={`relative flex flex-col items-center ${
                  draggingId === app.id ? "z-30" : "z-10"
                }`}
              >
                <motion.div
                  layout
                  drag={editing}
                  dragSnapToOrigin
                  dragMomentum={false}
                  dragElastic={0.1}
                  onPointerDown={editing ? undefined : startPress}
                  onPointerUp={cancelPress}
                  onDragStart={() => setDraggingId(app.id)}
                  onDrag={(_, info) => reorderTo(app.id, info.point.x, info.point.y)}
                  onDragEnd={() => setDraggingId(null)}
                  animate={
                    editing
                      ? {
                          rotate: jiggling ? [-wobble, wobble] : 0,
                          scale: draggingId === app.id ? 1.14 : 1,
                        }
                      : { rotate: 0, scale: 1 }
                  }
                  transition={
                    editing
                      ? {
                          rotate: jiggling
                            ? {
                                duration: 0.13 + seed * 0.05,
                                ease: "easeInOut",
                                repeat: Infinity,
                                repeatType: "mirror",
                              }
                            : { duration: 0.15 },
                          scale: { duration: 0.3, type: "spring" },
                        }
                      : { rotate: { duration: 0.15 } }
                  }
                  whileTap={editing ? undefined : { scale: 0.85 }}
                  style={{ transformOrigin: "center 60%" }}
                  className={editing ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}
                >
                  <AppIcon app={app} />
                  <AnimatePresence>
                    {editing && draggingId !== app.id && (
                      <motion.button
                        type="button"
                        key="remove"
                        aria-label={`Remove ${app.label}`}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{ bounce: 0.4, duration: 0.3, type: "spring" }}
                        onClick={(event) => {
                          event.stopPropagation();
                          removeApp(app.id);
                        }}
                        onPointerDown={(event) => event.stopPropagation()}
                        className="absolute -top-1.5 -left-1.5 grid size-5 place-items-center rounded-full bg-neutral-200/95 text-neutral-700 shadow-md"
                      >
                        <Minus className="size-3.5" strokeWidth={3} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </motion.div>
                <span className="mt-1.5 text-[11px] font-medium text-white/90 drop-shadow-sm">
                  {app.label}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="absolute inset-x-3 bottom-3">
        <div className="flex items-center justify-around rounded-[30px] bg-white/15 p-3 backdrop-blur-xl">
          {DOCK.map((app) => {
            const seed = wobbleSeed(app.id);
            return (
              <motion.div
                key={app.id}
                animate={jiggling ? { rotate: [-(2 + seed), 2 + seed] } : { rotate: 0 }}
                transition={
                  jiggling
                    ? {
                        rotate: {
                          duration: 0.13 + seed * 0.05,
                          ease: "easeInOut",
                          repeat: Infinity,
                          repeatType: "mirror",
                        },
                      }
                    : { rotate: { duration: 0.15 } }
                }
                whileTap={{ scale: 0.85 }}
                style={{ transformOrigin: "center 60%" }}
              >
                <AppIcon app={app} />
              </motion.div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {!editing && (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 1 } }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-x-0 bottom-[108px] text-center text-[11px] text-white/35"
          >
            Hold an icon to edit
          </motion.p>
        )}
      </AnimatePresence>
    </PhoneFrame>
  );
};
