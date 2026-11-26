"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { Button } from "./components/button";
import { Icon } from "./components/icon";
import { Group, Section } from "./components/page";
import { StatusStrip, StripCell } from "./components/status-strip";
import { Kbd } from "./components/tag";
import { TypeText } from "./components/text-motion";
import { ToastProvider } from "./components/toast";
import { AntiSlop, RULES } from "./foundations/anti-slop";
import { ColorTable, LampRules } from "./foundations/color";
import { Iconography } from "./foundations/icons";
import { Borders, Elevation, LEVELS, Radius, Space, spaceLead } from "./foundations/layout";
import { Motion } from "./foundations/motion";
import { DENSITIES, SettingsContext, settingVars } from "./foundations/settings";
import type { Density, DensityScale, Lamp, Theme } from "./foundations/settings";
import { COLOR_GROUPS, CURVES, MOTION_TOKENS, TYPE_ROLES } from "./foundations/tokens";
import { TypeScale, Voices } from "./foundations/type";
import { cssVars } from "./lib/css-vars";
import { MotionContext } from "./lib/motion";
import { DriftScreen } from "./screens/drift-screen";
import { RunsScreen } from "./screens/runs-screen";
import { SpendScreen } from "./screens/spend-screen";
import { SyncScreen } from "./screens/sync-screen";
import { Actions } from "./specimens/actions";
import { COMPONENT_TOTAL, GROUP_TOTAL, countOf } from "./specimens/catalog";
import { Charts } from "./specimens/charts";
import { Code } from "./specimens/code";
import { Data } from "./specimens/data";
import { Display } from "./specimens/display";
import { Feedback } from "./specimens/feedback";
import { Inputs } from "./specimens/inputs";
import { Navigation } from "./specimens/navigation";
import { CommandHost, Overlays } from "./specimens/overlays";
import { Runs } from "./specimens/runs";
import { Selection } from "./specimens/selection";
import { system } from "./system";

const NAV = [
  { href: "#in-use", label: "In use" },
  { href: "#foundations", label: "Foundations" },
  { href: "#components", label: "Components" },
];

const foundations = (scale: DensityScale) => [
  {
    body: (
      <>
        <ColorTable />
        <LampRules />
      </>
    ),
    id: "f-color",
    lead: "Warm paper, near-black ink, hairline rules, and a single amber that sinks to a tint after dark. Ratios come from the hex values below, measured against each theme's sheet.",
    meta: countOf(
      COLOR_GROUPS.reduce<number>((sum, group) => sum + group.tokens.length, 0),
      "token",
    ),
    title: "Color",
  },
  {
    body: (
      <>
        <TypeScale />
        <Voices />
      </>
    ),
    id: "f-type",
    lead: "Three voices at one weight: mono capitals for controls, mono as stored for values, a sans for sentences. Size, case and ink do the ranking.",
    meta: countOf(TYPE_ROLES.length, "role"),
    title: "Typography",
  },
  {
    body: <Space />,
    id: "f-space",
    lead: spaceLead(scale),
    meta: "4px steps",
    title: "Space",
  },
  {
    body: <Radius />,
    id: "f-radius",
    lead: "None, anywhere. A square corner lands exactly where two hairlines meet.",
    meta: "1 value",
    title: "Radius",
  },
  {
    body: <Borders />,
    id: "f-borders",
    lead: "A frame outlines a region once, and rules split what is inside it. Only the focus ring is thicker than a hairline.",
    meta: "4 lines",
    title: "Borders and lines",
  },
  {
    body: <Elevation />,
    id: "f-elevation",
    lead: "Nothing casts a shadow. An overlay differs by its fill and one rule, and a dialog dims the sheet behind it.",
    meta: countOf(LEVELS.length, "level"),
    title: "Elevation",
  },
  {
    body: <Motion />,
    id: "f-motion",
    lead: "Mechanical and brief. State changes cut, fills wipe along their rail, text types or settles, moves ease out. No springs, no scaling, and only the pending mark repeats.",
    meta: `${countOf(MOTION_TOKENS.length, "duration")} · ${countOf(CURVES.length, "curve")}`,
    title: "Motion",
  },
  {
    body: <Iconography />,
    id: "f-icons",
    lead: "Lucide with its stroke ends cut flat and its joins mitred, at a 1.5px line whatever the size.",
    meta: "16px default",
    title: "Iconography",
  },
  {
    body: <AntiSlop />,
    id: "f-slop",
    lead: "Habits of generated dashboards that Halogen refuses, each drawn wrong and then right.",
    meta: countOf(RULES.length, "rule"),
    title: "Anti-slop",
  },
];

