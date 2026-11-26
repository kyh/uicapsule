import type { CSSProperties, ReactNode } from "react";
import {
  BarChart3,
  Bell,
  Building,
  Building2,
  CheckSquare,
  ChevronDown,
  DollarSign,
  FileText,
  GitBranch,
  Grid3X3,
  Link,
  Mail,
  Settings,
  Star,
  Users,
  Workflow,
} from "lucide-react";

import { useResizableSidebar } from "./use-resizable-sidebar";

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  subItems?: NavItem[];
}

const navigationItems: NavItem[] = [
  { icon: <Bell size={14} />, id: "notifications", label: "Notifications" },
  { icon: <CheckSquare size={14} />, id: "tasks", label: "Tasks" },
  { icon: <Mail size={14} />, id: "emails", label: "Emails" },
  { icon: <BarChart3 size={14} />, id: "reports", label: "Reports" },
  {
    icon: <Settings size={14} />,
    id: "automations",
    label: "Automations",
    subItems: [
      { icon: <Workflow size={14} />, id: "workflows", label: "Workflows" },
      { icon: <GitBranch size={14} />, id: "sequences", label: "Sequences" },
    ],
  },
];

const favoritesItems: NavItem[] = [
  {
    icon: <Star size={14} />,
    id: "onboarding-pipeline",
    label: "Onboarding pipeline",
  },
  {
    icon: <Building2 size={14} />,
    id: "top-of-funnel",
    label: "Top of funnel",
  },
  {
    icon: <FileText size={14} />,
    id: "revops-workflows",
    label: "RevOps workflows",
  },
];

const recordsItems: NavItem[] = [
  {
    icon: <Building size={14} />,
    id: "companies",
    label: "Companies",
  },
  { icon: <Users size={14} />, id: "people", label: "People" },
  { icon: <DollarSign size={14} />, id: "deals", label: "Deals" },
  { icon: <Grid3X3 size={14} />, id: "workspaces", label: "Workspaces" },
  { icon: <Link size={14} />, id: "partnerships", label: "Partnerships" },
];

const EmojiIcon = ({ children }: { children: string }) => (
  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[16px] leading-4">
    {children}
  </span>
);

const listsItems: NavItem[] = [
  {
    icon: <EmojiIcon>🚀</EmojiIcon>,
    id: "strategic-accounts",
    label: "Strategic accounts",
  },
];

interface NavigationState {
  activeId: string;
  activeBackground: string;
}

const NavigationItem = ({ item, nav }: { item: NavItem; nav: NavigationState }) => (
  <div className="flex w-full flex-col">
    <div
      className="flex min-w-0 items-center gap-x-1.5 rounded-[9px] px-2 py-1 transition-colors duration-500 [transition-timing-function:cubic-bezier(0.65,0,0.35,1)]"
      style={item.id === nav.activeId ? { backgroundColor: nav.activeBackground } : undefined}
    >
      <div className="relative w-[14px]">{item.icon}</div>
      <span className="min-w-0 flex-1 truncate text-[14px] leading-5 font-medium tracking-[-0.28px]">
        {item.label}
      </span>
      {item.subItems && <ChevronDown size={14} />}
    </div>
    {item.subItems && (
      <div className="flex flex-col gap-y-px py-px">
        {item.subItems.map((subItem) => (
          <div key={subItem.id} className="relative flex pl-5">
            <div className="absolute left-3.5 h-[32px] w-px -translate-y-[2px] bg-[#D1D3D6] opacity-40" />
            <NavigationItem item={subItem} nav={nav} />
          </div>
        ))}
      </div>
    )}
  </div>
);

const NavigationSection = ({
  title,
  items,
  nav,
}: {
  title: string;
  items: NavItem[];
  nav: NavigationState;
}) => (
  <div className="flex flex-col">
    <div className="flex min-w-0 items-center gap-x-1.5 px-2 py-1.5">
      <ChevronDown size={14} />
      <span className="min-w-0 flex-1 truncate text-[12px] leading-4 font-medium tracking-normal text-[#75777C]">
        {title}
      </span>
    </div>
    <ul className="flex flex-col gap-px">
      {items.map((item) => (
        <NavigationItem key={item.id} item={item} nav={nav} />
      ))}
    </ul>
  </div>
);

type AccentStyle = CSSProperties & Record<`--${string}`, string>;

export interface SidebarProps {
  /** Width the sidebar starts at, in px. */
  defaultWidth?: number;
  /** Narrowest width a drag can reach, in px. */
  minWidth?: number;
  /** Widest width a drag can reach, in px. */
  maxWidth?: number;
  /** Name shown beside the workspace logo. */
  workspaceName?: string;
  /** `id` of the highlighted navigation item. */
  activeItem?: string;
  /** Sidebar surface color. */
  background?: string;
  /** Label and icon color. */
  foreground?: string;
  /** Quick actions field color. */
  searchBackground?: string;
  /** Highlight behind the active item. */
  activeBackground?: string;
  /** Resize handle color on hover and drag. */
  accentColor?: string;
}

