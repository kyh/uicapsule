import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { ChevronDown, X } from "lucide-react";

import { useDismiss } from "../lib/hooks";
import { Kbd } from "./badge";
import { Button } from "./button";
import { Icon } from "./icon";

const noop = () => null;

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer: ReactNode;
  note?: string;
  size?: "lg";
}

/** One modal sheet of paper over a dimmed page: the question and its fields first, then a ruled strip of actions. It appears at full size and never grows. */
export const Dialog = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  note,
  size,
}: DialogProps) => {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = ref.current;

    if (!dialog) {
      return;
    }

    dialog.setAttribute("closedby", "any");

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      aria-describedby={description ? descId : undefined}
      aria-labelledby={titleId}
      className="fj-dialog"
      data-size={size}
      onClose={() => {
        onOpenChange(false);
      }}
      ref={ref}
    >
      {open ? (
        <>
          <div className="fj-dialog-card">
            <div className="fj-dialog-head">
              <div>
                <h2 className="fj-dialog-title" id={titleId}>
                  {title}
                </h2>
                {description ? (
                  <p className="fj-dialog-desc" id={descId}>
                    {description}
                  </p>
                ) : null}
              </div>
              <Button
                aria-label="Close"
                onClick={() => {
                  onOpenChange(false);
                }}
                size="icon-sm"
                variant="ghost"
              >
                <Icon icon={X} />
              </Button>
            </div>
            {children}
          </div>
          <div className="fj-dialog-foot">
            {note !== undefined && note !== "" ? <p>{note}</p> : null}
            {footer}
          </div>
        </>
      ) : null}
    </dialog>
  );
};

interface TriggerProps {
  open: boolean;
  toggle: () => void;
  id: string;
}

interface PopoverProps {
  renderTrigger: (props: TriggerProps) => ReactNode;
  children: ReactNode;
  label: string;
  align?: "end";
  side?: "top";
}

/** A non-modal panel on paper with the overlay shadow. Escape or a click outside closes it. */
export const Popover = ({ renderTrigger, children, label, align, side }: PopoverProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useDismiss(open, () => {
    setOpen(false);
  }, [ref]);

  return (
    <div className="fj-anchor" ref={ref}>
      {renderTrigger({
        id,
        open,
        toggle: () => {
          setOpen((value) => !value);
        },
      })}
      {open ? (
        <dialog
          aria-label={label}
          className="fj-overlay fj-popover"
          data-align={align}
          data-side={side}
          id={id}
          open
        >
          {children}
        </dialog>
      ) : null}
    </div>
  );
};

interface TooltipTriggerProps {
  "aria-describedby": string | undefined;
  onBlur: () => void;
  onFocus: () => void;
  onKeyDown: (event: KeyboardEvent) => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}

interface TooltipProps {
  content: ReactNode;
  align?: "center" | "start";
  children: (props: TooltipTriggerProps) => ReactNode;
}

/** Names an icon-only control after 400ms of hover, or at once on keyboard focus. */
export const Tooltip = ({ content, align = "center", children }: TooltipProps) => {
  const [open, setOpen] = useState(false);
  const [delay, setDelay] = useState<number | null>(null);
  const id = useId();

  useEffect(() => {
    if (delay === null) {
      return noop;
    }

    const timer = window.setTimeout(() => {
      setOpen(true);
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [delay]);

  const show = (wait: number) => {
    setDelay(wait);
  };

  const hide = () => {
    setDelay(null);
    setOpen(false);
  };

  return (
    <span className="fj-anchor">
      {children({
        "aria-describedby": open ? id : undefined,
        onBlur: hide,
        onFocus: () => {
          show(0);
        },
        onKeyDown: (event) => {
          if (event.key === "Escape") {
            hide();
          }
        },
        onPointerEnter: () => {
          show(400);
        },
        onPointerLeave: hide,
      })}
      {open ? (
        <span className="fj-tooltip" data-align={align} id={id} role="tooltip">
          {content}
        </span>
      ) : null}
    </span>
  );
};

export interface MenuEntry {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
  shortcut?: string;
}

interface MenuProps {
  label: string;
  items: MenuEntry[];
  renderTrigger: (props: TriggerProps) => ReactNode;
  align?: "end";
}

/** Actions on one object, in words. Arrows move, a listed letter picks its item, and Escape hands focus back to the trigger. */
export const Menu = ({ label, items, renderTrigger, align }: MenuProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();

  const close = () => {
    setOpen(false);
    ref.current?.querySelector<HTMLButtonElement>("[aria-haspopup]")?.focus();
  };

  useDismiss(open, () => {
    setOpen(false);
  }, [ref]);

  useEffect(() => {
    if (open) {
      itemRefs.current[0]?.focus();
    }
  }, [open]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = itemRefs.current.indexOf(
      document.activeElement instanceof HTMLButtonElement ? document.activeElement : null,
    );

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();

      const delta = event.key === "ArrowDown" ? 1 : -1;
      const from = current === -1 && delta === -1 ? 0 : current;
      const next = (from + delta + items.length) % items.length;

      itemRefs.current[next]?.focus();
    } else if (event.key === "Escape") {
      event.stopPropagation();
      close();
    } else if (event.key === "Tab") {
      setOpen(false);
    } else if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      const match = items.find((item) => item.shortcut?.toLowerCase() === event.key.toLowerCase());

      if (match) {
        event.preventDefault();
        close();
        match.onSelect();
      }
    }
  };

  return (
    <div className="fj-anchor" ref={ref}>
      {renderTrigger({
        id,
        open,
        toggle: () => {
          setOpen((value) => !value);
        },
      })}
      {open ? (
        <div
          aria-label={label}
          className="fj-overlay fj-popover fj-menu"
          data-align={align}
          id={id}
          onKeyDown={onKeyDown}
          onPointerLeave={(event) => {
            event.currentTarget.focus();
          }}
          role="menu"
          tabIndex={-1}
        >
          {items.map((item, index) => (
            <button
              className="fj-menu-item"
              data-variant={item.destructive === true ? "destructive" : undefined}
              key={item.label}
              onClick={() => {
                close();
                item.onSelect();
              }}
              onPointerMove={(event) => {
                event.currentTarget.focus();
              }}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              role="menuitem"
              tabIndex={-1}
              type="button"
            >
              {item.label}
              {item.shortcut !== undefined && item.shortcut !== "" ? (
                <span className="fj-menu-meta">
                  <Kbd>{item.shortcut}</Kbd>
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string> {
  label: string;
  options: readonly SelectOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  hint?: string;
}

/** A native select. Browsers that support a styleable picker get Fjord paper and the overlay shadow; the rest keep their own menu. */
export const Select = <T extends string>({
  label,
  options,
  value,
  onValueChange,
  hint,
}: SelectProps<T>) => {
  const id = useId();

  return (
    <div className="fj-field">
      <label className="fj-field-label" htmlFor={id}>
        {label}
      </label>
      <div className="fj-select-wrap">
        <select
          aria-describedby={hint !== undefined && hint !== "" ? `${id}-hint` : undefined}
          className="fj-input fj-select"
          id={id}
          onChange={(event) => {
            const next = options.find((option) => option.value === event.target.value);

            if (next) {
              onValueChange(next.value);
            }
          }}
          value={value}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Icon icon={ChevronDown} size={12} />
      </div>
      {hint !== undefined && hint !== "" ? (
        <p className="fj-field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
};
