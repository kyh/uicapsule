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
  Users,
} from "lucide-react";

import { useResizablePanel } from "./use-resizable-panel";

const sidebarNavigation: Array<{
  label: string;
  items: Array<{
    label: string;
    icon: LucideIcon;
    badge?: string;
    shortcut?: string;
    active?: boolean;
    indicatorClass?: string;
  }>;
}> = [
  {
    label: "Favorites",
    items: [
      {
        label: "My issues",
        icon: CheckCircle2,
        shortcut: "⇧I",
        active: true,
        indicatorClass: "from-indigo-400/90 to-purple-500/90",
      },
      {
        label: "Inbox",
        icon: LayoutDashboard,
        badge: "12",
        indicatorClass: "from-sky-400/90 to-indigo-500/90",
      },
      {
        label: "Docs",
        icon: FileText,
        indicatorClass: "from-emerald-400/90 to-teal-500/90",
      },
    ],
  },
  {
    label: "Teams",
    items: [
      {
        label: "Product",
        icon: FolderKanban,
        badge: "24",
        indicatorClass: "from-rose-400/90 to-orange-400/90",
      },
      { label: "Growth", icon: BarChart3, badge: "8" },
      { label: "Support", icon: LifeBuoy, badge: "3" },
    ],
  },
  {
    label: "Shortcuts",
    items: [
      {
        label: "Active sprints",
        icon: Users,
        indicatorClass: "from-amber-400/90 to-orange-500/90",
      },
      {
        label: "Roadmap",
        icon: FolderKanban,
      },
    ],
  },
];

const tableColumns = ["Issue", "Assignee", "Status", "Priority", "Updated"];