export type ScreenId = "runs" | "drift" | "spend" | "sync";

interface ScreenEntry {
  body: (openCommand: () => void) => ReactNode;
  id: ScreenId;
  lead: string;
  parts: string;
  title: string;
}

const SCREENS: ScreenEntry[] = [
  {
    body: (openCommand: () => void) => <RunsScreen onSearch={openCommand} />,
    id: "runs",
    lead: "Today's runs on prod. A strip cell narrows the table; Run now starts the picked pipeline, or restarts it when it is already going.",
    parts: "status strip · filter bar · table · menu · empty state · pagination",
    title: "Run board",
  },
  {
    body: () => <DriftScreen />,
    id: "drift",
    lead: "crm-api shipped a new contacts schema overnight. Pick a fix for each column and the mapping rewrites itself; Apply mapping replays the held rows.",
    parts: "tool-call stack · schema diff · code window · progress · popover",
    title: "Schema drift",
  },
  {
    body: () => <SpendScreen />,
    id: "spend",
    lead: "November's credits by team against budget, the queue they cause, and the queries spilling to disk. Pick a team row, then cap it.",
    parts: "table · line chart · popover · dialog · slider · switch",
    title: "Credit spend",
  },
  {
    body: () => <SyncScreen />,
    id: "sync",
    lead: "The nightly refresh across five systems. Run refresh lights each step in turn and draws the connector to the next.",
    parts: "swimlanes · activity · line chart · tabs · progress",
    title: "Customer 360 refresh",
  },
];

/** The "In use" screens as picker options. */
export const SCREEN_OPTIONS = SCREENS.map((item) => ({ label: item.title, value: item.id }));

const FOUNDATION_TOTAL = foundations(DENSITIES.default).length;

const COUNTS = [
  { label: "Components", value: String(COMPONENT_TOTAL) },
  { label: "Foundations", value: String(FOUNDATION_TOTAL) },
  { label: "Screens", value: String(SCREENS.length) },
  { label: "Radius", unit: "px", value: "0" },
  { label: "Shadows", value: "none" },
  { label: "Lamps", unit: "per view", value: "1" },
];

const Mark = () => (
  <svg aria-hidden height="16" viewBox="0 0 16 16" width="16">
    <rect fill="none" height="15" stroke="currentColor" width="15" x="0.5" y="0.5" />
    <path
      d="M3 10 L5 6 L7 10 L9 6 L11 10 L13 6"
      fill="none"
      stroke="currentColor"
      strokeLinejoin="miter"
    />
    <rect fill="currentColor" height="2" width="10" x="3" y="12" />
  </svg>
);

const Screen = ({
  id,
  title,
  lead,
  parts,
  children,
}: {
  id: string;
  title: string;
  lead: string;
  parts: string;
  children: ReactNode;
}) => (
  <section aria-labelledby={`${id}-title`} className="hx-screen-anchor" id={id} tabIndex={-1}>
    <div className="hx-screen-caption">
      <h3 className="hx-heading-sm" id={`${id}-title`}>
        {title}
      </h3>
      <span className="hx-code-sm hx-ink-3 hx-end">{parts}</span>
      <p className="hx-body-sm hx-full-row">{lead}</p>
    </div>
    {children}
  </section>
);

interface DesignSystemProps {
  /** Light paper or the dark sheet. */
  theme?: Theme;
  /** Which filament lights the one action per view. */
  lamp?: Lamp;
  /** Control, row and head heights, and the region inset. */
  density?: Density;
  /** The "In use" screen shown first. */
  featured?: ScreenId;
  /** False cuts every transition and typing effect, as reduced motion does. */
  motion?: boolean;
}

