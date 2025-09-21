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

const MIN_WIDTH = 220;
const MAX_WIDTH = 420;

const navigation = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, active: true },
      { label: "Campaigns", icon: FolderKanban },
      { label: "Audience", icon: Users },
      { label: "Documents", icon: FileText },
    ],
  },
  {
    label: "Shortcuts",
    items: [
      { label: "Reports", icon: BarChart3, badge: "12" },
      { label: "Calendar", icon: CalendarDays },
      { label: "Support", icon: LifeBuoy, badge: "Live" },
    ],
  },
];

export function Sidebar() {
  const [width, setWidth] = React.useState(280);
  const [isResizing, setIsResizing] = React.useState(false);
  const startXRef = React.useRef(0);
  const startWidthRef = React.useRef(0);
  const isDraggingRef = React.useRef(false);

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      isDraggingRef.current = true;
      startXRef.current = event.clientX;
      startWidthRef.current = width;
      setIsResizing(true);
      document.body.classList.add("select-none");
    },
    [width],
  );

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
    <div className="flex h-full w-full overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-950/60 text-slate-200 shadow-2xl">
      <aside
        className="flex h-full flex-col border-r border-slate-800/60 bg-slate-950/80 backdrop-blur"
        style={{ width }}
      >
        <div className="flex items-center gap-3 border-b border-slate-800/60 px-5 py-4">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-sm font-semibold text-white shadow-lg">
            UX
          </div>
          <div>
            <p className="text-sm font-medium text-slate-100">Pixel Pilot</p>
            <p className="text-xs text-slate-500">Workspace</p>
          </div>
        </div>

        <div className="px-5 py-4">
          <label className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-400 focus-within:border-slate-700 focus-within:text-slate-200 focus-within:ring-2 focus-within:ring-slate-700/40">
            <Search className="size-4" />
            <input
              placeholder="Search"
              className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
          </label>

          {navigation.map((section) => (
            <div key={section.label} className="mt-6">
              <p className="text-[0.65rem] uppercase tracking-widest text-slate-500/80">
                {section.label}
              </p>
              <div className="mt-3 space-y-1.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      className={`group flex w-full items-center justify-between rounded-lg border border-transparent px-3 py-2.5 text-left text-sm transition ${
                        item.active
                          ? "border-slate-800/80 bg-slate-900/80 text-slate-100 shadow-inner"
                          : "text-slate-400 hover:border-slate-800/80 hover:bg-slate-900/70 hover:text-slate-100"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={`grid size-7 place-items-center rounded-lg border text-[0.7rem] transition ${
                            item.active
                              ? "border-slate-700/60 bg-slate-900 text-slate-200"
                              : "border-slate-800 bg-slate-950/80 text-slate-500 group-hover:border-slate-700 group-hover:text-slate-200"
                          }`}
                        >
                          <Icon className="size-4" />
                        </span>
                        {item.label}
                      </span>
                      {item.badge ? (
                        <span className="rounded-full border border-slate-700/60 bg-slate-900/70 px-2 py-0.5 text-[0.65rem] font-medium text-slate-300">
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

        <div className="mt-auto space-y-4 border-t border-slate-800/60 px-5 py-5">
          <div className="flex items-center gap-3 rounded-xl border border-slate-800/60 bg-slate-900/60 px-3 py-3">
            <div className="grid size-9 place-items-center rounded-lg bg-emerald-500/15 text-sm font-semibold text-emerald-300">
              JD
            </div>
            <div className="flex-1 text-xs">
              <p className="font-medium text-slate-200">Jane Doe</p>
              <p className="text-slate-500">Lead Designer</p>
            </div>
            <button className="rounded-lg border border-slate-700/50 px-3 py-1 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800/70">
              Switch
            </button>
          </div>

          <button className="flex w-full items-center justify-between rounded-lg border border-slate-800/60 bg-slate-900/60 px-3 py-2 text-xs text-slate-400 transition hover:border-slate-700 hover:bg-slate-800/70 hover:text-slate-100">
            <span className="flex items-center gap-3">
              <span className="grid size-7 place-items-center rounded-lg border border-slate-800 bg-slate-950/80 text-slate-500">
                <Settings className="size-4" />
              </span>
              Settings
            </span>
            <span className="text-[0.65rem] text-slate-500">⌘ ,</span>
          </button>
        </div>
      </aside>

      <div
        className={`group relative flex w-2 cursor-ew-resize items-center justify-center border-r border-slate-800/60 bg-slate-950/40 transition ${
          isResizing ? "bg-slate-800/60" : "hover:bg-slate-900/60"
        }`}
        onPointerDown={handlePointerDown}
      >
        <span
          className={`h-12 w-px rounded-full bg-slate-700 transition ${
            isResizing ? "bg-slate-500" : "group-hover:bg-slate-500"
          }`}
        />
      </div>

      <main className="flex flex-1 flex-col bg-slate-950/40 backdrop-blur">
        <header className="flex items-center justify-between border-b border-slate-800/60 px-8 py-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500">Analytics</p>
            <h2 className="text-xl font-semibold text-slate-100">Product Design Overview</h2>
          </div>
          <button className="rounded-lg border border-slate-700/60 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800">
            New Report
          </button>
        </header>

        <div className="grid flex-1 gap-6 overflow-y-auto px-8 py-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <section className="flex flex-col justify-between rounded-2xl border border-slate-800/60 bg-slate-950/70 p-6 shadow-lg">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500">Team Progress</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-100">Q2 Launch Readiness</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Track milestones, collaborate across pods, and monitor blockers as the launch approaches the final review
                window.
              </p>
            </div>
            <div className="mt-5 grid gap-3">
              {["Research", "Design", "Development", "QA"].map((stage, index) => (
                <div key={stage} className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{stage}</span>
                    <span>{[70, 82, 56, 34][index]}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-900/70">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300"
                      style={{ width: `${[70, 82, 56, 34][index]}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-2xl border border-slate-800/60 bg-slate-950/70 p-6 shadow-lg">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500">Upcoming</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-100">Meetings</h3>
            </div>
            <div className="space-y-3 text-sm">
              {[
                { title: "Design crit", time: "Today · 3:00 PM" },
                { title: "Usability testing", time: "Tomorrow · 10:30 AM" },
                { title: "Roadmap sync", time: "Fri · 1:00 PM" },
              ].map((meeting) => (
                <div
                  key={meeting.title}
                  className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-900/60 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-slate-100">{meeting.title}</p>
                    <p className="text-xs text-slate-500">{meeting.time}</p>
                  </div>
                  <button className="rounded-md border border-slate-700/60 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800/70">
                    Join
                  </button>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-4 text-xs text-slate-400">
              <p className="font-medium text-slate-200">Workspace Tips</p>
              <p className="mt-2 leading-5">
                Share templates with your team and pin the most active projects for faster access during standups.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
