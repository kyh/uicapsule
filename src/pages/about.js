import React from "react";
import HeroSection from "components/HeroSection";
import SectionHeader from "components/SectionHeader";
import CtaSection from "components/CtaSection";

function AboutPage() {
  return (
    <>
      <HeroSection bgColor="default" size="large">
        <SectionHeader
          title="We help you make money"
          subtitle="Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dolorum consequatur numquam aliquam tenetur ad amet inventore hic beatae, quas accusantium perferendis sapiente explicabo, corporis totam!"
          size={2}
        />
      </HeroSection>
      <CtaSection
        size="medium"
        title="Enough about us, lets get you started"
        subtitle="We have a generous free tier available to get you started right away"
        buttonText="Get started for free"
        buttonPath="/pricing"
      />
    </>
  );
}

export default AboutPage;