/** The Halogen showcase: header, demo screens, foundations, then every component by category. */
export const DesignSystem = ({
  theme = "light",
  lamp = "amber",
  density = "default",
  featured = "runs",
  motion = true,
}: DesignSystemProps) => {
  const [command, setCommand] = useState(false);
  const screens = SCREENS.toSorted((a, b) => Number(b.id === featured) - Number(a.id === featured));

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommand(true);
      }
    };

    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div
      className="ds-halogen"
      data-motion={motion ? undefined : "off"}
      data-theme={theme === "dark" ? "dark" : undefined}
      style={cssVars(settingVars(theme, lamp, density))}
    >
      <SettingsContext value={{ density, lamp }}>
        <MotionContext value={motion}>
          <ToastProvider>
            <header className="hx-topbar">
              <div className="hx-shell hx-topbar-inner">
                <a className="hx-brand hx-code" href="#top">
                  <Mark />
                  halogen
                  <span className="hx-code-sm hx-ink-3">v1.0</span>
                </a>
                <nav aria-label="Sections" className="hx-row hx-topnav">
                  {NAV.map((item, index) => (
                    <a className="hx-ntab" href={item.href} key={item.href}>
                      <span className="hx-ntab-index">{String(index + 1).padStart(2, "0")}</span>
                      {item.label}
                    </a>
                  ))}
                </nav>
                <span className="hx-row hx-end">
                  <Button
                    aria-label="Search"
                    onClick={() => {
                      setCommand(true);
                    }}
                    size="icon-sm"
                    title="Search"
                    variant="ghost"
                  >
                    <Icon icon={Search} />
                  </Button>
                </span>
              </div>
            </header>

            <main className="hx-shell" id="top">
              <div className="hx-hero">
                <h1 className="hx-display hx-hero-title">
                  <TypeText perChar={55} text={system.name} />
                </h1>
                <p className="hx-heading hx-hero-lead">{system.tagline}</p>
                <p className="hx-body hx-ink-2 hx-measure">
                  Halogen is a working kit for the people who keep data platforms running. It draws
                  on warm paper with hairlines and near-black ink, puts every control word in mono
                  capitals and every sentence in a plain sans, and leaves each corner square. Light
                  is scarce: one amber filament per view marks the thing to press. <Kbd>⌘</Kbd>{" "}
                  <Kbd>K</Kbd> jumps anywhere.
                </p>
                <StatusStrip label="What Halogen ships">
                  {COUNTS.map((item) => (
                    <StripCell
                      key={item.label}
                      label={item.label}
                      unit={item.unit}
                      value={item.value}
                    />
                  ))}
                </StatusStrip>
              </div>

              <Section
                id="in-use"
                lead="Screens from Larch's data platform, assembled only from the parts catalogued below. Every control on them responds."
                meta={countOf(screens.length, "screen")}
                title="In use"
              >
                <div className="hx-screens">
                  {screens.map((item) => (
                    <Screen
                      id={`s-${item.id}`}
                      key={item.id}
                      lead={item.lead}
                      parts={item.parts}
                      title={item.title}
                    >
                      {item.body(() => {
                        setCommand(true);
                      })}
                    </Screen>
                  ))}
                </div>
              </Section>

              <Section
                id="foundations"
                lead="What every part below already obeys. Each value here is read from the shipped CSS."
                meta={countOf(FOUNDATION_TOTAL, "foundation")}
                title="Foundations"
              >
                {foundations(DENSITIES[density]).map((item) => (
                  <Group
                    id={item.id}
                    key={item.id}
                    lead={item.lead}
                    meta={item.meta}
                    title={item.title}
                  >
                    {item.body}
                  </Group>
                ))}
              </Section>

              <Section
                id="components"
                lead="All live. Grouped by what you reach for, ending with the parts built for runs."
                meta={`${countOf(COMPONENT_TOTAL, "component")} · ${countOf(GROUP_TOTAL, "group")}`}
                title="Components"
              >
                <Actions />
                <Inputs />
                <Selection />
                <Display />
                <Feedback />
                <Overlays
                  onCommand={() => {
                    setCommand(true);
                  }}
                />
                <Navigation />
                <Data />
                <Code />
                <Charts />
                <Runs />
              </Section>
            </main>

            <footer className="hx-rule-top">
              <div className="hx-shell hx-row-wrap hx-between hx-footer">
                <span className="hx-code-sm hx-ink-3">halogen · tokens.css · styles/*.css</span>
                <span className="hx-caption hx-ink-3">
                  Ruled paper, mono words, one filament lit.
                </span>
              </div>
            </footer>
            <CommandHost onOpenChange={setCommand} open={command} />
          </ToastProvider>
        </MotionContext>
      </SettingsContext>
    </div>
  );
};
