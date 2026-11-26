"use client";

import { useEffect, useId, useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { Boxes, ChevronDown, Layers, PanelsTopLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Icon } from "./components/icon";
import { Breadcrumb } from "./components/navigation";
import { ToastProvider } from "./components/toast";
import { FOUNDATIONS } from "./foundations";
import { cssVars } from "./lib/css";
import { AppearanceContext } from "./lib/theme";
import type { Theme } from "./lib/theme";
import { ApiKeys } from "./screens/api-keys";
import { ModelSwap } from "./screens/model-swap";
import { RepoHome } from "./screens/repo-home";
import { RunTraceScreen } from "./screens/run-trace";
import { CATEGORIES, COMPONENT_COUNT } from "./specimens";
import { system } from "./system";

interface Entry {
  id: string;
  title: string;
}

interface Screen extends Entry {
  Component: ComponentType;
}

const SCREENS = [
  { Component: RepoHome, id: "screen-repo", title: "Repo overview" },
  { Component: RunTraceScreen, id: "screen-trace", title: "Run trace" },
  { Component: ModelSwap, id: "screen-swap", title: "Model swap" },
  { Component: ApiKeys, id: "screen-keys", title: "Deploy keys" },
] as const satisfies readonly Screen[];

export type ScreenId = (typeof SCREENS)[number]["id"];

export type Density = "compact" | "regular" | "comfortable";

interface Part {
  id: string;
  title: string;
  icon: LucideIcon;
  entries: readonly Entry[];
}

const featureFirst = (featured: ScreenId) => [
  ...SCREENS.filter((screen) => screen.id === featured),
  ...SCREENS.filter((screen) => screen.id !== featured),
];

const partsFor = (screens: readonly Screen[]) =>
  [
    { entries: screens, icon: PanelsTopLeft, id: "in-use", title: "In use" },
    { entries: FOUNDATIONS, icon: Layers, id: "foundations", title: "Foundations" },
    { entries: CATEGORIES, icon: Boxes, id: "components", title: "Components" },
  ] as const satisfies readonly Part[];

type Parts = ReturnType<typeof partsFor>;

const HEAD_ROOM = 0.35;

interface Place {
  part: string;
  entry: string | null;
}

const locate = (parts: Parts) => {
  const line = window.innerHeight * HEAD_ROOM;
  let place: Place = { entry: null, part: parts[0].id };

  for (const part of parts) {
    const node = document.querySelector(`#${part.id}`);

    if (node && node.getBoundingClientRect().top <= line) {
      place = { entry: null, part: part.id };

      for (const entry of part.entries) {
        const child = document.querySelector(`#${entry.id}`);

        if (child && child.getBoundingClientRect().top <= line) {
          place = { entry: entry.id, part: part.id };
        }
      }
    }
  }

  return place;
};

const usePlace = (parts: Parts) => {
  const [place, setPlace] = useState<Place>({ entry: null, part: parts[0].id });

  useEffect(() => {
    let frame = 0;

    const update = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const next = locate(parts);

        setPlace((current) =>
          current.part === next.part && current.entry === next.entry ? current : next,
        );
      });
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [parts]);

  return place;
};

const Contour = () => (
  <svg aria-hidden className="fj-contour" viewBox="0 0 320 200">
    <path d="M0 150 C40 140 70 96 112 98 S170 150 214 132 S280 70 320 74" />
    <path d="M0 166 C44 158 74 118 114 120 S172 166 216 150 S282 94 320 98" />
    <path d="M0 182 C48 176 78 140 116 142 S174 182 218 168 S284 118 320 122" />
    <path d="M0 198 C52 194 82 162 118 164 S176 198 220 186 S286 142 320 146" />
    <path d="M150 0 C150 30 170 52 214 58 S300 40 320 20" />
    <path d="M176 0 C178 22 196 38 230 42 S302 28 320 12" />
  </svg>
);

interface PageSectionProps {
  part: Part;
  lede: string;
  children: ReactNode;
}

const PageSection = ({ part, lede, children }: PageSectionProps) => (
  <section aria-labelledby={`${part.id}-title`} className="fj-section" id={part.id}>
    <header className="fj-section-head">
      <h2 className="fj-t-title" id={`${part.id}-title`}>
        {part.title}
      </h2>
      <p className="fj-t-body-lg fj-c-2">{lede}</p>
    </header>
    {children}
  </section>
);

interface DesignSystemProps {
  theme: Theme;
  focusHue: number;
  radiusScale: number;
  typeScale: number;
  density: Density;
  reducedMotion: boolean;
  featuredScreen: ScreenId;
}

