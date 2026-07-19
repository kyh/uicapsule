"use client";

import type { ReactNode } from "react";

import { useEffect, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Columns3Icon,
  FolderIcon,
  ImageIcon,
  LayoutGridIcon,
  ListIcon,
  SearchIcon,
} from "lucide-react";

import type { DesktopFile } from "./desktop-data";
import type { FrameProps } from "./window-frame";
import type { OpenWindow, WindowCtx } from "./window-types";

import { AppGlyph } from "./app-icons";
import { FILES, FIRST_NOTE, NOTES, PHOTOS, findFile } from "./desktop-data";
import { WindowFrame } from "./window-frame";

/* -------------------------------------------------------------- Quick Look -- */

const QuickLookBody = ({
  fileId,
  ctx,
}: {
  fileId: string | undefined;
  ctx: WindowCtx;
}): ReactNode => {
  const startIndex = Math.max(
    0,
    FILES.findIndex((file) => file.id === fileId),
  );
  const [index, setIndex] = useState(startIndex);

  const file: DesktopFile = FILES[index] ?? FILES[0];

  const step = (delta: number): void => {
    setIndex((prev) => (prev + delta + FILES.length) % FILES.length);
  };

  // `file.full` is a cold 1600px derivative. Warm both neighbours so an arrow
  // click swaps to a decoded frame instead of blanking for the fetch.
  useEffect(() => {
    const neighbours = [
      FILES[(index + 1) % FILES.length],
      FILES[(index - 1 + FILES.length) % FILES.length],
    ];
    neighbours.forEach((neighbour) => {
      if (!neighbour) return;
      const img = new Image();
      img.src = neighbour.full;
    });
  }, [index]);

  return (
    <div className="flex h-full flex-col bg-[#1c1a18]">
      <div className="relative min-h-0 flex-1">
        <button
          type="button"
          onClick={() => ctx.openLightbox(file.full)}
          aria-label={`Open ${file.name} full screen`}
          className="absolute inset-0 flex items-center justify-center p-6"
        >
          {/* No `key`: reusing the element lets the browser hold the previous
              frame until the next one decodes, instead of flashing empty. */}
          <img
            src={file.full}
            alt={file.name}
            draggable={false}
            className="max-h-full max-w-full rounded-[6px] object-contain shadow-[0_18px_50px_-20px_rgba(0,0,0,0.9)]"
          />
        </button>

        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Previous file"
          className="absolute top-1/2 left-3 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur-md transition-colors hover:bg-white/25"
        >
          <ChevronLeftIcon className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Next file"
          className="absolute top-1/2 right-3 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur-md transition-colors hover:bg-white/25"
        >
          <ChevronRightIcon className="size-4" />
        </button>
      </div>

      <div className="flex shrink-0 items-baseline gap-3 border-t border-white/10 bg-black/40 px-4 py-2.5 text-white">
        <span className="truncate text-[12.5px] font-medium">{file.name}</span>
        <span className="text-[11px] text-white/50">{file.dimensions}</span>
        <span className="ml-auto text-[11px] text-white/40">
          {index + 1} of {FILES.length}
        </span>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ Photos -- */

const PhotosBody = ({ ctx }: { ctx: WindowCtx }): ReactNode => (
  <div className="dos-scroll h-full overflow-y-auto px-6 py-7 sm:px-8 sm:py-8">
    <p className="text-[10px] font-semibold tracking-[0.18em] text-black/45 uppercase">
      Recents · {PHOTOS.length}
    </p>
    <div
      className="mt-4 grid auto-rows-[120px] grid-cols-4 gap-3"
      style={{ gridAutoFlow: "row dense" }}
    >
      {PHOTOS.map((photo) => (
        <button
          key={photo.src}
          type="button"
          onClick={() => ctx.openLightbox(photo.full)}
          className={`group relative overflow-hidden rounded-[8px] bg-black/5 ${
            photo.ratio === "tall" ? "row-span-2" : ""
          } ${photo.ratio === "wide" ? "col-span-2" : ""}`}
        >
          <img
            src={photo.src}
            alt={photo.caption}
            loading="lazy"
            draggable={false}
            className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
          />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-[11px] font-medium text-white opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
            {photo.caption}
          </span>
        </button>
      ))}
    </div>
  </div>
);

/* ------------------------------------------------------------------- Notes -- */

const NotesBody = ({ ctx }: { ctx: WindowCtx }): ReactNode => {
  const [activeId, setActiveId] = useState<string>(FIRST_NOTE.id);
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  const active = NOTES.find((note) => note.id === activeId) ?? FIRST_NOTE;
  const showList = !ctx.isMobile || mobileView === "list";
  const showDetail = !ctx.isMobile || mobileView === "detail";

  return (
    <div className="flex h-full">
      {showList && (
        <div
          className={`flex flex-col bg-[#f7f5ee] md:border-r md:border-black/[0.08] ${
            ctx.isMobile ? "w-full" : "w-60"
          }`}
        >
          <p className="border-b border-black/[0.06] px-4 py-2.5 text-[10px] font-semibold tracking-[0.16em] text-black/45 uppercase">
            Notes — {NOTES.length}
          </p>
          <div className="dos-scroll flex-1 overflow-y-auto">
            {NOTES.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => {
                  setActiveId(note.id);
                  if (ctx.isMobile) setMobileView("detail");
                }}
                className={`block w-full border-b border-black/[0.05] px-4 py-3 text-left transition-colors ${
                  note.id === activeId && !ctx.isMobile
                    ? "bg-[#f4d34c]/60"
                    : "hover:bg-black/[0.03]"
                }`}
              >
                <p className="truncate text-[13px] font-semibold text-[#1a1612]">{note.title}</p>
                <div className="mt-0.5 flex items-baseline gap-2">
                  <span className="text-[11px] font-medium text-black/70">{note.date}</span>
                  <span className="truncate text-[11px] text-black/55">{note.preview}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {showDetail && (
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {ctx.isMobile && (
            <button
              type="button"
              onClick={() => setMobileView("list")}
              className="flex items-center gap-1 border-b border-black/[0.06] px-3 py-2.5 text-[13px] font-medium text-[#1a1612]"
            >
              <ChevronLeftIcon className="size-4" />
              Notes
            </button>
          )}
          <div className="dos-scroll flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-7">
            <p className="text-[11px] text-black/45">{active.date}</p>
            <h3 className="mt-1 text-[22px] leading-tight font-semibold tracking-tight text-[#1a1612]">
              {active.title}
            </h3>
            <p className="mt-5 text-[14px] leading-relaxed whitespace-pre-line text-black/80">
              {active.body}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ Finder -- */

const FINDER_SIDEBAR = [
  { label: "Desktop", color: "#62a8e8" },
  { label: "Applications", color: "#7c8595" },
  { label: "Documents", color: "#7c8595" },
  { label: "Captures", color: "#5fd0c9" },
  { label: "Exports", color: "#a8a08b" },
  { label: "Downloads", color: "#7c8595" },
] as const;

const FinderFolderDot = ({ size = 14 }: { size?: number }): ReactNode => (
  <FolderIcon
    className="shrink-0 text-[#4aa3f0]"
    style={{ width: size, height: size }}
    fill="#4aa3f0"
  />
);

const ViewModeButton = ({
  children,
  active,
  label,
}: {
  children: ReactNode;
  active?: boolean;
  label: string;
}): ReactNode => (
  <button
    type="button"
    aria-label={label}
    className={`rounded p-1 text-black/45 ${
      active ? "bg-white text-black/70 shadow-[0_1px_0_rgba(0,0,0,0.08)]" : ""
    }`}
  >
    {children}
  </button>
);

const FinderBody = ({ win, ctx }: { win: OpenWindow; ctx: WindowCtx }): ReactNode => {
  const folderName = win.folderName ?? "Archive";
  // Trash and Archive hold different slices of the same library.
  const contents = folderName === "Trash" ? FILES.slice(6, 10) : FILES.slice(1, 6);

  return (
    <div className="flex h-full flex-col bg-[#f7f5ef]">
      <div className="flex items-center gap-3 border-b border-black/[0.06] bg-[#ecebe6] px-3 py-1.5">
        <div className="flex items-center text-black/35">
          <button
            type="button"
            aria-label="Back"
            className="rounded-md p-1 transition-colors hover:bg-black/5"
          >
            <ChevronLeftIcon className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label="Forward"
            className="rounded-md p-1 transition-colors hover:bg-black/5"
          >
            <ChevronRightIcon className="size-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1a1612]">
          <FinderFolderDot />
          {folderName}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-0.5 rounded-md border border-black/10 bg-white/70 p-0.5">
          <ViewModeButton label="Icon view" active>
            <LayoutGridIcon className="size-3.5" />
          </ViewModeButton>
          <ViewModeButton label="List view">
            <ListIcon className="size-3.5" />
          </ViewModeButton>
          <ViewModeButton label="Column view">
            <Columns3Icon className="size-3.5" />
          </ViewModeButton>
          <ViewModeButton label="Gallery view">
            <ImageIcon className="size-3.5" />
          </ViewModeButton>
        </div>
        <button
          type="button"
          aria-label="Search"
          className="rounded-md p-1 text-black/40 transition-colors hover:bg-black/5"
        >
          <SearchIcon className="size-3.5" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="dos-scroll hidden w-40 shrink-0 overflow-y-auto bg-[#ecebe6] px-2 py-2 sm:block">
          <p className="px-1.5 py-1 text-[10px] font-semibold tracking-[0.06em] text-black/45 uppercase">
            Locations
          </p>
          {["Recents", "Shared"].map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 rounded-[6px] px-1.5 py-1 transition-colors hover:bg-black/[0.06]"
            >
              <span className="size-3 rounded-[3px]" style={{ background: "#7c8595" }} />
              <span className="truncate text-[12px] text-[#1a1612]">{item}</span>
            </div>
          ))}
          <p className="mt-2 px-1.5 py-1 text-[10px] font-semibold tracking-[0.06em] text-black/45 uppercase">
            Favourites
          </p>
          {FINDER_SIDEBAR.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 rounded-[6px] px-1.5 py-1 transition-colors hover:bg-black/[0.06]"
            >
              <span className="size-3 rounded-[3px]" style={{ background: item.color }} />
              <span className="truncate text-[12px] text-[#1a1612]">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="dos-scroll min-w-0 flex-1 overflow-y-auto bg-white px-5 py-4">
          <div
            className="grid gap-x-2 gap-y-4"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
            }}
          >
            {contents.map((file) => (
              <button
                key={file.id}
                type="button"
                onClick={() => ctx.openQuickLook(file.id)}
                className="group flex flex-col items-center gap-1.5 rounded-md p-2 focus:outline-none focus-visible:bg-[#cce3ff]"
              >
                <span className="size-[68px] overflow-hidden rounded-[6px] border border-black/10 bg-black/5">
                  <img
                    src={file.thumb}
                    alt=""
                    loading="lazy"
                    draggable={false}
                    className="size-full object-cover"
                  />
                </span>
                <span className="line-clamp-2 max-w-[96px] rounded-[4px] px-1 text-center text-[11px] leading-[1.2] font-medium text-[#1a1612] group-focus-visible:bg-[#3b82f6] group-focus-visible:text-white">
                  {file.name}
                </span>
              </button>
            ))}
            <div className="flex flex-col items-center gap-1.5 rounded-md p-2">
              <span className="size-[68px]">
                <AppGlyph id="folder" />
              </span>
              <span className="max-w-[96px] truncate px-1 text-center text-[11px] leading-[1.2] font-medium text-[#1a1612]">
                Older
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 border-t border-black/[0.06] bg-[#f4f2eb] px-3 py-1.5 text-[10.5px] text-black/55">
        <FinderFolderDot size={12} />
        <span className="flex items-center gap-1">
          Macintosh HD
          <ChevronRightIcon className="size-2.5 text-black/35" />
          Users
          <ChevronRightIcon className="size-2.5 text-black/35" />
          Desktop
          <ChevronRightIcon className="size-2.5 text-black/35" />
          <span className="font-semibold text-black/75">{folderName}</span>
        </span>
        <span className="ml-auto">{contents.length + 1} items</span>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- Terminal -- */

interface TerminalLine {
  readonly prompt: boolean;
  readonly text: string;
  readonly tone?: "ok" | "dim";
}

const TERMINAL_LINES: readonly TerminalLine[] = [
  { prompt: true, text: "system --status" },
  { prompt: false, text: "compositor      up     16.6ms/frame", tone: "ok" },
  { prompt: false, text: "window server   up     6 surfaces", tone: "ok" },
  { prompt: false, text: "dock            up     magnification on", tone: "ok" },
  { prompt: false, text: "wallpaper       up     gradient, no bitmap", tone: "dim" },
  { prompt: true, text: "uptime" },
  { prompt: false, text: "2 seconds since boot", tone: "dim" },
];

const TerminalBody = (): ReactNode => {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(TERMINAL_LINES.length);
      return;
    }

    // The count lives in the closure, not in the updater: React may invoke an
    // updater twice, and stopping the interval from inside one is a side effect
    // that has no business running during a re-render.
    let shown = 0;
    const id = window.setInterval(() => {
      shown += 1;
      setVisible(shown);
      if (shown >= TERMINAL_LINES.length) window.clearInterval(id);
    }, 190);

    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="dos-scroll dos-scroll-dark h-full overflow-y-auto bg-[#101014] px-4 py-3 font-mono text-[12px] leading-[1.7] text-[#d6d6da]">
      {TERMINAL_LINES.slice(0, visible).map((line) => (
        <div key={line.text} className="flex gap-2">
          {line.prompt && <span className="text-[#5fd0a0]">~ %</span>}
          <span
            className={
              line.tone === "ok" ? "text-[#9fe6c0]" : line.tone === "dim" ? "text-white/45" : ""
            }
          >
            {line.text}
          </span>
        </div>
      ))}
      <div className="flex gap-2">
        <span className="text-[#5fd0a0]">~ %</span>
        <span className="dos-caret inline-block h-[14px] w-[7px] bg-[#d6d6da] align-middle" />
      </div>
    </div>
  );
};

/* -------------------------------------------------------------- dispatcher -- */

/**
 * Sibling of `titleForWindow`: the two functions are the whole mapping from a
 * window's kind to what the frame shows, and they stay next to each other so a
 * new kind cannot satisfy one exhaustive switch and miss the other.
 */
const bodyForWindow = (win: OpenWindow, ctx: WindowCtx): ReactNode => {
  switch (win.kind) {
    case "quicklook":
      return <QuickLookBody fileId={win.fileId} ctx={ctx} />;
    case "photos":
      return <PhotosBody ctx={ctx} />;
    case "notes":
      return <NotesBody ctx={ctx} />;
    case "finder":
      return <FinderBody win={win} ctx={ctx} />;
    case "terminal":
      return <TerminalBody />;
  }
};

const titleForWindow = (win: OpenWindow): string => {
  switch (win.kind) {
    case "quicklook":
      return findFile(win.fileId)?.name ?? "Quick Look";
    case "photos":
      return "Photos";
    case "notes":
      return "Notes";
    case "finder":
      return win.folderName ?? "Files";
    case "terminal":
      return "Terminal — bash";
  }
};

export const WindowView = ({
  win,
  ctx,
  sectionRef,
  onClose,
  onFocus,
  onMove,
}: Pick<FrameProps, "sectionRef" | "onClose" | "onFocus" | "onMove"> & {
  win: OpenWindow;
  ctx: WindowCtx;
}): ReactNode => {
  return (
    <WindowFrame
      win={win}
      isMobile={ctx.isMobile}
      sectionRef={sectionRef}
      onClose={onClose}
      onFocus={onFocus}
      onMove={onMove}
      title={titleForWindow(win)}
    >
      {bodyForWindow(win, ctx)}
    </WindowFrame>
  );
};
