import React, { useRef } from "react";
import styled from "styled-components";
import Image from "next/image";
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
                verticalMode
                itemsToShow={1}
                enableAutoPlay
                autoPlaySpeed={autoPlaySpeed}
                renderArrow={() => <span />}
                renderPagination={() => <span />}
                onNextEnd={({ index }) => {
                  clearTimeout(resetTimeout);
                  if (index + 1 === items.length) {
                    resetTimeout = setTimeout(() => {
                      if (carouselRef && carouselRef.current) {
                        carouselRef.current.goTo(0);
                      }
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
          <Button variant="contained" color="primary" size="large">
            Get started for free
          </Button>
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
        title="Ready to get started?"
        subtitle="We have a generous free tier available to get you started right away"
        buttonText="Get started for free"
        buttonPath="/pricing"
      />
    </>
  );
}

export default IndexPage;
