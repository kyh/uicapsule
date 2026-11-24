"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CopyIcon,
  ExternalLinkIcon,
  MonitorIcon,
  MoonIcon,
  PanelLeftIcon,
  PanelRightIcon,
  RotateCwIcon,
  SmartphoneIcon,
  SquareTerminalIcon,
  SunIcon,
  TabletIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Switch } from "@repo/ui/components/switch";
import { cn } from "cn";

import type { ContentComponentSummary, DefaultSize } from "@/lib/content/content-schema";
import { siteConfig } from "@/lib/site-config";
import { ComponentNav, groupComponents } from "./component-nav";
import { InfoPanel, useCopyInstall } from "./info-panel";
import { PanelHandle } from "./panel-handle";
import { panelLayoutScript, usePanelLayout } from "./panel-layout";
import { PREVIEW_WIDTH, PreviewStage } from "./preview-stage";
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

const slugFromPath = (pathname: string) =>
  /^\/ui\/(?<slug>[^/]+)\/?$/u.exec(pathname)?.groups?.slug;

const Divider = () => <span aria-hidden className="bg-border mx-1 h-4 w-px" />;

const CopyInstallButton = ({ slug }: { slug: string }) => {
  const { copy } = useCopyInstall(slug);

  return (
    <ToolbarButton label="Copy install command" onClick={copy}>
      <CopyIcon />
    </ToolbarButton>
  );
};

const ThemeButton = () => {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <ToolbarButton
      label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <MoonIcon className="dark:hidden" />
      <SunIcon className="hidden dark:block" />
    </ToolbarButton>
  );
};

interface ComponentWorkspaceProps {
  initialSlug: string;
  feed: ContentComponentSummary[];
}

