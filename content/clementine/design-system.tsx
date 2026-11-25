"use client";

import { LayoutGrid, Moon, Palette, Smartphone, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "./components/button";
import { TabBar } from "./components/tab-bar";
import { ToastProvider } from "./components/toast";
import { CATEGORIES, COMPONENT_COUNT, FOUNDATIONS, SCREENS } from "./data/catalog";
import { AntiSlopFoundation } from "./foundations/anti-slop";
import { ColorFoundation } from "./foundations/color";
import { IconFoundation } from "./foundations/icons";
import { MotionFoundation } from "./foundations/motion";
import { ElevationFoundation, RadiusFoundation, SpaceFoundation } from "./foundations/space";
import { TypeFoundation } from "./foundations/type";
import { HomeScreen } from "./screens/home-screen";
import { PaydayScreen } from "./screens/payday-screen";
import { ReceiptsScreen } from "./screens/receipts-screen";
import { SendScreen } from "./screens/send-screen";
import { Block, Frame, Section } from "./shell";
import { ActionSpecimens } from "./specimens/actions";
import { AssistantSpecimens } from "./specimens/assistant";
import { DisplaySpecimens } from "./specimens/display";
import { FeedbackSpecimens } from "./specimens/feedback";
import { InputSpecimens } from "./specimens/inputs";
import { NavigationSpecimens } from "./specimens/navigation";
import { OverlaySpecimens } from "./specimens/overlays";
import { SelectionSpecimens } from "./specimens/selection";
import { system } from "./system";

import "./base.css";

import "./shell.css";

const SPECIMENS = {
  "c-actions": ActionSpecimens,
  "c-assistant": AssistantSpecimens,
  "c-display": DisplaySpecimens,
  "c-feedback": FeedbackSpecimens,
  "c-inputs": InputSpecimens,
  "c-navigation": NavigationSpecimens,
  "c-overlays": OverlaySpecimens,
  "c-selection": SelectionSpecimens,
} as const;

const SCREEN_VIEWS = {
  "screen-home": {
    Screen: HomeScreen,
    lead: "Noor opens the app on a Wednesday evening: what is in Everyday, the bills between now and payday, and one orange way to top up.",
  },
  "screen-payday": {
    Screen: PaydayScreen,
    lead: "Friday's paycheck, cut into segments before it lands. Nudge each pot, watch the ring rebalance, then save the plan once.",
  },
  "screen-receipts": {
    Screen: ReceiptsScreen,
    lead: "November's card payments beside their receipts, two photos still to take, and a 3:41 am charge from a shop Noor has never used.",
  },
  "screen-send": {
    Screen: SendScreen,
    lead: "Pay a friend back: pick them, tap the amount, choose how fast, and keep a way back until it leaves tonight.",
  },
} as const;

const DOCK = [
  { href: "#in-use", icon: Smartphone, id: "in-use", label: "In use" },
  { href: "#foundations", icon: Palette, id: "foundations", label: "Foundations" },
  { href: "#components", icon: LayoutGrid, id: "components", label: "Components" },
] as const;

const SECTION_LINE = 72;

const useDock = () => {
  const [active, setActive] = useState<string>(DOCK[0].label);
  const [hidden, setHidden] = useState(false);
  const pinned = useRef(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;
    let settle = 0;

    const measure = () => {
      frame = 0;
      const y = window.scrollY;

      if (!pinned.current) {
        let current: string = DOCK[0].label;

        for (const item of DOCK) {
          const node = document.querySelector(`#${item.id}`);

          if (node && node.getBoundingClientRect().top <= SECTION_LINE) {
            current = item.label;
          }
        }

        const atEnd = window.innerHeight + y >= document.documentElement.scrollHeight - 2;
        setActive(current);
        setHidden(y > lastY && y > 240 && !atEnd);
      }

      lastY = y;
    };

    const onScroll = () => {
      if (frame === 0) {
        frame = requestAnimationFrame(measure);
      }

      if (pinned.current) {
        window.clearTimeout(settle);
        settle = window.setTimeout(() => {
          pinned.current = false;
        }, 160);
      }
    };

    const release = () => {
      pinned.current = false;
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", release, { passive: true });
    window.addEventListener("touchstart", release, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", release);
      window.removeEventListener("touchstart", release);
    };
  }, []);

  const select = (label: string) => {
    pinned.current = true;
    setActive(label);
    setHidden(false);
  };

  return { active, hidden, select };
};

export const DesignSystem = () => {
  const [dark, setDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dock = useDock();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="ds-clementine cl-page" data-theme={dark ? "dark" : "light"}>
      <ToastProvider>
        <header className="cl-topbar" data-scrolled={scrolled || undefined}>
          <div className="cl-topbar__inner">
            <a className="cl-topbar__name" href="#top">
              <span aria-hidden className="cl-topbar__mark" />
              {system.name}
            </a>
            <Button
              aria-label="Dark theme"
              aria-pressed={dark}
              onClick={() => setDark(!dark)}
              size="icon"
              variant="secondary"
            >
              {dark ? (
                <Sun aria-hidden size={20} strokeWidth={1.75} />
              ) : (
                <Moon aria-hidden size={20} strokeWidth={1.75} />
              )}
            </Button>
          </div>
        </header>
        <main className="cl-main" id="top">
          <header className="cl-hero">
            <h1 className="cl-hero__title">{system.name}</h1>
            <p className="cl-hero__tagline">{system.tagline}</p>
            <p className="cl-hero__body">
              Warm gray steps under near-black ink, soft-square buttons, figures with their cents
              lifted, and one clementine action per view that glows inside a ring of zest. Below are{" "}
              {SCREENS.length} working screens, {FOUNDATIONS.length} foundations and{" "}
              {COMPONENT_COUNT} components, each in light and dark.
            </p>
          </header>

          <Section
            id="in-use"
            jumps={SCREENS}
            lead="Four moments from one person's money week. Every control on them works, and every piece of them shows up again below as a component."
            title="In use"
          >
            {SCREENS.map((screen) => {
              const { Screen, lead } = SCREEN_VIEWS[screen.id];

              return (
                <Block id={screen.id} key={screen.id} lead={lead} title={screen.name}>
                  <Frame>
                    <Screen />
                  </Frame>
                </Block>
              );
            })}
          </Section>

          <Section
            id="foundations"
            jumps={FOUNDATIONS}
            lead="The values behind those screens, read live from tokens.css in whichever theme you are viewing."
            title="Foundations"
          >
            <ColorFoundation theme={dark ? "dark" : "light"} />
            <TypeFoundation />
            <SpaceFoundation />
            <RadiusFoundation />
            <ElevationFoundation />
            <MotionFoundation />
            <IconFoundation />
            <AntiSlopFoundation />
          </Section>

          <Section
            id="components"
            jumps={CATEGORIES}
            lead="Sorted by the job they do on a screen. Press, type, drag and toggle any of them."
            title="Components"
          >
            {CATEGORIES.map((category) => {
              const Specimens = SPECIMENS[category.id];

              return (
                <Block
                  id={category.id}
                  key={category.id}
                  lead={category.items.join(", ")}
                  title={category.name}
                >
                  <div className="cl-specs">
                    <Specimens />
                  </div>
                </Block>
              );
            })}
          </Section>
          <footer className="cl-footer">
            <p>
              {system.name} follows the structure and rules of Lime from design.how, with its own
              palette, glow, type, radius, copy and screens.
            </p>
          </footer>
        </main>
        <TabBar
          className="cl-dock"
          current={dock.active}
          tucked={dock.hidden}
          currentKind="location"
          items={DOCK}
          label="Sections"
          onSelect={(label) => dock.select(label)}
        />
      </ToastProvider>
    </div>
  );
};
