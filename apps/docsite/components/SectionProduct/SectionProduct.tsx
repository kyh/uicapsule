import React from "react";
import {
  Container,
  Text,
  View,
  Button,
  Checkbox,
  Hidden,
} from "@uicapsule/components";
import BlockReview from "components/BlockReview";
import BlockFeature from "components/BlockFeature";
import FeatureSlider from "components/FeatureSlider";
import IconLock from "icons/Lock";
import IconArrowRight from "icons/ArrowRight";
import IconDesignerCursor from "icons/colored/DesignerCursor";
import IconDeveloperCursor from "icons/colored/DeveloperCursor";
import features from "./data";
import s from "./SectionProduct.module.css";

const SectionProduct = () => {
  return (
    <Container width="1056px">
      <View gap={{ s: 12, l: 16 }}>
        <Container width="852px">
          <View gap={3}>
            <Text variant="display-3" align="center" as="h2">
              Skip a year of development
            </Text>
            <Text variant="featured-3" align="center" as="p">
              You have to set up a million things before you even start working
              on UI. <br />
              We took care of it so you can focus on your product.
            </Text>
          </View>
        </Container>

        <View
          gap={{ s: 4, l: 5 }}
          direction={{ s: "column", l: "row" }}
          align="stretch"
        >
          <View.Item columns={{ s: 12, l: 6 }}>
            <BlockFeature
              autoHeightPreview
              bleedPreview
              title="Solid foundation"
              text="Reshaped gives you a head start by solving UI problems at all scales. You can stop worrying about maintaining your foundations and focus entirely on the product."
            >
              <View gap={3} attributes={{ "aria-hidden": true }}>
                {features.map((items, index) => (
                  <View.Item key={index}>
                    <FeatureSlider items={items} reversed={!!(index % 2)} />
                  </View.Item>
                ))}
              </View>
            </BlockFeature>
          </View.Item>
          <View.Item columns={{ s: 12, l: 6 }}>
            <View
              gap={5}
              height="100%"
              direction={{ s: "column", m: "row", l: "column" }}
              align="stretch"
            >
              <View.Item grow columns={{ s: 12, m: 6, l: 12 }}>
                <BlockFeature
                  autoHeightPreview
                  title="React + Figma"
                  text="Reshaped ships a library of flexible components aligned between Figma and React. Avoid design hand-off surprises and share the same source of truth."
                >
                  <div className={s.bundle} aria-hidden="true">
                    <div className={s.developer}>
                      <IconDeveloperCursor />
                    </div>
                    <div className={s.designer}>
                      <IconDesignerCursor />
                    </div>
                    <View direction="row" gap={3} wrap={false}>
                      <View
                        backgroundColor="elevated"
                        padding={{ s: 3, l: 5 }}
                        borderRadius="medium"
                        width={{ s: "220px", l: "232px" }}
                        gap={3}
                        className={s.code}
                      >
                        <View.Item>
                          <Text variant="body-strong-2">React</Text>
                          <Text variant="body-2" color="neutral-faded">
                            v1.0.0
                          </Text>
                        </View.Item>

                        <Text variant="body-medium-2">
                          {"<Button"}
                          &nbsp;{"startIcon={"}
                          <Text color="primary" as="span">
                            Arrow
                          </Text>
                          {"}>"}
                          <br />
                          &nbsp;&nbsp;&nbsp;&nbsp;Submit
                          <br />
                          {"</Button>"}
                        </Text>
                      </View>

                      <View gap={5}>
                        <View direction="row" gap={2}>
                          <Hidden hide={{ s: true, l: false }}>
                            <Button
                              variant="outline"
                              size="large"
                              startIcon={IconLock}
                            />
                          </Hidden>
                          <Button size="large" endIcon={IconArrowRight}>
                            Submit
                          </Button>
                        </View>

                        <View gap={2}>
                          <Checkbox defaultChecked>Selected</Checkbox>
                          <Checkbox>Unselected</Checkbox>
                        </View>
                      </View>
                    </View>
                  </div>
                </BlockFeature>
              </View.Item>
              <View.Item columns={{ s: 12, m: 6, l: 12 }}>
                <BlockReview
                  text="Reshaped gives a superpower to not think about the implementation details when building a product. I absolutely love how it helps to solve Light/Dark theming and RTL. You literally don't think about anything except the UI when building."
                  avatarUrl="/img/landing/avatar-dmitriy.webp"
                  name="Dmitriy Kovalenko"
                  position="Lead Software Engineer, Ex-MUI"
                  color="purple"
                />
              </View.Item>
            </View>
          </View.Item>
        </View>
      </View>
    </Container>
  );
};

export default SectionProduct;
