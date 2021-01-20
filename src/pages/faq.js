import React from "react";
import FaqSection from "components/FaqSection";
import CtaSection from "components/CtaSection";

function FaqPage() {
  return (
    <>
      <FaqSection
        bgColor="default"
        size="medium"
        title="Frequently Asked Questions"
      />
      <CtaSection
        size="medium"
        title="Ready to get started?"
        subtitle="We have a generous free tier available to get you started right away"
        buttonText="Get started for free"
        buttonPath="/signup"
      />
    </>
  );
}

export default FaqPage;