export const Sidebar = ({
  defaultWidth = 240,
  minWidth = 100,
  maxWidth = 300,
  workspaceName = "Dataembed",
  activeItem = "companies",
  background = "#FBFBFB",
  foreground = "#232529",
  searchBackground = "#FFFFFF",
  activeBackground = "#F4F5F6",
  accentColor = "#266DF0",
}: SidebarProps) => {
  const { handleMouseDown, sidebarRef } = useResizableSidebar({ defaultWidth, maxWidth, minWidth });
  const nav = { activeBackground, activeId: activeItem } satisfies NavigationState;
  const surface = { backgroundColor: background } satisfies CSSProperties;
  const handleStyle: AccentStyle = { "--sidebar-accent": accentColor };

  return (
    <div
      ref={sidebarRef}
      className="relative min-w-0 border-r border-[#EEEFF1]"
      style={{ ...surface, color: foreground, width: defaultWidth }}
    >
      <div
        className="flex items-center justify-between gap-x-6 border-r border-b border-[#EEEFF1] pt-3 pr-[15px] pb-[11px] pl-3"
        style={surface}
      >
        <div className="flex min-w-0 flex-1 items-center">
          <img
            alt={workspaceName}
            loading="lazy"
            width="96"
            height="96"
            decoding="async"
            className="size-6 shrink-0 rounded"
            src="https://www.dataembed.com/favicon/web-app-manifest-512x512.png"
          />
          <div className="ml-2 min-w-0 truncate text-[16px] leading-5 font-semibold tracking-[-0.32px]">
            {workspaceName}
          </div>
          <svg className="ml-[5px] shrink-0" width="18" height="18" fill="none">
            <path
              d="M5.25 7.125 9 10.875l3.75-3.75"
              stroke="#5C5E63"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <svg width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g stroke="#75777C" strokeWidth="1.2">
            <rect x="1.5" y="2.5" width="15" height="13" rx="3" />
            <path d="M7.8 2.725v12.5" />
            <path
              d="M3.975 5.425h1.35M3.975 7.674h1.35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </div>
      <div
        className="relative row-span-2 block border-r border-[#EEEFF1] pt-[10px] pr-[7px] pl-2"
        style={surface}
      >
        <div
          className="flex min-w-0 flex-1 items-center justify-between rounded-sm py-1 pr-1 pl-1.5 shadow-[0px_0px_2px_0px_#E0E0E0,0px_2px_4px_-2px_rgba(24,39,75,0.02),0px_4px_4px_-2px_rgba(24,39,75,0.06)]"
          style={{ backgroundColor: searchBackground }}
        >
          <div className="flex min-w-0 flex-1 items-center gap-x-1">
            <svg width="14" height="14" fill="none" className="shrink-0">
              <rect
                x="2"
                y="1"
                width="10"
                height="12"
                rx="2.5"
                stroke="currentColor"
                strokeWidth="1.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect
                x="2"
                y="1"
                width="10"
                height="9"
                rx="2.5"
                stroke="currentColor"
                strokeWidth="1.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M5.333 3.166v4.667m0-1.667 1.053-1m0 0 2.105-2m-2.105 2 2.28 2.667"
                stroke="currentColor"
                strokeWidth="1.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="min-w-0 flex-1 truncate text-[14px] leading-5 font-medium tracking-[-0.28px]">
              Quick actions
            </span>
          </div>
          <div className="flex min-w-[20px] shrink-0 justify-center rounded-md border border-[#E6E7EA] p-[3px]">
            <span className="text-center text-[11px] leading-3 font-normal tracking-[0.22px] text-[#75777C]">
              ⌘K
            </span>
          </div>
        </div>
        <div className="mt-2.5 flex flex-col gap-[9px]">
          <div className="flex flex-col">
            <ul className="flex flex-col gap-px">
              {navigationItems.map((item) => (
                <NavigationItem key={item.id} item={item} nav={nav} />
              ))}
            </ul>
          </div>

          <NavigationSection title="Favorites" items={favoritesItems} nav={nav} />
          <NavigationSection title="Records" items={recordsItems} nav={nav} />
          <NavigationSection title="Lists" items={listsItems} nav={nav} />
        </div>
      </div>

      {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- mouse-only resize affordance; the sidebar is fully usable at its default width, so there is no keyboard equivalent to provide */}
      <div
        className="absolute top-0 -right-0.5 h-full w-1 cursor-col-resize bg-transparent transition-colors duration-200 hover:bg-(--sidebar-accent) active:bg-(--sidebar-accent)"
        style={handleStyle}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};
