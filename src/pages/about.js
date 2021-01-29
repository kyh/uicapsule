import React from "react";
import Head from "next/head";
import HeroSection from "components/HeroSection";
import SectionHeader from "components/SectionHeader";
import CtaSection from "components/CtaSection";

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
        buttonPath="/auth/signup"
      />
    </>
  );
}

export default AboutPage;
