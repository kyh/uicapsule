import React from "react";
import NextLink from "next/link";
import {
  Container,
  View,
  Text,
  Card,
  Badge,
  Button,
  Icon,
} from "@uicapsule/components";
import Price from "constants/prices";
import IconCheckmark from "icons/Checkmark";
import IconArrowRight from "icons/ArrowRight";
import * as ga from "utilities/ga";
import * as T from "./SectionPricing.types";
import s from "./SectionPricing.module.css";

const PricingCard = (props: T.PricingCardProps) => {
  const {
    badge,
    primary,
    title,
    price,
    priceSuffix,
    items,
    action,
    href,
    caption,
    onActionClick,
  } = props;

  return (
    <Card elevated padding={{ s: 4, m: 8 }} className={s.card}>
      <View gap={8} height="100%">
        <View gap={2} align="center">
          <Badge color={primary ? "primary" : undefined} variant="faded">
            {badge}
          </Badge>
          <Text variant="featured-3" color="neutral-faded">
            {title}
          </Text>
          <View.Item gapBefore={1}>
            <View direction="row" gap={2} align="center">
              <Text variant="title-1" as="span">
                {price ? `$${price}` : <>Contact us</>}
              </Text>
              {priceSuffix && (
                <Text as="span" variant="featured-3" color="neutral-faded">
                  {priceSuffix}
                </Text>
              )}
            </View>
          </View.Item>
        </View>
        <View gap={3} as="ul">
          {items.map((item) => (
            <View as="li" key={item.title} direction="row" gap={2}>
              <Icon svg={IconCheckmark} color="positive" size={5} />
              <View.Item grow>
                <Text variant="body-medium-2">{item.title}</Text>
                <Text variant="body-2" color="neutral-faded">
                  {item.text}
                </Text>
              </View.Item>
            </View>
          ))}
        </View>
        <View.Item gapBefore="auto">
          <View gap={2}>
            <NextLink href={href} passHref>
              <Button
                size="large"
                fullWidth
                endIcon={IconArrowRight}
                color={primary ? "primary" : undefined}
                onClick={onActionClick}
              >
                {action}
              </Button>
            </NextLink>
            <Text align="center" color="neutral-faded" variant="caption-1">
              {caption}
            </Text>
          </View>
        </View.Item>
      </View>
    </Card>
  );
};

const SectionPricing = () => {
  return (
    <Container width="1056px">
      <View gap={16}>
        <Container width="652px">
          <View gap={3}>
            <Text variant="display-3" align="center" as="h2">
              Pricing
            </Text>
            <Text variant="featured-3" align="center" as="p">
              Whether you’re looking for a library for a small side project or a
              base design system for a large product - we’ve covered it all
            </Text>
          </View>
        </Container>

        <View gap={{ s: 4, l: 5 }} direction="row" align="stretch">
          <View.Item columns={{ s: 12, m: 6, l: 4 }}>
            <PricingCard
              primary
              badge="Popular"
              title="Library license"
              price={Price.seat / 100}
              priceSuffix="/seat"
              items={[
                {
                  title: "Lifetime access",
                  text: "Future updates and components",
                },
                {
                  title: "Unlimited projects",
                  text: "Library license is reserved for one person and unlimited projects",
                },
                {
                  title: "React library",
                  text: "40+ components and utilities",
                },
                {
                  title: "Figma library",
                  text: "Components aligned with code, light & dark mode libraries",
                },
                {
                  title: "Documentation",
                  text: "Thoroughly documentated library and processes",
                },
                {
                  title: "Theming engine",
                  text: "Ability to create custom themes",
                },
              ]}
              action="Buy library license"
              href="/pricing"
              onActionClick={() => {
                ga.trackEvent({
                  category: ga.EventCategory.Pricing,
                  action: "pricing_click_license_tiers",
                });
              }}
              caption={
                <>
                  Forever yours with all updates 🙌
                  <br />
                  14 day money-back guarantee
                </>
              }
            />
          </View.Item>
          <View.Item columns={{ s: 12, m: 6, l: 4 }}>
            <PricingCard
              badge="Source code"
              title="Pro license"
              price={Price.sourceCode / 100}
              items={[
                {
                  title: "All assets from the library license",
                  text: "Get access to the libraries, theming and documentation",
                },
                {
                  title: "Unlimited seats and projects",
                  text: "Stop thinking about managing the number of available seats",
                },
                {
                  title: "Full access to the source code",
                  text: "Skip your first year of development for your own design system",
                },
                {
                  title: "Full test suite",
                  text: "Get full control over the component development environment",
                },
                {
                  title: "Extendable theming engine",
                  text: "Ability to create custom themes and extend the engine",
                },
              ]}
              action="Buy pro license"
              href="/pricing?type=source"
              onActionClick={() => {
                ga.trackEvent({
                  category: ga.EventCategory.Pricing,
                  action: "pricing_click_source_tiers",
                });
              }}
              caption={
                <>
                  Headstart for your own design systems 🤓
                  <br />
                  Best deal for teams
                </>
              }
            />
          </View.Item>
          <View.Item columns={{ s: 12, l: 4 }}>
            <PricingCard
              badge="Consulting"
              title="Enterprise"
              items={[
                {
                  title: "Onboarding",
                  text: "Guidance on how to introduce UICapsule to your development and design process",
                },
                {
                  title: "Design system audit",
                  text: "Review and recommendations for your own design system implementation",
                },
                {
                  title: "Tailored support",
                  text: "Priority support for the new feature requests based on your product requirements",
                },
                {
                  title: "Need even more?",
                  text: "Reach out to us and let's discuss how we can help",
                },
              ]}
              action="Contact us"
              href="mailto:hello@@uicapsule/components.so"
              onActionClick={() => {
                ga.trackEvent({
                  category: ga.EventCategory.Pricing,
                  action: "pricing_click_consulting_tiers",
                });
              }}
              caption={
                <>
                  Personalized approach 🚀
                  <br />
                  <br />
                </>
              }
            />
          </View.Item>
        </View>
      </View>
    </Container>
  );
};

export default SectionPricing;