const statusPills = ["In progress", "Review", "Blocked", "Planned", "Shipped"];

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
        "flex h-full flex-col border-r border-white/10 bg-[#111114] text-slate-200 shadow-[inset_-1px_0_0_rgba(255,255,255,0.05)]",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-3 border-b border-white/5 px-4 py-4">
        <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-[0.7rem] font-semibold text-white">
          LN
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-white">Linear</span>
          <span className="text-[0.65rem] text-slate-400">Product design</span>
        </div>
        <button className="ml-auto inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[0.65rem] text-slate-400 transition hover:bg-white/10 hover:text-white">
          Switch
          <ChevronDown className="size-3" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-6 px-4 py-5">
        <label className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-[0.7rem] text-slate-400 transition focus-within:border-white/10 focus-within:text-slate-100">
          <Search className="size-3.5 text-slate-500" />
          <input
            placeholder="Search"
            className="flex-1 bg-transparent text-[0.75rem] text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          <span className="rounded-md border border-white/10 px-2 py-0.5 text-[0.6rem] text-slate-500">⌘K</span>
        </label>

        <div className="space-y-5">
          {sidebarNavigation.map((section) => (
            <div key={section.label} className="space-y-2">
              <p className="px-1 text-[0.58rem] font-semibold uppercase tracking-[0.32em] text-slate-500">
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = Boolean(item.active);
                  const indicatorClass = item.indicatorClass ?? "from-indigo-400/80 to-purple-500/80";

                  return (
                    <button
                      key={item.label}
                      className={cn(
                        "group relative flex w-full items-center gap-3 overflow-hidden rounded-lg px-3 py-2 text-left text-[0.78rem] transition",
                        isActive
                          ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                          : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none absolute left-1 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b transition",
                          indicatorClass,
                          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60",
                        )}
                      />
                      <span className="grid size-7 shrink-0 place-items-center rounded-md bg-white/5 text-slate-400 transition group-hover:bg-white/10 group-hover:text-slate-100">
                        <Icon className="size-3.5" />
                      </span>
                      <span className="truncate">{item.label}</span>
                      {item.badge ? (
                        <span className="ml-auto rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[0.6rem] font-medium text-slate-200">
                          {item.badge}
                        </span>
                      ) : item.shortcut ? (
                        <span className="ml-auto rounded-md border border-white/10 px-2 py-0.5 text-[0.6rem] text-slate-500">
                          {item.shortcut}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 px-3 py-2 text-[0.75rem] font-medium text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-indigo-500/50">
          <Plus className="size-3.5" />
          Create issue
        </button>
      </div>

      <div className="mt-auto space-y-4 border-t border-white/5 px-4 py-5 text-[0.75rem]">
        <button className="flex w-full items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-left text-slate-300 transition hover:bg-white/10 hover:text-white">
          <span className="flex items-center gap-2">
            <Search className="size-3.5" />
            Command palette
          </span>
          <span className="rounded-md border border-white/10 px-2 py-0.5 text-[0.6rem] text-slate-400">⌘K</span>
        </button>

        <div className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-3 text-[0.75rem] text-slate-300">
          <div className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-[0.65rem] font-medium text-white">
            JD
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Jane Doe</p>
            <p className="text-[0.65rem] text-slate-400">Design lead</p>
          </div>
          <ChevronDown className="size-4 text-slate-500" />
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
        "flex flex-1 flex-col overflow-hidden bg-[#0f1117]",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-8 py-5 text-sm text-slate-300 backdrop-blur">
        <div className="space-y-1">
          <p className="text-[0.6rem] uppercase tracking-[0.35em] text-slate-500">Sprint board</p>
          <h2 className="text-xl font-semibold text-white">Current cycle</h2>
        </div>
        <div className="flex items-center gap-2 text-[0.75rem]">
          <button className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white">
            Filter
          </button>
          <button className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-1.5 text-white transition hover:from-indigo-400 hover:to-purple-400">
            <Plus className="size-3.5" />
            New view
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-8 pb-8 pt-6">
        <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#161a23] shadow-[0_25px_80px_-45px_rgba(15,23,42,0.9)]">
          <header className="flex items-center gap-3 border-b border-white/5 px-6 py-4 text-[0.75rem] text-slate-400">
            <button className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-slate-200 transition hover:bg-white/10 hover:text-white">
              Sorted by priority
            </button>
            <button className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white">
              Group by status
            </button>
          </header>

          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-[1.5fr_1fr_1fr_0.8fr_0.8fr] border-b border-white/5 bg-white/[0.03] px-6 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.32em] text-slate-500">
              {tableColumns.map((column) => (
                <span key={column}>{column}</span>
              ))}
            </div>
            <div className="divide-y divide-white/5">
              {Array.from({ length: 9 }).map((_, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1.5fr_1fr_1fr_0.8fr_0.8fr] items-center gap-4 px-6 py-4 text-[0.78rem] text-slate-300"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-full bg-white/5 text-[0.6rem] font-medium text-slate-300">
                      {index + 1}
                    </span>
                    <div className="flex flex-col gap-1">
                      <span className="h-2.5 w-32 rounded-full bg-white/10" />
                      <span className="h-2 w-20 rounded-full bg-white/5" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500" />
                    <span className="h-2.5 w-20 rounded-full bg-white/10" />
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[0.65rem] text-slate-200">
                    <span className="size-2 rounded-full bg-emerald-400" />
                    {statusPills[index % statusPills.length]}
                  </span>
                  <div className="flex items-center gap-2 text-[0.7rem] text-slate-400">
                    <CircleDashed className="size-3" />
                    <span className="h-2.5 w-14 rounded-full bg-white/8" />
                  </div>
                  <div className="flex flex-col items-end gap-1 text-[0.7rem] text-slate-400">
                    <span className="h-2.5 w-16 rounded-full bg-white/10" />
                    <span className="h-2 w-10 rounded-full bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export function SidebarDemo() {
  const { width, isResizing, getHandleProps } = useResizablePanel({ initialWidth: 260, minWidth: 220, maxWidth: 340 });

  return (
    <div className="flex h-full w-full overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(26,29,39,0.92),_rgba(12,14,22,0.98))] text-slate-100 shadow-[0_40px_140px_-70px_rgba(8,10,18,0.95)]">
      <Sidebar width={width} />

      <div
        className={cn(
          "group relative flex w-2 cursor-ew-resize items-center justify-center border-r border-white/10 bg-white/5 transition",
          isResizing ? "bg-white/15" : "hover:bg-white/10",
        )}
        {...getHandleProps()}
      >
        <span
          className={cn(
            "h-12 w-px rounded-full bg-white/30 transition",
            isResizing ? "bg-white/70" : "group-hover:bg-white/50",
          )}
        />
      </div>

      <DashboardPlaceholder />
    </div>
  );
}
