import type { LucideIcon } from "lucide-react";

import { cx } from "../lib/cx";

import "./tab-bar.css";

export interface TabBarItem {
  label: string;
  icon: LucideIcon;
  href?: string;
}

interface TabBarProps {
  label: string;
  items: readonly TabBarItem[];
  current: string;
  onSelect?: (label: string) => void;
  currentKind?: "page" | "location";
  tucked?: boolean;
  className?: string;
}

/** Bottom navigation for a phone: up to five places, an icon over a short word each. */
export const TabBar = ({
  label,
  items,
  current,
  onSelect,
  currentKind = "page",
  tucked = false,
  className,
}: TabBarProps) => (
  <nav aria-label={label} className={cx("cl-tabbar", className)} data-tucked={tucked || undefined}>
    {items.map(({ label: name, icon: Icon, href }) => {
      const on = name === current;

      const body = (
        <>
          <Icon aria-hidden size={20} strokeWidth={on ? 2 : 1.75} />
          <span>{name}</span>
        </>
      );

      return href !== undefined && href !== "" ? (
        <a
          aria-current={on ? currentKind : undefined}
          className="cl-tabbar__item"
          href={href}
          key={name}
          onClick={() => onSelect?.(name)}
        >
          {body}
        </a>
      ) : (
        <button
          aria-current={on ? currentKind : undefined}
          className="cl-tabbar__item"
          key={name}
          onClick={() => onSelect?.(name)}
          type="button"
        >
          {body}
        </button>
      );
    })}
  </nav>
);