export const ComponentWorkspace = ({ initialSlug, feed }: ComponentWorkspaceProps) => {
  const { layout, ref, setPanel, togglePanel } = usePanelLayout();
  const [dragging, setDragging] = useState(false);
  const [activeSlug, setActiveSlug] = useState(initialSlug);
  const [prevInitialSlug, setPrevInitialSlug] = useState(initialSlug);
  const [inspect, setInspect] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [widths, setWidths] = useState<Record<string, number>>({});

  if (prevInitialSlug !== initialSlug) {
    setPrevInitialSlug(initialSlug);
    setActiveSlug(initialSlug);
  }

  const ordered = useMemo(() => groupComponents(feed).flatMap((group) => group.items), [feed]);

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

      if (slug) {
        setActiveSlug(slug);
      }
    };

    window.addEventListener("popstate", onPopState);

    return () => window.removeEventListener("popstate", onPopState);
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

    return () => window.removeEventListener("keydown", onKey);
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
  const previewHref = active.type === "remote" ? active.iframeUrl : `/preview-frame/${active.slug}`;

  return (
    <>
      <div
        ref={ref}
        id={WORKSPACE_ID}
        data-dragging={dragging || undefined}
        className={cn(
          "flex flex-col border-t [--code-h:280px] [--info-w:340px] [--nav-w:232px] md:grid md:h-[calc(100dvh-(--spacing(16)))] md:grid-cols-[var(--nav-w)_minmax(0,1fr)_var(--info-w)] md:grid-rows-[minmax(0,1fr)] md:overflow-hidden",
          "data-dragging:select-none data-dragging:[&_iframe]:pointer-events-none",
        )}
      >
        <aside aria-label="Component list" className="relative hidden min-w-0 md:block">
          <div inert={!layout.nav.open} className="h-full overflow-hidden border-r">
            <div className="h-full w-(--nav-w)">
              <ComponentNav feed={feed} activeSlug={active.slug} onSelect={select} />
            </div>
          </div>
          <PanelHandle
            panel="nav"
            state={layout.nav}
            onChange={setPanel}
            onDraggingChange={setDragging}
            className="-right-1"
          />
        </aside>

        <div className="flex min-w-0 flex-col max-md:contents md:min-h-0">
          <div className="flex h-12 shrink-0 items-center gap-1 overflow-x-auto px-2 [scrollbar-width:none] md:px-3">
            <ToolbarButton
              label={layout.nav.open ? "Hide component list" : "Show component list"}
              pressed={layout.nav.open}
              className="max-md:hidden"
              onClick={() => togglePanel("nav")}
            >
              <PanelLeftIcon />
            </ToolbarButton>
            <label
              htmlFor="inspect-toggle"
              className={cn(
                "text-muted-foreground flex h-7 shrink-0 items-center gap-2 rounded-md px-2 text-sm",
                active.type === "remote" && "opacity-50",
              )}
            >
              <Switch
                id="inspect-toggle"
                checked={inspect}
                disabled={active.type === "remote"}
                onCheckedChange={setInspect}
              />
              Inspect
            </label>
            <div className="ml-auto flex shrink-0 items-center gap-0.5">
              <div className="flex items-center gap-0.5 max-md:hidden">
                {WIDTH_PRESETS.map(({ size, label, Icon }) => (
                  <ToolbarButton
                    key={size}
                    label={label}
                    pressed={preset === size}
                    onClick={() => onWidthChange(PREVIEW_WIDTH[size])}
                  >
                    <Icon />
                  </ToolbarButton>
                ))}
                <Divider />
              </div>
              {active.type === "local" && <CopyInstallButton slug={active.slug} />}
              <ToolbarButton
                label={prev ? `Previous: ${prev.name}` : "Previous"}
                disabled={!prev}
                onClick={() => prev && select(prev.slug)}
              >
                <ArrowLeftIcon />
              </ToolbarButton>
              <ToolbarButton
                label={next ? `Next: ${next.name}` : "Next"}
                disabled={!next}
                onClick={() => next && select(next.slug)}
              >
                <ArrowRightIcon />
              </ToolbarButton>
              <ToolbarButton
                label={layout.code.open ? "Hide code" : "Show code"}
                pressed={layout.code.open}
                onClick={() => togglePanel("code")}
              >
                <SquareTerminalIcon />
              </ToolbarButton>
              <ToolbarButton label="Reload preview" onClick={() => setReloadKey((k) => k + 1)}>
                <RotateCwIcon />
              </ToolbarButton>
              <ToolbarButton
                label="Open preview in new tab"
                nativeButton={false}
                render={
                  // oxlint-disable-next-line jsx-a11y/control-has-associated-label -- Base UI render prop; the Button's children become the anchor's content
                  <a href={previewHref} target="_blank" rel="noreferrer" />
                }
              >
                <ExternalLinkIcon />
              </ToolbarButton>
              <ThemeButton />
              <Divider />
              <ToolbarButton
                label={layout.info.open ? "Hide details" : "Show details"}
                pressed={layout.info.open}
                onClick={() => togglePanel("info")}
              >
                <PanelRightIcon />
              </ToolbarButton>
            </div>
          </div>

          <div className="h-[70dvh] shrink-0 md:h-auto md:min-h-0 md:flex-1">
            <PreviewStage
              component={active}
              inspect={inspect}
              reloadKey={reloadKey}
              width={width}
              onWidthChange={onWidthChange}
            />
          </div>

          <div
            className={cn(
              "relative shrink-0 max-md:order-last md:h-(--code-h) md:max-h-[calc(100%-(--spacing(40)))]",
              layout.code.open ? "h-[60dvh] border-t" : "max-md:hidden",
            )}
          >
            <PanelHandle
              panel="code"
              state={layout.code}
              onChange={setPanel}
              onDraggingChange={setDragging}
              className="-top-1"
            />
            {layout.code.open && (
              <div className="h-full overflow-hidden">
                <CodeDock component={active} onClose={() => setPanel("code", { open: false })} />
              </div>
            )}
          </div>
        </div>

        <aside
          aria-label="Component details"
          className={cn(
            "relative min-w-0 border-t md:border-t-0",
            !layout.info.open && "max-md:hidden",
          )}
        >
          <div inert={!layout.info.open} className="h-full overflow-hidden md:border-l">
            <div className="h-full overflow-y-auto md:w-(--info-w)">
              <InfoPanel key={active.slug} component={active} />
            </div>
          </div>
          <PanelHandle
            panel="info"
            state={layout.info}
            onChange={setPanel}
            onDraggingChange={setDragging}
            className="-left-1"
          />
        </aside>
      </div>
      <div
        hidden
        // oxlint-disable-next-line react/no-danger -- inline script must run during HTML parsing so stored panel sizes apply before first paint
        dangerouslySetInnerHTML={{ __html: `<script>${panelLayoutScript(WORKSPACE_ID)}</script>` }}
      />
    </>
  );
};
