import React, { useRef, useEffect, useState } from "react";
import styled, { css } from "styled-components";
import Head from "next/head";
import Link from "next/link";
import router from "next/router";
import Swiper from "tiny-swiper";
import SwiperPluginAutoPlay from "tiny-swiper/lib/modules/autoPlay.min.js";
import Button from "@material-ui/core/Button";
import SiteLayout from "components/SiteLayout";
import ScrollToLink from "components/ScrollToLink";
import HeroSection from "components/HeroSection";
import SectionHeader from "components/SectionHeader";
import ExtensionPreview from "components/ExtensionPreview";
import FeaturesSection from "components/FeaturesSection";
import TestimonialsSection from "components/TestimonialsSection";
import CtaSection from "components/CtaSection";
import { useAuth } from "util/auth";

const HeroCtaContainer = styled.div`
  ${({ theme }) => css`
    margin-bottom: ${theme.spacing(4)}px;
    > button {
      padding: ${theme.spacing(1.5)}px ${theme.spacing(3)}px;
    }
  `}
`;

const Item = styled.div`
  background: -webkit-linear-gradient(90deg, #338cf5, #4fd1c5);
  background: linear-gradient(90deg, #338cf5, #4fd1c5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  &:focus {
    outline: none;
  }
`;

const PageTitleContainer = styled.div`
  .swiper-container {
    height: 70px;
    overflow: hidden;
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
    if (auth.user) router.replace("/ui");
  }, [auth]);

  useEffect(() => {
    const data = fetchExample(exampleIndex);
    setHtml(data);
  }, []);

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

const items = ["websites", "articles", "apps", "anywhere"];
const PageTitle = () => {
  const carouselRef = useRef(null);

  useEffect(() => {
    let swiper;
    if (carouselRef) {
      swiper = new Swiper(carouselRef.current, {
        direction: "vertical",
        loop: true,
        autoplay: {
          delay: 3000,
        },
        plugins: [SwiperPluginAutoPlay],
      });
    }
    return () => swiper && swiper.destroy();
  }, [carouselRef]);

  return (
    <PageTitleContainer>
      <div>Save UI elements from </div>
      <div className="swiper-container" ref={carouselRef}>
        <div className="swiper-wrapper">
          {items.map((i) => (
            <Item className="swiper-slide" key={i}>
              {i}
            </Item>
          ))}
        </div>
      </div>
    </PageTitleContainer>
  );
};

IndexPage.Layout = SiteLayout;

export default IndexPage;
