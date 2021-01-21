import React, { useRef, useEffect } from "react";
import styled from "styled-components";
import Image from "next/image";
import Link from "next/link";
import Carousel from "react-elastic-carousel";
import Button from "@material-ui/core/Button";
import HeroSection from "components/HeroSection";
import SectionHeader from "components/SectionHeader";
import TestimonialsSection from "components/TestimonialsSection";
import CtaSection from "components/CtaSection";

const HeroCtaContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing(4)}px;
  > button {
    padding: ${({ theme }) => `${theme.spacing(1.5)}px ${theme.spacing(3)}px`};
  }
`;

const HeroPreviewContainer = styled.section`
  display: flex;
  justify-content: center;
  > div {
    border-radius: 5px;
    overflow: hidden;
  }
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

let resetTimeout;
const autoPlaySpeed = 2000;
const items = ["websites", "articles", "apps", "anywhere"];

function IndexPage() {
  const carouselRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(resetTimeout);
  }, []);

  return (
    <>
      <HeroSection
        size="large"
        bgImage="/hero-background.svg"
        bgImageOpacity="1"
        bgPosY="200px"
      >
        <SectionHeader
          title={
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
          }
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
        <HeroPreviewContainer>
          <Image
            layout="fill"
            src="/hero-preview.png"
            alt="Extension preview"
            width={850}
            height={432}
          />
        </HeroPreviewContainer>
      </HeroSection>
      <TestimonialsSection
        bgColor="default"
        size="medium"
        title="Here's what people are saying"
      />
      <CtaSection
        size="medium"
        title="Start capturing your inspiration"
        subtitle="Curate your own space filled with beautiful ideas"
        buttonText="Get started for free"
        buttonPath="/signup"
      />
    </>
  );
}

export default IndexPage;
