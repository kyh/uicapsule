import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactElement } from "react";
import type { LucideIcon } from "lucide-react";

import { Icon } from "./icon";
import { Kbd } from "./tag";
import { Popover } from "./popover";

export interface MenuItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  shortcut?: string;
  tone?: "fail";
  separatorBefore?: boolean;
}

interface MenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  items: MenuItem[];
  onSelect: (id: string) => void;
  renderTrigger: (props: {
    "aria-expanded": boolean;
    "aria-controls": string;
    onClick: () => void;
  }) => ReactElement;
}

/** A menu button with arrow-key focus, Escape to close, and a ruled danger section. */
export const DropdownMenu = ({
  open,
  onOpenChange,
  label,
  items,
  onSelect,
  renderTrigger,
}: MenuProps) => {
  const [active, setActive] = useState(0);
  const [seen, setSeen] = useState(open);
  const list = useRef<HTMLDivElement>(null);

  if (seen !== open) {
    setSeen(open);

    if (open) {
      setActive(0);
    }
  }

  useEffect(() => {
    if (open) {
      list.current?.querySelectorAll<HTMLElement>("[role=menuitem]")[active]?.focus();
    }
  }, [active, open]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index - 1 + items.length) % items.length);
    } else if (event.key === "Tab") {
      onOpenChange(false);
    }
  };

  return (
    <Popover
      bare
      className="hx-menu"
      label={label}
      onOpenChange={onOpenChange}
      open={open}
      side="bottom-end"
      renderTrigger={renderTrigger}
    >
      <div
        aria-label={label}
        className="hx-menu"
        onKeyDown={onKeyDown}
        ref={list}
        role="menu"
        tabIndex={-1}
      >
        {items.map((item, index) => (
          <div key={item.id} role="none">
            {item.separatorBefore === true ? <hr className="hx-menu-sep" /> : null}
            <button
              className="hx-menu-item"
              data-active={index === active}
              data-tone={item.tone}
              onClick={() => {
                onSelect(item.id);
                onOpenChange(false);
              }}
              onPointerEnter={() => {
                setActive(index);
              }}
              role="menuitem"
              tabIndex={index === active ? 0 : -1}
              type="button"
            >
              {item.icon ? <Icon icon={item.icon} /> : null}
              <span className="hx-grow">{item.label}</span>
              {item.shortcut !== undefined && item.shortcut !== "" ? (
                <Kbd>{item.shortcut}</Kbd>
              ) : null}
            </button>
          </div>
        ))}
      </div>
    </Popover>
  );
};
