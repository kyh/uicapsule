import * as React from "react";
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

// Navigation data structure
const navigationItems = [
  { id: "notifications", label: "Notifications", icon: <Bell size={14} /> },
  { id: "tasks", label: "Tasks", icon: <CheckSquare size={14} /> },
  { id: "emails", label: "Emails", icon: <Mail size={14} /> },
  { id: "reports", label: "Reports", icon: <BarChart3 size={14} /> },
  {
    id: "automations",
    label: "Automations",
    icon: <Settings size={14} />,
    hasSubItems: true,
    subItems: [
      { id: "workflows", label: "Workflows", icon: <Workflow size={14} /> },
      { id: "sequences", label: "Sequences", icon: <GitBranch size={14} /> },
    ],
  },
];

const favoritesItems = [
  {
    id: "onboarding-pipeline",
    label: "Onboarding pipeline",
    icon: <Star size={14} />,
  },
  {
    id: "top-of-funnel",
    label: "Top of funnel",
    icon: <Building2 size={14} />,
  },
  {
    id: "revops-workflows",
    label: "RevOps workflows",
    icon: <FileText size={14} />,
  },
];

const recordsItems = [
  {
    id: "companies",
    label: "Companies",
    icon: <Building size={14} />,
    isActive: true,
  },
  { id: "people", label: "People", icon: <Users size={14} /> },
  { id: "deals", label: "Deals", icon: <DollarSign size={14} /> },
  { id: "workspaces", label: "Workspaces", icon: <Grid3X3 size={14} /> },
  { id: "partnerships", label: "Partnerships", icon: <Link size={14} /> },
];

const listsItems = [
  {
    id: "strategic-accounts",
    label: "Strategic accounts",
    icon: "🚀",
  },
];

// Navigation item component
const NavigationItem = ({
  item,
  isSubItem = false,
}: {
  item: any;
  isSubItem?: boolean;
}) => (
  <div className="flex w-full flex-col">
    <div
      className={`flex min-w-0 items-center gap-x-1.5 rounded-[9px] px-2 py-1 transition-colors duration-500 [transition-timing-function:cubic-bezier(0.65,0,0.35,1)] ${item.isActive ? "bg-[#F4F5F6]" : ""}`}
    >
      <div className="relative w-[14px]">
        {typeof item.icon === "string" ? (
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[16px] leading-4">
            {item.icon}
          </span>
        ) : (
          item.icon
        )}
      </div>
      <span className="min-w-0 flex-1 truncate text-[14px] leading-5 font-medium tracking-[-0.28px]">
        {item.label}
      </span>
      {item.hasSubItems && <ChevronDown size={14} />}
    </div>
    {item.hasSubItems && item.subItems && (
      <div className="flex flex-col gap-y-px py-px">
        {item.subItems.map((subItem: any) => (
          <div key={subItem.id} className="relative flex pl-5">
            <div className="absolute left-3.5 h-[32px] w-px -translate-y-[2px] bg-[#D1D3D6] opacity-40" />
            <div className="flex w-full flex-col">
              <NavigationItem item={subItem} isSubItem />
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// Section component
const NavigationSection = ({
  title,
  items,
}: {
  title: string;
  items: any[];
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
        <NavigationItem key={item.id} item={item} />
      ))}
    </ul>
  </div>
);

export const Sidebar = () => {
  const { sidebarRef, handleMouseDown } = useResizableSidebar();

  return (
    <div
      ref={sidebarRef}
      className="sidebar-container relative border-r border-[#EEEFF1] bg-[#FBFBFB]"
    >
      <div className="flex items-center justify-between gap-x-6 border-r border-b border-[#EEEFF1] bg-[#FBFBFB] pt-3 pr-[15px] pb-[11px] pl-3">
        <div className="flex min-w-0 flex-1 items-center">
          <img
            alt="Basepoint"
            loading="lazy"
            width="96"
            height="96"
            decoding="async"
            data-nimg="1"
            className="size-6 flex-shrink-0"
            src=""
          />
          <div className="text-secondary-foreground ml-2 min-w-0 truncate text-[16px] leading-5 font-semibold tracking-[-0.32px]">
            Basepoint
          </div>
          <svg
            className="ml-[5px] flex-shrink-0"
            width="18"
            height="18"
            fill="none"
          >
            <path
              d="M5.25 7.125 9 10.875l3.75-3.75"
              stroke="#5C5E63"
              stroke-width="1.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </svg>
        </div>
        <svg
          width="18"
          height="18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g stroke="#75777C" stroke-width="1.2">
            <rect x="1.5" y="2.5" width="15" height="13" rx="3"></rect>
            <path d="M7.8 2.725v12.5"></path>
            <path
              d="M3.975 5.425h1.35M3.975 7.674h1.35"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </g>
        </svg>
      </div>
      <div className="relative row-span-2 block border-r border-[#EEEFF1] bg-[#FBFBFB] pt-[10px] pr-[7px] pl-2">
        <div className="flex min-w-0 flex-1 items-center justify-between rounded-sm bg-white py-1 pr-1 pl-1.5 shadow-[0px_0px_2px_0px_#E0E0E0,0px_2px_4px_-2px_rgba(24,39,75,0.02),0px_4px_4px_-2px_rgba(24,39,75,0.06)]">
          <div className="flex min-w-0 flex-1 items-center gap-x-1">
            <svg width="14" height="14" fill="none" className="flex-shrink-0">
              <rect
                x="2"
                y="1"
                width="10"
                height="12"
                rx="2.5"
                stroke="#232529"
                stroke-width="1.1"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></rect>
              <rect
                x="2"
                y="1"
                width="10"
                height="9"
                rx="2.5"
                stroke="#232529"
                stroke-width="1.1"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></rect>
              <path
                d="M5.333 3.166v4.667m0-1.667 1.053-1m0 0 2.105-2m-2.105 2 2.28 2.667"
                stroke="#232529"
                stroke-width="1.1"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
            </svg>
            <span className="min-w-0 flex-1 truncate text-[14px] leading-5 font-medium tracking-[-0.28px]">
              Quick actions
            </span>
          </div>
          <div className="flex min-w-[20px] flex-shrink-0 justify-center rounded-md border border-[#E6E7EA] p-[3px]">
            <span className="text-center text-[11px] leading-3 font-normal tracking-[0.22px] text-[#75777C]">
              ⌘K
            </span>
          </div>
        </div>
        <div className="mt-2.5 flex flex-col gap-[9px]">
          {/* Main Navigation */}
          <div className="flex flex-col">
            <ul className="flex flex-col gap-px">
              {navigationItems.map((item) => (
                <NavigationItem key={item.id} item={item} />
              ))}
            </ul>
          </div>

          {/* Favorites Section */}
          <NavigationSection title="Favorites" items={favoritesItems} />

          {/* Records Section */}
          <NavigationSection title="Records" items={recordsItems} />

          {/* Lists Section */}
          <NavigationSection title="Lists" items={listsItems} />
        </div>
      </div>

      {/* Resize Handle */}
      <div
        className="absolute top-0 -right-0.5 h-full w-1 cursor-col-resize bg-transparent transition-colors duration-200 hover:bg-[#266DF0] active:bg-[#266DF0]"
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};
