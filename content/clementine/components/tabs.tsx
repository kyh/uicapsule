import { useId, useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";

import "./tabs.css";

interface TabsProps<T extends string> {
  label: string;
  tabs: readonly { value: T; label: string; panel: ReactNode }[];
  value: T;
  onValueChange: (value: T) => void;
}

export const Tabs = <T extends string>({ label, tabs, value, onValueChange }: TabsProps<T>) => {
  const base = useId();
  const listRef = useRef<HTMLDivElement>(null);

  const onKeyDown = (event: KeyboardEvent) => {
    const index = tabs.findIndex((tab) => tab.value === value);

    const moves = new Map([
      ["ArrowLeft", (index - 1 + tabs.length) % tabs.length],
      ["ArrowRight", (index + 1) % tabs.length],
      ["Home", 0],
      ["End", tabs.length - 1],
    ]);

    const target = moves.get(event.key);

    if (target === undefined) {
      return;
    }

    event.preventDefault();
    const next = tabs[target];

    if (next) {
      onValueChange(next.value);
      listRef.current
        ?.querySelector<HTMLButtonElement>(`#${CSS.escape(`${base}-t-${next.value}`)}`)
        ?.focus();
    }
  };

  return (
    <div className="cl-tabs">
      <div aria-label={label} className="cl-tabs__list" ref={listRef} role="tablist">
        {tabs.map((tab) => (
          <button
            aria-controls={`${base}-p-${tab.value}`}
            aria-selected={tab.value === value}
            className="cl-tabs__tab"
            id={`${base}-t-${tab.value}`}
            key={tab.value}
            onClick={() => onValueChange(tab.value)}
            onKeyDown={onKeyDown}
            role="tab"
            tabIndex={tab.value === value ? 0 : -1}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          aria-labelledby={`${base}-t-${tab.value}`}
          className="cl-tabs__panel"
          hidden={tab.value !== value}
          id={`${base}-p-${tab.value}`}
          key={tab.value}
          role="tabpanel"
        >
          {tab.panel}
        </div>
      ))}
    </div>
  );
};