/** The Fjord showcase page; every prop drives a token on the `.ds-fjord` root. */
export const DesignSystem = ({
  theme,
  focusHue,
  radiusScale,
  typeScale,
  density,
  reducedMotion,
  featuredScreen,
}: DesignSystemProps) => {
  const screens = useMemo(() => featureFirst(featuredScreen), [featuredScreen]);
  const parts = useMemo(() => partsFor(screens), [screens]);

  const appearance = useMemo(
    () => ({ focusHue, reducedMotion, theme }),
    [focusHue, reducedMotion, theme],
  );

  const place = usePlace(parts);
  const jumpId = useId();
  const part = parts.find((entry) => entry.id === place.part) ?? parts[0];
  const here = part.entries.find((entry) => entry.id === place.entry);

  return (
    <AppearanceContext.Provider value={appearance}>
      <div
        className="ds-fjord fj-page"
        data-density={density}
        data-motion={reducedMotion ? "reduced" : "full"}
        data-theme={theme}
        style={cssVars({
          "--fj-focus-hue": focusHue,
          "--fj-radius-scale": radiusScale,
          "--fj-type-scale": typeScale,
        })}
      >
        <ToastProvider>
          <div className="fj-shell">
            <nav aria-label="Parts of the page" className="fj-rail">
              <a aria-label={`${system.name}, top of page`} className="fj-rail-mark" href="#top">
                <svg aria-hidden viewBox="0 0 24 24">
                  <path d="M3 17c3-1 4-7 7-7s3 6 5 6 3-4 6-4" />
                  <path d="M3 21c3-1 4-5 7-5s3 4 5 4 3-3 6-3" />
                </svg>
              </a>
              <ul>
                {parts.map((entry) => (
                  <li key={entry.id}>
                    <a
                      aria-current={entry.id === place.part ? "location" : undefined}
                      aria-label={entry.title}
                      className="fj-rail-link"
                      href={`#${entry.id}`}
                    >
                      <Icon icon={entry.icon} size={20} />
                      <span aria-hidden className="fj-rail-tip">
                        {entry.title}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="fj-main">
              <div className="fj-crumbbar">
                <Breadcrumb
                  items={[
                    "Kestrel",
                    { href: "#top", label: system.name },
                    { href: `#${part.id}`, label: part.title },
                    ...(here ? [here.title] : []),
                  ]}
                  label="You are here"
                />
                <div className="fj-crumbbar-tools">
                  <label className="fj-sr" htmlFor={jumpId}>
                    Jump to
                  </label>
                  <div className="fj-select-wrap fj-jump">
                    <select
                      className="fj-input fj-select"
                      data-size="sm"
                      id={jumpId}
                      onChange={(event) => {
                        document
                          .querySelector(`#${event.target.value}`)
                          ?.scrollIntoView({ block: "start" });
                      }}
                      value={place.entry ?? place.part}
                    >
                      {parts.map((entry) => (
                        <optgroup key={entry.id} label={entry.title}>
                          <option value={entry.id}>{entry.title}, overview</option>
                          {entry.entries.map((child) => (
                            <option key={child.id} value={child.id}>
                              {child.title}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <Icon icon={ChevronDown} size={12} />
                  </div>
                </div>
              </div>

              <main className="fj-container" id="top">
                <div className="fj-hero">
                  <div className="fj-hero-text">
                    <h1 className="fj-t-display">{system.name}</h1>
                    <p className="fj-t-body-lg fj-c-2 fj-hero-lede">{system.tagline}</p>
                  </div>
                  <Contour />
                  <p className="fj-hero-meta fj-t-body-sm fj-c-2">
                    <span className="fj-data fj-strong">{SCREENS.length}</span> product screens,{" "}
                    <span className="fj-data fj-strong">{FOUNDATIONS.length}</span> foundations and{" "}
                    <span className="fj-data fj-strong">{COMPONENT_COUNT}</span> live components, in
                    light and dark.
                  </p>
                </div>

                <PageSection
                  lede="Four screens from Kestrel, a team whose coding agents open most of its pull requests. Every part is a Fjord component and every screen runs: slots fill and empty, a trace forks and waits, a model swap closes its shadow window, a deploy key is minted and burned."
                  part={parts[0]}
                >
                  <div className="fj-screens">
                    {screens.map(({ Component, id }) => (
                      <Component key={id} />
                    ))}
                  </div>
                </PageSection>

                <PageSection
                  lede="What the screens stand on. Each choice names its token, gives a rule an id, and says why, so a reviewer can hold a pull request to it."
                  part={parts[1]}
                >
                  <div className="fj-foundations">
                    {FOUNDATIONS.map(({ Component, id }) => (
                      <Component key={id} />
                    ))}
                  </div>
                </PageSection>

                <PageSection
                  lede={`${COMPONENT_COUNT} components in ${CATEGORIES.length} groups. Each one is the real thing, so press it, type in it or tab through it.`}
                  part={parts[2]}
                >
                  <div className="fj-categories">
                    {CATEGORIES.map(({ Component, id }) => (
                      <Component key={id} />
                    ))}
                  </div>
                </PageSection>

                <footer className="fj-footer">
                  <p className="fj-t-body-sm fj-c-2">
                    Fjord is a uicapsule design system. Its page follows the outline of the system
                    pages on design.how: screens first, then foundations, then components.
                  </p>
                </footer>
              </main>
            </div>
          </div>
        </ToastProvider>
      </div>
    </AppearanceContext.Provider>
  );
};
