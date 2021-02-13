import React, { useRef, useEffect, useState } from "react";
import styled, { css } from "styled-components";
import Head from "next/head";
import Link from "next/link";
import router from "next/router";
import Carousel from "react-elastic-carousel";
import Button from "@material-ui/core/Button";
import SiteLayout from "components/SiteLayout";
import ScrollToLink from "components/ScrollToLink";
import HeroSection from "components/HeroSection";
import SectionHeader from "components/SectionHeader";
import ExtensionPreview from "components/ExtensionPreview";
import FeaturesSection from "components/FeaturesSection";
import TestimonialsSection from "components/TestimonialsSection";
import CtaSection from "components/CtaSection";
import { useAuth } from "util/auth.js";

const HeroCtaContainer = styled.div`
  ${({ theme }) => css`
    margin-bottom: ${theme.spacing(4)}px;
    > button {
      padding: ${theme.spacing(1.5)}px ${theme.spacing(3)}px;
    }
  `}
`;

const Item = styled.div`
  height: 70px;
  background: -webkit-linear-gradient(90deg, #338cf5, #4fd1c5);
  background: linear-gradient(90deg, #338cf5, #4fd1c5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  &:focus {
    outline: none;
  }
`;

const examples = [
  "/featured-examples/checklist.html",
  "/featured-examples/boat.html",
  "/featured-examples/radiolist.html",
];

const IndexPage = () => {
  const [html, setHtml] = useState("");
  const [exampleIndex, setExampleIndex] = useState(0);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const auth = useAuth();

  const onExtensionPreviewSetHtml = (html) => {
    setHtml(html);
    setActiveFeatureIndex(1);
  };

  const fetchExample = async (i) => {
    const data = await fetch(examples[i]).then((response) => response.text());
    setHtml(data);
  };

  const nextExample = () => {
    const nextIndex = exampleIndex + 1 < examples.length ? exampleIndex + 1 : 0;
    setExampleIndex(nextIndex);
    fetchExample(nextIndex);
  };

  useEffect(() => {
    if (auth.user) router.replace("/dashboard");
    const data = fetchExample(exampleIndex);
    setHtml(data);
  }, [auth]);

  return (
    <>
      <Head>
        <title>UI Capsule | Bookmark your inspirations</title>
      </Head>
      <style global jsx>
        {`
          html {
            scroll-behavior: smooth;
          }
        `}
      </style>
      <HeroSection
        size="large"
        bgImage="/hero-background.svg"
        bgImageOpacity="1"
        bgPosY="200px"
        pt={{ xs: 12, sm: 20 }}
        pb={{ xs: 6, sm: 8 }}
      >
        <SectionHeader
          title={<PageTitle />}
          subtitle="Bookmark elements for ideas and inspiration on your next web project"
          size="1"
        />
        <HeroCtaContainer>
          <Link href="/auth/signup" passHref>
            <Button
              variant="contained"
              color="primary"
              size="large"
              component="a"
            >
              Get started for free
            </Button>
          </Link>
        </HeroCtaContainer>
        <ScrollToLink id="demo" top={-80} />
        <ExtensionPreview onSetHtml={onExtensionPreviewSetHtml} />
      </HeroSection>
      <ScrollToLink id="features" top={-50} />
      <FeaturesSection
        html={html}
        nextExample={nextExample}
        activeFeatureIndex={activeFeatureIndex}
        setActiveFeatureIndex={setActiveFeatureIndex}
      />
      <ScrollToLink id="testimonials" top={-80} />
      <TestimonialsSection
        size="medium"
        title="Here's what people are saying"
      />
      <CtaSection
        size="medium"
        title="Start capturing your inspirations"
        subtitle="Curate your own space filled with beautiful ideas"
        buttonText="Get started for free"
        buttonPath="/auth/signup"
      />
    </>
  );
};

let resetTimeout;
const autoPlaySpeed = 2000;
const items = ["websites", "articles", "apps", "anywhere"];

const PageTitle = () => {
  const carouselRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(resetTimeout);
  }, []);

  return (
    <>
      <div>Save UI elements from </div>
      <Carousel
        ref={carouselRef}
        autoPlaySpeed={autoPlaySpeed}
        verticalMode
        enableAutoPlay
        preventDefaultTouchmoveEvent
        pagination={false}
        showArrows={false}
        enableSwipe={false}
        enableMouseSwipe={false}
        onNextEnd={({ index }) => {
          clearTimeout(resetTimeout);
          if (index + 1 === items.length) {
            resetTimeout = setTimeout(() => {
              carouselRef.current.goTo(0);
            }, autoPlaySpeed);
          }
        }}
      >
        {items.map((i) => (
          <Item key={i}>{i}</Item>
        ))}
      </Carousel>
    </>
  );
};

IndexPage.Layout = SiteLayout;

export default IndexPage;
