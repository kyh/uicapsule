import React from "react";
import {
  View,
  Container,
  Icon,
  Text,
  Button,
  ThemeProvider,
  Card,
  Avatar,
  DropdownMenu,
  Actionable,
} from "@uicapsule/components";
import IconReshaped from "icons/colored/Reshaped";
import IconClose from "icons/Close";
import IconColors from "icons/Colors";
import IconFigma from "icons/Figma";
import IconPlus from "icons/Plus";
import IconChevronDown from "icons/ChevronDown";
import IconSun from "icons/Sun";
import IconMoon from "icons/Moon";
import IconPluginArrow from "icons/colored/PluginArrow";
import useStoredColorMode from "hooks/useStoredColorMode";
import * as T from "./SectionFigmaPlugin.types";
import s from "./SectionFigmaPlugin.module.css";

const themes = [
  {
    name: "@uicapsule/components",
    color: "#5A58F2",
  },
  {
    name: "funky",
    color: "#FF3D00",
  },
  {
    name: "classic",
    color: "#000",
  },
];

const pluginLink = "https://www.figma.com/community/plugin/1132648122057236517";

const SectionFigmaPlugin = (props: T.Props) => {
  const { children, embed } = props;
  const { setColorMode, colorMode } = useStoredColorMode();
  const [selectedTheme, setSelectedTheme] = React.useState(themes[0].name);
  const [intendedTheme, setIntendedTheme] = React.useState(themes[0].name);
  const [intendedMode, setIntendedMode] =
    React.useState<typeof colorMode>("light");
  const [cursorStatus, setCursorStatus] = React.useState<
    "idle" | "hidden" | "visible"
  >("idle");
  const [modeMounted, setModeMounted] = React.useState(false);
  const cursorActiveRef = React.useRef(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const cursorRef = React.useRef<HTMLDivElement>(null);
  const gradientRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (embed) return;
    setColorMode("dark");
  }, [setColorMode, embed]);

  React.useEffect(() => {
    cursorActiveRef.current = false;
    setCursorStatus("idle");
  }, [colorMode]);

  React.useEffect(() => {
    if (!embed || modeMounted) return;

    setIntendedMode(colorMode === "dark" ? "light" : "dark");
  }, [embed, modeMounted, colorMode]);

  React.useEffect(() => {
    setModeMounted(true);

    // Reset cursor on page navigation
    return () => {
      cursorActiveRef.current = false;
      setCursorStatus("idle");
    };
  }, []);

  const updateCursor = React.useCallback((x: number, y: number) => {
    const el = cursorRef.current!;
    const elGradient = gradientRef.current!;

    if (!el || !elGradient) return;

    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    elGradient.style.left = `${x}px`;
    elGradient.style.top = `${y}px`;
  }, []);

  React.useEffect(() => {
    const rootEl = rootRef.current!;
    const interactiveEls = document.querySelectorAll("[data-interactive]");

    const handleMove = (e: MouseEvent) => {
      if (!cursorActiveRef.current) return;
      updateCursor(e.clientX, e.clientY);
    };

    const handleIdle = () => {
      cursorActiveRef.current = false;
      setCursorStatus("idle");
    };

    const handleHide = () => {
      cursorActiveRef.current = true;
      setCursorStatus("hidden");
    };

    const handleShow = () => {
      cursorActiveRef.current = true;
      setCursorStatus("visible");
    };

    window.addEventListener("mousemove", handleMove);
    rootEl.addEventListener("mouseenter", handleShow);
    rootEl.addEventListener("mouseleave", handleIdle);

    interactiveEls.forEach((el) => {
      el.addEventListener("mouseenter", handleHide);
      el.addEventListener("mouseleave", handleShow);
    });

    return () => {
      window.removeEventListener("mousemove", handleMove);
      rootEl.removeEventListener("mouseenter", handleShow);
      rootEl.removeEventListener("mouseleave", handleIdle);

      interactiveEls.forEach((el) => {
        el.removeEventListener("mouseenter", handleHide);
        el.removeEventListener("mouseleave", handleShow);
      });
    };
  }, [updateCursor, embed]);

  return (
    <ThemeProvider theme={selectedTheme}>
      <View
        className={[
          s.dots,
          s.page,
          colorMode === "dark" && s[`cursor--status-${cursorStatus}`],
          embed && s.embed,
        ]}
        height={{ s: "auto", l: embed ? "720px" : "auto" }}
        width="100vw"
        justify="center"
        align="center"
        padding={[18, 0]}
        attributes={{ ref: rootRef }}
      >
        {colorMode === "dark" && (
          <>
            <div className={s.cursor} ref={cursorRef} aria-hidden="true">
              🔦
            </div>
            <div className={s.gradient} ref={gradientRef} aria-hidden="true" />
          </>
        )}
        <Container width={embed ? "820px" : "1000px"}>
          <View
            direction={{ s: "column", l: "row" }}
            gap={{ s: 18, l: 14 }}
            align="center"
          >
            <ThemeProvider theme="figma">
              <View align="center" gap={1}>
                <View
                  width="270px"
                  height="440px"
                  backgroundColor="page"
                  borderColor="neutral-faded"
                  borderRadius="small"
                  overflow="hidden"
                  className={s.plugin}
                  attributes={{ "data-interactive": true }}
                  divided
                >
                  <View padding={3} gap={2} direction="row" align="center">
                    <Icon svg={IconReshaped} size={4} />
                    <View.Item grow>
                      <Text variant="body-strong-1">Reshaped</Text>
                    </View.Item>
                    <View.Item>
                      <Button.Aligner className={s.close}>
                        <Button
                          startIcon={IconClose}
                          variant="ghost"
                          size="small"
                        />
                      </Button.Aligner>
                    </View.Item>
                  </View>
                  <View padding={3} direction="row" gap={3}>
                    <Text variant="body-strong-2">Themes</Text>
                    <Actionable
                      href={pluginLink}
                      attributes={{ target: "_blank" }}
                    >
                      <Text variant="body-2" color="neutral-faded">
                        About
                      </Text>
                    </Actionable>
                  </View>
                  <View.Item grow className={s.dots}>
                    <View padding={3} gap={2}>
                      {themes.map((theme) => (
                        <Card
                          padding={3}
                          onClick={() => setIntendedTheme(theme.name)}
                          selected={theme.name === intendedTheme}
                          key={theme.name}
                        >
                          <View direction="row" align="center" gap={3}>
                            <View
                              width="var(--rs-unit-x7)"
                              height="var(--rs-unit-x7)"
                              borderRadius="small"
                              align="center"
                              justify="center"
                              attributes={{
                                style: {
                                  backgroundColor: theme.color,
                                  color: "#fff",
                                },
                              }}
                            >
                              <Icon svg={IconColors} size={4} />
                            </View>
                            <View.Item>
                              <Text variant="body-strong-1">
                                {theme.name.charAt(0).toUpperCase() +
                                  theme.name.slice(1)}
                              </Text>
                              <Text variant="body-2">Light and dark mode</Text>
                            </View.Item>
                          </View>
                        </Card>
                      ))}
                      <Card
                        padding={3}
                        href={pluginLink}
                        attributes={{ target: "_blank" }}
                      >
                        <View direction="row" align="center" gap={3}>
                          <Avatar icon={IconPlus} size={7} squared />
                          <View.Item>
                            <Text variant="body-strong-1">New theme</Text>
                            <Text variant="body-2">Light and dark mode</Text>
                          </View.Item>
                        </View>
                      </Card>
                    </View>
                  </View.Item>
                  <View padding={[2, 3]} direction="row">
                    <View.Item grow>
                      {modeMounted && (
                        <DropdownMenu position="top-start" width="140px">
                          <DropdownMenu.Trigger>
                            {(attributes) => (
                              <Button
                                size="small"
                                variant="outline"
                                attributes={attributes}
                                startIcon={
                                  intendedMode === "dark" ? IconMoon : IconSun
                                }
                                endIcon={IconChevronDown}
                              >
                                {intendedMode === "dark"
                                  ? "Dark mode"
                                  : "Light mode"}
                              </Button>
                            )}
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Content>
                            <DropdownMenu.Item
                              onClick={() => setIntendedMode("light")}
                            >
                              Light mode
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              onClick={() => setIntendedMode("dark")}
                            >
                              Dark mode
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu>
                      )}
                    </View.Item>
                    <Button
                      color="primary"
                      size="small"
                      onClick={() => {
                        setSelectedTheme(intendedTheme);
                        setColorMode(intendedMode);
                      }}
                    >
                      Reshape
                    </Button>
                  </View>
                </View>
                <div style={{ height: 0 }}>
                  <IconPluginArrow />
                </div>
              </View>
            </ThemeProvider>
            <View.Item grow>
              <View gap={10} align={{ s: "center", l: "start" }} height="100%">
                <View maxWidth={{ s: "420px", l: "100%" }}>{children}</View>
                <Button
                  size="large"
                  color="primary"
                  startIcon={IconFigma}
                  attributes={{ "data-interactive": true, target: "_blank" }}
                  href={pluginLink}
                >
                  Install plugin for free
                </Button>
              </View>
            </View.Item>
          </View>
        </Container>
      </View>
    </ThemeProvider>
  );
};

export default SectionFigmaPlugin;
