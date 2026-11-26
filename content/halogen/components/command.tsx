import { CornerDownLeft, Search } from "lucide-react";
import { useId, useState } from "react";
import type { KeyboardEvent } from "react";
import type { LucideIcon } from "lucide-react";

import { Dialog } from "./dialog";
import { Icon } from "./icon";
import { Kbd } from "./tag";

export interface CommandItem {
  id: string;
  label: string;
  group: string;
  icon: LucideIcon;
  target?: string;
}

interface CommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandItem[];
  onRun: (item: CommandItem) => void;
}

/** A searchable listbox in a dialog, for Cmd K. */
export const CommandPalette = ({ open, onOpenChange, items, onRun }: CommandProps) => {
  const id = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const needle = query.trim().toLowerCase();

  const matches = items.filter(
    (item) =>
      !needle ||
      item.label.toLowerCase().includes(needle) ||
      item.group.toLowerCase().includes(needle),
  );

  const current = matches[active];

  const close = () => {
    setQuery("");
    setActive(0);
    onOpenChange(false);
  };

  const run = (item: CommandItem | undefined) => {
    if (!item) {
      return;
    }

    onRun(item);
    close();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(matches.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(0, index - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      run(current);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  };

  return (
    <Dialog
      meta={`${matches.length} ${matches.length === 1 ? "result" : "results"}`}
      onOpenChange={(next) => {
        if (next) {
          onOpenChange(true);
        } else {
          close();
        }
      }}
      open={open}
      size="lg"
      title="Go to"
    >
      <span className="hx-input">
        <Icon icon={Search} />
        <input
          aria-describedby={`${id}-status`}
          aria-label="Search pipelines, warehouses and actions"
          autoComplete="off"
          data-autofocus
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search pipelines, warehouses, actions"
          type="search"
          value={query}
        />
        <Kbd>Esc</Kbd>
      </span>
      <p aria-live="polite" className="hx-sr" id={`${id}-status`}>
        {current
          ? `${matches.length} ${matches.length === 1 ? "result" : "results"}. ${current.label} highlighted, press Enter to open.`
          : "No results."}
      </p>
      {matches.length === 0 ? (
        <p className="hx-body-sm hx-ink-3 hx-command-empty">
          Nothing matches “{query}”. Try a table name or a verb such as cap.
        </p>
      ) : null}
      <ul aria-label="Results" className="hx-menu hx-command-list">
        {matches.map((item, index) => (
          <li key={item.id}>
            <button
              aria-current={index === active ? "true" : undefined}
              className="hx-menu-item"
              data-active={index === active}
              onClick={() => {
                run(item);
              }}
              onFocus={() => {
                setActive(index);
              }}
              onPointerEnter={() => {
                setActive(index);
              }}
              tabIndex={-1}
              type="button"
            >
              <Icon icon={item.icon} />
              <span className="hx-grow hx-truncate">{item.label}</span>
              <span className="hx-label-sm hx-ink-3">{item.group}</span>
              <span className="hx-command-enter">
                {index === active ? <Icon icon={CornerDownLeft} size={14} /> : null}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Dialog>
  );
};
