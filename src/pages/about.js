import React from "react";
import HeroSection from "components/HeroSection";
import SectionHeader from "components/SectionHeader";
import CtaSection from "components/CtaSection";

function AboutPage() {
  return (
    <>
      <HeroSection bgColor="default" size="large">
        <SectionHeader
          title="Make creativity easy, fast, and fun"
          subtitle="Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dolorum consequatur numquam aliquam tenetur ad amet inventore hic beatae, quas accusantium perferendis sapiente explicabo, corporis totam!"
          size={2}
        />
      </HeroSection>
      <CtaSection
        size="medium"
        title="Enough about me, want to give it a try?"
        subtitle="Start collecting and exploring UI ideas"
        buttonText="Get started for free"
        buttonPath="/signup"
      />
    </>
  );
}

export default AboutPage;
