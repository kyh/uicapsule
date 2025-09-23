import * as React from "react";
import {
  BarChart3,
  CalendarDays,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LifeBuoy,
  Search,
  Settings,
  Users,
} from "lucide-react";

const MIN_WIDTH = 200;
const MAX_WIDTH = 360;

const navigation = [
  {
    label: "Workspace",
    items: [
      { label: "Inbox", icon: LayoutDashboard, active: true },
      { label: "Roadmap", icon: FolderKanban },
      { label: "Teams", icon: Users },
      { label: "Docs", icon: FileText },
    ],
  },
  {
    label: "Favorites",
    items: [
      { label: "Pulse", icon: BarChart3, badge: "6" },
      { label: "Calendar", icon: CalendarDays },
      { label: "Support", icon: LifeBuoy },
    ],
  },
];

function cn(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type SidebarProps = React.ComponentPropsWithoutRef<"aside"> & {
  width?: number;
};

export function Sidebar({ width = 260, className, style, ...props }: SidebarProps) {
  return (
    <aside
      style={{ width, ...style }}
      className={cn(
        "flex h-full flex-col border-r border-slate-800/60 bg-slate-950/70 backdrop-blur",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-3 border-b border-slate-800/60 px-4 py-3">
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-[0.65rem] font-semibold text-white">
          LN
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-100">Linear North</span>
          <span className="text-[0.65rem] text-slate-500">Product org</span>
        </div>
        <button className="ml-auto rounded-md border border-slate-800/70 px-2 py-1 text-[0.65rem] text-slate-400 transition hover:border-slate-700 hover:text-slate-200">
          ⌘K
        </button>
      </div>

      <div className="space-y-5 px-4 py-3">
        <label className="flex items-center gap-2 rounded-lg border border-slate-800/80 bg-slate-900/60 px-2.5 py-1.5 text-[0.7rem] text-slate-400 focus-within:border-slate-700 focus-within:text-slate-200">
          <Search className="size-3.5" />
          <input
            placeholder="Search issues"
            className="flex-1 bg-transparent text-[0.75rem] text-slate-100 placeholder:text-slate-600 focus:outline-none"
          />
        </label>

        {navigation.map((section) => (
          <div key={section.label} className="mt-6">
            <p className="px-2 text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">{section.label}</p>
            <div className="mt-2 space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    className={`group flex w-full items-center justify-between rounded-lg border border-transparent px-2.5 py-2 text-left text-[0.8rem] transition ${
                      item.active
                        ? "border-slate-800/70 bg-slate-900 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                        : "text-slate-500 hover:border-slate-800/70 hover:bg-slate-900/70 hover:text-slate-100"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`relative grid size-6 place-items-center rounded-md text-[0.7rem] transition ${
                          item.active ? "text-slate-200" : "text-slate-600 group-hover:text-slate-300"
                        }`}
                      >
                        {item.active ? (
                          <span className="absolute left-[-10px] h-5 w-[2px] rounded-full bg-gradient-to-b from-[#7F5BFF] to-[#4B32C3]" />
                        ) : null}
                        <Icon className="size-4" />
                      </span>
                      {item.label}
                    </span>
                    {item.badge ? (
                      <span className="rounded-full border border-slate-800/70 bg-slate-950/80 px-2 py-0.5 text-[0.65rem] font-medium text-slate-300">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto space-y-3 border-t border-slate-800/60 px-4 py-4 text-[0.75rem] text-slate-400">
        <button className="flex w-full items-center justify-between rounded-lg border border-slate-800/60 bg-slate-900/60 px-2.5 py-2 text-left transition hover:border-slate-700 hover:text-slate-100">
          <span className="flex items-center gap-2.5">
            <span className="grid size-6 place-items-center rounded-md border border-slate-800 bg-slate-950/80 text-slate-500">
              <Settings className="size-3.5" />
            </span>
            Settings
          </span>
          <span className="text-[0.65rem] text-slate-500">⌘ ,</span>
        </button>

        <div className="flex items-center gap-3 rounded-lg border border-slate-800/60 bg-slate-900/60 px-2.5 py-2.5">
          <div className="grid size-7 place-items-center rounded-md bg-violet-500/20 text-[0.7rem] font-medium text-violet-300">JD</div>
          <div className="flex-1 text-[0.7rem]">
            <p className="font-medium text-slate-100">Jane Doe</p>
            <p className="text-slate-500">Product Design</p>
          </div>
          <span className="rounded-md border border-slate-800/70 px-2 py-1 text-[0.65rem] text-slate-400">Switch</span>
        </div>
      </div>
    </aside>
  );
}

type DashboardPlaceholderProps = React.ComponentPropsWithoutRef<"main">;

export function DashboardPlaceholder({ className, ...props }: DashboardPlaceholderProps) {
  return (
    <main
      className={cn("flex flex-1 flex-col bg-slate-950/40 backdrop-blur", className)}
      {...props}
    >
      <header className="flex items-center justify-between border-b border-slate-800/60 px-8 py-5 text-sm">
        <div className="space-y-1">
          <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-500">Active sprint</p>
          <h2 className="text-lg font-medium text-slate-100">Product velocity</h2>
        </div>
        <div className="flex items-center gap-2 text-[0.75rem] text-slate-500">
          <span className="rounded-md border border-slate-800/60 px-2 py-1 text-slate-400">Filter</span>
          <span className="rounded-md border border-slate-800/60 px-2 py-1 text-slate-400">Group</span>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-8 py-6">
        <section className="rounded-2xl border border-slate-800/60 bg-slate-950/70 p-5 shadow-[0_20px_40px_-30px_rgba(12,10,24,0.9)]">
          <header className="flex items-center justify-between text-[0.8rem] text-slate-400">
            <span className="flex items-center gap-2 text-slate-300">
              <span className="size-2 rounded-full bg-gradient-to-b from-[#7F5BFF] to-[#4B32C3]" />
              Sprint planning table
            </span>
            <span>Updated 2m ago</span>
          </header>

          <div className="mt-5 overflow-hidden rounded-xl border border-slate-800/60">
            <div className="grid grid-cols-[1.2fr_1fr_0.8fr_0.6fr_0.4fr] border-b border-slate-800/70 bg-slate-950/80 px-4 py-2 text-[0.7rem] uppercase tracking-[0.2em] text-slate-500">
              <span>Issue</span>
              <span>Owner</span>
              <span>Status</span>
              <span>Estimate</span>
              <span>Due</span>
            </div>
            <div className="divide-y divide-slate-900/60 bg-slate-950/60">
              {Array.from({ length: 7 }).map((_, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1.2fr_1fr_0.8fr_0.6fr_0.4fr] items-center px-4 py-3 text-[0.8rem] text-slate-500"
                >
                  <div className="flex items-center gap-3">
                    <span className="size-2.5 rounded-full bg-slate-700/70" />
                    <div className="flex flex-1 flex-col gap-1">
                      <span className="h-2.5 w-32 rounded bg-slate-700/50" />
                      <span className="h-2 w-20 rounded bg-slate-800/60" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-full bg-slate-800/80" />
                    <span className="h-2.5 w-16 rounded bg-slate-800/60" />
                  </div>
                  <span className="h-2.5 w-14 rounded bg-slate-800/60" />
                  <span className="h-2.5 w-10 rounded bg-slate-800/60" />
                  <span className="h-2.5 w-8 rounded bg-slate-800/60" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-4 text-[0.75rem] text-slate-500 sm:grid-cols-3">
          {["Focus", "Review", "Blocked"].map((label, index) => (
            <div key={label} className="flex flex-col gap-2 rounded-xl border border-slate-800/60 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between text-slate-400">
                <span>{label}</span>
                <span className="rounded-full border border-slate-800/70 px-2 py-0.5 text-[0.65rem] text-slate-500">{index * 3 + 2}</span>
              </div>
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, subIndex) => (
                  <div
                    key={subIndex}
                    className="flex flex-col gap-1 rounded-lg border border-slate-900/70 bg-slate-950/80 p-3"
                  >
                    <span className="h-2.5 w-28 rounded bg-slate-800/60" />
                    <span className="h-2 w-20 rounded bg-slate-900/70" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export function SidebarDemo() {
  const [width, setWidth] = React.useState(260);
  const [isResizing, setIsResizing] = React.useState(false);
  const startXRef = React.useRef(0);
  const startWidthRef = React.useRef(0);
  const isDraggingRef = React.useRef(false);

  const handlePointerDown = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    isDraggingRef.current = true;
    startXRef.current = event.clientX;
    startWidthRef.current = width;
    setIsResizing(true);
    document.body.classList.add("select-none");
  }, [width]);

  const handlePointerMove = React.useCallback((event: PointerEvent) => {
    if (!isDraggingRef.current) return;

    const delta = event.clientX - startXRef.current;
    const nextWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidthRef.current + delta));

    setWidth(nextWidth);
  }, []);

  const handlePointerUp = React.useCallback(() => {
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;
    setIsResizing(false);
    document.body.classList.remove("select-none");
  }, []);

  React.useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      document.body.classList.remove("select-none");
    };
  }, [handlePointerMove, handlePointerUp]);

  return (
    <div className="flex h-full w-full overflow-hidden rounded-2xl border border-slate-800/60 bg-[radial-gradient(circle_at_top,_rgba(32,33,46,0.92),_rgba(15,16,24,0.95))] text-slate-200 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.7)]">
      <Sidebar width={width} />

      <div
        className={`group relative flex w-2 cursor-ew-resize items-center justify-center border-r border-slate-800/60 bg-slate-950/40 transition ${
          isResizing ? "bg-slate-800/60" : "hover:bg-slate-900/60"
        }`}
        onPointerDown={handlePointerDown}
      >
        <span className={`h-10 w-px rounded-full bg-slate-700 transition ${isResizing ? "bg-slate-500" : "group-hover:bg-slate-500"}`} />
      </div>

      <DashboardPlaceholder />
    </div>
  );
}
