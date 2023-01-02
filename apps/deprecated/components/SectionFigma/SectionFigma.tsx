import React from "react";
import {
  Container,
  Text,
  View,
  Badge,
  Button,
  ActionBar,
} from "@uicapsule/components";
import BlockReview from "components/BlockReview";
import BlockFeature from "components/BlockFeature";
import BlockVideo from "components/BlockVideo";
import IconDownload from "icons/Download";
import IconFigmaStylesArrow from "icons/colored/FigmaStylesArrow";
import IconHeart from "icons/Heart";
import * as ga from "utilities/ga";
import s from "./SectionFigma.module.css";

const SectionFigma = () => {
  return (
    <Container width="1056px">
      <View gap={8}>
        <Container width="812px">
          <View gap={3}>
            <Text variant="display-3" align="center" as="h2">
              Figma libraries
            </Text>
            <Text variant="featured-3" align="center" as="p">
              Components and styles aligned with React library
            </Text>
          </View>
        </Container>

        <View
          gap={{ s: 4, l: 5 }}
          direction={{ s: "column", m: "row" }}
          align="stretch"
        >
          <View.Item columns={{ s: 12, m: 6, l: 12 }}>
            <BlockFeature
              horizontal
              title="Your Figma is already set up"
              text="You get 3 libraries: Components and Styles for light and dark modes. All of them are aligned with React and built in a scalable way."
              action={{
                icon: IconDownload,
                children: "Components demo",
                href: "https://www.figma.com/community/file/1086981007887138777",
                attributes: { target: "_blank" },

                onClick: () => {
                  ga.trackEvent({
                    category: ga.EventCategory.External,
                    action: "external_navigate_figma_demo",
                  });
                },
              }}
            >
              <img
                src="/img/landing/figma/library.webp"
                width={480}
                alt="Figma libraries popup"
                className={s.image}
              />
            </BlockFeature>
          </View.Item>

          <View.Item columns={{ s: 12, m: 6, l: 4 }}>
            <BlockFeature
              title="Styles"
              text="There are 2 style libraries: for light & dark modes. Each contains styles for colors, typography and effects that are used for all components."
            >
              <View direction="row" gap={9}>
                <img
                  src="/img/landing/figma/styles.webp"
                  height={255}
                  alt="Figma styles popup"
                  className={s.image}
                />
                <View
                  gap={2}
                  align="center"
                  attributes={{ "aria-hidden": true }}
                >
                  <Badge variant="outline">Badge</Badge>
                  <Text>&gt; 4.5:1 </Text>
                  <IconFigmaStylesArrow />
                </View>
              </View>
            </BlockFeature>
          </View.Item>
          <View.Item columns={{ s: 12, m: 6, l: 4 }}>
            <BlockFeature
              title="Variants"
              text="UICapsule has thousands of variants carefully wrapped into individual components that are easy to find and configure."
            >
              <View direction="row" gap={4}>
                <img
                  src="/img/landing/figma/variants.webp"
                  height={240}
                  alt="Figma variants popup"
                  className={s.image}
                />
                <View
                  gap={3}
                  align="center"
                  attributes={{ "aria-hidden": true }}
                >
                  <Button
                    variant="outline"
                    rounded
                    size="large"
                    startIcon={IconHeart}
                    color="primary"
                  />
                  <Button
                    variant="outline"
                    rounded
                    startIcon={IconHeart}
                    color="critical"
                  />
                  <Button
                    variant="outline"
                    rounded
                    size="small"
                    startIcon={IconHeart}
                  />
                </View>
              </View>
            </BlockFeature>
          </View.Item>
          <View.Item columns={{ s: 12, m: 6, l: 4 }}>
            <BlockFeature
              title="Auto layout"
              text="All components, where it's possible, support auto-layout. It lets you resize and see content auto reflow just like in code."
            >
              <div className={s.autoLayout}>
                <img
                  src="/img/landing/figma/auto-layout.webp"
                  height={215}
                  alt="Figma auto layout popup"
                  className={s.image}
                />
                <ActionBar
                  position="bottom"
                  className={s.actionBar}
                  attributes={{ "aria-hidden": true }}
                >
                  <View gap={0} align="stretch">
                    <Text variant="body-medium-1" align="center">
                      Pasta Pomodoro
                    </Text>
                    <Text variant="body-2" align="center">
                      $12.00 · 30 min
                    </Text>
                    <View.Item gapBefore={2}>
                      <Button color="primary" fullWidth>
                        Order now
                      </Button>
                    </View.Item>
                  </View>
                </ActionBar>
              </div>
            </BlockFeature>
          </View.Item>

          <View.Item columns={{ s: 12, m: 6 }}>
            <BlockVideo
              label="Figma video demo"
              previewSrc="/img/landing/figma/video.png"
              src={"https://www.youtube.com/embed/8Z8Z8Z8Z8Z8"}
            />
          </View.Item>

          <View.Item columns={{ s: 12, m: 6 }}>
            <BlockReview
              text="UICapsule's superpower is the theming architecture because it has a fine balance of flexibility and constraints which makes it easier for the consumers to tweak the theme based on the brand and the product and yet it is logical enough to understand from the outside."
              avatarUrl="/img/landing/avatar-kamlesh.webp"
              name="Kamlesh Chandnani"
              position="Principal Frontend Engineer, Razorpay"
              color="orange"
            />
          </View.Item>
        </View>
      </View>
    </Container>
  );
};

export default SectionFigma;
