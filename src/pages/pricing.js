import React from "react";
import Head from "next/head";
import PricingSection from "components/PricingSection";

function PricingPage() {
  return (
    <>
      <Head>
        <title>UI Capsule | Pricing</title>
      </Head>
      <PricingSection
        bgColor="default"
        size="medium"
        title="Pricing"
        subtitle="Choose the plan that makes sense for you. All plans include a 14-day free trial."
      />
    </>
  );
}

export default PricingPage;
