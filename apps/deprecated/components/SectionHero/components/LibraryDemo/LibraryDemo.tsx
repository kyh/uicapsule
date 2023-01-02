import React from "react";
import { motion, useAnimation } from "framer-motion";
import {
  View,
  Hidden,
  Card,
  Badge,
  RadioGroup,
  Radio,
  Text,
  Link,
  Tabs,
  Avatar,
  Switch,
  DropdownMenu,
  Image,
  ThemeProvider,
  ThemeProviderProps,
} from "@uicapsule/components";
import ComponentPreview from "components/ComponentPreview";
import s from "./LibraryDemo.module.css";

const SINGLE_HEIGHT = 34 * 4;
const GAP = 20;

const HorizontalGrid = () => (
  <svg
    className={s.gridHorizontal}
    width="100%"
    height="100%"
    fill="none"
    stroke="var(--uic-color-border-neutral-faded)"
    xmlns="http://www.w3.org/2000/svg"
  >
    <line y1="0.5" y2="0.5" x2="100%" />
    <line y1={SINGLE_HEIGHT - 0.5} y2={SINGLE_HEIGHT - 0.5} x2="100%" />

    <line
      y1={SINGLE_HEIGHT + GAP + 0.5}
      y2={SINGLE_HEIGHT + GAP + 0.5}
      x2="100%"
    />
    <line
      y1={SINGLE_HEIGHT * 2 + GAP - 0.5}
      y2={SINGLE_HEIGHT * 2 + GAP - 0.5}
      x2="100%"
    />

    <line
      y1={SINGLE_HEIGHT * 2 + GAP * 2 + 0.5}
      y2={SINGLE_HEIGHT * 2 + GAP * 2 + 0.5}
      x2="100%"
    />
  </svg>
);

const VerticalGrid = () => (
  <div className={s.gridVertical}>
    <div className={s.line} />
    <Hidden hide={{ s: true, l: false }}>
      {(className) => (
        <>
          <div className={`${s.line} ${className}`} />
          <div className={`${s.line} ${className}`} />
          <div className={`${s.line} ${className}`} />
          <div className={`${s.line} ${className}`} />
        </>
      )}
    </Hidden>
    <div className={s.line} />
  </div>
);

const Preview = (props: {
  children: React.ReactNode;
  blocks?: number;
  controls: any;
  theme: any;
  centered?: boolean;
}) => {
  const { children, blocks = 1, controls, theme, centered = true } = props;
  const gapsHeight = GAP * (blocks - 1);
  const height = SINGLE_HEIGHT * blocks + gapsHeight;

  return (
    <ComponentPreview height={height} centered={centered} elevated bordered>
      <motion.div animate={controls}>
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </motion.div>
    </ComponentPreview>
  );
};

