"use client";

import { useEffect, useState } from "react";

import { Actions } from "./catalog/actions";
import { Ai } from "./catalog/ai";
import { Data } from "./catalog/data";
import { Display } from "./catalog/display";
import { Feedback } from "./catalog/feedback";
import { Inputs } from "./catalog/inputs";
import { Navigation } from "./catalog/navigation";
import { Overlays } from "./catalog/overlays";
import { Selection } from "./catalog/selection";
import { Part, Sub } from "./chrome";
import { Segmented } from "./components/segmented";
import { ToastProvider } from "./components/toast";
import { AntiSlop } from "./foundations/anti-slop";
import { ColorFoundation } from "./foundations/color";
import { ElevationFoundation } from "./foundations/elevation";
import { IconFoundation } from "./foundations/icons";
import { BordersFoundation, RadiusFoundation, SpaceFoundation } from "./foundations/layout";
import { MotionFoundation } from "./foundations/motion";
import { TypeFoundation } from "./foundations/type";
import { ThemeContext } from "./lib/theme";
import type { Theme } from "./lib/theme";
import { DocsScreen } from "./screens/docs";
import { NotesScreen } from "./screens/notes";
import { RoutingScreen } from "./screens/routing";
import { TriageScreen } from "./screens/triage";
import { CATEGORIES, FOUNDATIONS, SCREENS, system } from "./system";

const COMPONENT_COUNT = CATEGORIES.reduce((sum, category) => sum + category.components.length, 0);

const THEMES = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
] as const;

const CATALOG = {
  "c-actions": Actions,
  "c-ai": Ai,
  "c-data": Data,
  "c-display": Display,
  "c-feedback": Feedback,
  "c-inputs": Inputs,
  "c-navigation": Navigation,
  "c-overlays": Overlays,
  "c-selection": Selection,
} as const;

const FOUNDATION_BODY = {
  "f-color": {
    body: ColorFoundation,
    note: "Iron-gall ink thinned to eight strengths on a warm sheet; the three hues are kept for verdicts.",
  },
  "f-elevation": {
    body: ElevationFoundation,
    note: "Four levels told apart by surface and a hairline ring. Nothing on the page casts a shadow.",
  },
  "f-icons": {
    body: IconFoundation,
    note: "Lucide line icons at a 1.75 stroke, used where a shape is quicker than a word.",
  },
  "f-lines": {
    body: BordersFoundation,
    note: "All lines are 1px of ink at one of five strengths; only focus is drawn at 2px.",
  },
  "f-motion": {
    body: MotionFoundation,
    note: "Short, decelerating and final. Press any replay to see a move again.",
  },
  "f-radius": {
    body: RadiusFoundation,
    note: "Six radii, each tied to a kind of object rather than a size.",
  },
  "f-slop": {
    body: AntiSlop,
    note: "Eight reflexes of machine-made interfaces, each drawn as it usually appears and as Vellum draws it.",
  },
  "f-space": {
    body: SpaceFoundation,
    note: "Steps of four, with controls and rows sized for dense working screens.",
  },
  "f-type": {
    body: TypeFoundation,
    note: "Ten roles in a single sans, plus a mono for the strings people copy.",
  },
} as const;

const SCREEN_BODY = {
  "s-docs": {
    body: DocsScreen,
    note: "A question put to the API docs: thinking folded, two tool rows, an answer with numbered sources. Follow it up, stop it, or ask again.",
  },
  "s-notes": {
    body: NotesScreen,
    note: "A meeting agent's notes at phone width: what the crit settled, who owes what, and an item added by voice.",
  },
  "s-routing": {
    body: RoutingScreen,
    note: "A live router sending easy turns to the small model: graded each night against the big one, regressions first, and what it saves per thousand turns.",
  },
  "s-triage": {
    body: TriageScreen,
    note: "A support agent holds a 38-customer reply until someone reads it, leaves a receipt with a minute to undo, and keeps to its rules.",
  },
} as const;

const NAV = [
  { items: [{ id: "top", title: "Introduction" }, ...SCREENS], title: "In use" },
  { items: FOUNDATIONS, title: "Foundations" },
  { items: CATEGORIES, title: "Components" },
] as const;

const Mark = () => (
  <svg aria-hidden fill="none" viewBox="0 0 22 22">
    <rect fill="var(--shell)" height="22" rx="7" width="22" />
    <rect
      fill="var(--paper)"
      height="16"
      rx="4.5"
      stroke="var(--line-faint)"
      width="16"
      x="3"
      y="3"
    />
    <rect fill="var(--ink-80)" height="1.5" rx="0.75" width="10" x="6" y="8" />
    <rect fill="var(--ink-45)" height="1.5" rx="0.75" width="7" x="6" y="11.5" />
  </svg>
);

