"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ExternalLinkIcon,
  MonitorIcon,
  PanelLeftIcon,
  PanelRightIcon,
  SmartphoneIcon,
  SquareDashedMousePointerIcon,
  SquareTerminalIcon,
  TabletIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Tabs, TabsIndicator, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { useMediaQuery } from "@repo/ui/hooks/use-media-query";
import { cn } from "cn";

import { contentElements } from "@/lib/content/content-categories";
import type { ContentComponentSummary, DefaultSize } from "@/lib/content/content-schema";
import { previewFrameSrc } from "@/lib/preview-protocol";
import { siteConfig } from "@/lib/site-config";
import { InfoPanel } from "./info-panel";
import { MobileSheet } from "./mobile-sheet";
import { PanelHandle } from "./panel-handle";
import { panelLayoutScript, usePanelLayout } from "./panel-layout";
import type { PanelId } from "./panel-layout";
import { PREVIEW_WIDTH, PreviewStage } from "./preview-stage";
import { PropsPanel } from "./props-panel";
import { ToolbarButton } from "./toolbar-button";

const CodeDock = dynamic(async () => {
  const mod = await import("./code-dock");

  return mod.CodeDock;
});

const WORKSPACE_ID = "component-workspace";

const WIDTH_PRESETS: { size: DefaultSize; label: string; Icon: LucideIcon }[] = [
  { Icon: SmartphoneIcon, label: "Phone width", size: "sm" },
  { Icon: TabletIcon, label: "Tablet width", size: "md" },
  { Icon: MonitorIcon, label: "Full width", size: "full" },
];

const KEY_DELTA = new Map<string, 1 | -1>([
  ["j", 1],
  ["k", -1],
]);

const orderComponents = (components: ContentComponentSummary[]) =>
  contentElements.flatMap((element) =>
    components
      .filter((c) => c.tags.includes(element.slug))
      .toSorted((a, b) => a.name.localeCompare(b.name)),
  );

const slugFromPath = (pathname: string) =>
  /^\/ui\/(?<slug>[^/]+)\/?$/u.exec(pathname)?.groups?.slug;

const Divider = () => <span aria-hidden className="bg-border mx-1 h-4 w-px" />;

const DESKTOP_QUERY = "(min-width: 768px)";

const OPEN_IN_NEW_TAB = "Open in new tab";

const PANEL_EASE = "ease-[cubic-bezier(0.23,1,0.32,1)]";

interface ComponentWorkspaceProps {
  initialSlug: string;
  feed: ContentComponentSummary[];
}

