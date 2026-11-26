import { useId, useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Icon } from "./icon";

export interface TabEntry<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface TabsProps<T extends string> {
  label: string;
  tabs: readonly TabEntry<T>[];
  value: T;
  onValueChange: (value: T) => void;
  children: ReactNode;
}

/** Views of one object. The selected tab takes a 2px ink line; the panel swaps with a cut. */
export const Tabs = <T extends string>({
  label,
  tabs,
  value,
  onValueChange,
  children,
}: TabsProps<T>) => {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = tabs.findIndex((tab) => tab.value === value);
    let next = index;

    if (event.key === "ArrowRight") {
      next = (index + 1) % tabs.length;
    } else if (event.key === "ArrowLeft") {
      next = (index - 1 + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = tabs.length - 1;
    } else {
      return;
    }

    event.preventDefault();

    const tab = tabs[next];

    if (tab) {
      onValueChange(tab.value);
      refs.current[next]?.focus();
    }
  };

  return (
    <div className="fj-vstack" data-gap="16">
      <div
        aria-label={label}
        className="fj-tabs-list"
        onKeyDown={onKeyDown}
        role="tablist"
        tabIndex={-1}
      >
        {tabs.map((tab, index) => (
          <button
            aria-controls={`${id}-panel`}
            aria-selected={tab.value === value}
            className="fj-tab"
            id={`${id}-${tab.value}`}
            key={tab.value}
            onClick={() => onValueChange(tab.value)}
            ref={(node) => {
              refs.current[index] = node;
            }}
            role="tab"
            tabIndex={tab.value === value ? 0 : -1}
            type="button"
          >
            {tab.label}
            {tab.count === undefined ? null : <span>{tab.count}</span>}
          </button>
        ))}
      </div>
      <div aria-labelledby={`${id}-${value}`} id={`${id}-panel`} role="tabpanel">
        {children}
      </div>
    </div>
  );
};

export interface Crumb {
  label: string;
  href?: string;
}

const toCrumb = (item: string | Crumb) => (isCrumb(item) ? item : { label: item });

const isCrumb = (item: string | Crumb): item is Crumb => typeof item !== "string";

/** The path to this page. Earlier places that have an address link back; the last is plain text. */
export const Breadcrumb = ({
  items,
  label = "Breadcrumb",
}: {
  items: readonly (string | Crumb)[];
  label?: string;
}) => (
  <nav aria-label={label}>
    <ol className="fj-breadcrumb">
      {items.map((item, index) => {
        const crumb = toCrumb(item);
        const last = index === items.length - 1;

        return (
          <li className="fj-hstack" data-gap="4" key={crumb.label}>
            {last ? <span aria-current="location">{crumb.label}</span> : null}
            {!last && crumb.href ? <a href={crumb.href}>{crumb.label}</a> : null}
            {!last && !crumb.href ? <span>{crumb.label}</span> : null}
            {last ? null : (
              <span aria-hidden className="fj-breadcrumb-sep">
                /
              </span>
            )}
          </li>
        );
      })}
    </ol>
  </nav>
);

interface PaginationProps {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
}

const pageList = (page: number, pages: number) => {
  const set = new Set([1, pages, page - 1, page, page + 1]);

  return [...set].filter((value) => value >= 1 && value <= pages).toSorted((a, b) => a - b);
};

export const Pagination = ({ page, pages, onPageChange }: PaginationProps) => {
  const list = pageList(page, pages);

  return (
    <nav aria-label="Pages" className="fj-pagination">
      <button
        aria-label="Previous page"
        className="fj-page-btn"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        type="button"
      >
        <Icon icon={ChevronLeft} />
      </button>
      {list.map((value, index) => {
        const previous = list[index - 1];
        const gap = previous !== undefined && value - previous > 1;

        return (
          <span className="fj-hstack" data-gap="4" key={value}>
            {gap ? (
              <span aria-hidden className="fj-c-3 fj-t-label">
                …
              </span>
            ) : null}
            <button
              aria-current={value === page ? "page" : undefined}
              aria-label={`Page ${value}`}
              className="fj-page-btn"
              onClick={() => onPageChange(value)}
              type="button"
            >
              {value}
            </button>
          </span>
        );
      })}
      <button
        aria-label="Next page"
        className="fj-page-btn"
        disabled={page === pages}
        onClick={() => onPageChange(page + 1)}
        type="button"
      >
        <Icon icon={ChevronRight} />
      </button>
    </nav>
  );
};
