"use client";

import { useCallback, useEffect, useRef, useState, type FC } from "react";
import {
  Activity,
  CalendarDays,
  Camera,
  Clock,
  CloudSun,
  Compass,
  Folder,
  Heart,
  Mail,
  Map,
  MessageCircle,
  Minus,
  Music2,
  NotebookPen,
  Phone,
  Podcast,
  Settings,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

type AppItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  background: string;
  iconClass: string;
};

const APPS: AppItem[] = [
  {
    id: "messages",
    label: "Messages",
    icon: MessageCircle,
    background: "bg-gradient-to-b from-[#5ff777] to-[#0eb531]",
    iconClass: "text-white",
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: CalendarDays,
    background: "bg-white",
    iconClass: "text-red-500",
  },
  {
    id: "photos",
    label: "Photos",
    icon: Camera,
    background: "bg-gradient-to-b from-[#fda4af] to-[#e11d48]",
    iconClass: "text-white",
  },
  {
    id: "clock",
    label: "Clock",
    icon: Clock,
    background: "bg-gradient-to-b from-[#3f4650] to-[#16181d]",
    iconClass: "text-white",
  },
  {
    id: "weather",
    label: "Weather",
    icon: CloudSun,
    background: "bg-gradient-to-b from-[#4aa8f0] to-[#1d63d8]",
    iconClass: "text-white",
  },
  {
    id: "maps",
    label: "Maps",
    icon: Map,
    background: "bg-gradient-to-b from-[#8ce99a] to-[#2f9e44]",
    iconClass: "text-white",
  },
  {
    id: "mail",
    label: "Mail",
    icon: Mail,
    background: "bg-gradient-to-b from-[#74c0fc] to-[#1971c2]",
    iconClass: "text-white",
  },
  {
    id: "notes",
    label: "Notes",
    icon: NotebookPen,
    background: "bg-gradient-to-b from-[#fff3bf] to-[#fcc419]",
    iconClass: "text-amber-900",
  },
  {
    id: "music",
    label: "Music",
    icon: Music2,
    background: "bg-gradient-to-b from-[#ff8787] to-[#e8390e]",
    iconClass: "text-white",
  },
  {
    id: "wallet",
    label: "Wallet",
    icon: Wallet,
    background: "bg-gradient-to-b from-[#343a40] to-[#0b0c0e]",
    iconClass: "text-white",
  },
  {
    id: "health",
    label: "Health",
    icon: Heart,
    background: "bg-white",
    iconClass: "text-pink-500",
  },
  {
    id: "podcasts",
    label: "Podcasts",
    icon: Podcast,
    background: "bg-gradient-to-b from-[#b197fc] to-[#6741d9]",
    iconClass: "text-white",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    background: "bg-gradient-to-b from-[#ced4da] to-[#868e96]",
    iconClass: "text-neutral-700",
  },
  {
    id: "files",
    label: "Files",
    icon: Folder,
    background: "bg-gradient-to-b from-[#a5d8ff] to-[#1c7ed6]",
    iconClass: "text-white",
  },
  {
    id: "fitness",
    label: "Fitness",
    icon: Activity,
    background: "bg-gradient-to-b from-[#2b2d31] to-[#101113]",
    iconClass: "text-lime-400",
  },
];

const DOCK: AppItem[] = [
  {
    id: "phone",
    label: "Phone",
    icon: Phone,
    background: "bg-gradient-to-b from-[#5ff777] to-[#0eb531]",
    iconClass: "text-white",
  },
  {
    id: "safari",
    label: "Safari",
    icon: Compass,
    background: "bg-white",
    iconClass: "text-sky-500",
  },
  {
    id: "dock-messages",
    label: "Messages",
    icon: MessageCircle,
    background: "bg-gradient-to-b from-[#4aa8f0] to-[#1d63d8]",
    iconClass: "text-white",
  },
  {
    id: "dock-music",
    label: "Music",
    icon: Music2,
    background: "bg-gradient-to-b from-[#ff8787] to-[#e8390e]",
    iconClass: "text-white",
  },
];

const COLUMNS = 4;
const LONG_PRESS_MS = 450;

const wobbleSeed = (id: string) => {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 997;
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

  useEffect(() => {
    return () => {
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    };
  }, []);

  const startPress = useCallback(() => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
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
      if (!grid) return;
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
      if (current === -1 || target === current) return;
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
    <div className="relative h-[620px] w-[340px] overflow-hidden rounded-[44px] bg-[#101223] shadow-2xl shadow-black/60 ring-8 ring-black select-none">
      <div aria-hidden className="absolute inset-0">
        <div className="absolute -top-20 -left-24 size-72 rounded-full bg-[#4438ca]/50 blur-3xl" />
        <div className="absolute right-[-60px] bottom-24 size-80 rounded-full bg-[#0ea5e9]/25 blur-3xl" />
        <div className="absolute bottom-[-80px] left-[-40px] size-64 rounded-full bg-[#c026d3]/25 blur-3xl" />
      </div>

      {/* Long-press on wallpaper enters edit mode; tap exits it */}
      <div
        className="absolute inset-0"
        onPointerDown={startPress}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        onClick={() => {
          if (editing && !draggingId) setEditing(false);
        }}
      />

      <div className="pointer-events-none relative flex h-8 items-center justify-between px-8 pt-4 text-[13px] font-semibold text-white">
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

      <div ref={gridRef} className="relative mx-auto mt-5 grid w-[304px] grid-cols-4 gap-y-5">
        <AnimatePresence mode="popLayout">
          {apps.map((app) => {
            const seed = wobbleSeed(app.id);
            const wobble = 2 + seed * 1.2;
            return (
              <motion.div
                key={app.id}
                layout
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{ type: "spring", duration: 0.45, bounce: 0.25 }}
                className={`relative flex flex-col items-center ${
                  draggingId === app.id ? "z-30" : "z-10"
                }`}
              >
                <motion.div
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
                          rotate: [-wobble, wobble],
                          scale: draggingId === app.id ? 1.14 : 1,
                        }
                      : { rotate: 0, scale: 1 }
                  }
                  transition={
                    editing
                      ? {
                          rotate: {
                            duration: 0.13 + seed * 0.05,
                            repeat: Infinity,
                            repeatType: "mirror",
                            ease: "easeInOut",
                          },
                          scale: { type: "spring", duration: 0.3 },
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
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", duration: 0.3, bounce: 0.4 }}
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

      <div className="absolute inset-x-4 bottom-4">
        <div className="flex items-center justify-around rounded-[30px] bg-white/15 p-3 backdrop-blur-xl">
          {DOCK.map((app) => {
            const seed = wobbleSeed(app.id);
            return (
              <motion.div
                key={app.id}
                animate={editing ? { rotate: [-(2 + seed), 2 + seed] } : { rotate: 0 }}
                transition={
                  editing
                    ? {
                        rotate: {
                          duration: 0.13 + seed * 0.05,
                          repeat: Infinity,
                          repeatType: "mirror",
                          ease: "easeInOut",
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
            className="pointer-events-none absolute inset-x-0 bottom-24 text-center text-[11px] text-white/35"
          >
            Hold an icon to edit
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};
