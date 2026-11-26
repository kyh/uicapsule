import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactElement, ReactNode } from "react";

const noop = () => null;

interface PopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  renderTrigger: (props: {
    "aria-expanded": boolean;
    "aria-controls": string;
    onClick: () => void;
  }) => ReactElement;
  side?: "bottom" | "bottom-end" | "top";
  label: string;
  className?: string;
  bare?: boolean;
  children: ReactNode;
}

/** A non-modal dialog pinned to its trigger, flipped and clamped to stay inside the viewport. */
export const Popover = ({
  open,
  onOpenChange,
  renderTrigger,
  side = "bottom",
  label,
  className,
  bare,
  children,
}: PopoverProps) => {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLElement | null>(null);
  const [place, setPlace] = useState<CSSProperties>({});

  useLayoutEffect(() => {
    if (!open) {
      return noop;
    }

    const measure = () => {
      const box = root.current?.getBoundingClientRect();

      if (!box) {
        return;
      }

      const width = panel.current?.offsetWidth ?? 288;
      const height = panel.current?.offsetHeight ?? 0;
      const room = document.documentElement.clientWidth;
      const wanted = side === "bottom-end" ? box.right - width : box.left;
      const left = Math.max(8, Math.min(wanted, room - width - 8));
      const base = { left, position: "fixed" as const };
      const fitsBelow = box.bottom + 4 + height <= window.innerHeight - 8;
      const fitsAbove = box.top - 4 - height >= 8;
      const above = side === "top" ? fitsAbove || !fitsBelow : !fitsBelow && fitsAbove;

      if (above) {
        setPlace({ ...base, bottom: window.innerHeight - box.top + 4, top: "auto" });
      } else {
        setPlace({ ...base, top: box.bottom + 4 });
      }
    };

    measure();
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);

    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [open, side]);

  useEffect(() => {
    if (!open) {
      return noop;
    }

    const onPointer = (event: PointerEvent) => {
      if (event.target instanceof Node && root.current?.contains(event.target) !== true) {
        onOpenChange(false);
      }
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
        root.current?.querySelector<HTMLElement>("[aria-expanded]")?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  return (
    <div className="hx-anchor" ref={root}>
      {renderTrigger({
        "aria-controls": id,
        "aria-expanded": open,
        onClick: () => {
          onOpenChange(!open);
        },
      })}
      {open && bare === true ? (
        <div
          className={`hx-overlay ${className ?? "hx-popover"}`}
          id={id}
          ref={(node) => {
            panel.current = node;
          }}
          style={place}
        >
          {children}
        </div>
      ) : null}
      {open && bare !== true ? (
        <dialog
          aria-label={label}
          className={`hx-overlay ${className ?? "hx-popover"}`}
          id={id}
          open
          ref={(node) => {
            panel.current = node;
          }}
          style={place}
        >
          {children}
        </dialog>
      ) : null}
    </div>
  );
};

/** Names a glyph-only control on hover and focus, linked with aria-describedby. */
export const Tooltip = ({
  label,
  renderTrigger,
}: {
  label: string;
  renderTrigger: (props: { "aria-describedby": string }) => ReactElement;
}) => {
  const [shown, setShown] = useState(false);
  const id = useId();

  return (
    <span
      className="hx-anchor"
      onBlur={() => {
        setShown(false);
      }}
      onFocus={() => {
        setShown(true);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setShown(false);
        }
      }}
      onPointerEnter={() => {
        setShown(true);
      }}
      onPointerLeave={() => {
        setShown(false);
      }}
      role="presentation"
    >
      {renderTrigger({ "aria-describedby": id })}
      <span className="hx-tooltip" hidden={!shown} id={id} role="tooltip">
        {label}
      </span>
    </span>
  );
};