export const ComponentWorkspace = ({ initialSlug, feed }: ComponentWorkspaceProps) => {
  const { layout, ref, setPanel, togglePanel } = usePanelLayout();
  const [codeMounted, setCodeMounted] = useState(layout.code.open);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const [dragging, setDragging] = useState(false);
  const [activeSlug, setActiveSlug] = useState(initialSlug);
  const [prevInitialSlug, setPrevInitialSlug] = useState(initialSlug);
  const [inspect, setInspect] = useState(false);
  const [widths, setWidths] = useState<Record<string, number>>({});
  const [mobilePanel, setMobilePanel] = useState<PanelId | null>(null);

  if (layout.code.open && !codeMounted) {
    setCodeMounted(true);
  }

  if (prevInitialSlug !== initialSlug) {
    setPrevInitialSlug(initialSlug);
    setActiveSlug(initialSlug);
  }

  const ordered = useMemo(() => orderComponents(feed), [feed]);

  const activeIndex = Math.max(
    0,
    ordered.findIndex((c) => c.slug === activeSlug),
  );

  const active = ordered[activeIndex];
  const prev = ordered[activeIndex - 1];
  const next = ordered[activeIndex + 1];

  const select = useCallback((slug: string) => {
    setActiveSlug(slug);
    setInspect(false);

    const path = `/ui/${slug}`;

    if (window.location.pathname !== path) {
      window.history.pushState(null, "", path);
    }
  }, []);

  useEffect(() => {
    if (active) {
      document.title = `${active.name} | ${siteConfig.name}`;
    }
  }, [active]);

  useEffect(() => {
    const onPopState = () => {
      const slug = slugFromPath(window.location.pathname);

      if (slug !== undefined && slug !== "") {
        setActiveSlug(slug);
      }
    };

    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const { target } = event;

      if (
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        (target instanceof HTMLElement &&
          (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable))
      ) {
        return;
      }

      const delta = KEY_DELTA.get(event.key);
      const destination = delta === undefined ? undefined : ordered[activeIndex + delta];

      if (!destination || document.querySelector('[role="dialog"], [role="alertdialog"]')) {
        return;
      }

      event.preventDefault();
      select(destination.slug);
    };

    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [activeIndex, ordered, select]);

  const onWidthChange = useCallback(
    (width: number) => {
      setWidths((previous) => ({ ...previous, [activeSlug]: width }));
    },
    [activeSlug],
  );

  if (!active) {
    return null;
  }

  const width = widths[active.slug] ?? PREVIEW_WIDTH[active.defaultSize ?? "full"];
  const preset = WIDTH_PRESETS.find((p) => PREVIEW_WIDTH[p.size] === width)?.size;
  const previewHref = active.type === "remote" ? active.iframeUrl : previewFrameSrc(active.slug);
  const isOpen = (panel: PanelId) => (isDesktop ? layout[panel].open : mobilePanel === panel);

  const toggle = (panel: PanelId) => {
    if (isDesktop) {
      togglePanel(panel);
    } else {
      setMobilePanel((current) => (current === panel ? null : panel));
    }
  };

  const infoOpen = isOpen("info");
  const propsOpen = isOpen("props");
  const codeOpen = isOpen("code");

  return (
    <>
      <div
        ref={ref}
        id={WORKSPACE_ID}
        suppressHydrationWarning
        data-dragging={dragging || undefined}
        className={cn(
          "flex h-[calc(100dvh-(--spacing(16)))] flex-col border-t [--code-h:0px] [--code-size:280px] [--info-size:340px] [--info-w:340px] [--props-size:280px] [--props-w:280px] md:grid md:grid-cols-[var(--info-w)_minmax(0,1fr)_var(--props-w)] md:grid-rows-[minmax(0,1fr)] md:overflow-hidden",
          "md:transition-[grid-template-columns] md:duration-300 motion-reduce:transition-none",
          PANEL_EASE,
          "data-dragging:select-none data-dragging:transition-none data-dragging:[&_*]:transition-none! data-dragging:[&_iframe]:pointer-events-none",
        )}
      >
        <aside aria-label="Component details" className="relative hidden min-w-0 md:block">
          <div inert={!layout.info.open} className="h-full overflow-hidden border-r">
            <div className="h-full w-(--info-size) overflow-y-auto">
              <InfoPanel key={active.slug} component={active} />
            </div>
          </div>
          <PanelHandle
            panel="info"
            state={layout.info}
            onChange={setPanel}
            onDraggingChange={setDragging}
            className="-right-1"
          />
        </aside>

        <div className="flex min-w-0 flex-col max-md:contents md:min-h-0">
          <div className="flex h-12 shrink-0 items-center gap-1 overflow-x-auto px-2 [scrollbar-width:none] md:grid md:grid-cols-[1fr_auto_1fr]">
            <div className="flex shrink-0 items-center gap-1">
              <ToolbarButton
                label={infoOpen ? "Hide details" : "Show details"}
                pressed={infoOpen}
                onClick={() => {
                  toggle("info");
                }}
              >
                <PanelLeftIcon />
              </ToolbarButton>
              <ToolbarButton
                label={inspect ? "Stop inspecting" : "Inspect elements"}
                pressed={inspect}
                disabled={active.type === "remote"}
                className="max-md:hidden"
                onClick={() => {
                  setInspect((on) => !on);
                }}
              >
                <SquareDashedMousePointerIcon />
              </ToolbarButton>
            </div>
            <Tabs
              value={preset ?? null}
              className="max-md:hidden"
              onValueChange={(size: DefaultSize) => {
                onWidthChange(PREVIEW_WIDTH[size]);
              }}
            >
              <TabsList
                aria-label="Preview width"
                className="relative h-7 gap-0.5 bg-transparent p-0"
              >
                <TabsIndicator className="bg-accent rounded-md shadow-none" />
                {WIDTH_PRESETS.map(({ size, label, Icon }) => (
                  <TabsTrigger
                    key={size}
                    value={size}
                    aria-label={label}
                    className="text-muted-foreground hover:text-foreground data-active:text-foreground relative size-7 flex-none rounded-md border-0 p-0"
                  >
                    <Icon className="size-4" />
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="ml-auto flex shrink-0 items-center gap-0.5 md:justify-self-end">
              <ToolbarButton
                label={prev ? `Previous: ${prev.name}` : "Previous"}
                disabled={!prev}
                onClick={() => {
                  if (prev) {
                    select(prev.slug);
                  }
                }}
              >
                <ArrowLeftIcon />
              </ToolbarButton>
              <ToolbarButton
                label={next ? `Next: ${next.name}` : "Next"}
                disabled={!next}
                onClick={() => {
                  if (next) {
                    select(next.slug);
                  }
                }}
              >
                <ArrowRightIcon />
              </ToolbarButton>
              <ToolbarButton
                label={codeOpen ? "Hide code" : "Show code"}
                pressed={codeOpen}
                onClick={() => {
                  toggle("code");
                }}
              >
                <SquareTerminalIcon />
              </ToolbarButton>
              <ToolbarButton
                label={OPEN_IN_NEW_TAB}
                nativeButton={false}
                render={
                  <a
                    href={previewHref}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={OPEN_IN_NEW_TAB}
                  />
                }
              >
                <ExternalLinkIcon />
              </ToolbarButton>
              <Divider />
              <ToolbarButton
                label={propsOpen ? "Hide props" : "Show props"}
                pressed={propsOpen}
                onClick={() => {
                  toggle("props");
                }}
              >
                <PanelRightIcon />
              </ToolbarButton>
            </div>
          </div>

          <div className="min-h-0 flex-1">
            <PreviewStage
              component={active}
              inspect={inspect}
              width={width}
              onWidthChange={onWidthChange}
            />
          </div>

          <div
            className={cn(
              "relative shrink-0 max-md:hidden md:h-(--code-h) md:max-h-[calc(100dvh-(--spacing(56)))] md:border-t md:transition-[height] md:duration-300 motion-reduce:transition-none",
              PANEL_EASE,
            )}
          >
            <PanelHandle
              panel="code"
              state={layout.code}
              onChange={setPanel}
              onDraggingChange={setDragging}
              className="-top-1"
            />
            {codeMounted && (
              <div inert={!layout.code.open} className="h-full overflow-hidden">
                <div className="h-full md:h-(--code-size) md:max-h-[calc(100dvh-(--spacing(56)))]">
                  <CodeDock
                    component={active}
                    onClose={() => {
                      setPanel("code", { open: false });
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <aside aria-label="Props" className="relative hidden min-w-0 md:block">
          <div inert={!layout.props.open} className="h-full overflow-hidden border-l">
            <div className="h-full w-(--props-size) overflow-y-auto">
              <PropsPanel />
            </div>
          </div>
          <PanelHandle
            panel="props"
            state={layout.props}
            onChange={setPanel}
            onDraggingChange={setDragging}
            className="-left-1"
          />
        </aside>
      </div>
      <MobileSheet
        panel={isDesktop ? null : mobilePanel}
        active={active}
        onClose={() => {
          setMobilePanel(null);
        }}
      />
      <div
        hidden
        // oxlint-disable-next-line react/no-danger -- inline script must run during HTML parsing so stored panel sizes apply before first paint
        dangerouslySetInnerHTML={{ __html: `<script>${panelLayoutScript(WORKSPACE_ID)}</script>` }}
      />
    </>
  );
};