const useScrollSpy = (ids: readonly string[]) => {
  const [current, setCurrent] = useState(ids[0] ?? "");

  useEffect(() => {
    const seen = new Map<string, boolean>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          seen.set(entry.target.id, entry.isIntersecting);
        }

        const first = ids.find((id) => seen.get(id));

        if (first !== undefined && first !== "") {
          setCurrent(first);
        }
      },
      { rootMargin: "-10% 0px -70% 0px" },
    );

    for (const id of ids) {
      const element = document.querySelector(`#${id}`);

      if (element) {
        observer.observe(element);
      }
    }

    return () => {
      observer.disconnect();
    };
  }, [ids]);

  return current;
};

const SPY_IDS = NAV.flatMap((group) => group.items.map((item) => item.id));

/** The Vellum showcase: demo screens, foundations and components, drawn in Vellum. */
export const DesignSystem = () => {
  const [theme, setTheme] = useState<Theme>("light");
  const current = useScrollSpy(SPY_IDS);

  return (
    <ThemeContext.Provider value={theme}>
      <div className="ds-vellum v-root" data-theme={theme}>
        <ToastProvider>
          <div className="v-page">
            <nav aria-label="Vellum" className="v-nav">
              {NAV.map((group) => (
                <div className="v-nav-group" key={group.title}>
                  <p>{group.title}</p>
                  {group.items.map((item) => (
                    <a
                      aria-current={current === item.id ? "true" : undefined}
                      href={`#${item.id}`}
                      key={item.id}
                    >
                      {item.title}
                    </a>
                  ))}
                </div>
              ))}
            </nav>
            <main className="v-main">
              <header className="v-head" id="top">
                <div className="v-head-top">
                  <span className="v-wordmark">
                    <Mark />
                    <h1 className="v-title">{system.name}</h1>
                  </span>
                  <Segmented
                    label="Theme"
                    onValueChange={setTheme}
                    options={THEMES}
                    size="sm"
                    value={theme}
                  />
                </div>
                <p className="v-tagline">{system.tagline}</p>
                <p className="v-counts">
                  <span>
                    <b>{COMPONENT_COUNT}</b> components
                  </span>
                  <span>
                    <b>{FOUNDATIONS.length}</b> foundations
                  </span>
                  <span>
                    <b>{SCREENS.length}</b> screens
                  </span>
                  <span>One glass action per group</span>
                </p>
              </header>

              <Part
                id="in-use"
                lede="Four working screens assembled from nothing but the components further down: meeting notes, a support agent asking before a wide reply, an answer from the docs and a live model router graded every night."
                title="In use"
              >
                {SCREENS.map((screen) => {
                  const { body: Body, note } = SCREEN_BODY[screen.id];

                  return (
                    <Sub id={screen.id} key={screen.id} note={note} title={screen.title}>
                      <div className="v-stage v-screen">
                        <Body />
                      </div>
                    </Sub>
                  );
                })}
              </Part>

              <Part
                id="foundations"
                lede="Every value the components read, shown the way they are used. The values printed follow the theme switch above."
                title="Foundations"
              >
                {FOUNDATIONS.map((foundation) => {
                  const { body: Body, note } = FOUNDATION_BODY[foundation.id];

                  return (
                    <Sub
                      id={foundation.id}
                      key={foundation.id}
                      note={note}
                      title={foundation.title}
                    >
                      <Body />
                    </Sub>
                  );
                })}
              </Part>

              <Part
                id="components"
                lede="Live specimens, grouped the way you reach for them. Every one takes a keyboard, and every overlay closes on Escape."
                title="Components"
              >
                {CATEGORIES.map((category) => {
                  const Body = CATALOG[category.id];

                  return (
                    <Sub
                      id={category.id}
                      key={category.id}
                      note={category.components.join(", ")}
                      title={category.title}
                    >
                      <div className="v-specimens">
                        <Body />
                      </div>
                    </Sub>
                  );
                })}
              </Part>

              <footer className="v-foot">
                Vellum is an original system modeled on the character of Glaze from design.how:
                compact ink on paper for AI products. Names, palette, copy and data here are its
                own.
              </footer>
            </main>
          </div>
        </ToastProvider>
      </div>
    </ThemeContext.Provider>
  );
};
