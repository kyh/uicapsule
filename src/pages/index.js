import React from "react";
import HeroSection from "components/HeroSection";
import TestimonialsSection from "components/TestimonialsSection";
import CtaSection from "components/CtaSection";

function IndexPage() {
  return (
    <>
      <HeroSection
        title="Save UI elements from anywhere"
        subtitle="Bookmark elements for ideas and inspiration on your next web project"
        size="large"
        bgImage="/hero-background.svg"
        bgImageOpacity="1"
        bgPosY="200px"
      />
      <TestimonialsSection
        bgColor="default"
        size="medium"
        bgImage=""
        bgImageOpacity={1}
        title="Here's what people are saying"
        subtitle=""
      />
      <CtaSection
        bgColor="primary"
        size="medium"
        bgImage=""
        bgImageOpacity={1}
        title="Ready to get started?"
        subtitle=""
        buttonText="Get Started"
        buttonColor="default"
        buttonPath="/pricing"
      />
    </>
  );
}

export default IndexPage;
