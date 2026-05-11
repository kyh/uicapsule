"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type Ref,
} from "react";
import { isRemoteContentComponent } from "@repo/api/content/content-schema";

import type { ContentComponentSummary } from "@repo/api/content/content-schema";
import { ResponsiveAside } from "./aside";
import { WIDTH_BY_SIZE } from "./widths";

type ContentFeedProps = {
  initialSlug: string;
  feed: ContentComponentSummary[];
};

export const ContentFeed = ({ initialSlug, feed }: ContentFeedProps) => {
  const initialIndex = Math.max(
    0,
    feed.findIndex((c) => c.slug === initialSlug),
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    setActiveIndex(initialIndex);
  }, [initialIndex]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const target = itemRefs.current[initialIndex];
    if (!container || !target) return;
    container.scrollTop = target.offsetTop;
  }, [initialIndex]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const itemHeight = container.clientHeight;
        if (itemHeight === 0) return;
        const next = Math.round(container.scrollTop / itemHeight);
        const clamped = Math.max(0, Math.min(feed.length - 1, next));
        setActiveIndex((prev) => (prev === clamped ? prev : clamped));
      });
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [feed.length]);

  useEffect(() => {
    const active = feed[activeIndex];
    if (!active) return;
    const path = `/ui/${active.slug}`;
    if (window.location.pathname !== path) {
      window.history.replaceState(null, "", path);
    }
  }, [activeIndex, feed]);

  const scrollToIndex = useCallback((idx: number) => {
    const container = containerRef.current;
    const target = itemRefs.current[idx];
    if (!container || !target) return;
    container.scrollTo({ top: target.offsetTop, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) {
        return;
      }

      const delta =
        e.key === "ArrowDown" || e.key === "j"
          ? 1
          : e.key === "ArrowUp" || e.key === "k"
            ? -1
            : 0;
      if (!delta) return;

      const next = activeIndex + delta;
      if (next < 0 || next >= feed.length) return;
      e.preventDefault();
      scrollToIndex(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, feed.length, scrollToIndex]);

  const active = feed[activeIndex];
  if (!active) return null;

  return (
    <>
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-auto snap-y snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {feed.map((item, idx) => (
          <FeedItem
            key={item.slug}
            ref={(el) => {
              itemRefs.current[idx] = el;
            }}
            component={item}
            shouldRender={Math.abs(idx - activeIndex) <= 1}
          />
        ))}
      </div>
      <ResponsiveAside
        contentComponent={active}
        onPrev={activeIndex > 0 ? () => scrollToIndex(activeIndex - 1) : undefined}
        onNext={
          activeIndex < feed.length - 1 ? () => scrollToIndex(activeIndex + 1) : undefined
        }
      />
    </>
  );
};

type FeedItemProps = {
  ref?: Ref<HTMLElement>;
  component: ContentComponentSummary;
  shouldRender: boolean;
};

const FeedItem = ({ ref, component, shouldRender }: FeedItemProps) => {
  const src = isRemoteContentComponent(component)
    ? component.iframeUrl
    : `/preview-frame/${component.slug}`;

  const width = WIDTH_BY_SIZE[component.defaultSize ?? "md"];

  return (
    <section
      ref={ref}
      data-slug={component.slug}
      className="flex h-full snap-start snap-always items-center justify-center px-3 pb-2"
    >
      <div
        className="bg-background h-full w-full overflow-hidden rounded-md border"
        style={{ maxWidth: `${width}px` }}
      >
        {shouldRender ? (
          <iframe
            className="bg-background h-full w-full"
            title={component.name}
            src={src}
          />
        ) : (
          <div className="bg-muted h-full w-full animate-pulse" />
        )}
      </div>
    </section>
  );
};
