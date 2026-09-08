"use client";

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Ref } from "react";

import type { ContentComponentSummary, DefaultSize } from "@/lib/content/content-schema";
import { MediaReveal } from "@/components/media-reveal";
import { ResponsiveAside } from "./aside";

const WIDTH_BY_SIZE = { full: 1392, md: 720, sm: 360 } satisfies Record<DefaultSize, number>;

const KEY_DELTA = new Map<string, 1 | -1>([
  ["ArrowDown", 1],
  ["j", 1],
  ["ArrowUp", -1],
  ["k", -1],
]);

interface ContentFeedProps {
  initialSlug: string;
  feed: ContentComponentSummary[];
}

interface FeedItemProps {
  ref?: Ref<HTMLElement>;
  component: ContentComponentSummary;
  shouldRender: boolean;
  keepMounted: boolean;
}

const FeedItemBase = ({ ref, component, shouldRender, keepMounted }: FeedItemProps) => {
  // Keep visited neighbors mounted so scrolling back preserves preview state.
  const [everRendered, setEverRendered] = useState(shouldRender);
  if (shouldRender && !everRendered) {
    setEverRendered(true);
  }
  const mountIframe = shouldRender || (everRendered && keepMounted);

  const src =
    component.type === "remote" ? component.iframeUrl : `/preview-frame/${component.slug}`;

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
        <MediaReveal
          className="h-full w-full"
          iframe={mountIframe ? { src, title: component.name, type: component.type } : undefined}
        />
      </div>
    </section>
  );
};

const FeedItem = memo(FeedItemBase);

export const ContentFeed = ({ initialSlug, feed }: ContentFeedProps) => {
  const initialIndex = Math.max(
    0,
    feed.findIndex((c) => c.slug === initialSlug),
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [prevInitialSlug, setPrevInitialSlug] = useState(initialSlug);

  if (prevInitialSlug !== initialSlug) {
    setPrevInitialSlug(initialSlug);
    setActiveIndex(initialIndex);
  }

  useLayoutEffect(() => {
    const container = containerRef.current;
    const target = itemRefs.current[initialIndex];
    if (!container || !target) {
      return;
    }
    container.scrollTop = target.offsetTop;
  }, [initialIndex]);

  // Full-height snap panes ensure only one crosses the 0.6 threshold.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) {
            continue;
          }
          const index = itemRefs.current.indexOf(entry.target);
          if (index === -1) {
            continue;
          }
          setActiveIndex(index);
        }
      },
      { root: container, threshold: 0.6 },
    );

    for (const item of itemRefs.current.slice(0, feed.length)) {
      if (item) {
        observer.observe(item);
      }
    }
    return () => observer.disconnect();
  }, [feed.length]);

  const activeSlug = feed[activeIndex]?.slug;
  useEffect(() => {
    if (!activeSlug) {
      return;
    }
    const path = `/ui/${activeSlug}`;
    if (window.location.pathname !== path) {
      window.history.replaceState(null, "", path);
    }
  }, [activeSlug]);

  const scrollToIndex = useCallback((idx: number) => {
    const container = containerRef.current;
    const target = itemRefs.current[idx];
    if (!container || !target) {
      return;
    }
    container.scrollTo({ behavior: "smooth", top: target.offsetTop });
  }, []);

  const scrollByDelta = useCallback(
    (delta: 1 | -1) => {
      const container = containerRef.current;
      if (!container) {
        return;
      }
      const itemHeight = container.clientHeight;
      if (itemHeight === 0) {
        return;
      }
      const currentIdx = Math.round(container.scrollTop / itemHeight);
      const next = currentIdx + delta;
      if (next < 0 || next >= feed.length) {
        return;
      }
      scrollToIndex(next);
    },
    [feed.length, scrollToIndex],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { target } = e;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }

      const delta = KEY_DELTA.get(e.key);
      if (!delta) {
        return;
      }
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) {
        return;
      }

      e.preventDefault();
      scrollByDelta(delta);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scrollByDelta]);

  const itemRefSetters = useMemo(
    () =>
      Array.from({ length: feed.length }, (_, idx) => (el: HTMLElement | null) => {
        itemRefs.current[idx] = el;
      }),
    [feed.length],
  );

  const active = feed[activeIndex];
  if (!active) {
    return null;
  }

  return (
    <>
      <div
        ref={containerRef}
        id="content-feed"
        data-initial-slug={initialSlug}
        className="h-full w-full overflow-y-auto snap-y snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {feed.map((item, idx) => (
          <FeedItem
            key={item.slug}
            ref={itemRefSetters[idx]}
            component={item}
            shouldRender={Math.abs(idx - activeIndex) <= 1}
            keepMounted={Math.abs(idx - activeIndex) <= 2}
          />
        ))}
      </div>
      {/* Align deep links before first paint. HTML parsing runs this script;
          client navigation uses the layout effect because React-created scripts don't run. */}
      <div
        hidden
        // oxlint-disable-next-line react/no-danger -- inline script must run during HTML parsing; React-created scripts don't
        dangerouslySetInnerHTML={{
          __html:
            '<script>(function(){var c=document.getElementById("content-feed");if(!c)return;var s=c.getAttribute("data-initial-slug");var n=c.querySelectorAll("[data-slug]");for(var i=0;i<n.length;i++){if(n[i].getAttribute("data-slug")===s){c.scrollTop=n[i].offsetTop;return;}}})();</script>',
        }}
      />
      <ResponsiveAside
        contentComponent={active}
        onPrev={activeIndex > 0 ? () => scrollByDelta(-1) : undefined}
        onNext={activeIndex < feed.length - 1 ? () => scrollByDelta(1) : undefined}
      />
    </>
  );
};
