import * as React from "react";
import {
  BarChart3,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LifeBuoy,
  LucideIcon,
  Plus,
  Search,
  Settings,
  Users,
} from "lucide-react";

import { useResizablePanel } from "./use-resizable-panel";

const sidebarNavigation: Array<{
  label: string;
  items: Array<{ label: string; icon: LucideIcon; badge?: string; active?: boolean }>;
}> = [
  {
    label: "Quick access",
    items: [
      { label: "Inbox", icon: LayoutDashboard, badge: "12", active: true },
      { label: "My tasks", icon: CheckCircle2 },
      { label: "Projects", icon: FolderKanban },
      { label: "Docs", icon: FileText },
    ],
  },
  {
    label: "Teams",
    items: [
      { label: "Product", icon: Users },
      { label: "Growth", icon: BarChart3 },
      { label: "Support", icon: LifeBuoy },
    ],
  },
];

const tableColumns = ["Company", "Domains", "Associated deals", "ICP fit", "Estimated ARR"];

const statusPills = ["Strong", "Medium", "New", "Low", "Review"];

const miniCards = [
  { label: "Meetings scheduled", metric: "32", trend: "+8%" },
  { label: "Last email reply", metric: "1.2h", trend: "Avg." },
  { label: "Active sequences", metric: "18", trend: "Team" },
];

