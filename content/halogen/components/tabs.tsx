import { useId, useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";

export interface TabItem<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface TabsProps<T extends string> {
  label: string;
  value: T;
  items: TabItem<T>[];
  onValueChange: (value: T) => void;
  numbered?: boolean;
  children: ReactNode;
}

/** A tablist with arrow-key roving; `numbered` prefixes each tab with its index. */
export const Tabs = <T extends string>({
  label,
  value,
  items,
  onValueChange,
  numbered,
  children,
}: TabsProps<T>) => {
  const id = useId();
  const list = useRef<HTMLDivElement>(null);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = items.findIndex((item) => item.value === value);
    const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];

    if (step === undefined) {
      return;
    }

    event.preventDefault();
    const next = items[(index + step + items.length) % items.length];

    if (next) {
      onValueChange(next.value);
      list.current?.querySelector<HTMLElement>(`[data-value="${next.value}"]`)?.focus();
    }
  };

  return (
    <div>
      <div
        aria-label={label}
        className={numbered === true ? "hx-ntabs" : "hx-tabs"}
        onKeyDown={onKeyDown}
        ref={list}
        role="tablist"
        tabIndex={-1}
      >
        {items.map((item, index) => (
          <button
            aria-controls={`${id}-panel`}
            aria-selected={item.value === value}
            className={numbered === true ? "hx-ntab" : "hx-tab"}
            data-value={item.value}
            id={`${id}-${item.value}`}
            key={item.value}
            onClick={() => {
              onValueChange(item.value);
            }}
            role="tab"
            tabIndex={item.value === value ? 0 : -1}
            type="button"
          >
            {numbered === true ? (
              <span className="hx-ntab-index">{String(index + 1).padStart(2, "0")}</span>
            ) : null}
            {item.label}
            {item.count === undefined ? null : <span className="hx-tab-count">{item.count}</span>}
          </button>
        ))}
      </div>
      <div aria-labelledby={`${id}-${value}`} id={`${id}-panel`} role="tabpanel">
        {children}
      </div>
    </div>
  );
};

interface CrumbsProps {
  path: string[];
  onNavigate?: (index: number) => void;
}

/** A trail of path segments ending at the current page. */
export const Breadcrumb = ({ path, onNavigate }: CrumbsProps) => (
  <nav aria-label="Breadcrumb">
    <ol className="hx-crumbs hx-code">
      {path.map((segment, index) => (
        <li className="hx-row hx-gap-2" key={segment}>
          {index > 0 ? (
            <span aria-hidden className="hx-crumb-sep">
              /
            </span>
          ) : null}
          {index === path.length - 1 ? (
            <span aria-current="page" className="hx-ink-1">
              {segment}
            </span>
          ) : (
            <button onClick={() => onNavigate?.(index)} type="button">
              {segment}
            </button>
          )}
        </li>
      ))}
    </ol>
  </nav>
);

interface PaginationProps {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
}

const windowed = (page: number, pages: number) => {
  const wanted = new Set([1, pages, page - 1, page, page + 1]);

  return [...wanted].filter((value) => value >= 1 && value <= pages).toSorted((a, b) => a - b);
};

/** Previous, numbered pages with gaps, and next. */
export const Pagination = ({ page, pages, onPageChange }: PaginationProps) => {
  const shown = windowed(page, pages);

  return (
    <nav aria-label="Pages" className="hx-pages">
      <button
        className="hx-page-btn hx-label-sm"
        disabled={page === 1}
        onClick={() => {
          onPageChange(page - 1);
        }}
        type="button"
      >
        Prev
      </button>
      {shown.map((value, index) => (
        <span className="hx-row hx-gap-1" key={value}>
          {index > 0 && value - (shown[index - 1] ?? value) > 1 ? (
            <span aria-hidden className="hx-code-sm hx-ink-3">
              ..
            </span>
          ) : null}
          <button
            aria-current={value === page ? "page" : undefined}
            aria-label={`Page ${value}`}
            className="hx-page-btn"
            onClick={() => {
              onPageChange(value);
            }}
            type="button"
          >
            {String(value).padStart(2, "0")}
          </button>
        </span>
      ))}
      <button
        className="hx-page-btn hx-label-sm"
        disabled={page === pages}
        onClick={() => {
          onPageChange(page + 1);
        }}
        type="button"
      >
        Next
      </button>
    </nav>
  );
};
