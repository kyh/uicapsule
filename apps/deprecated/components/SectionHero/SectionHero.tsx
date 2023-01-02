import React from "react";
import { motion } from "framer-motion";
import NextLink from "next/link";
import { Container, Text, View, Button, useTheme } from "@uicapsule/components";
import IconArrowRight from "icons/ArrowRight";
import * as ga from "utilities/ga";
import LibraryDemo from "./components/LibraryDemo";
import TimedTheme from "./components/TimedTheme";
import s from "./SectionHero.module.css";
import Price from "constants/prices";

const themes = ["uicapsule", "funky", "classic"];

const Animation = (props: { order: number; children?: React.ReactNode }) => {
  const duration = 1;

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 28 }}
      transition={{
        duration,
        delay: props.order * 0.4,
        ease: "easeOut",
      }}
    >
      {props.children}
    </motion.div>
  );
};

const SectionHero = () => {
  const { colorMode } = useTheme();
  const [themeIndex, setThemeIndex] = React.useState<number | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const badgeSrc = `https://api.producthunt.com/widgets/embed-image/v1/top-post-badge.svg?post_id=345713&theme=${
    colorMode === "dark" ? "dark" : "neutral"
  }`;

  const handleThemeChange = async (themeIndex: number) => {
    setThemeIndex(themeIndex);
  };

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={s.root}>
      {/* <ThemeProvider theme={themes[themeIndex || 0]}> */}
      <div className={s.gradient} />
      {/* </ThemeProvider> */}
      <motion.div transition={{ staggerChildren: 0.5 }}>
        <View gap={18}>
          <Container width="652px">
            <View gap={8} align="center">
              <Animation order={0}>
                <a
                  href="https://www.producthunt.com/products/@uicapsule/components"
                  target="_blank"
                  rel="noreferrer"
                >
                  {mounted && (
                    <img
                      src={badgeSrc}
                      alt="UICapsule - Design system built for your scale in React and Figma | Product Hunt"
                      height="52"
                    />
                  )}
                </a>
              </Animation>
              <Animation order={0}>
                <Text variant="display-2" align="center" as="h1">
                  Design system
                  <br />
                  built for your scale
                </Text>
              </Animation>
              <View.Item gapBefore={5}>
                <Animation order={1}>
                  <Text
                    variant="featured-2"
                    align="center"
                    color="neutral-faded"
                    as="p"
                  >
                    UICapsule is a professionally crafted design system for
                    everyday product development with Figma and React
                  </Text>
                </Animation>
              </View.Item>
              <Animation order={1}>
                <View gap={3} direction="row" justify="center">
                  <NextLink
                    href="/content/docs/getting-started/overview/"
                    passHref
                  >
                    <Button variant="outline" size="large">
                      Browse docs
                    </Button>
                  </NextLink>
                  <NextLink href="/pricing/" passHref>
                    <Button
                      color="primary"
                      size="large"
                      endIcon={IconArrowRight}
                      onClick={() => {
                        ga.trackEvent({
                          category: ga.EventCategory.Pricing,
                          action: "pricing_click_license_section",
                        });
                      }}
                    >
                      ${Price.seat / 100} Buy now
                    </Button>
                  </NextLink>
                </View>
              </Animation>
              <View.Item gapBefore={3}>
                <Animation order={1}>
                  <Text color="neutral-faded" variant="body-1" align="center">
                    14 day money-back guarantee
                  </Text>
                </Animation>
              </View.Item>
            </View>
          </Container>

          <Animation order={1}>
            <div className={s.demo}>
              <LibraryDemo.HorizontalGrid />
              <Container width="1056px">
                <div className={s.grid}>
                  <LibraryDemo.VerticalGrid />

                  <View gap={15}>
                    <LibraryDemo theme={themes[themeIndex || 0]} />
                    <TimedTheme
                      onThemeChange={handleThemeChange}
                      themeIndex={themeIndex}
                      themes={themes}
                    />
                  </View>
                </div>
              </Container>
            </div>
          </Animation>
        </View>
      </motion.div>
    </div>
  );
};

export default SectionHero;
