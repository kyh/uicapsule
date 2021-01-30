import React from "react";
import styled, { css } from "styled-components";
import Head from "next/head";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
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

function AboutContent() {
  return (
    <>
      <AboutParagraph>
        I often find myself often bookmarking pages I find beautiful, useful,
        and well designed. To me, these bookmarks a great reference point when
        working on a new project to draw inspiration from.
      </AboutParagraph>
      <AboutParagraph>
        Over the years though, I've found that my bookmark manager doesn't offer
        me the tools to organize, resurface, and itentify the things I've saved
        very well.
      </AboutParagraph>
      <AboutParagraph>
        The issue, I think, can be split into these few bullet points:
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
            resolutions may be poor and a bigger issue is that it isn't
            interactive
          </AboutParagraph>
        </li>
        <li>
          <AboutParagraph>
            It's difficult to compose various bookmarks together in one single
            moodboard
          </AboutParagraph>
        </li>
      </AboutList>
      <AboutParagraph>
        I built UI Capsule to try to tackle each of these problems. Hopefully,
        with the help of this tool, design hoarders like me can continue our
        passion for collecting, without all the extra baggage.
      </AboutParagraph>
    </>
  );
}

function AboutPage() {
  return (
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
}

export default AboutPage;