const LibraryDemo = (props: { theme: ThemeProviderProps["theme"] }) => {
  const { theme } = props;
  const controls = useAnimation();
  const controlsText = useAnimation();
  const [appliedTheme, setAppliedTheme] = React.useState(theme);

  React.useEffect(() => {
    const run = async () => {
      const data = {
        scale: 0.97,
        z: 0,
        y: 2,
        transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
      };

      controlsText.start({ ...data, opacity: 0.5 });
      await controls.start(data);

      setAppliedTheme(theme);
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, controls, controlsText]);

  React.useEffect(() => {
    const data = {
      scale: 1,
      y: 0,
      z: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: "easeOut" },
    };
    controls.start(data);
    controlsText.start(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedTheme, controls, controlsText]);

  return (
    <View gap={5} direction="row" className={s.root}>
      {/* Column 1 */}
      <View.Item columns={{ s: 12, l: 4 }}>
        <View gap={5}>
          <Preview blocks={2} controls={controls} theme={appliedTheme}>
            <Card className={s.animated}>
              <View gap={2}>
                <Image
                  src="/img/examples/nft.webp"
                  width="188px"
                  borderRadius="medium"
                  alt="Artwork preview"
                  className={s.animated}
                />
                <View direction="row" align="center">
                  <View.Item grow>By Ester Naomi</View.Item>
                  <Badge variant="faded">New</Badge>
                </View>
              </View>
            </Card>
          </Preview>

          <View gap={5} direction="row">
            <View.Item columns={6}>
              <Preview controls={controls} theme={appliedTheme}>
                <RadioGroup defaultValue="now" name="time">
                  <View gap={2}>
                    <Radio value="now">Scale now</Radio>
                    <Radio value="later">Lateeer</Radio>
                  </View>
                </RadioGroup>
              </Preview>
            </View.Item>

            <View.Item columns={6}>
              <Preview controls={controls} theme={appliedTheme}>
                <Text variant="body-medium-2" className={s.animated}>
                  <Link className={s.animated}>Read me</Link>
                </Text>
              </Preview>
            </View.Item>
          </View>
        </View>
      </View.Item>

      {/* Column 2 */}

      <Hidden hide={{ s: true, l: false }}>
        {(className) => (
          <View.Item columns={4} key={2} className={className}>
            <View gap={5}>
              <Preview
                controls={controlsText}
                theme={appliedTheme}
                centered={false}
              >
                <View gap={1} align="start">
                  <Badge variant="outline" rounded>
                    Featured 3 / 20-28
                  </Badge>
                  <Text variant="featured-3">
                    The quick brown fox jumps <br />
                    over the lazy dog
                  </Text>
                </View>
              </Preview>

              <View gap={5} direction="row">
                <View.Item columns={6}>
                  <Preview controls={controls} theme={appliedTheme}>
                    <View direction="row" gap={0}>
                      <Badge.Container>
                        <Badge
                          color="critical"
                          size="small"
                          className={s.animated}
                        >
                          5
                        </Badge>
                        <Avatar
                          className={s.animated}
                          src="/img/landing/hero/avatar.webp"
                          squared
                          alt="User avatar"
                        />
                      </Badge.Container>
                    </View>
                  </Preview>
                </View.Item>

                <View.Item columns={6}>
                  <Preview controls={controls} theme={appliedTheme}>
                    <Switch defaultChecked name="switch" />
                  </Preview>
                </View.Item>
              </View>

              <Preview controls={controls} theme={appliedTheme}>
                <View width="200px" align="center">
                  <Tabs variant="pills-elevated">
                    <Tabs.List className={s.animated}>
                      <Tabs.Item value="0">Popular</Tabs.Item>
                      <Tabs.Item value="1">Distance</Tabs.Item>
                    </Tabs.List>
                  </Tabs>
                </View>
              </Preview>
            </View>
          </View.Item>
        )}
      </Hidden>

      {/* Column 3 */}
      <Hidden hide={{ s: true, l: false }}>
        {(className) => (
          <View.Item columns={4} key={3} className={className}>
            <Preview blocks={3} controls={controls} theme={appliedTheme}>
              <View width="200px">
                <Card padding={1} className={s.animated}>
                  <DropdownMenu.Section>
                    <DropdownMenu.Item endSlot="⌘X">Cut</DropdownMenu.Item>
                    <DropdownMenu.Item endSlot="⌘C">Copy</DropdownMenu.Item>
                    <DropdownMenu.Item endSlot="⌘V">Paste</DropdownMenu.Item>
                  </DropdownMenu.Section>
                  <DropdownMenu.Section>
                    <DropdownMenu.Item endSlot="⌘Z" selected>
                      Undo
                    </DropdownMenu.Item>
                    <DropdownMenu.Item endSlot="⌘Y">Redo</DropdownMenu.Item>
                  </DropdownMenu.Section>
                  <DropdownMenu.Section>
                    <DropdownMenu.Item endSlot="⌘P">Print</DropdownMenu.Item>
                    <DropdownMenu.Item endSlot="⌘R">Reshape</DropdownMenu.Item>
                  </DropdownMenu.Section>
                </Card>
              </View>
            </Preview>
          </View.Item>
        )}
      </Hidden>
    </View>
  );
};

LibraryDemo.VerticalGrid = VerticalGrid;
LibraryDemo.HorizontalGrid = HorizontalGrid;
export default LibraryDemo;
