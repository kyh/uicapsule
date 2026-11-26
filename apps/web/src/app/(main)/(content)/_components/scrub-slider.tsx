"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { createPortal } from "react-dom";
import { cn } from "cn";

import {
  clickedNumber,
  draggedNumber,
  formatNumber,
  handleCrowdsText,
  hashmarkRatios,
  keyedNumber,
  numberRatio,
  numberStep,
  parseNumberInput,
  rubberStretch,
  snapNumber,
} from "./control-format";
import type { NumberControl } from "./control-format";
import { ROW_LABEL, ROW_SURFACE, TRAVEL_EASE } from "./control-row";

const CLICK_SLOP = 3;

const ACTIVE_FILL =
  "group-hover:bg-foreground/15 group-has-focus-visible:bg-foreground/15 group-data-dragging:bg-foreground/15";

const ACTIVE_TEXT =
  "group-hover:text-foreground group-has-focus-visible:text-foreground group-data-dragging:text-foreground";

const HANDLE_CLEAR =
  "group-hover:opacity-50 group-has-focus-visible:opacity-100 group-data-dragging:opacity-100";

const HANDLE_CROWDED =
  "scale-y-75 group-hover:opacity-15 group-has-focus-visible:opacity-15 group-data-dragging:opacity-15";

interface Gesture {
  readonly pointerId: number;
  readonly rect: DOMRect;
  readonly startValue: number;
  readonly startX: number;
  readonly startY: number;
  dragging: boolean;
}

interface TrackLayout {
  readonly labelEnd: number;
  readonly valueStart: number;
  readonly width: number;
}

const sameLayout = (a: TrackLayout | null, b: TrackLayout) =>
  a !== null && a.labelEnd === b.labelEnd && a.valueStart === b.valueStart && a.width === b.width;

const ratioAt = (clientX: number, rect: DOMRect) =>
  rect.width > 0 ? (clientX - rect.left) / rect.width : 0;

const overshootAt = (clientX: number, rect: DOMRect) => {
  if (clientX < rect.left) {
    return clientX - rect.left;
  }

  return clientX > rect.right ? clientX - rect.right : 0;
};

interface ScrubSliderProps {
  control: NumberControl;
  label: string;
  value: number;
  onChange: (value: number) => void;
}

/**
 * A number control as one scrubbable row: the label and value sit inside the track, a fill grows
 * from the left, and dragging anywhere on the row sets the value under the pointer. A click
 * without a drag snaps to the nearest step or round tenth; Escape mid-drag puts the value back.
 * Clicking the value, or Enter, edits it as text. A visually hidden range input carries focus,
 * keys and the accessible value. Mid-drag a page-wide shield covers the preview, whose iframe
 * would otherwise swallow the pointer as it crosses.
 */
