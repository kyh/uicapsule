import React from "react";
import { motion } from "framer-motion";
import NextLink from "next/link";
import {
  Container,
  View,
  Text,
  Link,
  Hidden,
  Button,
  Accordion,
} from "@uicapsule/components";
import IconArrowRight from "icons/ArrowRight";
import IconDocumentation from "icons/Documentation";

const FAQItem = (props: { title: string; children: React.ReactNode }) => {
  const { title, children } = props;

  return (
    <Accordion>
      <Accordion.Trigger iconSize={6}>
        <View padding={[5, 0]}>
          <Text variant="featured-3">{title}</Text>
        </View>
      </Accordion.Trigger>
      <Accordion.Content>
        <View paddingBottom={5}>
          <Text variant="body-1" color="neutral-faded">
            {children}
          </Text>
        </View>
      </Accordion.Content>
    </Accordion>
  );
};

const FAQRoute = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Container width="680px">
        <View padding={{ s: [15, 0], m: [25, 0] }} gap={16}>
          <View gap={6} align="center">
            <Text variant="display-3" align="center">
              Frequently asked questions
            </Text>
            <Text variant="featured-3" color="neutral-faded" align="center">
              Everything you need to know about the licensing, billing and
              usage.{" "}
              <Hidden hide={{ s: true, m: false }}>
                {(className) => <br className={className} />}
              </Hidden>
              Got additional questions? Drop us an email at{" "}
              <Link href="mailto:hello@@uicapsule/components.so">
                hello@@uicapsule/components.so
              </Link>
              .
            </Text>
            <View direction="row" gap={3}>
              <NextLink passHref href="/content/docs/getting-started/overview">
                <Button
                  size="large"
                  variant="outline"
                  startIcon={IconDocumentation}
                >
                  Browse docs
                </Button>
              </NextLink>
              <NextLink passHref href="/pricing">
                <Button size="large" color="primary" endIcon={IconArrowRight}>
                  See pricing
                </Button>
              </NextLink>
            </View>
          </View>
          <View divided>
            <FAQItem title="What kind of projects can I use UICapsule for?">
              You can use UICapsule for commercial and non-commercial products,
              no matter if that&apos;s something you build for yourself or for a
              client. UICapsule can be used for open-source projects.
            </FAQItem>

            <FAQItem title="What are the UICapsule usage restrictions?">
              You can&apos;t use UICapsule for redistributing our components and
              assets as a different package. This includes design systems,
              component libraries or tools that are providing access to
              UICapsule package assets without purchasing UICapsule license. You
              can find more information about this in our&nbsp;
              <NextLink href="/content/license" passHref>
                <Link attributes={{ target: "_blank" }}>license agreement</Link>
              </NextLink>
              .
            </FAQItem>

            <FAQItem title="What is the refund policy?">
              <View gap={3}>
                <View.Item>
                  We provide a 14 day money-back guarantee for the Library
                  license. If you are unhappy with your purchase for any reason,
                  send us an email and we will refund you in full.
                </View.Item>
                <View.Item>
                  We do not provide refunds for the pro license. Preview{" "}
                  <Link
                    href="https://github.com/@uicapsule/components/community/tree/master/demo/components/Modal"
                    attributes={{ target: "_blank" }}
                  >
                    our demo
                  </Link>{" "}
                  if you would like to check the quality before your purchase.
                </View.Item>
              </View>
            </FAQItem>

            <FAQItem title="Is payment secure?">
              All payments are handled by Stripe. It has been audited by a
              PCI-certified auditor and is certified to PCI Service Provider
              Level 1. This is the most stringent level of certification
              available in the payments industry.
            </FAQItem>

            <FAQItem title="Can my UICapsule license expire?">
              Both Library and Pro licenses include lifetime access with
              unlimited future updates.
            </FAQItem>

            <FAQItem title="How often do you release new UICapsule versions?">
              <View gap={3}>
                <View.Item>
                  We&apos;re aiming to release ~1 minor release of the design
                  system per month for React and Figma together. These releases
                  don&apos;t include breaking changes and can be easily updated
                  in your product.
                </View.Item>
                <View.Item>
                  We keep at least 12 months before major releases that might
                  contain breaking changes and provide thorough migration
                  guidelines when they&apos;re released. You can find more
                  details about our release strategy in{" "}
                  <NextLink
                    href="/content/docs/getting-started/release-strategy"
                    passHref
                  >
                    <Link attributes={{ target: "_blank" }}>
                      our documentation
                    </Link>
                  </NextLink>
                  .
                </View.Item>
              </View>
            </FAQItem>

            <FAQItem title="How can I update the library?">
              <View gap={3}>
                <View.Item>
                  To update the React package version &mdash; download the new
                  release, replace the package in your project with the
                  downloaded one and reinstall it with your package manager.
                </View.Item>
                <View.Item>
                  In Figma we support updates through library swapping: follow{" "}
                  <NextLink
                    href="/content/docs/getting-started/figma/libraries#update-library-version"
                    passHref
                  >
                    <Link attributes={{ target: "_blank" }}>
                      these guidelines
                    </Link>
                  </NextLink>{" "}
                  to update the library version.
                </View.Item>
                <View.Item>
                  In case you&apos;re using UICapsule source code and have
                  heavily modified the code, it might be challenging to update
                  the modified components. However, you can still leverage from
                  the newly released components and utilities.
                </View.Item>
              </View>
            </FAQItem>

            <FAQItem title="When should I get the regular library license?">
              <View gap={3}>
                <View.Item>
                  Library license is best applicable for individuals, small
                  teams and studios that need a solution they can immediately
                  start using in their product. You get free updates for React
                  and Figma libraries for a single payment per seat. As your
                  team grows, you can purchase additional seats for the same
                  account.
                </View.Item>
                <View.Item>
                  You can update themes to change the look and feel of
                  components, but if you want to extend the library or change
                  core features we recommend buying the source code.
                </View.Item>
              </View>
            </FAQItem>

            <FAQItem title="When should I get the pro license?">
              The pro license is best applicable in two types of situations:{" "}
              <br />
              <br />
              1. You&apos;re a growing team and don&apos;t want to worry about
              managing licenses every time new team member joins. Pro license
              gives you unlimited seats for the whole company. <br />
              <br />
              2. You&apos;e an individual or a team that builds their own design
              system or want to extend our libraries. By using the source code,
              you can start from a point where all main challenges are already
              solved, which allows you to skip all the initial setup and start
              working on your needs.
            </FAQItem>

            <FAQItem title="Is Figma library included into the licenses?">
              Yes, it&apos;s included in both Library and Pro licenses.
            </FAQItem>

            <FAQItem title="Do I need to subscribe to Figma to use UICapsule?">
              We recommend having a Figma subscription to fully leverage
              Libraries and Theming capabilities. But don&apos;t worry, if you
              don&apos;t have a professional subscription,{" "}
              <NextLink
                href="/content/docs/getting-started/figma/libraries#use-with-a-free-figma-plan"
                passHref
              >
                <Link attributes={{ target: "_blank" }}>
                  you can still use UICapsule components
                </Link>
              </NextLink>{" "}
              with some limitations and design directly in our file. If
              you&apos;re a student or an educator, Figma provides{" "}
              <Link
                attributes={{ target: "_blank" }}
                href="https://www.figma.com/education/"
              >
                free access
              </Link>{" "}
              to professional features.
            </FAQItem>

            <FAQItem title="Can I apply custom styles to UICapsule components?">
              UICapsule has a built-in theming engine which allows you to create
              themes for React and Figma components. Check our{" "}
              <NextLink href="/content/docs/theming/creating-themes" passHref>
                <Link attributes={{ target: "_blank" }}>
                  theming documentation
                </Link>
              </NextLink>{" "}
              for more information.
            </FAQItem>

            <FAQItem title="Does UICapsule support dark mode?">
              Yes, our theming approach includes automatic dark mode support.
              This means that you won&apos;t need to design your product
              separately for light and dark mode even if you&apos;re building
              custom components. Read more about color tokens in our{" "}
              <NextLink href="/content/docs/tokens/color" passHref>
                <Link attributes={{ target: "_blank" }}>
                  design tokens documentation
                </Link>
              </NextLink>
              .
            </FAQItem>

            <FAQItem title="Which browsers does UICapsule support?">
              UICapsule is built using the features from the latest stable
              releases of all major browsers including Chrome, Firefox, Safari
              and Edge. UICapsule doesn&apos;t support Internet Explorer 11.
            </FAQItem>

            <FAQItem title="How can I request a feature or report a bug?">
              You can create tickets for issues and bugs on our{" "}
              <Link
                attributes={{ target: "_blank" }}
                href="https://github.com/@uicapsule/components/community/issues"
              >
                Github board
              </Link>
              . Once we triage it, you will be able to track its progress and
              timeline in the{" "}
              <Link
                attributes={{ target: "_blank" }}
                href="https://blvworkspace.notion.site/64cf1f5713344a7383330e0402f43949?v=b88a6dbbcb9a4faeb867d40d09ec0b12"
              >
                roadmap
              </Link>
              .
            </FAQItem>

            <FAQItem title="Do you provide custom consulting options?">
              We can provide a personalized approach to your design system. This
              may include an onboarding to UICapsule, an audit of your design
              system, priority support and more. Reach out to us at{" "}
              <Link href="mailto:hello@@uicapsule/components.so">
                hello@@uicapsule/components.so
              </Link>{" "}
              and let&apos;s discuss where you&apos;re at and how we can help.
            </FAQItem>
          </View>
        </View>
      </Container>
    </motion.div>
  );
};

export default FAQRoute;
