import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cx } from "../lib/cx";

import "./list.css";

export const List = ({
  variant = "plain",
  label,
  children,
  className,
}: {
  variant?: "plain" | "grouped";
  label?: string;
  children: ReactNode;
  className?: string;
}) => (
  <ul aria-label={label} className={cx("cl-list", className)} data-variant={variant}>
    {children}
  </ul>
);

export const ListIcon = ({
  icon: Icon,
  tone = "neutral",
}: {
  icon: LucideIcon;
  tone?: "neutral" | "accent" | "success" | "danger";
}) => (
  <span aria-hidden className="cl-list-icon" data-tone={tone}>
    <Icon size={20} strokeWidth={1.75} />
  </span>
);

interface ListItemProps {
  title: ReactNode;
  description?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  chevron?: boolean;
  selected?: boolean;
}

export const ListItem = ({
  title,
  description,
  leading,
  trailing,
  onClick,
  chevron = false,
  selected = false,
}: ListItemProps) => {
  const body = (
    <>
      {leading}
      <span className="cl-row__text">
        <span className="cl-row__title">{title}</span>
        {Boolean(description) && <span className="cl-row__desc">{description}</span>}
      </span>
      {Boolean(trailing) && <span className="cl-row__trail">{trailing}</span>}
      {chevron ? (
        <ChevronRight aria-hidden className="cl-row__chev" size={16} strokeWidth={1.75} />
      ) : null}
    </>
  );

  return (
    <li className="cl-row" data-selected={selected || undefined}>
      {onClick ? (
        <button
          aria-pressed={selected ? true : undefined}
          className="cl-row__inner cl-row__inner--action"
          onClick={onClick}
          type="button"
        >
          {body}
        </button>
      ) : (
        <div className="cl-row__inner">{body}</div>
      )}
    </li>
  );
};