function cn(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type SidebarProps = React.ComponentPropsWithoutRef<"aside"> & {
  width?: number;
};

export function Sidebar({ width = 280, className, style, ...props }: SidebarProps) {
  return (
    <aside
      style={{ width, ...style }}
      className={cn(
        "flex h-full flex-col border-r border-slate-200/70 bg-white/80 text-slate-900 backdrop-blur",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-3 border-b border-slate-200/80 px-5 py-4">
        <div className="grid size-9 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-black text-sm font-semibold text-white">
          BP
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-900">Basepoint</span>
          <span className="text-[0.65rem] text-slate-500">Revenue workspace</span>
        </div>
        <button className="ml-auto inline-flex items-center gap-1 rounded-full border border-slate-200/80 px-2.5 py-1 text-[0.65rem] font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900">
          Switch
          <ChevronDown className="size-3" />
        </button>
      </div>

      <div className="space-y-6 px-5 py-5">
        <label className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white/80 px-3 py-2 text-xs text-slate-500 shadow-sm focus-within:border-slate-300 focus-within:text-slate-900">
          <Search className="size-3.5 text-slate-400" />
          <input
            placeholder="Search"
            className="flex-1 bg-transparent text-[0.75rem] text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <span className="rounded-md border border-slate-200 px-2 py-0.5 text-[0.6rem] font-medium text-slate-500">⌘K</span>
        </label>

        {sidebarNavigation.map((section) => (
          <div key={section.label} className="space-y-2">
            <p className="px-1 text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-slate-400">{section.label}</p>
            <div className="space-y-1.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = Boolean(item.active);
                return (
                  <button
                    key={item.label}
                    className={cn(
                      "group flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-[0.75rem] transition",
                      isActive
                        ? "border-slate-900/10 bg-slate-900/5 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
                        : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-100/80 hover:text-slate-900",
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={cn(
                          "grid size-7 shrink-0 place-items-center rounded-lg border text-[0.7rem] transition",
                          isActive
                            ? "border-slate-900/10 bg-white text-slate-900"
                            : "border-slate-200 bg-white text-slate-500 group-hover:border-slate-300 group-hover:text-slate-900",
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      {item.label}
                    </span>
                    {item.badge ? (
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[0.6rem] font-medium text-slate-600">
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

      <div className="mt-auto space-y-4 border-t border-slate-200/70 bg-white/70 px-5 py-5 text-[0.75rem] text-slate-600">
        <button className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-left transition hover:border-slate-300 hover:text-slate-900">
          <span className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
              <Settings className="size-3.5" />
            </span>
            Workspace settings
          </span>
          <span className="text-[0.6rem] text-slate-400">⌘ ,</span>
        </button>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/70 px-3 py-3">
          <div className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-[0.7rem] font-medium text-white">
            JD
          </div>
          <div className="flex-1 text-[0.7rem]">
            <p className="font-medium text-slate-900">Jane Doe</p>
            <p className="text-slate-500">Revenue operations</p>
          </div>
          <span className="rounded-lg border border-slate-200 px-3 py-1 text-[0.6rem] text-slate-500">Switch</span>
        </div>
      </div>
    </aside>
  );
}

type DashboardPlaceholderProps = React.ComponentPropsWithoutRef<"main">;

export function DashboardPlaceholder({ className, ...props }: DashboardPlaceholderProps) {
  return (
    <main
      className={cn(
        "flex flex-1 flex-col gap-6 overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-100",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between border-b border-slate-200/80 bg-white/70 px-8 py-5 text-sm text-slate-600 backdrop-blur">
        <div className="space-y-1">
          <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-400">Companies</p>
          <h2 className="text-xl font-semibold text-slate-900">Top companies</h2>
        </div>
        <div className="flex items-center gap-2 text-[0.75rem]">
          <button className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-600 transition hover:border-slate-300 hover:text-slate-900">
            View settings
          </button>
          <button className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-indigo-600 transition hover:bg-indigo-500/20">
            <Plus className="size-3.5" />
            New view
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden px-8 pb-8">
        <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200/80 bg-white/90 shadow-[0_20px_70px_-50px_rgba(15,23,42,0.6)]">
          <header className="flex flex-wrap items-center gap-3 border-b border-slate-200/80 px-6 py-4 text-[0.75rem] text-slate-500">
            <button className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-600 transition hover:border-slate-300 hover:text-slate-900">
              Sorted by last email interaction
            </button>
            <button className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-500 transition hover:border-slate-300 hover:text-slate-900">
              Advanced filters
            </button>
            <button className="ml-auto rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-500 transition hover:border-slate-300 hover:text-slate-900">
              Import / Export
            </button>
          </header>

          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr_0.8fr] border-b border-slate-200/70 bg-slate-50/80 px-6 py-3 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
              {tableColumns.map((column) => (
                <span key={column}>{column}</span>
              ))}
            </div>
            <div className="divide-y divide-slate-200/70">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr_0.8fr] items-center gap-4 px-6 py-4 text-[0.8rem] text-slate-500"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-full border border-slate-200 bg-slate-50 text-[0.6rem] font-medium text-slate-500">
                      {String.fromCharCode(65 + (index % 6))}
                    </span>
                    <div className="flex flex-col gap-1">
                      <span className="h-2.5 w-32 rounded-full bg-slate-200" />
                      <span className="h-2 w-20 rounded-full bg-slate-200/80" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-24 rounded-full bg-slate-200" />
                    <span className="h-2 w-12 rounded-full bg-slate-200/80" />
                  </div>
                  <div className="flex items-center gap-2">
                    <CircleDashed className="size-3 text-slate-300" />
                    <span className="h-2.5 w-24 rounded-full bg-slate-200" />
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-[0.7rem] font-medium text-emerald-600">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    {statusPills[index % statusPills.length]}
                  </span>
                  <div className="flex flex-col items-end gap-1">
                    <span className="h-2.5 w-16 rounded-full bg-slate-200" />
                    <span className="h-2 w-10 rounded-full bg-slate-200/80" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="flex w-[260px] shrink-0 flex-col gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_20px_70px_-60px_rgba(15,23,42,0.6)]">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              <span>Pipeline health</span>
              <span>Today</span>
            </div>
            <div className="mt-5 space-y-4">
              {miniCards.map((card) => (
                <div key={card.label} className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">{card.label}</p>
                    <p className="text-lg font-semibold text-slate-900">{card.metric}</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[0.65rem] font-medium text-emerald-600">
                    {card.trend}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-between rounded-2xl border border-slate-200/80 bg-white/80 p-5 text-sm text-slate-600 shadow-[0_20px_70px_-60px_rgba(15,23,42,0.6)]">
            <div className="space-y-3">
              <p className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">Automation</p>
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-start gap-3 rounded-xl border border-slate-200/70 bg-white/60 p-3">
                    <span className="mt-1 size-2 rounded-full bg-indigo-400" />
                    <div className="flex-1 space-y-1">
                      <span className="h-2.5 w-32 rounded-full bg-slate-200" />
                      <span className="h-2 w-20 rounded-full bg-slate-200/80" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[0.75rem] font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900">
              <Plus className="size-3.5" />
              Create automation
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}

export function SidebarDemo() {
  const { width, isResizing, getHandleProps } = useResizablePanel({ initialWidth: 280, minWidth: 220, maxWidth: 360 });

  return (
    <div className="flex h-full w-full overflow-hidden rounded-3xl border border-slate-200/70 bg-[radial-gradient(circle_at_top,_rgba(248,250,252,0.95),_rgba(226,232,240,0.85))] text-slate-900 shadow-[0_30px_120px_-60px_rgba(15,23,42,0.55)]">
      <Sidebar width={width} />

      <div
        className={cn(
          "group relative flex w-2 cursor-ew-resize items-center justify-center border-r border-slate-200/80 bg-white/40 transition",
          isResizing ? "bg-slate-200/80" : "hover:bg-slate-100",
        )}
        {...getHandleProps()}
      >
        <span className={cn("h-12 w-px rounded-full bg-slate-300 transition", isResizing ? "bg-slate-400" : "group-hover:bg-slate-400")}
        />
      </div>

      <DashboardPlaceholder />
    </div>
  );
}