export const ScrubSlider = ({ control, label, value, onChange }: ScrubSliderProps) => {
  const labelId = useId();
  const rowRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<HTMLInputElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const valueRef = useRef<HTMLSpanElement>(null);
  const draftRef = useRef<HTMLInputElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const editCancelled = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [stretch, setStretch] = useState(0);
  const [draft, setDraft] = useState<string | null>(null);
  const [layout, setLayout] = useState<TrackLayout | null>(null);

  const ratio = numberRatio(value, control);
  const text = formatNumber(value, control);
  const editing = draft !== null;
  const crowded = layout !== null && handleCrowdsText(ratio, layout);

  useLayoutEffect(() => {
    const nodes = [rowRef.current, labelRef.current, valueRef.current];

    const measure = () => {
      const [row, labelNode, valueNode] = nodes;

      if (!row || !labelNode || !valueNode) {
        return;
      }

      const next = {
        labelEnd: labelNode.offsetLeft + labelNode.offsetWidth,
        valueStart: valueNode.offsetLeft,
        width: row.offsetWidth,
      } satisfies TrackLayout;

      setLayout((current) => (sameLayout(current, next) ? current : next));
    };

    const observer = new ResizeObserver(measure);

    for (const node of nodes) {
      if (node) {
        observer.observe(node);
      }
    }

    measure();

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (editing) {
      draftRef.current?.focus();
      draftRef.current?.select();
    }
  }, [editing]);

  const change = (next: number) => {
    if (next !== value) {
      onChange(next);
    }
  };

  const endGesture = (cancelled: boolean) => {
    const active = gesture.current;
    const row = rowRef.current;

    if (active === null) {
      return;
    }

    gesture.current = null;

    if (row?.hasPointerCapture(active.pointerId) === true) {
      row.releasePointerCapture(active.pointerId);
    }

    if (cancelled && active.dragging) {
      onChange(active.startValue);
    }

    setDragging(false);
    setStretch(0);
  };

  const startEditing = () => {
    editCancelled.current = false;
    setDraft(text);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || editing || gesture.current !== null) {
      return;
    }

    event.preventDefault();
    rangeRef.current?.focus({ focusVisible: false, preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = {
      dragging: false,
      pointerId: event.pointerId,
      rect: event.currentTarget.getBoundingClientRect(),
      startValue: value,
      startX: event.clientX,
      startY: event.clientY,
    };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const active = gesture.current;

    if (active === null || active.pointerId !== event.pointerId) {
      return;
    }

    if (!active.dragging) {
      if (Math.hypot(event.clientX - active.startX, event.clientY - active.startY) <= CLICK_SLOP) {
        return;
      }

      active.dragging = true;
      setDragging(true);
    }

    setStretch(rubberStretch(overshootAt(event.clientX, active.rect)));
    change(draggedNumber(ratioAt(event.clientX, active.rect), control));
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const active = gesture.current;

    if (active === null || active.pointerId !== event.pointerId) {
      return;
    }

    if (!active.dragging) {
      change(clickedNumber(ratioAt(event.clientX, active.rect), control));
    }

    endGesture(false);
  };

  const onRangeKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.altKey || event.metaKey || event.ctrlKey) {
      return;
    }

    if (event.key === "Escape" && gesture.current !== null) {
      event.preventDefault();
      endGesture(true);

      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      startEditing();

      return;
    }

    const next = keyedNumber(event.key, event.shiftKey, value, control);

    if (next === null) {
      return;
    }

    event.preventDefault();

    if (!event.currentTarget.matches(":focus-visible")) {
      event.currentTarget.blur();
      event.currentTarget.focus({ focusVisible: true, preventScroll: true });
    }

    change(next);
  };

  const commitDraft = () => {
    const parsed =
      draft === null || editCancelled.current ? null : parseNumberInput(draft, control);

    if (parsed !== null) {
      change(parsed);
    }

    setDraft(null);
  };

  const onDraftKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" && event.key !== "Escape") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    editCancelled.current = event.key === "Escape";
    rangeRef.current?.focus({ preventScroll: true });
  };

  return (
    <div
      ref={rowRef}
      data-dragging={dragging || undefined}
      className="group relative h-9 cursor-pointer touch-none select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        endGesture(true);
      }}
      onLostPointerCapture={() => {
        endGesture(true);
      }}
    >
      <input
        ref={rangeRef}
        type="range"
        min={control.min}
        max={control.max}
        step={numberStep(control)}
        value={value}
        tabIndex={editing ? -1 : 0}
        aria-labelledby={labelId}
        aria-valuetext={text}
        className="sr-only"
        onChange={(event) => {
          change(snapNumber(Number(event.currentTarget.value), control));
        }}
        onKeyDown={onRangeKeyDown}
      />
      <div
        aria-hidden
        className={cn(
          ROW_SURFACE,
          "group-has-focus-visible:ring-ring/50 absolute inset-y-0 overflow-hidden group-has-focus-visible:ring-2 group-has-focus-visible:ring-inset",
          !dragging && `transition-[left,right] duration-300 ${TRAVEL_EASE}`,
        )}
        style={{ left: Math.min(0, stretch), right: -Math.max(0, stretch) }}
      >
        {hashmarkRatios(control).map((mark) => (
          <span
            key={mark}
            className="group-hover:bg-foreground/15 group-has-focus-visible:bg-foreground/15 group-data-dragging:bg-foreground/15 absolute top-1/2 h-2 w-px -translate-1/2 rounded-full bg-transparent transition-colors duration-200"
            style={{ left: `${mark * 100}%` }}
          />
        ))}
        <div
          className={cn(
            "bg-foreground/10 absolute inset-y-0 left-0",
            ACTIVE_FILL,
            dragging
              ? "transition-colors duration-150"
              : `transition-[width,background-color] duration-200 ${TRAVEL_EASE}`,
          )}
          style={{ width: `${ratio * 100}%` }}
        />
        <div
          className={cn(
            "bg-foreground group-has-focus-visible:bg-primary group-data-dragging:bg-primary absolute top-1/2 h-5 w-[3px] -translate-y-1/2 scale-x-25 rounded-full opacity-0",
            "group-hover:scale-x-100 group-has-focus-visible:scale-x-100 group-data-dragging:scale-x-100",
            crowded ? HANDLE_CROWDED : HANDLE_CLEAR,
            dragging
              ? `transition-[background-color,opacity,scale] duration-150 ${TRAVEL_EASE}`
              : `transition-[left,background-color,opacity,scale] duration-200 ${TRAVEL_EASE}`,
          )}
          style={{ left: `max(5px, calc(${ratio * 100}% - 9px))` }}
        />
      </div>
      <span
        ref={labelRef}
        id={labelId}
        className={cn(
          ROW_LABEL,
          "pointer-events-none absolute top-1/2 left-3 max-w-[calc(100%-7ch-2rem)] -translate-y-1/2 truncate",
        )}
      >
        {label}
      </span>
      <span
        ref={valueRef}
        aria-hidden
        className={cn(
          "text-foreground/70 hover:border-muted-foreground absolute top-1/2 right-3 translate-y-[calc(-50%_+_1px)] cursor-text border-b border-transparent pb-px font-mono text-[13px] font-medium tabular-nums transition-colors duration-150",
          ACTIVE_TEXT,
          editing && "invisible",
        )}
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        onClick={startEditing}
      >
        {text}
      </span>
      {dragging &&
        createPortal(<div className="fixed inset-0 z-50 cursor-ew-resize" />, document.body)}
      {editing && (
        <input
          ref={draftRef}
          type="text"
          inputMode="decimal"
          aria-label={`${label} value`}
          value={draft}
          autoComplete="off"
          spellCheck={false}
          className="text-foreground caret-primary border-muted-foreground absolute top-1/2 right-3 w-[7ch] translate-y-[calc(-50%_+_1px)] border-b bg-transparent pb-px text-right font-mono text-[13px] font-medium outline-none"
          onChange={(event) => {
            setDraft(event.currentTarget.value);
          }}
          onKeyDown={onDraftKeyDown}
          onBlur={commitDraft}
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
        />
      )}
    </div>
  );
};
