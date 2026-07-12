"use client";

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Ref,
} from "react";
import { isRemoteContentComponent } from "@/lib/content/content-schema";

import type { ContentComponentSummary, DefaultSize } from "@/lib/content/content-schema";
import { MediaReveal } from "@/components/media-reveal";
import { ResponsiveAside } from "./aside";

const WIDTH_BY_SIZE = { sm: 360, md: 720, full: 1392 } as const satisfies Record<
  DefaultSize,
  number
>;

const KEY_DELTA: Record<string, 1 | -1> = {
  ArrowDown: 1,
  j: 1,
  ArrowUp: -1,
  k: -1,
};

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
  const [prevInitialSlug, setPrevInitialSlug] = useState(initialSlug);

  if (prevInitialSlug !== initialSlug) {
    setPrevInitialSlug(initialSlug);
    setActiveIndex(initialIndex);
  }

  useLayoutEffect(() => {
    const container = containerRef.current;
    const target = itemRefs.current[initialIndex];
    if (!container || !target) return;
    container.scrollTop = target.offsetTop;
  }, [initialIndex]);

  // The active item is found by observation rather than by reading scrollTop on every
  // scroll frame — those reads force layout, on the one interaction that has to stay
  // smooth. Items are full-height snap panes, so at a 0.6 threshold exactly one can
  // ever be intersecting.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = itemRefs.current.findIndex((item) => item === entry.target);
          if (index === -1) continue;
          setActiveIndex((prev) => (prev === index ? prev : index));
        }
      },
      { root: container, threshold: 0.6 },
    );

    for (const item of itemRefs.current) {
      if (item) observer.observe(item);
    }
    return () => observer.disconnect();
  }, [feed.length]);

  const activeSlug = feed[activeIndex]?.slug;
  useEffect(() => {
    if (!activeSlug) return;
    const path = `/ui/${activeSlug}`;
    if (window.location.pathname !== path) {
      window.history.replaceState(null, "", path);
    }
  }, [activeSlug]);

  const scrollToIndex = useCallback((idx: number) => {
    const container = containerRef.current;
    const target = itemRefs.current[idx];
    if (!container || !target) return;
    container.scrollTo({ top: target.offsetTop, behavior: "smooth" });
  }, []);

  const scrollByDelta = useCallback(
    (delta: 1 | -1) => {
      const container = containerRef.current;
      if (!container) return;
      const itemHeight = container.clientHeight;
      if (itemHeight === 0) return;
      const currentIdx = Math.round(container.scrollTop / itemHeight);
      const next = currentIdx + delta;
      if (next < 0 || next >= feed.length) return;
      scrollToIndex(next);
    },
    [feed.length, scrollToIndex],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }

      const delta = KEY_DELTA[e.key];
      if (!delta) return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;

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
  if (!active) return null;

  return (
    <>
      <div
        ref={containerRef}
        id="content-feed"
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
      {/* Scroll the deep-linked item into place while the static HTML is
          parsing, before first paint — otherwise the page flashes item 0
          until hydration runs the layout effect above. The script is wrapped
          in a hidden div via dangerouslySetInnerHTML because React never
          executes <script> elements it renders on the client (and warns about
          them); the browser's HTML parser executes this one on initial load,
          and client-side navigations are handled by the layout effect. */}
      <div
        hidden
        dangerouslySetInnerHTML={{
          __html: `<script>(function(){var c=document.getElementById("content-feed");if(!c)return;var t=c.querySelector('[data-slug=${JSON.stringify(initialSlug)}]');if(t)c.scrollTop=t.offsetTop;})();</script>`,
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

type FeedItemProps = {
  ref?: Ref<HTMLElement>;
  component: ContentComponentSummary;
  shouldRender: boolean;
  keepMounted: boolean;
};

const FeedItem = memo(function FeedItem({
  ref,
  component,
  shouldRender,
  keepMounted,
}: FeedItemProps) {
  // Latch once an iframe has rendered so scrolling away one extra item
  // (shouldRender false, keepMounted true) doesn't unload it — otherwise
  // scrolling back would reload the preview from scratch.
  const [everRendered, setEverRendered] = useState(shouldRender);
  if (shouldRender && !everRendered) setEverRendered(true);
  const mountIframe = shouldRender || (everRendered && keepMounted);

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
        <MediaReveal
          className="h-full w-full"
          iframe={mountIframe ? { src, title: component.name } : undefined}
        />
      </div>
    </section>
  );
});
