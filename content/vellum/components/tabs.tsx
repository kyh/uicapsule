"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

const noop = () => null;

/** Switches between views; a pressed-ink pill slides under the chosen tab. */
export const Tabs = <T extends string>({
  id,
  label,
  tabs,
  value,
  onValueChange,
}: {
  id: string;
  label: string;
  tabs: readonly { value: T; label: string }[];
  value: T;
  onValueChange: (value: T) => void;
}) => {
  const list = useRef<HTMLDivElement>(null);
  const [boxes, setBoxes] = useState<readonly { left: number; width: number }[]>([]);
  const index = tabs.findIndex((tab) => tab.value === value);
  const mark = boxes[index];

  useEffect(() => {
    const element = list.current;

    if (!element) {
      return noop;
    }

    const measure = () => {
      setBoxes(
        [...element.querySelectorAll<HTMLButtonElement>("[role=tab]")].map((tab) => ({
          left: tab.offsetLeft,
          width: tab.offsetWidth,
        })),
      );
    };

    const observer = new ResizeObserver(measure);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    let nextIndex = index;

    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % tabs.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else {
      return;
    }

    event.preventDefault();

    const nextTab = tabs[nextIndex];

    if (nextTab) {
      onValueChange(nextTab.value);
      list.current?.querySelectorAll<HTMLButtonElement>("[role=tab]")[nextIndex]?.focus();
    }
  };

  return (
    <div
      aria-label={label}
      className="v-tabs"
      onKeyDown={onKeyDown}
      ref={list}
      role="tablist"
      tabIndex={-1}
    >
      {mark ? (
        <span
          aria-hidden
          className="v-tab-mark"
          style={{ translate: `${mark.left}px 0`, width: mark.width }}
        />
      ) : null}
      {tabs.map((tab) => (
        <button
          aria-controls={`${id}-${tab.value}`}
          aria-selected={tab.value === value}
          className="v-tab"
          id={`${id}-tab-${tab.value}`}
          key={tab.value}
          onClick={() => {
            onValueChange(tab.value);
          }}
          role="tab"
          tabIndex={tab.value === value ? 0 : -1}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

/** Props for the panel a tab controls, matching the ids Tabs gives its tabs. */
export const tabPanelProps = (id: string, value: string) => ({
  "aria-labelledby": `${id}-tab-${value}`,
  id: `${id}-${value}`,
  role: "tabpanel" as const,
});
