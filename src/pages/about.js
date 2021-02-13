import React from "react";
import styled, { css } from "styled-components";
import Head from "next/head";
import Typography from "@material-ui/core/Typography";
import SiteLayout from "components/SiteLayout";
import HeroSection from "components/HeroSection";
import SectionHeader from "components/SectionHeader";
import CtaSection from "components/CtaSection";

const AboutParagraph = styled(Typography)`
  ${({ theme }) => css`
    text-align: left;
    font-size: 1.1rem;
    line-height: 1.6;
    max-width: 600px;
    margin: auto auto ${theme.spacing(3)}px;

    em {
      font-weight: 500;
    }
  `}
`;

const AboutList = styled.ol`
  ${({ theme }) => css`
    font-size: 1.1rem;
    line-height: 1.6;
    max-width: 600px;
    margin: auto auto ${theme.spacing(3)}px;
    padding-left: 20px;
  `}
`;

const AboutContent = () => (
  <>
    <AboutParagraph>
      I'm a total bookmark nerd. Often times finding myself bookmarking things I
      think I'll need later on. Specifically, web pages I find beautiful,
      useful, and well designed. To me, these bookmarks a great reference point
      when working on a new project to draw inspiration from.
    </AboutParagraph>
    <AboutParagraph>
      Over the years though, I've found that my bookmark manager doesn't quite
      provide me with the tools to resurface, identify, and organize the things
      I've saved.
    </AboutParagraph>
    <AboutParagraph>
      The issues, I think, can be split into these few themes:
    </AboutParagraph>
    <AboutList>
      <li>
        <AboutParagraph>
          Bookmarking an entire page seems a little too generic. What was it
          about this particular page did I find fascinating?
        </AboutParagraph>
      </li>
      <li>
        <AboutParagraph>
          As time goes by these bookmarks would become stale. A nightmare I
          think we've all experienced: the links stop working 😔
        </AboutParagraph>
      </li>
      <li>
        <AboutParagraph>
          If we're lucky our bookmark manager would also take a screenshot if
          the original source is no longer there. However, screenshot
          resolutions may be poor and even worse yet, non interactive
        </AboutParagraph>
      </li>
      <li>
        <AboutParagraph>
          It's difficult to compose various bookmarks together in one single
          source, whether it be a moodboard or some other design artifact
        </AboutParagraph>
      </li>
    </AboutList>
    <AboutParagraph>
      I built UI Capsule to try to tackle each of these problems. I describe it
      as <em>"Pinterest meets UI"</em>
    </AboutParagraph>
    <AboutParagraph>
      Hopefully, with the help of this tool, design hoarders like myself can
      continue our passion for collecting, without all the extra baggage.
    </AboutParagraph>
  </>
);

const AboutPage = () => (
  <>
    <Head>
      <title>UI Capsule | About</title>
    </Head>
    <HeroSection
      bgColor="default"
      size="large"
      pt={{ xs: 12, sm: 20 }}
      pb={{ xs: 6, sm: 8 }}
    >
      <SectionHeader
        title="Design hoarding"
        subtitle="without the bookmark debt"
        size={2}
      />
      <AboutContent />
    </HeroSection>
    <CtaSection
      size="medium"
      title="Want to give it a try?"
      subtitle="Let's collect UI without all the extra baggage"
      buttonText="Get started for free"
      buttonPath="/auth/signup"
    />
  </>
);

AboutPage.Layout = SiteLayout;

export default AboutPage;
